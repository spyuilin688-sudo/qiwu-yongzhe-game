import type { BattleView, EnemyKind, EnemyView } from '@qiwu/game-core';
import { describe, expect, it } from 'vitest';
import { ENEMY_SLOT_X } from '../layout.ts';
import { UNIT_BOOK_KEY, allocateSlots, assignEnemySlots, emptySlotBook, slotOfEnemy, unitSlotRules, waveKeyOf, type SlotBook, type UnitLike } from '../slots.ts';

function enemy(uid: number, kind: EnemyKind = 'normal'): EnemyView {
  return { uid, monsterId: `MON-01-${uid}`, name: `怪${uid}`, kind, hp: 10, maxHp: 10, statuses: [], traits: [] };
}

function view(enemies: readonly EnemyView[], options: { waveIndex?: number; stageId?: string; bossBodyUid?: number } = {}): BattleView {
  return {
    encounterKind: options.bossBodyUid === undefined ? 'stage' : 'boss',
    stageId: options.stageId ?? 'ST-01-01',
    timeMs: 0,
    waveIndex: options.waveIndex ?? 0,
    totalWaves: 3,
    enemies,
    hero: { basicIntervalMs: 1000, skills: [], resources: {}, units: [], buffs: [], cards: null },
    boss:
      options.bossBodyUid === undefined
        ? null
        : { name: 'BOSS', bodyUid: options.bossBodyUid, elapsedMs: 0, durationMs: 60000, remainingMs: 60000, hp: 1, maxHp: 1, phaseLabels: [], resolved: null },
  };
}

function xOf(book: SlotBook<EnemyView>, uid: number): number | null {
  const slot = slotOfEnemy(book, uid);
  return slot === null ? null : ENEMY_SLOT_X[slot];
}

describe('敵人站位（同一波內不換位）', () => {
  it('前面的怪依序倒下，後面的怪留在原欄位', () => {
    let book = assignEnemySlots(emptySlotBook(), view([enemy(10), enemy(11), enemy(12)]));
    expect([xOf(book, 10), xOf(book, 11), xOf(book, 12)]).toEqual([62, 76, 90]);
    book = assignEnemySlots(book, view([enemy(11), enemy(12)]));
    expect([xOf(book, 11), xOf(book, 12)]).toEqual([76, 90]);
    book = assignEnemySlots(book, view([enemy(12)]));
    expect(xOf(book, 12)).toBe(90);
  });

  it('離場的怪保留最後位置（給死亡演出與飄字使用），present 變成 false', () => {
    let book = assignEnemySlots(emptySlotBook(), view([enemy(10), enemy(11), enemy(12)]));
    book = assignEnemySlots(book, view([enemy(11), enemy(12)]));
    expect(book.records.get(10)).toMatchObject({ slot: 0, present: false });
    expect(xOf(book, 10)).toBe(62);
  });

  it('同一波中途補進來的怪填進空出的欄位，不擠走其他怪', () => {
    let book = assignEnemySlots(emptySlotBook(), view([enemy(10), enemy(11), enemy(12)]));
    book = assignEnemySlots(book, view([enemy(11), enemy(12)]));
    book = assignEnemySlots(book, view([enemy(11), enemy(12), enemy(13)]));
    expect([xOf(book, 11), xOf(book, 12), xOf(book, 13)]).toEqual([76, 90, 62]);
  });

  it('換波時重新從左排起，舊波的離場紀錄清掉', () => {
    let book = assignEnemySlots(emptySlotBook(), view([enemy(10), enemy(11), enemy(12)]));
    book = assignEnemySlots(book, view([enemy(12)]));
    book = assignEnemySlots(book, view([enemy(20), enemy(21)], { waveIndex: 1 }));
    expect([xOf(book, 20), xOf(book, 21)]).toEqual([62, 76]);
    expect(book.records.has(10)).toBe(false);
    expect(book.key).toBe(waveKeyOf(view([], { waveIndex: 1 })));
  });

  it('單獨出場的小首領站中間欄；和小怪同波時照一般順序', () => {
    const alone = assignEnemySlots(emptySlotBook(), view([enemy(5, 'elite')]));
    expect(xOf(alone, 5)).toBe(76);
    const mixed = assignEnemySlots(emptySlotBook(), view([enemy(5, 'elite'), enemy(6)]));
    expect([xOf(mixed, 5), xOf(mixed, 6)]).toEqual([62, 76]);
  });

  it('BOSS 本體站中間，副目標站兩側；副目標倒下後新生的副目標補回空的那一側', () => {
    let book = assignEnemySlots(emptySlotBook(), view([enemy(1, 'boss')], { bossBodyUid: 1 }));
    expect(xOf(book, 1)).toBe(76);
    book = assignEnemySlots(book, view([enemy(1, 'boss'), enemy(2, 'add'), enemy(3, 'add')], { bossBodyUid: 1 }));
    expect([xOf(book, 1), xOf(book, 2), xOf(book, 3)]).toEqual([76, 62, 90]);
    book = assignEnemySlots(book, view([enemy(1, 'boss'), enemy(3, 'add')], { bossBodyUid: 1 }));
    book = assignEnemySlots(book, view([enemy(1, 'boss'), enemy(3, 'add'), enemy(4, 'add')], { bossBodyUid: 1 }));
    expect([xOf(book, 1), xOf(book, 3), xOf(book, 4)]).toEqual([76, 90, 62]);
  });

  it('沒有戰況時清空站位簿；重複計算同一個快照結果不變', () => {
    const snapshot = view([enemy(10), enemy(11)]);
    const once = assignEnemySlots(emptySlotBook(), snapshot);
    const twice = assignEnemySlots(once, snapshot);
    expect([...twice.records.entries()]).toEqual([...once.records.entries()]);
    expect(assignEnemySlots(twice, null).records.size).toBe(0);
  });

  it('離場紀錄有上限，同一個 key 長時間刷怪也不會無限累積', () => {
    let book = emptySlotBook<EnemyView>();
    for (let uid = 1; uid <= 30; uid += 1) book = assignEnemySlots(book, view([enemy(uid)]));
    expect(book.records.size).toBeLessThanOrEqual(7);
  });
});

describe('召喚物站位', () => {
  const rules = unitSlotRules<UnitLike>();
  const unit = (uid: number, kind = 'turret', permanent = false): UnitLike => ({ uid, kind, permanent });

  it('依出現順序站前排 0、1，再站身後 2、3；舊的到期後新的補空格，其他不動', () => {
    let book = allocateSlots(emptySlotBook<UnitLike>(UNIT_BOOK_KEY), UNIT_BOOK_KEY, [unit(1), unit(2), unit(3, 'mech')], rules);
    expect([1, 2, 3].map((uid) => book.records.get(uid)?.slot)).toEqual([0, 1, 2]);
    book = allocateSlots(book, UNIT_BOOK_KEY, [unit(2), unit(3, 'mech'), unit(4)], rules);
    expect([2, 3, 4].map((uid) => book.records.get(uid)?.slot)).toEqual([1, 2, 0]);
    expect(book.records.has(1)).toBe(false);
  });

  it('常駐戰獸固定站前排第一格', () => {
    const book = allocateSlots(emptySlotBook<UnitLike>(UNIT_BOOK_KEY), UNIT_BOOK_KEY, [unit(7, 'phantom'), unit(9, 'beast', true)], rules);
    expect(book.records.get(9)?.slot).toBe(0);
    expect(book.records.get(7)?.slot).toBe(1);
  });
});
