import { describe, expect, it } from 'vitest';

import type { CommentMarker } from '../src/contracts/index.js';
import { renderMarker } from '../src/core/reconcile/markers.js';
import type {
  GitHubGateway,
  PullRequestRef,
  RawFileChange,
  RawReviewComment,
} from '../src/platforms/github/client.js';
import { fetchSnapshot } from '../src/platforms/github/fetch.js';

const REF: PullRequestRef = { owner: 'acme', repo: 'web', number: 7 };

function file(overrides: Partial<RawFileChange> = {}): RawFileChange {
  return {
    filename: 'src/a.ts',
    previousFilename: null,
    status: 'modified',
    patch: ['@@ -1,1 +1,1 @@', '-old', '+new'].join('\n'),
    additions: 1,
    deletions: 1,
    ...overrides,
  };
}

function comment(overrides: Partial<RawReviewComment> = {}): RawReviewComment {
  return { id: '1', body: '普通评论', path: 'src/a.ts', line: 3, side: 'RIGHT', ...overrides };
}

function gateway(overrides: Partial<GitHubGateway> = {}): GitHubGateway {
  return {
    listPullRequestFiles: async () => [],
    getFileContent: async () => null,
    listReviewComments: async () => [],
    getRepoInfo: async () => ({ hasWiki: false, defaultBranch: 'main' }),
    ...overrides,
  };
}

describe('取数：组装快照', () => {
  it('把平台文件列表转成行结构', async () => {
    const result = await fetchSnapshot(
      gateway({ listPullRequestFiles: async () => [file()] }),
      REF,
      'head-sha',
    );

    expect(result.snapshot.diff.files).toHaveLength(1);
    expect(result.snapshot.diff.files[0]?.lines).toHaveLength(2);
    expect(result.snapshot.diff.headSha).toBe('head-sha');
  });

  it('状态映射：removed → deleted，copied → added', async () => {
    const result = await fetchSnapshot(
      gateway({
        listPullRequestFiles: async () => [
          file({ filename: 'x.ts', status: 'removed', patch: null }),
          file({ filename: 'y.ts', status: 'copied', patch: null }),
        ],
      }),
      REF,
      'sha',
    );

    expect(result.snapshot.diff.files[0]?.status).toBe('deleted');
    expect(result.snapshot.diff.files[1]?.status).toBe('added');
  });

  it('重命名带旧路径，普通修改不带', async () => {
    const result = await fetchSnapshot(
      gateway({
        listPullRequestFiles: async () => [
          file({ filename: 'new.ts', previousFilename: 'old.ts', status: 'renamed' }),
          file({ filename: 'plain.ts', previousFilename: null, status: 'modified' }),
        ],
      }),
      REF,
      'sha',
    );

    expect(result.snapshot.diff.files[0]?.oldPath).toBe('old.ts');
    expect(result.snapshot.diff.files[1]?.oldPath).toBeNull();
  });

  it('只对未跳过的文件取内容', async () => {
    const requested: string[] = [];
    const result = await fetchSnapshot(
      gateway({
        listPullRequestFiles: async () => [
          file({ filename: 'keep.ts' }),
          file({ filename: 'no-patch.ts', patch: null }),
        ],
        getFileContent: async (_ref, path) => {
          requested.push(path);
          return `content of ${path}`;
        },
      }),
      REF,
      'sha',
    );

    // 第二个文件没有补丁（平台未提供），不该再浪费一次请求
    expect(requested).toEqual(['keep.ts']);
    expect(result.snapshot.fileContents.get('keep.ts')).toBe('content of keep.ts');
  });

  it('跳过清单命中时标注原因，且仍然计入改动', async () => {
    const result = await fetchSnapshot(
      gateway({ listPullRequestFiles: async () => [file({ filename: 'yarn.lock', patch: null })] }),
      REF,
      'sha',
      ['**/*.lock'],
    );

    expect(result.snapshot.diff.files[0]?.skippedReason).toBe('命中跳过清单');
    // 仍然在 files 里，所以「这个文件在本次改动中」这个事实不会丢
    expect(result.snapshot.diff.files).toHaveLength(1);
  });
});

describe('取数：已有评论', () => {
  it('能认出本工具发的评论（带标记）', async () => {
    const marker: CommentMarker = {
      version: 'v1',
      fingerprint: 'fp-1',
      reviewer: 'correctness',
      scope: 'changed',
      promptVersion: 'v1.0',
      model: 'deepseek-chat',
    };

    const result = await fetchSnapshot(
      gateway({
        listReviewComments: async () => [
          comment({ id: '1', body: `建议修一下\n\n${renderMarker(marker)}` }),
          comment({ id: '2', body: '别人的评论' }),
        ],
      }),
      REF,
      'sha',
    );

    expect(result.snapshot.existingComments[0]?.marker?.fingerprint).toBe('fp-1');
    // 没有标记的是别人发的，后续生命周期操作绝不碰它
    expect(result.snapshot.existingComments[1]?.marker).toBeNull();
  });

  it('LEFT 侧映射回 old', async () => {
    const result = await fetchSnapshot(
      gateway({ listReviewComments: async () => [comment({ side: 'LEFT' })] }),
      REF,
      'sha',
    );

    expect(result.snapshot.existingComments[0]?.side).toBe('old');
  });
});

describe('取数：失败路径', () => {
  it('列文件失败向上抛，由调用方判定整轮失败', async () => {
    await expect(
      fetchSnapshot(
        gateway({
          listPullRequestFiles: async () => {
            throw new Error('401 Unauthorized');
          },
        }),
        REF,
        'sha',
      ),
    ).rejects.toThrow('401');
  });

  it('单文件取内容失败只影响该文件，不整体失败', async () => {
    const result = await fetchSnapshot(
      gateway({
        listPullRequestFiles: async () => [file({ filename: 'a.ts' }), file({ filename: 'b.ts' })],
        getFileContent: async (_ref, path) => (path === 'a.ts' ? null : 'ok'),
      }),
      REF,
      'sha',
    );

    expect(result.snapshot.fileContents.get('a.ts')).toBeNull();
    expect(result.snapshot.fileContents.get('b.ts')).toBe('ok');
  });

  it('读不到历史评论时告警，而不是静默当成没有历史', async () => {
    const result = await fetchSnapshot(
      gateway({
        listReviewComments: async () => {
          throw new Error('secondary rate limit');
        },
      }),
      REF,
      'sha',
    );

    expect(result.snapshot.existingComments).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.kind).toBe('history');
  });

  it('一切正常时没有告警', async () => {
    const result = await fetchSnapshot(gateway(), REF, 'sha');
    expect(result.warnings).toHaveLength(0);
  });
});
