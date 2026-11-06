import {
  SHARED_OWNER_ID,
  SHARED_SLOT_IDS,
  SLOT_IDS,
  getStageAt,
  lineageIds,
  loadDefaultCatalog,
  type QualityId,
} from '@qiwu/content';
import { describe, expect, it } from 'vitest';
import {
  GameEngine,
  LedgerInvariantError,
  appendLedger,
  createInitialState,
  type Command,
  type CommandResponse,
  type EngineEvent,
  type GameState,
  type IdentifyResult,
  type ItemInstance,
  type SellResult,
} from '../src/index.ts';

/**
 * 經濟與操作完整性（規格 02／09／10：T-01～T-12、T-32）。
 * 前置條件可用 fixture 狀態建立；受測動作一律經 engine.execute／engine.advance。
 */

const catalog = loadDefaultCatalog();
const { tuning } = catalog;

let opSerial = 0;
function nextOpId(prefix = 'op-econ'): string {
  opSerial += 1;
  return `${prefix}-${String(opSerial).padStart(5, '0')}`;
}

function fixture(mutate?: (state: GameState) => void, seed = 7): GameState {
  const state = createInitialState(catalog, seed);
  mutate?.(state);
  return state;
}

function engineWith(mutate?: (state: GameState) => void, seed = 7): GameEngine {
  return new GameEngine({ catalog, nowMs: 0, state: fixture(mutate, seed) });
}

function send(engine: GameEngine, type: string, payload: unknown, operationId = nextOpId(), nowMs = 1_000): CommandResponse {
  return engine.execute({ operationId, command: { type, payload } as unknown as Command }, nowMs);
}

function expectSucceeded<T>(res: CommandResponse): T {
  if (res.status !== 'succeeded') throw new Error(`預期成功，實際被拒：${res.error.code} ${res.error.message}`);
  return res.result as T;
}

function expectRejected(res: CommandResponse, code: string): Extract<CommandResponse, { status: 'rejected' }> {
  expect(res.status).toBe('rejected');
  if (res.status !== 'rejected') throw new Error('預期被拒');
  expect(res.error.code).toBe(code);
  return res;
}

function identify(engine: GameEngine, operationId = nextOpId()): IdentifyResult {
  return expectSucceeded<IdentifyResult>(send(engine, 'identify', {}, operationId));
}

function identifyMany(engine: GameEngine, count: number): ItemInstance[] {
  const items: ItemInstance[] = [];
  for (let index = 0; index < count; index += 1) items.push(identify(engine).item);
  return items;
}

function sell(engine: GameEngine, itemIds: string[], operationId = nextOpId()): CommandResponse {
  return send(engine, 'sellItems', { itemIds, origin: 'manual' }, operationId);
}

/** 依規格 02 售價公式（N 值讀 catalog.tuning）獨立計算，不呼叫受測函式。 */
function expectedSellPrice(level: number, qualityId: QualityId): number {
  const { sellBase, sellPerLevel, sellMultiplierByQuality } = tuning.economy;
  return Math.floor((sellBase + sellPerLevel * level) * sellMultiplierByQuality[qualityId]);
}

function expectedIdentifyXp(levelBefore: number): number {
  const { base, perLevel } = tuning.progression.identifyXp;
  return base + perLevel * levelBefore;
}

function expectedNextLevelXp(level: number): number {
  const { base, linear, quadratic } = tuning.progression.nextXp;
  const n = level - 1;
  return base + linear * n + quadratic * n * n;
}

function expectedNormalPoints(mapNumber: number): number {
  const { normalBasePoints, normalGrowthPerMap } = tuning.relic;
  return Math.round(normalBasePoints * normalGrowthPerMap ** (mapNumber - 1));
}

function defeatedEvents(events: readonly EngineEvent[]) {
  return events.flatMap((entry) => (entry.type === 'battle' && entry.event.type === 'enemyDefeated' ? [entry.event] : []));
}

/** 以固定步長推進普通戰鬥並收集事件（步長小於 maxCatchUpMs，不會被丟棄）。 */
function advanceFor(engine: GameEngine, fromMs: number, durationMs: number, stepMs = 100): { nowMs: number; events: EngineEvent[] } {
  const events: EngineEvent[] = [];
  let nowMs = fromMs;
  const end = fromMs + durationMs;
  while (nowMs < end) {
    nowMs += stepMs;
    engine.advance(nowMs);
    events.push(...engine.drainEvents());
  }
  return { nowMs, events };
}

// ───────────────────────── T-01／T-02 戰鬥產出 ─────────────────────────

describe('戰鬥產出：擊殺只累積古物（T-01、T-02）', () => {
  it('T-01 普通怪擊殺：經驗、等級、金幣完全不變，帳本只有 RELIC_GRANTED', () => {
    const engine = new GameEngine({ catalog, nowMs: 0, seed: 101 });
    const { events } = advanceFor(engine, 0, 4 * 60_000);
    const state = engine.exportState();
    const kills = defeatedEvents(events);

    expect(kills.length).toBeGreaterThan(0);
    expect(state.player.xp).toBe(0);
    expect(state.player.level).toBe(1);
    expect(state.wallet.gold).toBe(0);
    expect(state.totals.goldEarned).toBe(0);
    expect(state.revision).toBe(0);
    expect(state.ledger.length).toBeGreaterThan(0);
    for (const entry of state.ledger) {
      expect(entry.eventType).toBe('RELIC_GRANTED');
      expect(entry.resource).toBe('RELIC');
      expect(entry.delta).toBe(1);
    }
    expect(state.ledger.some((entry) => entry.resource === 'GOLD' || entry.resource === 'XP')).toBe(false);
    // 普通怪每隻 w(m) 點，地圖 1。
    for (const kill of kills.filter((event) => event.kind === 'normal')) {
      expect(kill.rewardPoints).toBe(expectedNormalPoints(1));
    }
    expect(state.wallet.relics).toBe(state.totals.relicsGranted);
    expect(state.ledger.filter((entry) => entry.eventType === 'RELIC_GRANTED')).toHaveLength(state.totals.relicsGranted);
  });

  it('T-01 小首領擊殺：產出 6×w(m) 點，仍不給經驗／金幣', () => {
    const eliteStage = getStageAt(catalog, 1, 5);
    expect(eliteStage.type).toBe('elite');
    const engine = engineWith((state) => {
      state.progress.localStage = eliteStage.localNumber;
    }, 202);
    const { events } = advanceFor(engine, 0, 3 * 60_000);
    const eliteKills = defeatedEvents(events).filter((event) => event.kind === 'elite');
    expect(eliteKills.length).toBeGreaterThanOrEqual(1);
    expect(eliteKills[0]!.rewardPoints).toBe(expectedNormalPoints(1) * tuning.relic.eliteMultiplier);

    const state = engine.exportState();
    expect(state.player.xp).toBe(0);
    expect(state.player.level).toBe(1);
    expect(state.wallet.gold).toBe(0);
    expect(state.ledger.every((entry) => entry.eventType === 'RELIC_GRANTED')).toBe(true);
    // 小首領死亡後推進到下一關。
    expect(state.progress.localStage).toBeGreaterThan(eliteStage.localNumber);
  });

  it('T-02 每個敵人只結算一次：產出點總和 = 古物×100 + 餘數，擊殺數 = 死亡事件數', () => {
    const engine = new GameEngine({ catalog, nowMs: 0, seed: 303 });
    const { events } = advanceFor(engine, 0, 3 * 60_000);
    const kills = defeatedEvents(events);
    const state = engine.exportState();
    const totalPoints = kills.reduce((sum, kill) => sum + kill.rewardPoints, 0);

    expect(state.totals.kills).toBe(kills.length);
    expect(new Set(kills.map((kill) => kill.uid)).size).toBe(kills.length);
    expect(state.totals.relicsGranted * tuning.relic.pointsPerRelic + state.wallet.relicProgress).toBe(totalPoints);
    expect(state.wallet.relicProgress).toBeLessThan(tuning.relic.pointsPerRelic);
    // 事件只會被取出一次，不會重新投遞。
    expect(engine.drainEvents()).toEqual([]);
  });

  it('T-02 重複／倒退推進同一時刻不重複結算，與正常推進結果完全一致', () => {
    const normal = new GameEngine({ catalog, nowMs: 0, seed: 404 });
    const duplicated = new GameEngine({ catalog, nowMs: 0, seed: 404 });
    const durationMs = 2 * 60_000;
    for (let nowMs = 100; nowMs <= durationMs; nowMs += 100) {
      normal.advance(nowMs);
      duplicated.advance(nowMs);
      duplicated.advance(nowMs);
      duplicated.advance(nowMs - 50);
      duplicated.advance(nowMs);
    }
    const a = normal.exportState();
    const b = duplicated.exportState();
    expect(a.totals.kills).toBeGreaterThan(0);
    expect(b.totals).toEqual(a.totals);
    expect(b.wallet).toEqual(a.wallet);
    expect(b.progress).toEqual(a.progress);
    expect(b.ledger).toEqual(a.ledger);
  });

  it('T-02 背景暫停後恢復：暫停期間無產出、不補算離線收益', () => {
    const engine = new GameEngine({ catalog, nowMs: 0, seed: 505 });
    const first = advanceFor(engine, 0, 30_000);
    const before = engine.exportState();
    engine.suspend();
    engine.advance(first.nowMs + 10 * 60_000);
    expect(engine.exportState().totals).toEqual(before.totals);
    expect(engine.exportState().wallet).toEqual(before.wallet);
    engine.resume(first.nowMs + 10 * 60_000);
    // 恢復後下一次推進只算恢復之後的時間（遠小於 10 分鐘的產出）。
    engine.advance(first.nowMs + 10 * 60_000 + 50);
    const after = engine.exportState();
    expect(after.totals.kills - before.totals.kills).toBeLessThanOrEqual(1);
  });
});

// ───────────────────────── T-03～T-07 鑑定 ─────────────────────────

describe('鑑定（T-03～T-07）', () => {
  it('T-03 鑑定一次：古物−1、裝備+1、經驗依公式增加、金幣不變，帳本寫 RELIC_CONSUMED 與 IDENTIFIED', () => {
    const engine = engineWith((state) => {
      state.wallet.relics = 3;
      state.wallet.gold = 123;
    });
    const opId = nextOpId('op-t03');
    const result = identify(engine, opId);
    const state = engine.exportState();

    expect(state.wallet.relics).toBe(2);
    expect(result.relicsAfter).toBe(2);
    expect(Object.keys(state.items)).toEqual([result.item.id]);
    expect(result.xpGained).toBe(expectedIdentifyXp(1));
    expect(state.player.xp).toBe(expectedIdentifyXp(1));
    expect(state.wallet.gold).toBe(123);
    expect(state.totals.identified).toBe(1);
    expect(result.item.level).toBe(1);
    expect(result.item.createdByOperation).toBe(opId);
    expect(result.item.contentVersion).toBe(catalog.contentVersion);
    expect(result.item.locked).toBe(false);
    expect(state.revision).toBe(1);

    const entries = state.ledger.filter((entry) => entry.operationId === opId);
    expect(entries.map((entry) => [entry.eventType, entry.resource, entry.delta])).toEqual([
      ['RELIC_CONSUMED', 'RELIC', -1],
      ['IDENTIFIED', 'XP', expectedIdentifyXp(1)],
    ]);
    expect(state.ledger.some((entry) => entry.resource === 'GOLD')).toBe(false);
  });

  it('T-04 同操作 ID 重送 10 次：只有 1 件裝備、1 次經驗、古物只扣 1，回應完全一致', () => {
    const engine = engineWith((state) => {
      state.wallet.relics = 5;
    });
    const opId = nextOpId('op-t04');
    const first = send(engine, 'identify', {}, opId);
    expect(first.status).toBe('succeeded');
    const afterFirst = engine.exportState();

    for (let attempt = 0; attempt < 9; attempt += 1) {
      const replay = send(engine, 'identify', {}, opId, 5_000 + attempt);
      expect(replay.replayed).toBe(true);
      const { replayed: _replayed, ...rest } = replay;
      expect(rest).toEqual(first);
    }
    const state = engine.exportState();
    expect(Object.keys(state.items)).toHaveLength(1);
    expect(state.wallet.relics).toBe(4);
    expect(state.player.xp).toBe(afterFirst.player.xp);
    expect(state.totals.identified).toBe(1);
    expect(state.revision).toBe(afterFirst.revision);
    expect(state.ledger.filter((entry) => entry.eventType === 'IDENTIFIED')).toHaveLength(1);
    expect(engine.queryOperation(opId)?.status).toBe('succeeded');
  });

  it('T-04 同操作 ID 重送出售 10 次：金幣只增加一次', () => {
    const engine = engineWith((state) => {
      state.wallet.relics = 1;
    });
    const item = identify(engine).item;
    const opId = nextOpId('op-t04-sell');
    const first = expectSucceeded<SellResult>(sell(engine, [item.id], opId));
    for (let attempt = 0; attempt < 9; attempt += 1) {
      const replay = sell(engine, [item.id], opId);
      expect(replay.status).toBe('succeeded');
      expect(replay.replayed).toBe(true);
    }
    const state = engine.exportState();
    expect(state.wallet.gold).toBe(first.goldGained);
    expect(state.ledger.filter((entry) => entry.eventType === 'ITEM_SOLD')).toHaveLength(1);
    expect(state.totals.itemsSold).toBe(1);
  });

  // 回歸測試（已修正的核心缺陷）: 重送回應（replayed）只做淺拷貝 `{ ...existing.response }`，result.item 與權威狀態中的
  // operations.records[...].response 以及（下一次命令前）state.items[id] 是同一個物件。
  // 呼叫端修改重送回應即可改寫已保存的操作結果與背包中的裝備（例如把品質改成 Q5），
  // 違反 T-04「結果完全一致」與 T-32「不能得到非法資產」。預期：重送回應應為深拷貝。
  it('T-04／T-32 修改重送回應不得影響權威狀態或下一次重送結果', () => {
    const engine = engineWith((state) => {
      state.wallet.relics = 1;
    });
    const opId = nextOpId('op-alias');
    const first = send(engine, 'identify', {}, opId);
    const original = (first as { result: IdentifyResult }).result.item;
    const replay = send(engine, 'identify', {}, opId) as { result: IdentifyResult };
    replay.result.item.qualityId = 'Q5';
    replay.result.item.level = 999;
    replay.result.item.mainStat.value = 999_999;

    const state = engine.exportState();
    expect(state.items[original.id]!.qualityId).toBe(original.qualityId);
    expect(state.items[original.id]!.level).toBe(original.level);
    const again = send(engine, 'identify', {}, opId) as { result: IdentifyResult };
    expect(again.result.item).toEqual(original);
    // 實測：seed 7 的 Q2 Lv1 裝備（應售 15 金）被竄改後以 Q5 Lv999 售出 14042 金。
    const sold = expectSucceeded<SellResult>(sell(engine, [original.id]));
    expect(sold.goldGained).toBe(expectedSellPrice(original.level, original.qualityId));
  });

  it('T-05 同 ID 改 payload／改命令：OPERATION_REUSED，不生成第二結果、原紀錄不被覆寫', () => {
    const engine = engineWith((state) => {
      state.wallet.relics = 3;
    });
    const opId = nextOpId('op-t05');
    const first = identify(engine, opId);
    const before = engine.exportState();

    const changedPayload = send(engine, 'identify', { extra: true }, opId);
    expectRejected(changedPayload, 'OPERATION_REUSED');
    const changedCommand = sell(engine, [first.item.id], opId);
    expectRejected(changedCommand, 'OPERATION_REUSED');

    const after = engine.exportState();
    expect(after.items).toEqual(before.items);
    expect(after.wallet).toEqual(before.wallet);
    expect(after.player).toEqual(before.player);
    expect(after.revision).toBe(before.revision);
    expect(after.ledger).toEqual(before.ledger);
    const record = engine.queryOperation(opId);
    expect(record?.commandType).toBe('identify');
    expect((record?.response as { result: IdentifyResult }).result.item.id).toBe(first.item.id);
    // 原請求仍可查回原結果。
    const replay = send(engine, 'identify', {}, opId);
    expect(replay.replayed).toBe(true);
    expect((replay as { result: IdentifyResult }).result.item.id).toBe(first.item.id);
  });

  it('T-05 同 ID 出售不同物品：拒絕，第二件不被出售', () => {
    const engine = engineWith((state) => {
      state.wallet.relics = 2;
    });
    const [a, b] = identifyMany(engine, 2);
    const opId = nextOpId('op-t05-sell');
    expectSucceeded<SellResult>(sell(engine, [a!.id], opId));
    const goldAfterFirst = engine.getState().wallet.gold;
    expectRejected(sell(engine, [b!.id], opId), 'OPERATION_REUSED');
    expect(engine.getState().wallet.gold).toBe(goldAfterFirst);
    expect(engine.getState().items[b!.id]).toBeDefined();
  });

  it('T-06 經驗剛好升級：該件裝備採操作前等級，下一件用新等級', () => {
    const xpToLevelUp = expectedNextLevelXp(1) - expectedIdentifyXp(1);
    expect(xpToLevelUp).toBeGreaterThanOrEqual(0);
    const engine = engineWith((state) => {
      state.wallet.relics = 2;
      state.player.xp = xpToLevelUp;
    });
    const first = identify(engine);
    expect(first.levelBefore).toBe(1);
    expect(first.levelAfter).toBe(2);
    expect(first.levelsGained).toBe(1);
    expect(first.item.level).toBe(1);
    expect(engine.getState().player.level).toBe(2);
    expect(engine.getState().player.xp).toBe(0);

    const second = identify(engine);
    expect(second.levelBefore).toBe(2);
    expect(second.item.level).toBe(2);
    expect(second.xpGained).toBe(expectedIdentifyXp(2));
    expect(engine.getState().player.xp).toBe(expectedIdentifyXp(2));
  });

  it('T-06 升級後保留經驗餘額（逐級扣除門檻）', () => {
    const overflow = 5;
    const engine = engineWith((state) => {
      state.wallet.relics = 1;
      state.player.xp = expectedNextLevelXp(1) - expectedIdentifyXp(1) + overflow;
    });
    const result = identify(engine);
    expect(result.item.level).toBe(1);
    expect(engine.getState().player.level).toBe(2);
    expect(engine.getState().player.xp).toBe(overflow);
  });

  it('T-07 古物不足：NO_RELIC，不扣資源、不給經驗、不生成裝備、revision 不變', () => {
    const engine = engineWith((state) => {
      state.player.xp = 10;
    });
    const before = engine.exportState();
    const res = expectRejected(send(engine, 'identify', {}), 'NO_RELIC');
    expect(res.error.retryable).toBe(true);
    const after = engine.exportState();
    expect(after.wallet).toEqual(before.wallet);
    expect(after.player).toEqual(before.player);
    expect(after.items).toEqual({});
    expect(after.ledger).toEqual(before.ledger);
    expect(after.revision).toBe(before.revision);
    expect(after.counters.itemSerial).toBe(before.counters.itemSerial);
    expect(after.rng).toEqual(before.rng);
  });

  it('T-07 背包滿：BAG_FULL，不扣古物、不給經驗；出售後才可繼續', () => {
    const capacity = catalog.globals.backpackCapacity;
    const engine = engineWith((state) => {
      state.wallet.relics = capacity + 1;
    });
    const items = identifyMany(engine, capacity);
    expect(Object.keys(engine.getState().items)).toHaveLength(capacity);
    const before = engine.exportState();
    expect(before.wallet.relics).toBe(1);

    const res = expectRejected(send(engine, 'identify', {}), 'BAG_FULL');
    expect(res.error.retryable).toBe(true);
    const after = engine.exportState();
    expect(after.wallet.relics).toBe(1);
    expect(after.player).toEqual(before.player);
    expect(Object.keys(after.items)).toHaveLength(capacity);
    expect(after.ledger).toEqual(before.ledger);
    expect(after.rng).toEqual(before.rng);

    expectSucceeded<SellResult>(sell(engine, [items[0]!.id]));
    identify(engine);
    expect(engine.getState().wallet.relics).toBe(0);
    expect(Object.keys(engine.getState().items)).toHaveLength(capacity);
  });
});

// ───────────────────────── T-08～T-10 出售 ─────────────────────────

describe('出售（T-08～T-10）', () => {
  it('T-08 出售一件普通裝備：金幣 = 伺服器售價公式，經驗不變，物品移入封存', () => {
    const engine = engineWith((state) => {
      state.wallet.relics = 30;
    });
    const items = identifyMany(engine, 30);
    const common = items.find((item) => item.qualityId === 'Q1');
    expect(common).toBeDefined();
    const before = engine.exportState();
    const opId = nextOpId('op-t08');
    const result = expectSucceeded<SellResult>(sell(engine, [common!.id], opId));
    const price = expectedSellPrice(common!.level, 'Q1');

    const after = engine.exportState();
    expect(result.goldGained).toBe(price);
    expect(after.wallet.gold).toBe(before.wallet.gold + price);
    expect(after.player).toEqual(before.player);
    expect(after.items[common!.id]).toBeUndefined();
    expect(after.soldArchive.find((item) => item.id === common!.id)?.status).toBe('sold');
    expect(after.totals.goldEarned).toBe(price);
    const goldEntries = after.ledger.filter((entry) => entry.operationId === opId);
    expect(goldEntries).toEqual([
      expect.objectContaining({ eventType: 'ITEM_SOLD', resource: 'GOLD', delta: price, balanceAfter: price, entityRef: common!.id }),
    ]);
    expect(after.ledger.some((entry) => entry.operationId === opId && entry.resource === 'XP')).toBe(false);
  });

  it('T-08 批次出售：金幣 = 各件依保存等級／品質計算的售價總和', () => {
    const engine = engineWith((state) => {
      state.wallet.relics = 20;
      state.player.level = 7;
    });
    const items = identifyMany(engine, 20);
    expect(new Set(items.map((item) => item.qualityId)).size).toBeGreaterThan(1);
    const expected = items.reduce((sum, item) => sum + expectedSellPrice(item.level, item.qualityId), 0);
    const xpBefore = engine.getState().player.xp;
    const result = expectSucceeded<SellResult>(sell(engine, items.map((item) => item.id)));
    expect(result.goldGained).toBe(expected);
    expect(engine.getState().wallet.gold).toBe(expected);
    expect(engine.getState().player.xp).toBe(xpBefore);
    expect(Object.keys(engine.getState().items)).toHaveLength(0);
  });

  it('T-09 批次含鎖定與配置引用的裝備：整筆失敗，金幣與物品不變，fieldErrors 列出衝突項目', () => {
    const engine = engineWith((state) => {
      state.wallet.relics = 6;
    });
    const [locked, equippedFarm, equippedBoss, free] = identifyMany(engine, 4);
    expectSucceeded(send(engine, 'lockItem', { itemId: locked!.id, locked: true }));
    expectSucceeded(send(engine, 'equipItem', { itemId: equippedFarm!.id, purpose: 'farm' }));
    // 只被打王配置引用的物品同樣不可出售（任一配置引用皆拒絕）。
    const bossCandidate = equippedBoss!;
    expectSucceeded(send(engine, 'equipItem', { itemId: bossCandidate.id, purpose: 'boss' }));
    const before = engine.exportState();

    const res = sell(engine, [free!.id, locked!.id, equippedFarm!.id, bossCandidate.id]);
    expect(res.status).toBe('rejected');
    if (res.status !== 'rejected') return;
    expect(['ITEM_LOCKED', 'ITEM_REFERENCED']).toContain(res.error.code);
    expect(Object.keys(res.error.fieldErrors ?? {}).sort()).toEqual([locked!.id, equippedFarm!.id, bossCandidate.id].sort());
    expect(res.error.fieldErrors?.[free!.id]).toBeUndefined();

    const after = engine.exportState();
    expect(after.wallet.gold).toBe(before.wallet.gold);
    expect(after.items).toEqual(before.items);
    expect(after.soldArchive).toEqual([]);
    expect(after.ledger).toEqual(before.ledger);
    expect(after.revision).toBe(before.revision);
  });

  it('T-09 單件鎖定拒絕 ITEM_LOCKED；解鎖後可出售（鎖定只禁止出售）', () => {
    const engine = engineWith((state) => {
      state.wallet.relics = 1;
    });
    const item = identify(engine).item;
    expectSucceeded(send(engine, 'lockItem', { itemId: item.id, locked: true }));
    expectRejected(sell(engine, [item.id]), 'ITEM_LOCKED');
    expect(engine.getState().wallet.gold).toBe(0);
    expectSucceeded(send(engine, 'lockItem', { itemId: item.id, locked: false }));
    const result = expectSucceeded<SellResult>(sell(engine, [item.id]));
    expect(result.goldGained).toBe(expectedSellPrice(item.level, item.qualityId));
  });

  it('T-09 已穿戴裝備拒絕 ITEM_REFERENCED；卸下後可出售', () => {
    const engine = engineWith((state) => {
      state.wallet.relics = 1;
    });
    const item = identify(engine).item;
    expectSucceeded(send(engine, 'equipItem', { itemId: item.id, purpose: 'farm' }));
    const res = expectRejected(sell(engine, [item.id]), 'ITEM_REFERENCED');
    expect(res.error.fieldErrors?.[item.id]).toBeTruthy();
    expect(engine.getState().items[item.id]).toBeDefined();
    expectSucceeded(send(engine, 'unequipSlot', { slot: item.slot, purpose: 'farm' }));
    expectSucceeded<SellResult>(sell(engine, [item.id]));
    expect(engine.getState().items[item.id]).toBeUndefined();
  });

  it('T-10 出售同件兩次：第二次 ITEM_ALREADY_SOLD，不再給金幣；同批重複 ID 整筆拒絕', () => {
    const engine = engineWith((state) => {
      state.wallet.relics = 2;
    });
    const [item, other] = identifyMany(engine, 2);
    const first = expectSucceeded<SellResult>(sell(engine, [item!.id]));
    const goldAfterFirst = engine.getState().wallet.gold;
    expect(goldAfterFirst).toBe(first.goldGained);

    expectRejected(sell(engine, [item!.id]), 'ITEM_ALREADY_SOLD');
    expect(engine.getState().wallet.gold).toBe(goldAfterFirst);
    // 已售出 + 未售出混在同批：整筆失敗，未售出那件不被賣掉。
    const mixed = expectRejected(sell(engine, [other!.id, item!.id]), 'ITEM_ALREADY_SOLD');
    expect(Object.keys(mixed.error.fieldErrors ?? {})).toEqual([item!.id]);
    expect(engine.getState().items[other!.id]).toBeDefined();
    // 同一批重複列同一件。
    expectRejected(sell(engine, [other!.id, other!.id]), 'INVALID_PAYLOAD');
    expect(engine.getState().wallet.gold).toBe(goldAfterFirst);
    const state = engine.exportState();
    expect(state.ledger.filter((entry) => entry.eventType === 'ITEM_SOLD' && entry.entityRef === item!.id)).toHaveLength(1);
    expect(state.totals.itemsSold).toBe(1);
  });
});

// ───────────────────────── T-11 鑑定台升級 ─────────────────────────

describe('鑑定台升級（T-11）', () => {
  const cost1 = catalog.bench[0]!.nextCost!;
  const cost2 = catalog.bench[1]!.nextCost!;

  it('T-11 兩次升台帶同一 expectedBenchLevel：第二次 BENCH_LEVEL_MISMATCH，不透支', () => {
    const engine = engineWith((state) => {
      state.wallet.gold = cost1 + cost2 - 1;
    });
    const first = expectSucceeded<{ levelBefore: number; levelAfter: number; cost: number; goldAfter: number }>(
      send(engine, 'upgradeBench', { expectedBenchLevel: 1 }),
    );
    expect(first).toEqual({ levelBefore: 1, levelAfter: 2, cost: cost1, goldAfter: cost2 - 1 });
    const second = expectRejected(send(engine, 'upgradeBench', { expectedBenchLevel: 1 }), 'BENCH_LEVEL_MISMATCH');
    expect(second.error.details?.currentLevel).toBe(2);
    expect(engine.getState().wallet.benchLevel).toBe(2);
    expect(engine.getState().wallet.gold).toBe(cost2 - 1);

    // 以新台等重新計價：差 1 金幣，不可扣成負數。
    const third = expectRejected(send(engine, 'upgradeBench', { expectedBenchLevel: 2 }), 'INSUFFICIENT_GOLD');
    expect(third.error.details).toEqual({ cost: cost2, shortfall: 1 });
    expect(third.error.retryable).toBe(true);
    expect(engine.getState().wallet.gold).toBe(cost2 - 1);
    expect(engine.getState().wallet.benchLevel).toBe(2);

    const state = engine.exportState();
    expect(state.ledger.filter((entry) => entry.eventType === 'BENCH_UPGRADED')).toEqual([
      expect.objectContaining({ resource: 'GOLD', delta: -cost1, balanceAfter: cost2 - 1 }),
    ]);
  });

  it('T-11 兩次升台帶同一 expectedRevision：第二次 REVISION_MISMATCH', () => {
    const engine = engineWith((state) => {
      state.wallet.gold = cost1 + cost2;
    });
    const revision = engine.getState().revision;
    const a = engine.execute(
      { operationId: nextOpId('op-t11-rev'), expectedRevision: revision, command: { type: 'upgradeBench', payload: { expectedBenchLevel: 1 } } },
      1_000,
    );
    expect(a.status).toBe('succeeded');
    const b = engine.execute(
      { operationId: nextOpId('op-t11-rev'), expectedRevision: revision, command: { type: 'upgradeBench', payload: { expectedBenchLevel: 2 } } },
      1_000,
    );
    expectRejected(b, 'REVISION_MISMATCH');
    expect(engine.getState().wallet.benchLevel).toBe(2);
    expect(engine.getState().wallet.gold).toBe(cost2);
  });

  it('T-11 金幣不足：INSUFFICIENT_GOLD 顯示差額，金幣與台等不變', () => {
    const engine = engineWith((state) => {
      state.wallet.gold = cost1 - 1;
    });
    const before = engine.exportState();
    const res = expectRejected(send(engine, 'upgradeBench', { expectedBenchLevel: 1 }), 'INSUFFICIENT_GOLD');
    expect(res.error.details).toEqual({ cost: cost1, shortfall: 1 });
    const after = engine.exportState();
    expect(after.wallet).toEqual(before.wallet);
    expect(after.ledger).toEqual(before.ledger);
    expect(after.revision).toBe(before.revision);
  });

  it('T-11 每級費用讀鑑定台表，升級不發經驗、不重抽舊裝；第 10 級為上限', () => {
    const totalCost = catalog.bench.reduce((sum, row) => sum + (row.nextCost ?? 0), 0);
    const engine = engineWith((state) => {
      state.wallet.gold = totalCost;
      state.wallet.relics = 3;
    });
    identifyMany(engine, 3);
    const itemsBefore = engine.exportState().items;
    const playerBefore = engine.exportState().player;
    for (const row of catalog.bench) {
      if (row.nextCost === null) break;
      const goldBefore = engine.getState().wallet.gold;
      const res = expectSucceeded<{ cost: number }>(send(engine, 'upgradeBench', { expectedBenchLevel: row.level }));
      expect(res.cost).toBe(row.nextCost);
      expect(engine.getState().wallet.gold).toBe(goldBefore - row.nextCost);
    }
    const maxLevel = catalog.bench.length;
    expect(engine.getState().wallet.benchLevel).toBe(maxLevel);
    expect(engine.getState().wallet.gold).toBe(0);
    expectRejected(send(engine, 'upgradeBench', { expectedBenchLevel: maxLevel }), 'BENCH_MAX_LEVEL');
    expect(engine.exportState().items).toEqual(itemsBefore);
    expect(engine.exportState().player).toEqual(playerBefore);
    expect(engine.getState().wallet.gold).toBeGreaterThanOrEqual(0);
  });
});

// ───────────────────────── T-12 轉職 ─────────────────────────

describe('轉職與換裝（T-12）', () => {
  /** 建立 Lv10 劍士，鑑定劍士路線裝備並穿上主武器（清怪＋打王）與一件共用頭部。 */
  function swordsmanWithGear() {
    const engine = engineWith((state) => {
      state.player.level = 10;
      state.wallet.relics = 80;
    }, 1212);
    expectSucceeded(send(engine, 'unlockJob', { jobId: 'JOB01' }));
    expect(engine.getState().identifySettings.targetJobId).toBe('JOB01');
    expectSucceeded(send(engine, 'switchJob', { jobId: 'JOB01', ackUnequipItemIds: [] }));
    const items = identifyMany(engine, 80);
    const weapon = items.find((item) => item.slot === 'weapon');
    const head = items.find((item) => item.slot === 'head');
    expect(weapon).toBeDefined();
    expect(head).toBeDefined();
    expect(catalog.equipment.get(weapon!.baseId)?.ownerJobId).toBe('JOB01');
    for (const purpose of ['farm', 'boss'] as const) {
      expectSucceeded(send(engine, 'equipItem', { itemId: weapon!.id, purpose }));
      expectSucceeded(send(engine, 'equipItem', { itemId: head!.id, purpose }));
    }
    expectSucceeded(send(engine, 'unlockJob', { jobId: 'JOB06' }));
    return { engine, weapon: weapon!, head: head! };
  }

  it('T-12 劍士轉弓手：非法主武卸下但留在背包，共用裝備保留，不產經驗／金幣', () => {
    const { engine, weapon, head } = swordsmanWithGear();
    const before = engine.exportState();
    const result = expectSucceeded<{ jobIdBefore: string; jobIdAfter: string; unequippedItemIds: string[] }>(
      send(engine, 'switchJob', { jobId: 'JOB06', ackUnequipItemIds: [weapon.id] }),
    );
    expect(result.jobIdBefore).toBe('JOB01');
    expect(result.jobIdAfter).toBe('JOB06');
    expect(result.unequippedItemIds).toEqual([weapon.id]);

    const after = engine.exportState();
    expect(after.player.currentJobId).toBe('JOB06');
    expect(after.items[weapon.id]).toEqual(before.items[weapon.id]);
    expect(after.items[head.id]).toEqual(before.items[head.id]);
    for (const purpose of ['farm', 'boss'] as const) {
      const loadout = after.loadouts[`JOB06:${purpose}`]!;
      expect(loadout.items.weapon).toBeUndefined();
      expect(loadout.items.head).toBe(head.id);
    }
    expect(after.player.xp).toBe(before.player.xp);
    expect(after.player.level).toBe(before.player.level);
    expect(after.wallet).toEqual(before.wallet);
    expect(after.ledger).toEqual(before.ledger);
    expect(Object.keys(after.items)).toHaveLength(Object.keys(before.items).length);

    // 弓手不能穿劍士主武。
    expectRejected(send(engine, 'equipItem', { itemId: weapon.id, purpose: 'farm' }), 'ROUTE_INVALID');
    // 切回劍士：優先恢復該職業仍合法的已存配置。
    expectSucceeded(send(engine, 'switchJob', { jobId: 'JOB01', ackUnequipItemIds: [] }));
    expect(engine.getState().loadouts['JOB01:farm']?.items.weapon).toBe(weapon.id);
    expect(engine.getState().wallet).toEqual(before.wallet);
  });

  it('T-12 ackUnequipItemIds 與計畫不符：SWITCH_CONFIRMATION_OUTDATED，狀態完全不變', () => {
    const { engine, weapon, head } = swordsmanWithGear();
    const before = engine.exportState();
    const missing = expectRejected(send(engine, 'switchJob', { jobId: 'JOB06', ackUnequipItemIds: [] }), 'SWITCH_CONFIRMATION_OUTDATED');
    expect(missing.error.details?.expected).toBe(weapon.id);
    expectRejected(send(engine, 'switchJob', { jobId: 'JOB06', ackUnequipItemIds: [weapon.id, head.id] }), 'SWITCH_CONFIRMATION_OUTDATED');
    const after = engine.exportState();
    expect(after.player).toEqual(before.player);
    expect(after.loadouts).toEqual(before.loadouts);
    expect(after.revision).toBe(before.revision);
  });
});

// ───────────────────────── T-32 權限偽造 ─────────────────────────

describe('權限偽造與嚴格 payload（T-32）', () => {
  function engineWithItem() {
    const engine = engineWith((state) => {
      state.wallet.relics = 2;
    });
    const item = identify(engine).item;
    return { engine, item };
  }

  it('T-32 鑑定夾帶 qualityRoll／rewardAmount／playerId：INVALID_PAYLOAD，不扣古物、不生成裝備', () => {
    const { engine } = engineWithItem();
    const before = engine.exportState();
    for (const payload of [{ qualityRoll: 'Q5' }, { rewardAmount: 99_999 }, { playerId: 'someone-else' }, { qualityId: 'Q5', level: 999 }]) {
      const res = expectRejected(send(engine, 'identify', payload), 'INVALID_PAYLOAD');
      expect(res.error.fieldErrors).toBeDefined();
    }
    const after = engine.exportState();
    expect(after.wallet).toEqual(before.wallet);
    expect(after.items).toEqual(before.items);
    expect(after.player).toEqual(before.player);
    expect(after.revision).toBe(before.revision);
  });

  it('T-32 出售夾帶 sellPrice／playerId 或升台夾帶 cost：INVALID_PAYLOAD，金幣不變', () => {
    const { engine, item } = engineWithItem();
    expectRejected(send(engine, 'sellItems', { itemIds: [item.id], origin: 'manual', sellPrice: 999_999 }), 'INVALID_PAYLOAD');
    expectRejected(send(engine, 'sellItems', { itemIds: [item.id], origin: 'manual', playerId: 'p2' }), 'INVALID_PAYLOAD');
    expectRejected(send(engine, 'sellItems', { itemIds: [item.id], origin: 'manual', rewardAmount: 5 }), 'INVALID_PAYLOAD');
    expectRejected(send(engine, 'upgradeBench', { expectedBenchLevel: 1, cost: 0 }), 'INVALID_PAYLOAD');
    expectRejected(send(engine, 'upgradeBench', { expectedBenchLevel: 1.5 }), 'INVALID_PAYLOAD');
    expectRejected(send(engine, 'equipItem', { itemId: item.id, purpose: 'farm', qualityId: 'Q5' }), 'INVALID_PAYLOAD');
    expectRejected(send(engine, 'lockItem', { itemId: item.id, locked: true, level: 99 }), 'INVALID_PAYLOAD');
    const state = engine.exportState();
    expect(state.wallet.gold).toBe(0);
    expect(state.wallet.benchLevel).toBe(1);
    expect(state.items[item.id]).toEqual(item);
    expect(state.ledger.some((entry) => entry.resource === 'GOLD')).toBe(false);
  });

  it('T-32 不存在／偽造的 itemId：出售、鎖定、穿戴皆拒絕，批次中真物品也不被賣出', () => {
    const { engine, item } = engineWithItem();
    expectRejected(sell(engine, ['it999-forged']), 'ITEM_NOT_FOUND');
    const mixed = expectRejected(sell(engine, [item.id, 'it999-forged']), 'ITEM_NOT_FOUND');
    expect(Object.keys(mixed.error.fieldErrors ?? {})).toEqual(['it999-forged']);
    expectRejected(send(engine, 'lockItem', { itemId: 'it999-forged', locked: true }), 'ITEM_NOT_FOUND');
    expectRejected(send(engine, 'equipItem', { itemId: 'it999-forged', purpose: 'farm' }), 'ITEM_NOT_FOUND');
    expectRejected(sell(engine, ['x'.repeat(65)]), 'INVALID_PAYLOAD');
    expect(engine.getState().wallet.gold).toBe(0);
    expect(engine.getState().items[item.id]).toBeDefined();
  });

  it('T-32 未知命令、非法操作 ID、內容版本不符：拒絕且不改狀態', () => {
    const { engine } = engineWithItem();
    const before = engine.exportState();
    const unknown = send(engine, 'grantGold', { amount: 1_000_000 });
    expect(unknown.status).toBe('rejected');
    expect(unknown.commandType).toBe('unknown');
    expectRejected(unknown, 'INVALID_PAYLOAD');
    expectRejected(send(engine, 'identify', {}, 'short'), 'INVALID_PAYLOAD');
    expectRejected(send(engine, 'identify', {}, 'x'.repeat(81)), 'INVALID_PAYLOAD');
    const versionMismatch = engine.execute(
      { operationId: nextOpId('op-t32-ver'), contentVersion: 'forged-version', command: { type: 'identify', payload: {} } },
      1_000,
    );
    expectRejected(versionMismatch, 'CONTENT_VERSION_MISMATCH');
    const after = engine.exportState();
    expect(after.wallet).toEqual(before.wallet);
    expect(after.items).toEqual(before.items);
    expect(after.player).toEqual(before.player);
    expect(after.revision).toBe(before.revision);
    // 格式錯誤的操作 ID 不寫入操作紀錄。
    expect(engine.queryOperation('short')).toBeNull();
  });
});

// ───────────────────────── 帳本不變式 ─────────────────────────

describe('帳本不變式', () => {
  const baseWrite = { operationId: 'op-ledger-test', entityRef: null, atMs: 0 } as const;

  it('appendLedger：GOLD 只能由 ITEM_SOLD 增加，XP 只能由 IDENTIFIED 增加', () => {
    const state = createInitialState(catalog, 1);
    const max = tuning.persistence.maxLedgerEntries;
    for (const eventType of ['IDENTIFIED', 'RELIC_GRANTED', 'RELIC_CONSUMED', 'BENCH_UPGRADED'] as const) {
      expect(() => appendLedger(state, { ...baseWrite, eventType, resource: 'GOLD', delta: 10, balanceAfter: 10 }, max)).toThrow(
        LedgerInvariantError,
      );
    }
    for (const eventType of ['ITEM_SOLD', 'RELIC_GRANTED', 'RELIC_CONSUMED', 'BENCH_UPGRADED'] as const) {
      expect(() => appendLedger(state, { ...baseWrite, eventType, resource: 'XP', delta: 10, balanceAfter: 10 }, max)).toThrow(
        LedgerInvariantError,
      );
    }
    expect(state.ledger).toEqual([]);
    expect(state.counters.ledgerSerial).toBe(0);

    appendLedger(state, { ...baseWrite, eventType: 'ITEM_SOLD', resource: 'GOLD', delta: 10, balanceAfter: 10 }, max);
    appendLedger(state, { ...baseWrite, eventType: 'BENCH_UPGRADED', resource: 'GOLD', delta: -10, balanceAfter: 0 }, max);
    appendLedger(state, { ...baseWrite, eventType: 'IDENTIFIED', resource: 'XP', delta: 22, balanceAfter: 22 }, max);
    expect(state.ledger.map((entry) => entry.ledgerId)).toEqual(['L1', 'L2', 'L3']);
  });

  it('appendLedger：零增量、非整數增量、負餘額都拋錯', () => {
    const state = createInitialState(catalog, 1);
    const max = tuning.persistence.maxLedgerEntries;
    expect(() => appendLedger(state, { ...baseWrite, eventType: 'ITEM_SOLD', resource: 'GOLD', delta: 0, balanceAfter: 0 }, max)).toThrow();
    expect(() => appendLedger(state, { ...baseWrite, eventType: 'ITEM_SOLD', resource: 'GOLD', delta: 1.5, balanceAfter: 2 }, max)).toThrow();
    expect(() =>
      appendLedger(state, { ...baseWrite, eventType: 'BENCH_UPGRADED', resource: 'GOLD', delta: -10, balanceAfter: -5 }, max),
    ).toThrow();
    expect(state.ledger).toEqual([]);
  });

  it('完整循環（清怪 → 鑑定 → 出售 → 升台）後帳本鏈一致：金幣只來自出售，經驗只來自鑑定', () => {
    const engine = new GameEngine({ catalog, nowMs: 0, seed: 777 });
    let nowMs = 0;
    for (let round = 0; round < 4; round += 1) {
      nowMs = advanceFor(engine, nowMs, 90_000).nowMs;
      while (engine.getState().wallet.relics > 0) {
        expect(engine.execute({ operationId: nextOpId('op-cycle'), command: { type: 'identify', payload: {} } }, nowMs).status).toBe(
          'succeeded',
        );
      }
      const ids = Object.keys(engine.getState().items);
      if (ids.length > 0) expect(sell(engine, ids.slice(0, 50)).status).toBe('succeeded');
      const cost = catalog.bench[engine.getState().wallet.benchLevel - 1]?.nextCost;
      if (cost && engine.getState().wallet.gold >= cost) {
        expectSucceeded(send(engine, 'upgradeBench', { expectedBenchLevel: engine.getState().wallet.benchLevel }));
      }
    }
    const state = engine.exportState();
    expect(state.totals.identified).toBeGreaterThan(0);
    expect(state.totals.itemsSold).toBeGreaterThan(0);
    let gold = 0;
    for (const entry of state.ledger) {
      if (entry.delta > 0 && entry.resource === 'GOLD') expect(entry.eventType).toBe('ITEM_SOLD');
      if (entry.delta > 0 && entry.resource === 'XP') expect(entry.eventType).toBe('IDENTIFIED');
      if (entry.resource === 'GOLD') {
        gold += entry.delta;
        expect(entry.balanceAfter).toBe(gold);
        expect(entry.balanceAfter).toBeGreaterThanOrEqual(0);
      }
    }
    expect(gold).toBe(state.wallet.gold);
    expect(state.totals.goldEarned).toBe(
      state.ledger.filter((entry) => entry.eventType === 'ITEM_SOLD').reduce((sum, entry) => sum + entry.delta, 0),
    );
    // XP 帳本筆數 = 鑑定次數；每筆增量依操作前等級的公式。
    const xpEntries = state.ledger.filter((entry) => entry.resource === 'XP');
    expect(xpEntries).toHaveLength(state.totals.identified);
  });
});

// ───────────────────────── 產出規則 ─────────────────────────

describe('鑑定產出規則：品質只由台等決定、部位與路線限制', () => {
  /** 鑑定 total 次，背包快滿時批次出售，回傳所有產出物品。 */
  function identifyWithRecycling(engine: GameEngine, total: number): ItemInstance[] {
    const produced: ItemInstance[] = [];
    const recycleAt = catalog.globals.backpackCapacity - 10;
    while (produced.length < total) {
      produced.push(identify(engine).item);
      const ids = Object.keys(engine.getState().items);
      if (ids.length >= recycleAt) {
        for (let index = 0; index < ids.length; index += tuning.economy.maxSellBatch) {
          expectSucceeded(sell(engine, ids.slice(index, index + tuning.economy.maxSellBatch)));
        }
      }
    }
    return produced;
  }

  function countBy<T extends string>(values: readonly T[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }

  it('台等 1 大量鑑定只出普通／精良，比例接近機率表', () => {
    const total = 600;
    const engine = engineWith((state) => {
      state.wallet.relics = total;
    }, 9001);
    const items = identifyWithRecycling(engine, total);
    const counts = countBy(items.map((item) => item.qualityId));
    expect(Object.keys(counts).sort()).toEqual(['Q1', 'Q2']);
    const weights = catalog.bench[0]!.weights;
    const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
    const expectedQ1 = weights[0]! / weightTotal;
    expect(Math.abs(counts.Q1! / total - expectedQ1)).toBeLessThan(0.06);
  });

  it('台等 10 不會出現機率 0 的普通品質', () => {
    const engine = engineWith((state) => {
      state.wallet.relics = 300;
      state.wallet.benchLevel = catalog.bench.length;
    }, 9002);
    const items = identifyWithRecycling(engine, 300);
    const weights = catalog.bench.at(-1)!.weights;
    const counts = countBy(items.map((item) => item.qualityId));
    catalog.qualityOrder.forEach((qualityId, index) => {
      if (weights[index] === 0) expect(counts[qualityId]).toBeUndefined();
    });
    expect(counts.Q1).toBeUndefined();
  });

  it('同種子、同台等、不同地圖進度：產出完全相同（地圖不偷偷提高品質）', () => {
    const benchLevel = 5;
    const early = engineWith((state) => {
      state.wallet.relics = 60;
      state.wallet.benchLevel = benchLevel;
    }, 4242);
    const late = engineWith((state) => {
      state.wallet.relics = 60;
      state.wallet.benchLevel = benchLevel;
      state.progress.mapNumber = 10;
      state.progress.highestClearedMap = 9;
      state.progress.localStage = 12;
    }, 4242);
    const a = identifyMany(early, 60);
    const b = identifyMany(late, 60);
    expect(b.map((item) => item.qualityId)).toEqual(a.map((item) => item.qualityId));
    expect(b.map(({ createdByOperation: _a, ...rest }) => rest)).toEqual(a.map(({ createdByOperation: _b, ...rest }) => rest));
  });

  it('見習者鑑定只產出六個共用部位，基底皆為共用', () => {
    const engine = engineWith((state) => {
      state.wallet.relics = 180;
    }, 6006);
    const items = identifyMany(engine, 180);
    const slots = new Set(items.map((item) => item.slot));
    expect([...slots].sort()).toEqual([...SHARED_SLOT_IDS].sort());
    for (const item of items) {
      expect(catalog.equipment.get(item.baseId)?.ownerJobId).toBe(SHARED_OWNER_ID);
      expect(item.targetJobId).toBe('NOVICE');
    }
  });

  it('首次一轉後八部位產出，主武／副手只來自目標路線（法師）', () => {
    const engine = engineWith((state) => {
      state.player.level = 10;
      state.wallet.relics = 190;
    }, 8008);
    expectSucceeded(send(engine, 'unlockJob', { jobId: 'JOB11' }));
    expect(engine.getState().identifySettings.targetJobId).toBe('JOB11');
    const items = identifyMany(engine, 190);
    expect([...new Set(items.map((item) => item.slot))].sort()).toEqual([...SLOT_IDS].sort());
    const routeItems = items.filter((item) => item.slot === 'weapon' || item.slot === 'offhand');
    expect(routeItems.length).toBeGreaterThan(0);
    for (const item of routeItems) expect(catalog.equipment.get(item.baseId)?.ownerJobId).toBe('JOB11');
    for (const item of items.filter((entry) => entry.slot !== 'weapon' && entry.slot !== 'offhand')) {
      expect(catalog.equipment.get(item.baseId)?.ownerJobId).toBe(SHARED_OWNER_ID);
    }
  });

  it('二轉目標路線：主武／副手只來自該路線及祖先，不跨分支或跨職業系', () => {
    const engine = engineWith((state) => {
      state.player.level = 40;
      state.wallet.relics = 190;
    }, 9009);
    expectSucceeded(send(engine, 'unlockJob', { jobId: 'JOB01' }));
    expectSucceeded(send(engine, 'unlockJob', { jobId: 'JOB02' }));
    const settings = engine.getState().identifySettings;
    expectSucceeded(
      send(engine, 'updateIdentifySettings', {
        targetJobId: 'JOB02',
        keep: { minQuality: settings.keep.minQuality, slots: [], affixStats: [], upgradesOverEquipped: false },
        autoSell: { enabled: false, maxQuality: settings.autoSell.maxQuality, slots: [...settings.autoSell.slots] },
        confirmAutoSell: false,
      }),
    );
    const allowedOwners = lineageIds(catalog, 'JOB02');
    expect([...allowedOwners].sort()).toEqual(['JOB01', 'JOB02']);
    const items = identifyMany(engine, 190);
    const routeItems = items.filter((item) => item.slot === 'weapon' || item.slot === 'offhand');
    expect(routeItems.length).toBeGreaterThan(0);
    const owners = new Set(routeItems.map((item) => catalog.equipment.get(item.baseId)!.ownerJobId));
    for (const owner of owners) expect(allowedOwners.has(owner)).toBe(true);
    expect(owners.has('JOB04')).toBe(false);
    expect(items.every((item) => item.targetJobId === 'JOB02')).toBe(true);
  });

  it('產出路線不可選未解鎖職業：ROUTE_INVALID，設定不變', () => {
    const engine = engineWith((state) => {
      state.player.level = 10;
    });
    expectSucceeded(send(engine, 'unlockJob', { jobId: 'JOB01' }));
    const before = engine.exportState().identifySettings;
    expectRejected(
      send(engine, 'updateIdentifySettings', {
        targetJobId: 'JOB06',
        keep: { minQuality: before.keep.minQuality, slots: [], affixStats: [], upgradesOverEquipped: false },
        autoSell: { enabled: false, maxQuality: before.autoSell.maxQuality, slots: [...before.autoSell.slots] },
        confirmAutoSell: false,
      }),
      'ROUTE_INVALID',
    );
    expect(engine.exportState().identifySettings).toEqual(before);
  });
});
