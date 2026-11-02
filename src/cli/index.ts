#!/usr/bin/env node
/**
 * 可执行入口。
 *
 * 只做一件事：调用 main 并把返回值落成退出码。
 * 所有逻辑都在 `main.ts`，以便被测试直接 import 而不触发顶层执行。
 */
import { main } from './main.js';

void main(process.argv.slice(2)).then((code) => {
  process.exitCode = code;
});
