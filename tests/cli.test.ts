import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { main } from '../src/cli/main.js';

/** 把 process.stdout.write 的输出收集起来，避免测试时污染终端。 */
function captureStream(stream: NodeJS.WriteStream): { text: () => string } {
  let buffer = '';
  vi.spyOn(stream, 'write').mockImplementation((chunk: unknown): boolean => {
    buffer += typeof chunk === 'string' ? chunk : String(chunk);
    return true;
  });
  return { text: () => buffer };
}

describe('命令行入口', () => {
  let stdout: { text: () => string };
  let stderr: { text: () => string };

  beforeEach(() => {
    stdout = captureStream(process.stdout);
    stderr = captureStream(process.stderr);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('无参数时打印用法并返回 0', () => {
    expect(main([])).toBe(0);
    expect(stdout.text()).toContain('用法');
  });

  it('--help 与无参数行为一致', () => {
    expect(main(['--help'])).toBe(0);
    expect(stdout.text()).toContain('子命令');
  });

  it('--version 输出版本号', () => {
    expect(main(['--version'])).toBe(0);
    expect(stdout.text().trim()).toBe('0.1.0');
  });

  it('未知命令返回 2 并在标准错误说明', () => {
    expect(main(['nope'])).toBe(2);
    expect(stderr.text()).toContain('未知命令');
  });

  it('已登记但未实现的子命令返回 3，且不假装成功', () => {
    expect(main(['review'])).toBe(3);
    expect(stderr.text()).toContain('尚未实现');
  });
});
