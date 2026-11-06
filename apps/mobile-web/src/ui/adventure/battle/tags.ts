import type { BattleView } from '@qiwu/game-core';

const MS_PER_SECOND = 1000;

/** 小標籤（狀態、增益）在腳下只排一行：超過上限時顯示前幾個，其餘以「+N」表示，不會把版面撐高。 */
export interface LimitedTags<T> {
  readonly shown: readonly T[];
  readonly hiddenCount: number;
}

export function limitTags<T>(items: readonly T[], max: number): LimitedTags<T> {
  if (items.length <= max) return { shown: items, hiddenCount: 0 };
  return { shown: items.slice(0, max), hiddenCount: items.length - max };
}

export type HeroBuffView = BattleView['hero']['buffs'][number];

/** 增益標籤文字：有層數顯示「×層數」，否則顯示剩餘秒數（無條件進位），兩者皆無只顯示名稱。 */
export function buffTagText(buff: HeroBuffView): string {
  if (buff.charges > 0) return `${buff.label} ×${buff.charges}`;
  if (buff.remainingMs > 0) return `${buff.label} ${Math.ceil(buff.remainingMs / MS_PER_SECOND)}秒`;
  return buff.label;
}

export function secondsLeft(remainingMs: number): number {
  return Math.ceil(remainingMs / MS_PER_SECOND);
}
