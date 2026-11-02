/**
 * 契约层统一出口。
 *
 * 其他模块一律从这里导入类型，不要直接引用具体文件——这样以后拆分或调整文件布局时，
 * 调用方不需要改。
 */
export type * from './diff.js';
export type * from './finding.js';
export type * from './result.js';
export type * from './inspection.js';
export type * from './config.js';
