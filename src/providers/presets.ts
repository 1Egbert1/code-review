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
    baseUrl: 'https://api.deepseek.com',
    // 2026-11 核实：`deepseek-chat` 已不是文档中的模型名，当前是 `deepseek-flash`
    // （老名字 `deepseek-v4-flash` 仍被接受但已退役）。模型名会变，接入前请对照官方定价页。
    model: 'deepseek-flash',
    // 文档标称 1M。这里按标称值填，实际用多少由配置里的 llm.contextWindow 决定——
    // 预设只描述「这个模型最多能装多少」，工程上愿意用多少是另一回事。
    contextWindow: 1_000_000,
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
