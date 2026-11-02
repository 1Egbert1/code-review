/**
 * 安全性审核员。
 *
 * **不对所有文件跑。** 先由风险路由筛一遍（路径关键词 + 危险 API + 是否请求入口），
 * 命中才送审。理由：把一个纯工具函数送去做安全审查，除了烧 token 还会引入噪声——
 * 模型总得报点什么，于是一个 `formatDate` 里也会冒出「未校验输入」。
 */

import type { ReviewerSpec } from '../../schema.js';
import { buildSchema } from '../../schema.js';
import { buildUserMessage, OUTPUT_CONTRACT } from '../message.js';
import { PROMPT_VERSION, SYSTEM_PROMPT } from './prompt.js';

export const SECURITY_CATEGORIES = [
  'injection',
  'authz',
  'secret-exposure',
  'unsafe-deserialization',
  'path-traversal',
  'ssrf',
  'crypto-misuse',
  'frontend-exposure',
] as const;

export const securityReviewer: ReviewerSpec = {
  id: 'security',
  promptVersion: PROMPT_VERSION,
  allowedCategories: SECURITY_CATEGORIES,
  maxSeverity: 'blocker',
  systemPrompt: `${SYSTEM_PROMPT}\n\n${OUTPUT_CONTRACT}`,
  schema: buildSchema(SECURITY_CATEGORIES, 'blocker'),
  buildUserMessage: (input) => buildUserMessage(input),
};
