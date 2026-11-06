import type { EnemyView } from '@qiwu/game-core';
import type { CSSProperties } from 'react';
import { formatCompact } from '../../format/format.ts';
import styles from '../battle.module.css';
import { floatAnchorOf, type FloatTarget, type FloatText } from './floats.ts';
import { CENTER_SLOT, enemySlotX, type EnemySlot } from './layout.ts';
import type { SlotBook } from './slots.ts';

const SOURCE_CLASS: Readonly<Record<string, string | undefined>> = {
  dot: styles.floatDot,
  summon: styles.floatSummon,
  followUp: styles.floatFollow,
};

/** 從站位簿查目標的欄位與種類（離場的怪也查得到最後位置）。 */
export function floatTargetFromBook(book: SlotBook<EnemyView>, uid: number): FloatTarget | null {
  const record = book.records.get(uid);
  if (!record) return null;
  return { x: enemySlotX(record.slot as EnemySlot), anchor: floatAnchorOf(record.last.kind) };
}

const FALLBACK_TARGET: FloatTarget = { x: enemySlotX(CENTER_SLOT), anchor: 'mob' };

/**
 * 傷害飄字（裝飾，aria-hidden；血量資訊在各血條的 meter 裡）。
 * 位置在建立時就記下，之後不再跟著站位變動；目標頭頂上方冒出，同目標接連命中分層錯開。
 */
export function FloatLayer({ floats, book }: { readonly floats: readonly FloatText[]; readonly book: SlotBook<EnemyView> }) {
  return (
    <>
      {floats.map((item) => {
        const target = item.target ?? floatTargetFromBook(book, item.uid) ?? FALLBACK_TARGET;
        const style = { left: `${target.x}%`, '--float-lane': item.lane, '--float-side': item.side } as CSSProperties;
        return (
          <span
            key={item.id}
            className={[styles.float, item.crit && styles.floatCrit, SOURCE_CLASS[item.source]].filter(Boolean).join(' ')}
            data-anchor={target.anchor}
            style={style}
            aria-hidden="true"
          >
            {formatCompact(item.amount)}
          </span>
        );
      })}
    </>
  );
}
