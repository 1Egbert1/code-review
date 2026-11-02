/**
 * 正确性审核员。
 *
 * 第一遍逐文件全量跑——它要看懂函数体、追执行路径，只能一个文件一个文件看。
 * 全局视角对它是负担而非帮助：跨文件的部分由第二遍和跨文件展开负责。
 */

import type { ReviewerSpec } from '../../schema.js';
import { buildSchema } from '../../schema.js';
import { buildUserMessage, OUTPUT_CONTRACT } from '../message.js';
import { PROMPT_VERSION, SYSTEM_PROMPT } from './prompt.js';

/** 允许的问题类别。schema 用同一份清单，越界类别在结构化输出层就被拒。 */
export const CORRECTNESS_CATEGORIES = [
  'null-safety',
  'logic',
  'concurrency',
  'error-handling',
  'resource',
  'boundary',
] as const;

export const correctnessReviewer: ReviewerSpec = {
  id: 'correctness',
  promptVersion: PROMPT_VERSION,
  allowedCategories: CORRECTNESS_CATEGORIES,
  maxSeverity: 'blocker',
  systemPrompt: `${SYSTEM_PROMPT}\n\n${OUTPUT_CONTRACT}`,
  schema: buildSchema(CORRECTNESS_CATEGORIES, 'blocker'),
  buildUserMessage: (input) => buildUserMessage(input),
};
