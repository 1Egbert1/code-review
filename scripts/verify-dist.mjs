#!/usr/bin/env node
/**
 * 校验入库的 dist/cli.js 与源码一致。
 *
 * 为什么需要它：Action 在远端直接执行仓库里的这个文件，runner 不会替它构建。
 * 如果有人改了源码却忘了重新构建，远端跑的还是旧逻辑——而本地测试全绿、CI 也全绿，
 * 问题只会在真实 PR 上出现。这个检查把「忘记构建」变成一次可见的失败。
 *
 * 用 esbuild 的 JS 接口而不是命令行：Windows 下 `npx.cmd` 不能直接 spawn，
 * 而跨平台分叉一份命令字符串是这类脚本最常见的坏味道。
 */

import { readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const committed = join(root, 'dist', 'cli.js');
const fresh = join(root, 'dist', '.verify.js');

const banner =
  "import{createRequire as __cr}from 'node:module';const require=__cr(import.meta.url);";

await build({
  entryPoints: [join(root, 'src', 'cli', 'index.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  banner: { js: banner },
  outfile: fresh,
  logLevel: 'silent',
});

const a = readFileSync(committed, 'utf8');
const b = readFileSync(fresh, 'utf8');
rmSync(fresh, { force: true });

if (a !== b) {
  process.stderr.write(
    'dist/cli.js 与源码不一致：请运行 pnpm run build 后把 dist 一起提交。\n' +
      'Action 在远端直接执行这个文件，不会重新构建。\n',
  );
  process.exit(1);
}

process.stdout.write('dist 与源码一致\n');
