import { STAT_LABELS, isFlatStat, type StatKey } from '@qiwu/content';

/** 數字使用萬／億縮寫；完整值另由詳情面板顯示（規格 07）。 */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs < 10_000) return value.toLocaleString('zh-TW');
  // 先四捨五入再決定單位，避免 99,999,999 顯示成「10000萬」。
  const wan = trimDecimal(value / 10_000);
  if (Math.abs(Number(wan)) < 10_000) return `${wan}萬`;
  return `${trimDecimal(value / 100_000_000)}億`;
}

function trimDecimal(value: number): string {
  const fixed = Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(1);
  return fixed.replace(/\.0$/, '');
}

export function formatFull(value: number): string {
  return value.toLocaleString('zh-TW');
}

/** 萬分位 → 百分比字串。 */
export function formatBp(bp: number, digits = 2): string {
  const percent = bp / 100;
  const text = Number.isInteger(percent) ? percent.toFixed(0) : percent.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
  return `${text}%`;
}

export function formatStatValue(stat: StatKey, value: number, signed = true): string {
  const sign = signed && value > 0 ? '+' : '';
  if (isFlatStat(stat)) return `${sign}${formatFull(Math.round(value))}`;
  return `${sign}${formatBp(value)}`;
}

export function formatStatDiff(stat: StatKey, diff: number): string {
  if (diff === 0) return '—';
  const sign = diff > 0 ? '+' : '−';
  const magnitude = Math.abs(diff);
  return `${sign}${isFlatStat(stat) ? formatFull(Math.round(magnitude)) : formatBp(magnitude)}`;
}

export function statLabel(stat: StatKey): string {
  return STAT_LABELS[stat];
}

export function formatSecondsShort(ms: number): string {
  if (ms <= 0) return '0';
  const seconds = ms / 1000;
  return seconds >= 10 ? Math.ceil(seconds).toString() : (Math.ceil(seconds * 10) / 10).toFixed(1);
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatAttack(value: number): string {
  return formatFull(Math.floor(value));
}
