/**
 * 规范性审核员。
 *
 * 第二遍全局跑一次，不逐文件：判断「风格是否统一」需要同时看到多个文件的写法，
 * 逐文件反而看不出来。这也是把它和正确性拆开的实际原因之一——两者需要的视野不同。
 *
 * 两个硬限制：
 * - 严重度上限 minor（永久，不允许配置放宽）
 * - 一律只进摘要，永不行内评论（行内位置留给会导致故障的问题）
 */

import type { ReviewerSpec } from '../../schema.js';
import { buildSchema } from '../../schema.js';
import { buildUserMessage, OUTPUT_CONTRACT } from '../message.js';
import { PROMPT_VERSION, SYSTEM_PROMPT } from './prompt.js';

export const CONVENTION_CATEGORIES = [
  'naming',
  'structure',
  'consistency',
  'duplication',
  'convention',
] as const;

export const conventionReviewer: ReviewerSpec = {
  id: 'convention',
  promptVersion: PROMPT_VERSION,
  allowedCategories: CONVENTION_CATEGORIES,
  maxSeverity: 'minor',
  systemPrompt: `${SYSTEM_PROMPT}\n\n${OUTPUT_CONTRACT}`,
  schema: buildSchema(CONVENTION_CATEGORIES, 'minor'),
  buildUserMessage: (input) => buildUserMessage(input),
};

export { detectLintConfig, shouldMuteConvention } from './lint-detect.js';
