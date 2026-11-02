/**
 * token 数估算。
 *
 * **这是估算，不是分词器。** 差异来源：
 * - 各家模型的分词表不同，同一段文本的 token 数能差 10~20%
 * - 代码里的长标识符、base64、压缩过的 JSON 会被切得比自然语言更碎
 *
 * 因此它只用于**裁剪决策**（判断「这段值不值得放进去」），误差 ±20% 完全可接受。
 * **计费一律用接口返回的用量**，绝不能用这里的数字算钱——那会算出一个假的账单。
 */

/** 全角字符（CJK、全角标点）大致 1 字 1 token；其余按 4 字符 1 token 估算。 */
const ASCII_CHARS_PER_TOKEN = 4;

/** 判断是否属于「一字一 token」的宽字符区间。 */
function isWide(char: string): boolean {
  const code = char.codePointAt(0);
  if (code === undefined) return false;
  return (
    (code >= 0x2e80 && code <= 0x9fff) || // CJK 部首、假名、统一表意文字
    (code >= 0xac00 && code <= 0xd7af) || // 韩文
    (code >= 0xf900 && code <= 0xfaff) || // CJK 兼容表意
    (code >= 0xff00 && code <= 0xffef) || // 全角标点与字母
    (code >= 0x3000 && code <= 0x303f) // CJK 标点
  );
}

/**
 * 估算一段文本的 token 数。
 *
 * 空串为 0；纯 ASCII 按 4 字符 1 token 向上取整。
 */
export function estimateTokens(text: string): number {
  if (text === '') return 0;

  let wide = 0;
  let narrow = 0;
  for (const char of text) {
    if (isWide(char)) wide += 1;
    else narrow += 1;
  }
  return wide + Math.ceil(narrow / ASCII_CHARS_PER_TOKEN);
}
