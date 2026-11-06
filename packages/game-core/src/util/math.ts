/**
 * 以重複乘法計算整數次方。為什麼不用 Math.pow：ECMAScript 未規定 Math.pow 的精度，
 * 不同 JS 引擎可能差一個 ulp，伺服器與客戶端重播時會讓 ceil／round 結果不同。
 */
export function powInt(base: number, exponent: number): number {
  if (!Number.isInteger(exponent) || exponent < 0) throw new RangeError(`指數必須是非負整數：${exponent}`);
  let result = 1;
  for (let index = 0; index < exponent; index += 1) result *= base;
  return result;
}

/** 浮點誤差容忍：避免 14.999999999 被 floor 成 14。 */
const EPSILON = 1e-9;

export function floorSafe(value: number): number {
  return Math.floor(value + EPSILON);
}

export function ceilSafe(value: number): number {
  return Math.ceil(value - EPSILON);
}

export function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5 + EPSILON);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 金幣、經驗、古物都是整數；超出安全整數範圍代表帳本錯誤，必須立即中止而不是悄悄失真。 */
export function assertSafeNonNegativeInt(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${label} 必須是非負安全整數：${value}`);
  return value;
}

export function bpToRatio(bp: number): number {
  return bp / 10000;
}
