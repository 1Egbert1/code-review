/**
 * GitHub 真实连通性测试——**默认跳过**，只有配了环境变量才运行。
 *
 * 启用方式：
 *   ACR_TEST_TOKEN=<有 repo 读权限的令牌> \
 *   ACR_TEST_REPO=owner/repo \
 *   pnpm test
 *
 * 需要验证合并请求取数时再加：
 *   ACR_TEST_PR=<一个真实存在的 PR 编号>
 *
 * 为什么单独放一个文件：单元测试一律打假网关，不能碰网络；
 * 而「能不能真的取到数据」只能打真接口验证。两者混在一起会让人分不清失败原因。
 */

import { describe, expect, it } from 'vitest';

import { createGitHubGateway } from '../src/platforms/github/client.js';

const TOKEN = process.env['ACR_TEST_TOKEN'];
const REPO = process.env['ACR_TEST_REPO'];
const PR = process.env['ACR_TEST_PR'];

/** 把 owner/repo 拆开；格式不对时返回 null，测试会被跳过而不是误报失败。 */
function parseRepo(): { owner: string; repo: string } | null {
  if (REPO === undefined) return null;
  const [owner, repo] = REPO.split('/');
  if (owner === undefined || repo === undefined) return null;
  return { owner, repo };
}

const target = parseRepo();
const enabled = TOKEN !== undefined && target !== null;

describe.skipIf(!enabled)('GitHub 真实取数', () => {
  const gateway = createGitHubGateway(TOKEN ?? '');
  const ref = target ?? { owner: '', repo: '' };

  it('能读到仓库元信息', async () => {
    const info = await gateway.getRepoInfo(ref);
    expect(typeof info.hasWiki).toBe('boolean');
    expect(typeof info.defaultBranch).toBe('string');
    expect(info.defaultBranch.length).toBeGreaterThan(0);
  });

  it('能读到某个公开文件的内容', async () => {
    const info = await gateway.getRepoInfo(ref);
    const content = await gateway.getFileContent(ref, 'README.md', info.defaultBranch);
    // 仓库没有 README 时也是合法结果，只要不抛错即可
    expect(content === null || typeof content === 'string').toBe(true);
  });
});

describe.skipIf(!(enabled && PR !== undefined))('GitHub 真实取数：合并请求', () => {
  const gateway = createGitHubGateway(TOKEN ?? '');
  const ref = target === null ? null : { ...target, number: Number(PR) };

  it('能列出改动的文件并解析出行结构', async () => {
    if (ref === null) throw new Error('缺少仓库信息');
    const files = await gateway.listPullRequestFiles(ref);
    expect(Array.isArray(files)).toBe(true);
    for (const file of files) {
      expect(typeof file.filename).toBe('string');
    }
  });

  it('能列出已有评论', async () => {
    if (ref === null) throw new Error('缺少仓库信息');
    const comments = await gateway.listReviewComments(ref);
    expect(Array.isArray(comments)).toBe(true);
  });
});
