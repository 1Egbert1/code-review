/**
 * 报告载体的选择与写入。
 *
 * 三条规则来自真实约束，不是设计偏好：
 *
 * 1. **报告不能用「待办类」载体。** Issue 的语义是「需要有人处理」，放进去的报告会持续
 *    要求注意力；而报告是周期快照，应该可查而不打扰。所以没有 Wiki 时用**常设单条 Issue
 *    且建完立即关闭**，绝不留 open 条目。
 * 2. **Wiki 优先，因为它语义最贴且不产生代码提交。** 但 Wiki 要走 git 推送，失败方式比
 *    HTTP 多（冲突、权限、仓库没建页面），所以**失败必须能降级到 Issue**，不能让整轮巡检白跑。
 * 3. **载体选择要自动，不能让用户先去改仓库设置。** 检测 `has_wiki` 即可决定，
 *    配置里的 `carrier` 只是覆盖开关。
 */

import type { InspectionConfig } from '../../contracts/config.js';
import type { ReportCarrier, ReportLocation } from '../../contracts/inspection.js';

/**
 * 写入结果。失败要带可读原因——「报告没生成」是最难排查的一种失败。
 *
 * 成功分支带一个可选 `warning`：有些操作是「主目标达成、附带动作失败」。
 * 典型例子是报告写进去了但没能把 Issue 关掉（缺 `issues: write`）——
 * 报告确实在了，可 open 状态的条目会一直打扰人。这种情况报失败是错的
 * （正文在），报纯净成功也是错的（破坏「不留 open 条目」的约束），必须是「成功 + 告警」。
 */
export type WriteOutcome =
  | {
      readonly ok: true;
      readonly reference: string;
      readonly url: string;
      readonly warning?: string;
    }
  | { readonly ok: false; readonly reason: string };

/** 一个载体。做成接口，是为了让降级逻辑与平台无关。 */
export interface ReportWriter {
  readonly kind: ReportCarrier;
  /** @param pageName 页面名或标题前缀，用于定位「上一期」 */
  write(pageName: string, markdown: string): Promise<WriteOutcome>;
}

/**
 * 选载体。
 *
 * `auto` 时的顺序：仓库开了 Wiki 就用 Wiki，否则用常设 Issue。
 * 显式指定时照办——有人就是不想让 wiki 仓库多一堆页面。
 */
export function chooseCarrier(config: InspectionConfig, hasWiki: boolean): ReportCarrier {
  if (config.carrier !== 'auto') return config.carrier;
  return hasWiki ? 'wiki' : 'issue';
}

export interface WriteReportInput {
  readonly config: InspectionConfig;
  readonly hasWiki: boolean;
  readonly pageName: string;
  readonly markdown: string;
  readonly writers: { readonly wiki?: ReportWriter; readonly issue?: ReportWriter };
}

export interface WriteReportResult {
  readonly location: ReportLocation | null;
  /** 降级或失败的说明，进告警区 */
  readonly warning: string | null;
}

/**
 * 写报告，失败自动降级。
 *
 * 之所以要「降级」而不是直接报错：巡检是定时任务，一次写入失败就整轮丢结果，
 * 用户第二天看到的是一封失败邮件而不是报告，这比内容位置不理想糟得多。
 */
export async function writeReport(input: WriteReportInput): Promise<WriteReportResult> {
  const primary = chooseCarrier(input.config, input.hasWiki);
  const order: ReportCarrier[] = primary === 'wiki' ? ['wiki', 'issue'] : ['issue'];

  let warning: string | null = null;

  for (const carrier of order) {
    const writer = input.writers[carrier];
    if (writer === undefined) continue;

    const outcome = await writer.write(input.pageName, input.markdown);
    if (outcome.ok) {
      const notices = [
        ...(warning === null
          ? []
          : [`${warning}，已改为写入${carrier === 'wiki' ? ' Wiki' : ' Issue'}`]),
        ...(outcome.warning === undefined ? [] : [outcome.warning]),
      ];
      return {
        location: { carrier: writer.kind, reference: outcome.reference, url: outcome.url },
        warning: notices.length === 0 ? null : notices.join('；'),
      };
    }

    // 累加而不是「已有就保留」：之前写法在 wiki 与 issue 都失败时只报第一条，
    // 后面的失败被静默吞掉——用户看到「Wiki 失败」就以为 Issue 成功了，实际两条都没成。
    const reason = `写入${carrier === 'wiki' ? ' Wiki ' : ' Issue '}失败：${outcome.reason}`;
    warning = warning === null ? reason : `${warning}；${reason}`;
  }

  return { location: null, warning: warning ?? '没有可用的报告载体' };
}

/**
 * 定位「上一期」的页面名。
 *
 * 页面名以日期开头，字母序即时间序——这是 Wiki 侧边栏唯一可靠的排序方式，
 * 不需要额外维护目录页。
 */
export function pageNameFor(prefix: string): string {
  return prefix;
}

/** 从已有的报告页面里挑出比当前早的最近一期，用于趋势对比。 */
export function findPreviousPage(pages: readonly string[], current: string): string | null {
  const earlier = pages.filter((page) => page < current).sort();
  return earlier.length === 0 ? null : (earlier[earlier.length - 1] ?? null);
}
