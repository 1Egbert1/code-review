/**
 * 命令行的纯逻辑层。
 *
 * 这里不产生任何顶层副作用，因此可以被测试直接 import。
 * 真正的可执行入口在 `index.ts`，它只负责调用 main 并落退出码。
 */

/** 可用的子命令；未实现的先列出来，让 --help 有内容可显示。 */
const COMMANDS = ['review', 'inspect', 'cost', 'eval'] as const;

type CommandName = (typeof COMMANDS)[number];

const USAGE = `acr — AI 代码审查

用法:
  acr <子命令> [选项]

子命令:
  review     审查一次代码改动
  inspect    巡检整个仓库并出报告
  cost       预估一次审查的花费
  eval       跑评估集并与基准对比

  acr <子命令> --help   查看子命令选项
`;

/** 判断给定字符串是否为已登记的子命令。 */
function isCommand(value: string): value is CommandName {
  return (COMMANDS as readonly string[]).includes(value);
}

/**
 * 入口主函数。
 *
 * @param argv 已去掉 node 与脚本路径的参数列表
 * @returns 进程退出码
 */
export function main(argv: readonly string[]): number {
  const first = argv[0];

  if (first === undefined || first === '--help' || first === '-h') {
    process.stdout.write(USAGE);
    return 0;
  }

  if (first === '--version' || first === '-v') {
    process.stdout.write('0.1.0\n');
    return 0;
  }

  if (!isCommand(first)) {
    process.stderr.write(`未知命令: ${first}\n\n${USAGE}`);
    return 2;
  }

  // 子命令在后续任务包实现（T-16）。现在明确告知未完成，而不是静默成功。
  process.stderr.write(`子命令 ${first} 尚未实现（计划在 T-16）\n`);
  return 3;
}
