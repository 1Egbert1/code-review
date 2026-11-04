/**
 * 从错误对象里取 HTTP 状态码。
 *
 * 单独一个文件，是因为它被两处用到（检查运行与标签），而**同一件事写两遍就会分叉**：
 * 一处判 `status` 字段是否存在，另一处判类型，同一份错误在两边得到不同结论，
 * 排查时会以为是平台行为不一致。
 *
 * 为什么不用 `instanceof RequestError`：跨包版本重复安装时 `instanceof`
 * 会失灵（同名类在不同模块实例里不相等），而状态码是稳定的。
 */
export function httpStatusOf(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' && status !== 0 ? status : null;
}
