import { describe, expect, it } from 'vitest';

import { DEFAULT_CONFIG } from '../src/config/defaults.js';
import type { CommentMarker } from '../src/contracts/index.js';
import { renderMarker } from '../src/core/reconcile/markers.js';
import type {
  GitHubGateway,
  PullRequestRef,
  RawFileChange,
  RawReviewComment,
} from '../src/platforms/github/client.js';
import { fetchCommitSnapshot, fetchSnapshot } from '../src/platforms/github/fetch.js';

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
    getPullRequestShas: async () => ({ head: 'head-sha', base: 'base-sha' }),
    getCommit: async () => ({ sha: 'head-sha', parentSha: 'base-sha', summary: '提交' }),
    compareCommits: async () => [],
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

  it('默认清单跳过根目录 README 与子目录文档，但不误伤代码文件', async () => {
    const result = await fetchSnapshot(
      gateway({
        listPullRequestFiles: async () => [
          file({ filename: 'README.md' }),
          file({ filename: 'docs/guide.md' }),
          file({ filename: 'src/readme.ts' }),
        ],
      }),
      REF,
      'sha',
      DEFAULT_CONFIG.review.skipPaths,
    );

    const byPath = new Map(result.snapshot.diff.files.map((f) => [f.path, f.skippedReason]));
    expect(byPath.get('README.md')).toBe('命中跳过清单');
    expect(byPath.get('docs/guide.md')).toBe('命中跳过清单');
    expect(byPath.get('src/readme.ts')).toBeNull();
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

describe('按提交取数', () => {
  const REPO = { owner: 'o', repo: 'r' };

  it('基准取父提交，头部取该提交自身', async () => {
    const result = await fetchCommitSnapshot(
      gateway({
        getCommit: async () => ({ sha: 'head', parentSha: 'parent', summary: '改了点东西' }),
        compareCommits: async (_ref, base, head) => {
          expect(base).toBe('parent');
          expect(head).toBe('head');
          return [file({ filename: 'src/a.ts', patch: '@@ -1 +1 @@\n-a\n+b' })];
        },
      }),
      REPO,
      'head',
    );

    expect(result.snapshot.diff.baseSha).toBe('parent');
    expect(result.snapshot.diff.headSha).toBe('head');
    expect(result.snapshot.diff.files).toHaveLength(1);
  });

  it('提交没有评论区，已有评论恒为空', async () => {
    const result = await fetchCommitSnapshot(gateway(), REPO, 'head');
    expect(result.snapshot.existingComments).toEqual([]);
  });

  it('根提交没有父提交可比，直接报错而不是审一个空改动', async () => {
    await expect(
      fetchCommitSnapshot(
        gateway({ getCommit: async () => ({ sha: 'root', parentSha: null, summary: '初始' }) }),
        REPO,
        'root',
      ),
    ).rejects.toThrow(/根提交/);
  });

  it('文件数顶到平台上限时告警，不静默截断', async () => {
    const many = Array.from({ length: 100 }, (_, i) =>
      file({ filename: `src/f${String(i)}.ts`, patch: '@@ -1 +1 @@\n-a\n+b' }),
    );

    const result = await fetchCommitSnapshot(
      gateway({ compareCommits: async () => many }),
      REPO,
      'head',
    );

    expect(result.warnings.some((w) => w.message.includes('100'))).toBe(true);
  });

  it('取不到文件内容不影响其他文件', async () => {
    const result = await fetchCommitSnapshot(
      gateway({
        compareCommits: async () => [
          file({ filename: 'src/a.ts', patch: '@@ -1 +1 @@\n-a\n+b' }),
          file({ filename: 'src/b.ts', patch: '@@ -1 +1 @@\n-c\n+d' }),
        ],
        getFileContent: async (_ref, path) => (path === 'src/a.ts' ? null : '内容'),
      }),
      REPO,
      'head',
    );

    expect(result.snapshot.fileContents.get('src/a.ts')).toBeNull();
    expect(result.snapshot.fileContents.get('src/b.ts')).toBe('内容');
  });
});
