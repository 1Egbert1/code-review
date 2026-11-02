/**
 * 内置模型预设。
 *
 * **只放结构，不放价格。** 单价、缓存倍率一律由用户配置提供：
 * 价格随时会变，写死在代码里等于出厂即错，而错误的价格会直接体现为一张错的账单。
 *
 * 同理不放「这个模型一定支持 JSON Schema」这类断言：厂商在同一个模型名下悄悄改能力
 * 是发生过的事。能力一律靠首次调用自适应降级确认（见 openai-compat.ts）。
 */

/** 一个预设只描述「连哪里、先试哪个模型、窗口多大」。 */
export interface ModelPreset {
  readonly name: string;
  readonly baseUrl: string;
  readonly model: string;
  /** 上下文窗口的默认假设，用户可覆盖 */
  readonly contextWindow: number;
}

export const PRESETS: Readonly<Record<string, ModelPreset>> = {
  deepseek: {
    name: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    contextWindow: 65536,
  },
  openai: {
    name: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    contextWindow: 128000,
  },
  /** 任何 OpenAI 兼容网关：把 baseUrl 指向内部地址即可 */
  compatible: {
    name: 'compatible',
    baseUrl: 'http://localhost:8000/v1',
    model: 'default',
    contextWindow: 32768,
  },
  ollama: {
    name: 'ollama',
    baseUrl: 'http://localhost:11434/v1',
    model: 'qwen2.5-coder',
    contextWindow: 32768,
  },
};

/** 取预设；未知名字返回 null，由调用方决定是报错还是回落到默认。 */
export function getPreset(name: string): ModelPreset | null {
  return PRESETS[name] ?? null;
}
