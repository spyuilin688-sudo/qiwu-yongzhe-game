import { describe, expect, it } from 'vitest';
import { formatBp, formatClock, formatCompact, formatStatDiff, formatStatValue } from './format.ts';

describe('介面數字格式（萬／億縮寫、百分比）', () => {
  it('一萬以下顯示完整數字，以上縮寫為萬／億', () => {
    expect(formatCompact(9999)).toBe('9,999');
    expect(formatCompact(12_500)).toBe('1.3萬');
    expect(formatCompact(1_000_000)).toBe('100萬');
    expect(formatCompact(250_000_000)).toBe('2.5億');
    expect(formatCompact(99_999_999)).toBe('1億');
    expect(formatCompact(99_940_000)).toBe('9994萬');
  });

  it('萬分位轉百分比，固定攻擊顯示整數', () => {
    expect(formatBp(230)).toBe('2.3%');
    expect(formatBp(1500)).toBe('15%');
    expect(formatStatValue('ATK_PCT', 203)).toBe('+2.03%');
    expect(formatStatValue('FLAT_ATTACK', 45)).toBe('+45');
    expect(formatStatDiff('FLAT_ATTACK', -5)).toBe('−5');
    expect(formatStatDiff('CDR', 0)).toBe('—');
  });

  it('BOSS 倒數格式', () => {
    expect(formatClock(60_000)).toBe('1:00');
    expect(formatClock(9_050)).toBe('0:10');
    expect(formatClock(0)).toBe('0:00');
  });
});
