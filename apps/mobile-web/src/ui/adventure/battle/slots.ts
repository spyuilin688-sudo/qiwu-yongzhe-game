import type { BattleView, EnemyView } from '@qiwu/game-core';
import { CENTER_SLOT, ENEMY_SLOT_X, type EnemySlot } from './layout.ts';

/**
 * 站位簿：每個單位第一次出現時分配一個欄位，存活期間不再重配，
 * 前面的怪倒下時後面的怪不會瞬移換位。離場的單位保留最後一次的樣子（last），
 * 讓死亡演出與飄字可以留在原地；換波（key 改變）時整本重來。
 */
export interface SlotRecord<T> {
  readonly slot: number;
  readonly present: boolean;
  readonly last: T;
}

export interface SlotBook<T> {
  readonly key: string;
  readonly records: ReadonlyMap<number, SlotRecord<T>>;
}

export interface SlotRules<T> {
  readonly slotCount: number;
  readonly idOf: (item: T) => number;
  /** 依序嘗試的欄位；都被佔用時再嘗試其餘空欄，仍然沒有才與第一志願重疊。 */
  readonly preferredSlots: (item: T, everyone: readonly T[]) => readonly number[];
  /** 同一本簿最多保留幾筆離場紀錄（越舊越先丟）。 */
  readonly maxDeparted: number;
}

function preferenceRank(preferred: readonly number[]): number {
  return preferred.length === 0 ? Number.POSITIVE_INFINITY : preferred.length;
}

export function emptySlotBook<T>(key = ''): SlotBook<T> {
  return { key, records: new Map() };
}

export function allocateSlots<T>(book: SlotBook<T>, key: string, items: readonly T[], rules: SlotRules<T>): SlotBook<T> {
  const previous = book.key === key ? book.records : new Map<number, SlotRecord<T>>();
  const presentIds = new Set(items.map(rules.idOf));
  const records = new Map<number, SlotRecord<T>>();
  const departed: [number, SlotRecord<T>][] = [];
  for (const [id, record] of previous) {
    if (presentIds.has(id)) continue;
    departed.push([id, record.present ? { ...record, present: false } : record]);
  }
  for (const [id, record] of departed.slice(Math.max(0, departed.length - rules.maxDeparted))) records.set(id, record);

  const occupied = new Set<number>();
  const newcomers: T[] = [];
  for (const item of items) {
    const record = previous.get(rules.idOf(item));
    if (record && !occupied.has(record.slot)) {
      occupied.add(record.slot);
      records.set(rules.idOf(item), { slot: record.slot, present: true, last: item });
    } else {
      newcomers.push(item);
    }
  }
  // 志願越明確的先排（BOSS 本體、常駐戰獸），其餘依出現順序（uid 由小到大）。
  const ranked = newcomers
    .map((item) => ({ item, preferred: rules.preferredSlots(item, items) }))
    .sort((a, b) => preferenceRank(a.preferred) - preferenceRank(b.preferred) || rules.idOf(a.item) - rules.idOf(b.item));
  for (const { item, preferred } of ranked) {
    const fallback = Array.from({ length: rules.slotCount }, (_, slot) => slot);
    const slot = [...preferred, ...fallback].find((candidate) => !occupied.has(candidate)) ?? preferred[0] ?? 0;
    occupied.add(slot);
    records.set(rules.idOf(item), { slot, present: true, last: item });
  }
  return { key, records };
}

/** 換波（或換關、開始 BOSS 戰）才重排站位；同一波內新出現的怪補進空欄。 */
export function waveKeyOf(view: BattleView): string {
  return `${view.encounterKind}:${view.stageId}:${view.waveIndex}`;
}

const ENEMY_SLOT_COUNT = ENEMY_SLOT_X.length;
const SIDE_SLOTS: readonly EnemySlot[] = [0, 2];
const ROW_SLOTS: readonly EnemySlot[] = [0, 1, 2];
/** 一波最多 3 敵；保留兩波份的離場紀錄已足夠讓死亡演出播完。 */
const MAX_DEPARTED_ENEMIES = ENEMY_SLOT_COUNT * 2;

export function enemySlotRules(bossBodyUid: number | null): SlotRules<EnemyView> {
  return {
    slotCount: ENEMY_SLOT_COUNT,
    idOf: (enemy) => enemy.uid,
    maxDeparted: MAX_DEPARTED_ENEMIES,
    preferredSlots: (enemy, everyone) => {
      if (enemy.uid === bossBodyUid) return [CENTER_SLOT];
      if (enemy.kind === 'add') return SIDE_SLOTS;
      // 單獨出場的小首領站中間欄；和小怪同波時照一般順序排。
      if (enemy.kind === 'elite' && everyone.length === 1) return [CENTER_SLOT];
      return ROW_SLOTS;
    },
  };
}

export function assignEnemySlots(book: SlotBook<EnemyView>, view: BattleView | null): SlotBook<EnemyView> {
  if (!view) return book.records.size === 0 ? book : emptySlotBook();
  return allocateSlots(book, waveKeyOf(view), view.enemies, enemySlotRules(view.boss?.bodyUid ?? null));
}

export function slotOfEnemy(book: SlotBook<EnemyView>, uid: number): EnemySlot | null {
  const record = book.records.get(uid);
  return record ? (record.slot as EnemySlot) : null;
}

/**
 * 召喚物站位：0、1 是角色前方（往敵人方向）的前排，2、3 是角色身後的後排。
 * 常駐的戰獸固定站前排第一格；其他召喚物依出現順序補空格。
 */
export const UNIT_SLOT_COUNT = 4;
export const FRONT_UNIT_SLOTS = 2;

export interface UnitLike {
  readonly uid: number;
  readonly kind: string;
  readonly permanent: boolean;
}

export function unitSlotRules<T extends UnitLike>(): SlotRules<T> {
  return {
    slotCount: UNIT_SLOT_COUNT,
    idOf: (unit) => unit.uid,
    maxDeparted: 0,
    preferredSlots: (unit) => (unit.permanent ? [0] : []),
  };
}

export const UNIT_BOOK_KEY = 'units';
