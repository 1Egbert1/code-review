/**
 * 三个维度共用的消息拼装。
 *
 * 为什么共用：**缓存命中要求前缀逐字稳定**。系统提示在前、材料在后，
 * 三个维度各自有独立的系统提示，所以各自的缓存互不干扰。
 * 如果每个维度自己拼一套格式，改一处措辞就会让另一处的缓存全部失效。
 *
 * 材料顺序必须是 L0 → L4（装配层已经排好），这里**不重排**。
 */

import type { ContextSegment } from '../../../contracts/context.js';
import type { ReviewerInput } from '../schema.js';

export interface MessageOptions {
  /** 这一维度额外关心的点，追加在材料之后 */
  readonly guidance?: string;
}

function renderSegments(segments: readonly ContextSegment[]): string {
  return segments
    .map((segment) => [`#### ${segment.title}`, '```', segment.content, '```'].join('\n'))
    .join('\n\n');
}

/** 拼 user 消息。结构固定：文件 → 材料 → 补充说明。 */
export function buildUserMessage(input: ReviewerInput, options: MessageOptions = {}): string {
  const blocks: string[] = [];

  blocks.push(
    input.file === null
      ? '## 待审范围\n\n本次改动涉及的全部文件（全局视角）'
      : `## 待审文件\n\n\`${input.file}\``,
  );

  if (input.segments.length > 0) {
    blocks.push(`## 材料\n\n${renderSegments(input.segments)}`);
  }

  if (input.note !== undefined && input.note !== '') {
    blocks.push(`## 补充说明\n\n${input.note}`);
  }

  if (options.guidance !== undefined && options.guidance !== '') {
    blocks.push(`## 本次额外关注\n\n${options.guidance}`);
  }

  return blocks.join('\n\n');
}

/** 输出格式说明，三个维度共用同一段措辞——字段规范必须一致，否则下游解析要分叉。 */
export const OUTPUT_CONTRACT = `## 输出

只输出 JSON，不要任何解释文字：

{"findings":[{"file":"文件路径","line":123,"side":"new","severity":"major","category":"类别","title":"不超过 60 字","body":"触发条件与后果","evidence":"逐字复制的代码","suggestion":"改法或 null","confidence":0.8}]}

- line：改动后的行号；side 为 old 时用改动前的行号
- side："new" 这行在改动后存在；"old" 这行被删除了
- 没有发现问题时输出 {"findings":[]}。不要为了凑数编造问题。`;
