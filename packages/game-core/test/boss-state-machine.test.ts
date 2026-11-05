import {
  SHARED_SLOT_IDS,
  bossStageLocalNumber,
  getStageAt,
  loadDefaultCatalog,
  type BossMechanicDef,
} from '@qiwu/content';
import { describe, expect, it } from 'vitest';
import {
  BattleSim,
  GameEngine,
  bossHp,
  createInitialState,
  eliteRelicPoints,
  normalRelicPoints,
  parseSave,
  serializeSave,
  type BattleEvent,
  type BossAttempt,
  type CombatStatsSnapshot,
  type Command,
  type CommandResponse,
  type EngineEvent,
  type GameState,
  type HeroLoadoutSnapshot,
  type IdentifyResult,
  type StageMode,
  type StartBossResult,
} from '../src/index.ts';

/**
 * 關卡狀態機與地圖 BOSS（規格 02 狀態機、09 BOSS 建立／勝負／重連、10 T-13～T-16、T-27）。
 * 前置條件可用 fixture 狀態建立；受測動作一律經 engine.execute／engine.advance（或 BattleSim 本身）。
 * 數值（N）一律讀 catalog.tuning／catalog.globals，不寫死。
 */

const catalog = loadDefaultCatalog();
const { tuning, globals } = catalog;
const TICK_MS = globals.tickMs;
const BOSS_DURATION_MS = globals.bossDurationMs;
const BOSS_MAX_TICKS = Math.floor(BOSS_DURATION_MS / TICK_MS);
const LAST_MAP = catalog.mapCount;

/** 一擊秒殺普通怪／小首領（攻擊 = 10 + 2×(L−1)），用於快速推圖。 */
const STRONG_LEVEL = 1000;
/** 打得贏第 1 圖 BOSS，但需要數十秒（用於重連一致性）。 */
const MID_LEVEL = 100;
/** 刷得動第 30 關普通怪，但 60 秒內打不贏第 1 圖 BOSS。 */
const WEAK_LEVEL = 20;
/** 打得贏第 12 圖 BOSS。 */
const ENDGAME_LEVEL = 100_000;

let opSerial = 0;
function nextOpId(prefix = 'op-boss'): string {
  opSerial += 1;
  return `${prefix}-${String(opSerial).padStart(5, '0')}`;
}

function fixture(mutate?: (state: GameState) => void, seed = 11): GameState {
  const state = createInitialState(catalog, seed);
  mutate?.(state);
  return state;
}

function engineWith(mutate?: (state: GameState) => void, nowMs = 0, seed = 11): GameEngine {
  return new GameEngine({ catalog, nowMs, state: fixture(mutate, seed) });
}

function bossLocal(mapNumber: number): number {
  return bossStageLocalNumber(catalog, mapNumber);
}

function bossStageId(mapNumber: number): string {
  return getStageAt(catalog, mapNumber, bossLocal(mapNumber)).id;
}

/** 前置：停在某圖第 30 關，指定模式（BOSS_READY／FARM_BLOCKED／ENDGAME_FARM）。 */
function atBossStage(level: number, mapNumber = 1, mode: StageMode = 'BOSS_READY', extra?: (state: GameState) => void) {
  return (state: GameState): void => {
    state.player.level = level;
    state.progress.mapNumber = mapNumber;
    state.progress.localStage = bossLocal(mapNumber);
    state.progress.mode = mode;
    state.progress.highestClearedMap = mode === 'ENDGAME_FARM' ? mapNumber : mapNumber - 1;
    extra?.(state);
  };
}

function atStage(level: number, mapNumber: number, localStage: number, extra?: (state: GameState) => void) {
  return (state: GameState): void => {
    state.player.level = level;
    state.progress.mapNumber = mapNumber;
    state.progress.localStage = localStage;
    state.progress.mode = 'PROGRESS';
    state.progress.highestClearedMap = mapNumber - 1;
    extra?.(state);
  };
}

function send(engine: GameEngine, type: string, payload: unknown, nowMs: number, operationId = nextOpId()): CommandResponse {
  return engine.execute({ operationId, command: { type, payload } as unknown as Command }, nowMs);
}

function expectSucceeded<T>(res: CommandResponse): T {
  if (res.status !== 'succeeded') throw new Error(`預期成功，實際被拒：${res.error.code} ${res.error.message}`);
  return res.result as T;
}

function expectRejected(res: CommandResponse, code: string): void {
  expect(res.status).toBe('rejected');
  if (res.status !== 'rejected') throw new Error('預期被拒');
  expect(res.error.code).toBe(code);
}

function startBoss(engine: GameEngine, nowMs: number, operationId = nextOpId('op-start')): BossAttempt {
  const mapNumber = engine.getState().progress.mapNumber;
  return expectSucceeded<StartBossResult>(send(engine, 'startBossAttempt', { stageId: bossStageId(mapNumber) }, nowMs, operationId)).attempt;
}

/** 以固定步長推進引擎並收集事件（步長需小於 maxCatchUpMs，避免普通刷怪被丟棄）。 */
function runFor(engine: GameEngine, fromMs: number, toMs: number, stepMs = 1000): EngineEvent[] {
  const events: EngineEvent[] = [];
  for (let now = fromMs + stepMs; now <= toMs; now += stepMs) {
    engine.advance(now);
    events.push(...engine.drainEvents());
  }
  return events;
}

/** 逐刻推進直到條件成立；回傳停止時間與收集到的事件。 */
function runUntil(
  engine: GameEngine,
  fromMs: number,
  done: (event: EngineEvent) => boolean,
  maxMs: number,
  stepMs = TICK_MS,
): { nowMs: number; events: EngineEvent[] } {
  const events: EngineEvent[] = [];
  for (let now = fromMs + stepMs; now <= fromMs + maxMs; now += stepMs) {
    engine.advance(now);
    const batch = engine.drainEvents();
    events.push(...batch);
    if (batch.some(done)) return { nowMs: now, events };
  }
  throw new Error(`在 ${maxMs}ms 內沒有出現預期事件`);
}

function battleEvents(events: readonly EngineEvent[]): BattleEvent[] {
  return events.flatMap((event) => (event.type === 'battle' ? [event.event] : []));
}

function lastHistory(engine: GameEngine): BossAttempt {
  const attempt = engine.getState().boss.history.at(-1);
  if (!attempt) throw new Error('沒有 BOSS 紀錄');
  return attempt as BossAttempt;
}

/** 除了操作紀錄（被拒也會存結果以便查詢）之外的全部狀態。 */
function stateWithoutOperations(engine: GameEngine): Omit<GameState, 'operations'> {
  const { operations: _ignored, ...rest } = engine.exportState();
  return rest;
}

// ───────────── BattleSim 直接驗證用 ─────────────

const NOVICE_HERO: HeroLoadoutSnapshot = {
  jobId: 'NOVICE',
  skillIds: [],
  ultimateId: null,
  conditions: {},
  targetPolicy: 'default',
  passiveIds: [],
  legendBaseIds: [],
};

function fixedStats(attack: number, basicIntervalMs: number): CombatStatsSnapshot {
  return {
    attack,
    basicIntervalMs,
    critRateBp: 0,
    critMultBp: tuning.hero.baseCritMultBp,
    cdrBp: 0,
    bonusBp: {
      BASIC_DMG: 0,
      SKILL_DMG: 0,
      DOT_DMG: 0,
      SUMMON_DMG: 0,
      FOLLOWUP_DMG: 0,
      MARK_DMG: 0,
      SHATTER_DMG: 0,
      EXECUTE_DMG: 0,
    },
  };
}

function runBossSim(attack: number, basicIntervalMs: number, options: { mapNumber?: number; targetPolicy?: 'default' | 'mechanicFirst' } = {}) {
  const mapNumber = options.mapNumber ?? 1;
  const sim = new BattleSim({
    catalog,
    seed: 12345,
    stats: fixedStats(attack, basicIntervalMs),
    hero: { ...NOVICE_HERO, targetPolicy: options.targetPolicy ?? 'default' },
    encounter: { kind: 'boss', stage: getStageAt(catalog, mapNumber, bossLocal(mapNumber)), durationMs: BOSS_DURATION_MS },
  });
  const events = sim.runUntilTick(BOSS_MAX_TICKS);
  return { sim, events, result: sim.bossResult, timeMs: sim.currentTimeMs };
}

/** 二分搜尋能在時限內擊敗 BOSS 的最小整數攻擊。 */
function minimalWinningAttack(basicIntervalMs: number): number {
  let lose = 1;
  let win = 1_000_000;
  expect(runBossSim(lose, basicIntervalMs).result).toBe('timeout');
  expect(runBossSim(win, basicIntervalMs).result).toBe('success');
  while (win - lose > 1) {
    const mid = Math.floor((win + lose) / 2);
    if (runBossSim(mid, basicIntervalMs).result === 'success') win = mid;
    else lose = mid;
  }
  return win;
}

// ═════════════════════════════════════════════════════════════

describe('關卡狀態機：普通關、小首領、第 30 關', () => {
  it('地圖結構：小首領固定在第 5／10／15／20／25 關，BOSS 在最後一關', () => {
    for (const map of catalog.maps.values()) {
      const types = map.stageIds.map((id) => catalog.stages.get(id)!.type);
      const eliteLocals = types.flatMap((type, index) => (type === 'elite' ? [index + 1] : []));
      expect(eliteLocals).toEqual([5, 10, 15, 20, 25]);
      expect(types.at(-1)).toBe('boss');
      expect(types.filter((type) => type === 'boss')).toHaveLength(1);
      expect(bossLocal(map.number)).toBe(30);
    }
  });

  it('普通關：3 波 × 每波 3 隻全部清除後才推進下一關，推進不給經驗或金幣', () => {
    const engine = engineWith(atStage(STRONG_LEVEL, 1, 1));
    const before = engine.exportState();
    const { events } = runUntil(engine, 0, (event) => event.type === 'stageAdvanced', 120_000);
    const battle = battleEvents(events);
    const waves = battle.filter((event): event is Extract<BattleEvent, { type: 'waveSpawned' }> => event.type === 'waveSpawned');
    expect(waves).toHaveLength(tuning.battle.wavesPerNormalStage);
    for (const [index, wave] of waves.entries()) {
      expect(wave.waveIndex).toBe(index);
      expect(wave.totalWaves).toBe(tuning.battle.wavesPerNormalStage);
      expect(wave.uids).toHaveLength(tuning.battle.monstersPerWave);
    }
    const defeated = battle.filter((event) => event.type === 'enemyDefeated');
    expect(defeated).toHaveLength(tuning.battle.wavesPerNormalStage * tuning.battle.monstersPerWave);
    expect(defeated.every((event) => event.type === 'enemyDefeated' && event.kind === 'normal')).toBe(true);
    expect(battle.filter((event) => event.type === 'stageCleared')).toHaveLength(1);

    const advanced = events.filter((event) => event.type === 'stageAdvanced');
    expect(advanced).toEqual([{ type: 'stageAdvanced', mapNumber: 1, localStage: 2, mode: 'PROGRESS' }]);
    const state = engine.getState();
    expect(state.progress).toMatchObject({ mapNumber: 1, localStage: 2, mode: 'PROGRESS' });
    expect(state.player.xp).toBe(before.player.xp);
    expect(state.player.level).toBe(before.player.level);
    expect(state.wallet.gold).toBe(before.wallet.gold);
    expect(state.revision).toBe(before.revision);
  });

  it('小首領關（5／10／15／20／25）：只有 1 名小首領，擊敗後推進下一關', () => {
    for (const local of [5, 10, 15, 20, 25]) {
      const stage = getStageAt(catalog, 1, local);
      expect(stage.type).toBe('elite');
      const engine = engineWith(atStage(STRONG_LEVEL, 1, local));
      const { events } = runUntil(engine, 0, (event) => event.type === 'stageAdvanced', 60_000);
      const battle = battleEvents(events);
      const waves = battle.filter((event): event is Extract<BattleEvent, { type: 'waveSpawned' }> => event.type === 'waveSpawned');
      expect(waves).toHaveLength(1);
      expect(waves[0]!.totalWaves).toBe(1);
      expect(waves[0]!.uids).toHaveLength(1);
      const defeated = battle.filter((event): event is Extract<BattleEvent, { type: 'enemyDefeated' }> => event.type === 'enemyDefeated');
      expect(defeated).toHaveLength(1);
      expect(defeated[0]!.kind).toBe('elite');
      expect(defeated[0]!.monsterId).toBe(stage.eliteMonsterId);
      expect(defeated[0]!.rewardPoints).toBe(eliteRelicPoints(catalog, 1));
      expect(defeated[0]!.rewardPoints).toBe(normalRelicPoints(catalog, 1) * tuning.relic.eliteMultiplier);
      expect(engine.getState().progress).toMatchObject({ mapNumber: 1, localStage: local + 1, mode: 'PROGRESS' });
    }
  });

  it('抵達第 30 關 → BOSS_READY；之後持續刷同關普通怪，關卡不進位、預設不自動召喚', () => {
    const engine = engineWith(atStage(STRONG_LEVEL, 1, 29));
    const reached = runUntil(engine, 0, (event) => event.type === 'stageAdvanced', 120_000);
    expect(reached.events.filter((event) => event.type === 'stageAdvanced')).toEqual([
      { type: 'stageAdvanced', mapNumber: 1, localStage: 30, mode: 'BOSS_READY' },
    ]);
    expect(engine.getState().boss.active).toBeNull();
    expect(engine.getBattleView()?.encounterKind).toBe('loop');

    const killsBefore = engine.getState().totals.kills;
    const relicPointsBefore = engine.getState().totals.relicsGranted * tuning.relic.pointsPerRelic + engine.getState().wallet.relicProgress;
    const later = runFor(engine, reached.nowMs, reached.nowMs + 60_000);
    const state = engine.getState();
    expect(later.some((event) => event.type === 'stageAdvanced')).toBe(false);
    expect(later.some((event) => event.type === 'bossStarted')).toBe(false);
    expect(state.progress).toMatchObject({ mapNumber: 1, localStage: 30, mode: 'BOSS_READY' });
    expect(state.totals.kills).toBeGreaterThan(killsBefore);
    // 第 30 關刷的是普通怪：每隻都給普通怪產出點，沒有 BOSS 或副目標。
    const defeated = battleEvents(later).filter((event): event is Extract<BattleEvent, { type: 'enemyDefeated' }> => event.type === 'enemyDefeated');
    expect(defeated.length).toBe(state.totals.kills - killsBefore);
    expect(defeated.every((event) => event.kind === 'normal' && event.rewardPoints === normalRelicPoints(catalog, 1))).toBe(true);
    const relicPointsAfter = state.totals.relicsGranted * tuning.relic.pointsPerRelic + state.wallet.relicProgress;
    expect(relicPointsAfter - relicPointsBefore).toBe(defeated.length * normalRelicPoints(catalog, 1));
    expect(state.totals.bossAttempts).toBe(0);
    expect(state.wallet.gold).toBe(0);
  });
});

describe('startBossAttempt 前置條件', () => {
  it('只有 BOSS_READY／FARM_BLOCKED 可召喚；其他模式或關卡不符時拒絕且狀態不變', () => {
    const cases: { name: string; mutate: (state: GameState) => void; stageId: string; code: string }[] = [
      { name: 'PROGRESS 第 1 關', mutate: atStage(MID_LEVEL, 1, 1), stageId: bossStageId(1), code: 'NOT_AT_BOSS_STAGE' },
      { name: 'PROGRESS 第 29 關', mutate: atStage(MID_LEVEL, 1, 29), stageId: bossStageId(1), code: 'NOT_AT_BOSS_STAGE' },
      { name: 'ENDGAME_FARM', mutate: atBossStage(MID_LEVEL, LAST_MAP, 'ENDGAME_FARM'), stageId: bossStageId(LAST_MAP), code: 'NOT_AT_BOSS_STAGE' },
      {
        name: 'BOSS_READY 但 stageId 不是目前 BOSS 關',
        mutate: atBossStage(MID_LEVEL, 1, 'BOSS_READY'),
        stageId: getStageAt(catalog, 1, 29).id,
        code: 'STAGE_MISMATCH',
      },
      { name: 'BOSS_READY 但送別圖 BOSS 關', mutate: atBossStage(MID_LEVEL, 1, 'BOSS_READY'), stageId: bossStageId(2), code: 'STAGE_MISMATCH' },
    ];
    for (const testCase of cases) {
      const engine = engineWith(testCase.mutate);
      // 命令會先依伺服器時間結算戰鬥；先推進到同一時間點，比較的才只是命令本身的影響。
      engine.advance(1_000);
      const before = stateWithoutOperations(engine);
      const res = send(engine, 'startBossAttempt', { stageId: testCase.stageId }, 1_000);
      expectRejected(res, testCase.code);
      expect(stateWithoutOperations(engine), testCase.name).toEqual(before);
      expect(engine.getState().boss.active).toBeNull();
    }
  });

  it('BOSS_READY 召喚成功：建立 pending 挑戰、切 BOSS_FIGHT、截止時間 = 開始 + 時限；挑戰中再召喚被拒', () => {
    const engine = engineWith(atBossStage(MID_LEVEL));
    const startAt = 5_000;
    engine.advance(startAt);
    engine.drainEvents();
    const before = engine.exportState();
    const attempt = startBoss(engine, startAt);
    const events = engine.drainEvents();
    expect(events).toContainEqual({ type: 'bossStarted', attemptId: attempt.attemptId, autoTriggered: false });
    expect(attempt).toMatchObject({
      mapNumber: 1,
      stageId: bossStageId(1),
      startedAtMs: startAt,
      deadlineAtMs: startAt + BOSS_DURATION_MS,
      durationMs: BOSS_DURATION_MS,
      result: 'pending',
      autoTriggered: false,
      contentVersion: catalog.contentVersion,
    });
    const state = engine.getState();
    expect(state.progress.mode).toBe('BOSS_FIGHT');
    expect(state.boss.active?.attemptId).toBe(attempt.attemptId);
    expect(state.totals.bossAttempts).toBe(1);
    // 挑戰本身不消耗資源。
    expect(state.wallet).toEqual(before.wallet);
    expect(engine.getBattleView()?.encounterKind).toBe('boss');

    const again = send(engine, 'startBossAttempt', { stageId: bossStageId(1) }, startAt + 1_000);
    expectRejected(again, 'BOSS_ALREADY_ACTIVE');
    expect(engine.getState().totals.bossAttempts).toBe(1);
    expect(engine.getState().boss.active?.attemptId).toBe(attempt.attemptId);
  });

  it('FARM_BLOCKED 可手動召喚', () => {
    const engine = engineWith(atBossStage(MID_LEVEL, 1, 'FARM_BLOCKED'));
    const attempt = startBoss(engine, 1_000);
    expect(attempt.result).toBe('pending');
    expect(engine.getState().progress.mode).toBe('BOSS_FIGHT');
  });
});

describe('BOSS_FIGHT 凍結成長與配置操作', () => {
  it('挑戰中鑑定／出售／升台／穿戴／轉職等一律 BOSS_LOCKED 且不做任何修改；結束後同樣命令可成功', () => {
    const benchCost = catalog.bench[0]!.nextCost!;
    const engine = engineWith(
      atBossStage(MID_LEVEL, 1, 'BOSS_READY', (state) => {
        state.wallet.relics = 12;
        state.wallet.gold = benchCost;
      }),
    );
    // 前置：解鎖一轉並鑑定數件裝備（全部經由命令完成）。
    expectSucceeded(send(engine, 'unlockJob', { jobId: 'JOB01' }, 100));
    const items = Array.from({ length: 8 }, () => expectSucceeded<IdentifyResult>(send(engine, 'identify', {}, 200)).item);
    const sharedSlots: readonly string[] = SHARED_SLOT_IDS;
    const wearable = items.find((item) => sharedSlots.includes(item.slot));
    if (!wearable) throw new Error('fixture 沒有鑑定出共用部位裝備，請調整種子');
    const sellable = items.find((item) => item.id !== wearable.id)!;

    const attempt = startBoss(engine, 1_000);
    engine.advance(3_000);
    engine.drainEvents();

    const lockedCommands: { type: string; payload: unknown }[] = [
      { type: 'identify', payload: {} },
      { type: 'sellItems', payload: { itemIds: [sellable.id], origin: 'manual' } },
      { type: 'upgradeBench', payload: { expectedBenchLevel: 1 } },
      { type: 'equipItem', payload: { itemId: wearable.id, purpose: 'farm' } },
      { type: 'equipItem', payload: { itemId: wearable.id, purpose: 'boss' } },
      { type: 'switchJob', payload: { jobId: 'JOB01', ackUnequipItemIds: [] } },
      { type: 'unequipSlot', payload: { slot: wearable.slot, purpose: 'farm' } },
      { type: 'copyLoadout', payload: { from: 'farm', to: 'boss' } },
      { type: 'saveLoadoutSkills', payload: { purpose: 'boss', skillIds: [], conditions: {}, targetPolicy: 'mechanicFirst' } },
    ];
    for (const command of lockedCommands) {
      const before = stateWithoutOperations(engine);
      const res = send(engine, command.type, command.payload, 4_000);
      expectRejected(res, 'BOSS_LOCKED');
      expect(stateWithoutOperations(engine), command.type).toEqual(before);
    }
    const locked = engine.getState();
    expect(locked.progress.mode).toBe('BOSS_FIGHT');
    expect(locked.boss.active?.attemptId).toBe(attempt.attemptId);

    // 對照組：退出挑戰後，同樣的命令可以正常執行（證明上面被拒是因為 BOSS 鎖，而非其他條件）。
    expectSucceeded(send(engine, 'abortBossAttempt', { attemptId: attempt.attemptId }, 5_000));
    expectSucceeded(send(engine, 'identify', {}, 5_100));
    expectSucceeded(send(engine, 'sellItems', { itemIds: [sellable.id], origin: 'manual' }, 5_200));
    expectSucceeded(send(engine, 'upgradeBench', { expectedBenchLevel: 1 }, 5_300));
    expectSucceeded(send(engine, 'equipItem', { itemId: wearable.id, purpose: 'farm' }, 5_400));
    expectSucceeded(send(engine, 'switchJob', { jobId: 'JOB01', ackUnequipItemIds: [] }, 5_500));
  });

  it('BOSS 進行中停止普通刷怪：擊殺數、古物與產出點都不增加', () => {
    const engine = engineWith(atBossStage(WEAK_LEVEL));
    runFor(engine, 0, 10_000);
    const before = engine.exportState();
    startBoss(engine, 10_000);
    runFor(engine, 10_000, 10_000 + BOSS_DURATION_MS - 1_000);
    const state = engine.getState();
    expect(state.progress.mode).toBe('BOSS_FIGHT');
    expect(state.totals.kills).toBe(before.totals.kills);
    expect(state.wallet.relics).toBe(before.wallet.relics);
    expect(state.wallet.relicProgress).toBe(before.wallet.relicProgress);
  });
});

describe('T-13 BOSS 失敗', () => {
  it('T-13 手動挑戰逾時 → FARM_BLOCKED，停在原圖第 30 關刷普通怪、不倒退、不自動重試', () => {
    const engine = engineWith(atBossStage(WEAK_LEVEL));
    const startAt = 1_000;
    const attempt = startBoss(engine, startAt);
    const fight = runFor(engine, startAt, startAt + BOSS_DURATION_MS + 2_000);
    const resolved = fight.filter((event) => event.type === 'bossResolved');
    expect(resolved).toHaveLength(1);
    const finished = lastHistory(engine);
    expect(finished).toMatchObject({ attemptId: attempt.attemptId, result: 'timeout', resolvedAtMs: startAt + BOSS_DURATION_MS });
    expect(finished.bossHpRemainingBp).toBeGreaterThan(0);

    const afterFail = engine.exportState();
    expect(afterFail.progress).toMatchObject({ mapNumber: 1, localStage: 30, mode: 'FARM_BLOCKED', highestClearedMap: 0 });
    expect(afterFail.boss.active).toBeNull();
    // 失敗沒有死亡扣費，也沒有任何獎勵。
    expect(afterFail.wallet.gold).toBe(0);
    expect(afterFail.player.xp).toBe(0);

    // 長時間刷怪：持續擊殺普通怪累積古物，但關卡與模式不變、沒有新挑戰。
    const farmFrom = startAt + BOSS_DURATION_MS + 2_000;
    const farm = runFor(engine, farmFrom, farmFrom + 5 * 60_000);
    const state = engine.getState();
    expect(state.totals.kills).toBeGreaterThan(afterFail.totals.kills);
    expect(state.totals.relicsGranted * tuning.relic.pointsPerRelic + state.wallet.relicProgress).toBeGreaterThan(
      afterFail.totals.relicsGranted * tuning.relic.pointsPerRelic + afterFail.wallet.relicProgress,
    );
    expect(farm.some((event) => event.type === 'bossStarted' || event.type === 'stageAdvanced')).toBe(false);
    expect(state.progress).toMatchObject({ mapNumber: 1, localStage: 30, mode: 'FARM_BLOCKED' });
    expect(state.totals.bossAttempts).toBe(1);
    expect(state.boss.history).toHaveLength(1);
    expect(engine.getBattleView()?.encounterKind).toBe('loop');
  });

  it('T-13 首次自動挑戰失敗後：長時間掛機與從匯出狀態重新載入都不再自動召喚，只能手動', () => {
    const engine = engineWith(atStage(WEAK_LEVEL, 1, 29));
    expectSucceeded(send(engine, 'updateGameSettings', { firstBossAuto: true }, 0));
    const reached = runUntil(engine, 0, (event) => event.type === 'bossStarted', 10 * 60_000);
    expect(reached.events.filter((event) => event.type === 'bossStarted')).toEqual([
      expect.objectContaining({ type: 'bossStarted', autoTriggered: true }),
    ]);
    const fight = runFor(engine, reached.nowMs, reached.nowMs + BOSS_DURATION_MS + 2_000);
    expect(fight.filter((event) => event.type === 'bossResolved')).toHaveLength(1);
    expect(lastHistory(engine)).toMatchObject({ result: 'timeout', autoTriggered: true });
    expect(engine.getState().progress.mode).toBe('FARM_BLOCKED');
    expect(engine.getState().progress.firstAutoTriedMaps).toEqual([1]);

    let now = reached.nowMs + BOSS_DURATION_MS + 2_000;
    const longIdle = runFor(engine, now, now + 5 * 60_000);
    now += 5 * 60_000;
    expect(longIdle.some((event) => event.type === 'bossStarted')).toBe(false);

    // 重新登入：以匯出狀態重建引擎，仍不自動召喚。
    const reloaded = new GameEngine({ catalog, nowMs: now, state: engine.exportState() });
    const afterReload = runFor(reloaded, now, now + 5 * 60_000);
    now += 5 * 60_000;
    expect(afterReload.some((event) => event.type === 'bossStarted')).toBe(false);
    const state = reloaded.getState();
    expect(state.progress).toMatchObject({ mapNumber: 1, localStage: 30, mode: 'FARM_BLOCKED' });
    expect(state.totals.bossAttempts).toBe(1);
    expect(state.boss.active).toBeNull();

    // 下一次必須由玩家手動召喚。
    const manual = startBoss(reloaded, now);
    expect(manual.autoTriggered).toBe(false);
    expect(reloaded.getState().totals.bossAttempts).toBe(2);
  });
});

describe('T-14 BOSS 勝利只結算一次', () => {
  it('T-14 擊敗 BOSS → 下一圖第 1 關（只進位一次）；重送召喚操作回同一結果且不建立新挑戰', () => {
    const engine = engineWith(atBossStage(MID_LEVEL));
    const startAt = 2_000;
    const startOp = 'op-t14-start-boss-0001';
    const startPayload = { stageId: bossStageId(1) };
    const original = send(engine, 'startBossAttempt', startPayload, startAt, startOp);
    const attempt = expectSucceeded<StartBossResult>(original).attempt;
    const { nowMs: resolvedNow, events: fight } = runUntil(
      engine,
      startAt,
      (event) => event.type === 'bossResolved',
      BOSS_DURATION_MS + 1_000,
      1_000,
    );

    const resolved = fight.filter((event): event is Extract<EngineEvent, { type: 'bossResolved' }> => event.type === 'bossResolved');
    expect(resolved).toHaveLength(1);
    expect(resolved[0]!.mapAfter).toBe(2);
    expect(resolved[0]!.endgame).toBe(false);
    const finished = lastHistory(engine);
    expect(finished.result).toBe('success');
    expect(finished.resolvedAtMs).toBeLessThanOrEqual(attempt.deadlineAtMs);
    expect(finished.bossHpRemainingBp).toBe(0);
    const mapChanges = fight.filter((event) => event.type === 'stageAdvanced' && event.mapNumber === 2 && event.localStage === 1);
    expect(mapChanges).toHaveLength(1);

    const afterWin = engine.exportState();
    expect(afterWin.progress).toMatchObject({ mapNumber: 2, localStage: 1, mode: 'PROGRESS', highestClearedMap: 1 });
    // 成功只解鎖新圖，不直接給經驗或金幣。
    expect(afterWin.player.xp).toBe(0);
    expect(afterWin.player.level).toBe(MID_LEVEL);
    expect(afterWin.wallet.gold).toBe(0);

    // 重送同一操作 ID：回原結果、標記 replayed，不建立新挑戰、不重開 60 秒。
    const replay = send(engine, 'startBossAttempt', startPayload, resolvedNow + 100, startOp);
    expect(replay.status).toBe('succeeded');
    expect(replay.replayed).toBe(true);
    expect(expectSucceeded<StartBossResult>(replay).attempt.attemptId).toBe(attempt.attemptId);
    expect({ ...replay, replayed: undefined }).toEqual({ ...original, replayed: undefined });
    const afterReplay = engine.exportState();
    expect(afterReplay.boss.active).toBeNull();
    expect(afterReplay.totals.bossAttempts).toBe(1);
    expect(afterReplay.boss.history).toHaveLength(1);
    expect(afterReplay.revision).toBe(afterWin.revision);
    expect(afterReplay.progress).toEqual(afterWin.progress);

    // 同 ID 不同 payload：拒絕，不覆寫原紀錄。
    expectRejected(send(engine, 'startBossAttempt', { stageId: bossStageId(2) }, resolvedNow + 200, startOp), 'OPERATION_REUSED');

    // 繼續推進與重新載入都不會再次進位地圖（不跳過第 2 圖）。
    let now = resolvedNow;
    const later = runFor(engine, now, now + 20_000);
    now += 20_000;
    expect(later.some((event) => event.type === 'bossResolved')).toBe(false);
    const reloaded = new GameEngine({ catalog, nowMs: now, state: engine.exportState() });
    const afterReload = runFor(reloaded, now, now + 20_000);
    expect(afterReload.some((event) => event.type === 'bossResolved')).toBe(false);
    expect(reloaded.getState().progress.mapNumber).toBe(2);
    expect(reloaded.getState().progress.highestClearedMap).toBe(1);
    expect(reloaded.getState().boss.history).toHaveLength(1);
  });

  it('T-14 失敗後停在 FARM_BLOCKED 時重送原召喚操作 ID：只回原結果，不會偷偷開第二場', () => {
    const engine = engineWith(atBossStage(WEAK_LEVEL));
    const startOp = 'op-t14-replay-after-fail';
    const payload = { stageId: bossStageId(1) };
    const original = send(engine, 'startBossAttempt', payload, 0, startOp);
    expectSucceeded(original);
    runFor(engine, 0, BOSS_DURATION_MS + 1_000);
    expect(engine.getState().progress.mode).toBe('FARM_BLOCKED');
    const before = engine.exportState();

    const replay = send(engine, 'startBossAttempt', payload, BOSS_DURATION_MS + 2_000, startOp);
    expect(replay.replayed).toBe(true);
    expect(engine.drainEvents().some((event) => event.type === 'bossStarted')).toBe(false);
    const state = engine.exportState();
    expect(state.progress.mode).toBe('FARM_BLOCKED');
    expect(state.boss.active).toBeNull();
    expect(state.totals.bossAttempts).toBe(before.totals.bossAttempts);
    expect(state.revision).toBe(before.revision);
  });
});

describe('BOSS 成功的地圖進位', () => {
  it('第 1～11 圖擊敗 BOSS 一律進入下一圖第 1 關 PROGRESS，不跳圖', () => {
    for (let mapNumber = 1; mapNumber < LAST_MAP; mapNumber += 1) {
      const engine = engineWith(atBossStage(ENDGAME_LEVEL, mapNumber));
      startBoss(engine, 0);
      const { events } = runUntil(engine, 0, (event) => event.type === 'bossResolved', BOSS_DURATION_MS + 1_000, 1_000);
      const resolved = events.filter((event): event is Extract<EngineEvent, { type: 'bossResolved' }> => event.type === 'bossResolved');
      expect(resolved).toHaveLength(1);
      expect(resolved[0]).toMatchObject({ mapAfter: mapNumber + 1, endgame: false });
      expect(lastHistory(engine)).toMatchObject({ mapNumber, result: 'success' });
      expect(engine.getState().progress, `map ${mapNumber}`).toMatchObject({
        mapNumber: mapNumber + 1,
        localStage: 1,
        mode: 'PROGRESS',
        highestClearedMap: mapNumber,
      });
      expect(engine.getBattleView()?.stageId).toBe(getStageAt(catalog, mapNumber + 1, 1).id);
    }
  });
});

describe('T-15 最後一張圖通關', () => {
  it('T-15 第 12 圖 BOSS 成功 → ENDGAME_FARM，留在 12-30 刷怪，不生成第 361 關', () => {
    const engine = engineWith(atBossStage(ENDGAME_LEVEL, LAST_MAP));
    const startAt = 1_000;
    startBoss(engine, startAt);
    const fight = runFor(engine, startAt, startAt + BOSS_DURATION_MS + 1_000);
    const resolved = fight.filter((event): event is Extract<EngineEvent, { type: 'bossResolved' }> => event.type === 'bossResolved');
    expect(resolved).toHaveLength(1);
    expect(resolved[0]).toMatchObject({ mapAfter: LAST_MAP, endgame: true });
    expect(lastHistory(engine).result).toBe('success');
    expect(engine.getState().progress).toMatchObject({
      mapNumber: LAST_MAP,
      localStage: bossLocal(LAST_MAP),
      mode: 'ENDGAME_FARM',
      highestClearedMap: LAST_MAP,
    });

    // 內容只有 360 關；末圖之後沒有任何關卡。
    const totalStages = [...catalog.maps.values()].reduce((sum, map) => sum + map.stageIds.length, 0);
    expect(catalog.stages.size).toBe(totalStages);
    expect(catalog.stages.has(`ST${totalStages + 1}`)).toBe(false);
    expect(catalog.maps.has(LAST_MAP + 1)).toBe(false);

    let now = startAt + BOSS_DURATION_MS + 1_000;
    const killsBefore = engine.getState().totals.kills;
    const farm = runFor(engine, now, now + 60_000);
    now += 60_000;
    expect(farm.some((event) => event.type === 'stageAdvanced')).toBe(false);
    expect(engine.getState().totals.kills).toBeGreaterThan(killsBefore);
    expect(engine.getBattleView()?.encounterKind).toBe('loop');
    expect(engine.getBattleView()?.stageId).toBe(bossStageId(LAST_MAP));
    expectRejected(send(engine, 'startBossAttempt', { stageId: bossStageId(LAST_MAP) }, now), 'NOT_AT_BOSS_STAGE');

    const reloaded = new GameEngine({ catalog, nowMs: now, state: engine.exportState() });
    runFor(reloaded, now, now + 30_000);
    expect(reloaded.getState().progress).toMatchObject({ mapNumber: LAST_MAP, localStage: bossLocal(LAST_MAP), mode: 'ENDGAME_FARM' });
    expect(reloaded.getState().totals.bossAttempts).toBe(1);
  });
});

describe('T-16 BOSS 60 秒邊界', () => {
  it('T-16 命中剛好落在截止刻（60000ms）仍有效：最小致勝攻擊在 60000 判成功，再低 1 點即逾時', () => {
    // 首發普攻在第 1 刻（50ms）施放、命中延後 minHitDelayMs；間隔讓第 3 發命中正好落在 60000ms。
    const firstHitAt = TICK_MS + tuning.battle.minHitDelayMs;
    const interval = (BOSS_DURATION_MS - firstHitAt) / 2;
    expect(interval % TICK_MS).toBe(0);

    const minimal = minimalWinningAttack(interval);
    const win = runBossSim(minimal, interval);
    expect(win.result).toBe('success');
    expect(win.timeMs).toBe(BOSS_DURATION_MS);
    const winHits = win.events.filter((event) => event.type === 'hit');
    expect(winHits.map((event) => event.atMs)).toEqual([firstHitAt, firstHitAt + interval, BOSS_DURATION_MS]);
    expect(win.events.filter((event) => event.type === 'bossResolved')).toEqual([
      { type: 'bossResolved', atMs: BOSS_DURATION_MS, result: 'success', bossHpRemainingBp: 0 },
    ]);

    const lose = runBossSim(minimal - 1, interval);
    expect(lose.result).toBe('timeout');
    expect(lose.timeMs).toBe(BOSS_DURATION_MS);
    const loseResolved = lose.events.find((event) => event.type === 'bossResolved');
    expect(loseResolved).toMatchObject({ atMs: BOSS_DURATION_MS, result: 'timeout' });
    expect(loseResolved?.type === 'bossResolved' && loseResolved.bossHpRemainingBp).toBeGreaterThan(0);
  });

  it('T-16 預設普攻間隔：最小致勝攻擊在 60000ms 內結算成功，低 1 點即在截止刻判逾時', () => {
    const interval = tuning.hero.basicAttackIntervalMs;
    expect(interval % TICK_MS).toBe(0);
    const minimal = minimalWinningAttack(interval);

    const win = runBossSim(minimal, interval);
    expect(win.result).toBe('success');
    expect(win.timeMs).toBeLessThanOrEqual(BOSS_DURATION_MS);
    expect(win.events.filter((event) => event.type === 'bossResolved')).toEqual([
      { type: 'bossResolved', atMs: win.timeMs, result: 'success', bossHpRemainingBp: 0 },
    ]);

    const lose = runBossSim(minimal - 1, interval);
    expect(lose.result).toBe('timeout');
    expect(lose.timeMs).toBe(BOSS_DURATION_MS);
    expect(lose.events.some((event) => event.type === 'hit' && event.atMs > BOSS_DURATION_MS)).toBe(false);
    expect(lose.sim.view().boss!.hp).toBeGreaterThan(0);
  });

  it('T-16 截止後不補算：截止時仍有未跳完的持續傷害，逾時後不再結算，繼續推進也沒有任何事件', () => {
    // 法師一轉「燃燒」為 4 跳持續傷害：找一個截止時 BOSS 身上仍有燃燒剩餘時間的冷卻設定。
    const burnSkillId = 'SK021';
    const burnHero: HeroLoadoutSnapshot = { ...NOVICE_HERO, jobId: 'JOB11', skillIds: [burnSkillId] };
    const stage = getStageAt(catalog, 1, bossLocal(1));
    const build = (cdrBp: number) =>
      new BattleSim({
        catalog,
        seed: 777,
        stats: { ...fixedStats(20, tuning.hero.basicAttackIntervalMs), cdrBp },
        hero: burnHero,
        encounter: { kind: 'boss', stage, durationMs: BOSS_DURATION_MS },
      });
    let chosen: { sim: BattleSim; events: BattleEvent[] } | null = null;
    for (let cdrBp = 0; cdrBp <= tuning.hero.cdrCapBp && !chosen; cdrBp += 100) {
      const sim = build(cdrBp);
      const events = sim.runUntilTick(BOSS_MAX_TICKS);
      const burning = sim.view().enemies.some((enemy) =>
        enemy.kind === 'boss' && enemy.statuses.some((status) => status.statusId === 'BURN' && status.remainingMs > 0),
      );
      if (sim.bossResult === 'timeout' && burning) chosen = { sim, events };
    }
    if (!chosen) throw new Error('找不到截止時仍在燃燒的設定');
    const { sim, events } = chosen;
    expect(events.some((event) => event.type === 'hit' && event.source === 'dot')).toBe(true);
    expect(events.some((event) => event.type === 'hit' && event.atMs > BOSS_DURATION_MS)).toBe(false);
    expect(events.filter((event) => event.type === 'bossResolved')).toEqual([
      expect.objectContaining({ atMs: BOSS_DURATION_MS, result: 'timeout' }),
    ]);
    const hpAtDeadline = sim.view().boss!.hp;
    expect(hpAtDeadline).toBeGreaterThan(0);

    expect(sim.runUntilTick(BOSS_MAX_TICKS * 2)).toEqual([]);
    expect(sim.tick()).toEqual([]);
    expect(sim.currentTimeMs).toBe(BOSS_DURATION_MS);
    expect(sim.bossResult).toBe('timeout');
    expect(sim.view().boss!.hp).toBe(hpAtDeadline);
  });

  it('T-16 引擎依截止時間結算：截止前一刻仍進行中，截止刻判逾時，結算時間不因延後推進而改變', () => {
    const engine = engineWith(atBossStage(WEAK_LEVEL));
    const startAt = 7_000;
    const startOp = 'op-t16-engine-deadline';
    const attempt = startBoss(engine, startAt, startOp);
    engine.advance(attempt.deadlineAtMs - TICK_MS);
    expect(engine.getState().boss.active?.result).toBe('pending');
    expect(engine.getState().progress.mode).toBe('BOSS_FIGHT');
    expect(engine.getBattleView()?.boss?.remainingMs).toBe(TICK_MS);

    engine.advance(attempt.deadlineAtMs);
    const finished = lastHistory(engine);
    expect(finished.result).toBe('timeout');
    expect(finished.resolvedAtMs).toBe(attempt.deadlineAtMs);

    // 對照：同一場在截止很久之後才第一次推進，結果與結算時間完全相同。
    const late = engineWith(atBossStage(WEAK_LEVEL));
    startBoss(late, startAt, startOp);
    late.advance(attempt.deadlineAtMs + 10 * 60_000);
    expect(lastHistory(late)).toEqual(finished);
  });
});

describe('T-27 切背景／斷線', () => {
  function uninterruptedResult(level: number, startAt: number): BossAttempt {
    const engine = engineWith(atBossStage(level));
    startBoss(engine, startAt, 'op-t27-start-boss');
    runFor(engine, startAt, startAt + BOSS_DURATION_MS + 1_000);
    return lastHistory(engine);
  }

  for (const [label, level] of [
    ['勝利場', MID_LEVEL],
    ['逾時場', WEAK_LEVEL],
  ] as const) {
    it(`T-27 已開始的 BOSS 在 suspend 期間仍依牆鐘推進；中途匯出重載後結果與不中斷相同（${label}）`, () => {
      const startAt = 10_000;
      const expected = uninterruptedResult(level, startAt);
      expect(expected.result).toBe(level === MID_LEVEL ? 'success' : 'timeout');

      const suspendAt = startAt + 5_000;
      const backgroundUntil = startAt + 12_000;
      // 本案例要求挑戰在背景期間仍未結束，才能驗證「背景中計時繼續」。
      expect(expected.resolvedAtMs!).toBeGreaterThan(backgroundUntil);

      const engine = engineWith(atBossStage(level));
      startBoss(engine, startAt, 'op-t27-start-boss');
      runFor(engine, startAt, suspendAt);
      expect(engine.getBattleView()?.boss?.elapsedMs).toBe(suspendAt - startAt);
      engine.suspend();
      expect(engine.isSuspended()).toBe(true);
      engine.advance(backgroundUntil);
      // 背景期間 BOSS 計時不暫停：依牆鐘推進到 backgroundUntil。
      expect(engine.getBattleView()?.boss?.elapsedMs).toBe(backgroundUntil - startAt);
      expect(engine.getBattleView()?.boss?.remainingMs).toBe(BOSS_DURATION_MS - (backgroundUntil - startAt));
      expect(engine.getState().boss.active?.result).toBe('pending');

      // 斷線重連：從匯出狀態重建（BOSS 從第 0 刻依快照與種子重播），一次推進到遠超截止時間。
      const reloaded = new GameEngine({ catalog, nowMs: startAt + 40_000, state: engine.exportState() });
      expect(reloaded.getState().progress.mode).toBe('BOSS_FIGHT');
      reloaded.advance(startAt + 10 * 60_000);
      const events = reloaded.drainEvents();
      expect(events.filter((event) => event.type === 'bossResolved')).toHaveLength(1);
      expect(lastHistory(reloaded)).toEqual(expected);
      expect(reloaded.getState().boss.history).toHaveLength(1);

      // 原引擎在 suspend 中繼續推進，也得到同一結果。
      engine.advance(startAt + 10 * 60_000);
      expect(lastHistory(engine)).toEqual(expected);
    });
  }

  // 回歸測試（已修正的核心缺陷）: 引擎的 execute() 不會先把進行中的 BOSS 依牆鐘結算到 nowMs。若 BOSS 依開戰快照早已在截止前被擊敗
  // （例如切背景／斷線期間 advance 沒被呼叫），之後送出的 abortBossAttempt 仍被接受，結果被覆寫成 aborted、
  // resolvedAtMs 晚於 deadlineAtMs、地圖不進位。規格 02「BOSS 計時不因開面板、切頁或斷線而暫停」、
  // 規格 09「worker 按伺服器時鐘與固定 tick 計算；若已完成就顯示結果」與 T-27「已開始 BOSS 依原 deadline 結算」
  // 要求：已分出勝負的挑戰應維持原結果（退出應回 BOSS_NOT_ACTIVE 或先結算再判斷）。
  // 預期：result=success、地圖 2-1；實際：result=aborted、resolvedAtMs=deadline+60000、停在 1-30 FARM_BLOCKED。
  it('T-27 挑戰已依牆鐘分出勝負後才送出退出：不得把既定勝利覆寫成 aborted', () => {
    const engine = engineWith(atBossStage(ENDGAME_LEVEL));
    const attempt = startBoss(engine, 0);
    // 對照：同一快照不中斷推進時，數秒內即擊敗 BOSS。
    const reference = engineWith(atBossStage(ENDGAME_LEVEL));
    startBoss(reference, 0);
    reference.advance(BOSS_DURATION_MS);
    expect(lastHistory(reference).result).toBe('success');
    expect(lastHistory(reference).resolvedAtMs!).toBeLessThan(attempt.deadlineAtMs);

    // 斷線期間沒有 advance；回來後第一個動作是按「退出」。
    const lateAt = attempt.deadlineAtMs + 60_000;
    send(engine, 'abortBossAttempt', { attemptId: attempt.attemptId }, lateAt);
    engine.advance(lateAt);
    const history = engine.getState().boss.history;
    expect(history.every((entry) => entry.resolvedAtMs !== null && entry.resolvedAtMs <= entry.deadlineAtMs)).toBe(true);
    expect(lastHistory(engine)).toMatchObject({ attemptId: attempt.attemptId, result: 'success' });
    expect(engine.getState().progress).toMatchObject({ mapNumber: 2, localStage: 1, mode: 'PROGRESS' });
  });

  it('T-27 普通刷怪在 suspend 期間完全不產出；resume 後不補算，長時間空白最多只推進 maxCatchUpMs', () => {
    const engine = engineWith(atStage(STRONG_LEVEL, 1, 1));
    runFor(engine, 0, 5_000);
    const snapshot = () => {
      const state = engine.getState();
      return {
        kills: state.totals.kills,
        relics: state.wallet.relics,
        relicProgress: state.wallet.relicProgress,
        progress: { ...state.progress },
        simTime: engine.getBattleView()!.timeMs,
      };
    };
    const beforeSuspend = snapshot();
    expect(beforeSuspend.kills).toBeGreaterThan(0);

    engine.suspend();
    const suspendedEvents = runFor(engine, 5_000, 65_000);
    expect(suspendedEvents).toEqual([]);
    expect(snapshot()).toEqual(beforeSuspend);

    // 回前景：從 resume 當下開始，不補算背景 60 秒。
    engine.resume(65_000);
    engine.advance(66_000);
    expect(engine.getBattleView()!.timeMs).toBe(beforeSuspend.simTime + 1_000);

    // 沒有 suspend 的長空白（例如畫面凍結）：只推進最多 maxCatchUpMs。
    const simBeforeGap = engine.getBattleView()!.timeMs;
    const killsBeforeGap = engine.getState().totals.kills;
    engine.advance(66_000 + 30 * 60_000);
    const { maxCatchUpMs } = tuning.battle;
    expect(engine.getBattleView()!.timeMs - simBeforeGap).toBe(maxCatchUpMs);
    const killsInGap = engine.getState().totals.kills - killsBeforeGap;
    // 見習者只有單體普攻：每發最多擊殺 1 隻。
    expect(killsInGap).toBeLessThanOrEqual(Math.floor(maxCatchUpMs / tuning.hero.basicAttackIntervalMs) + 1);
  });
});

describe('首次自動挑戰設定（P，預設關閉）', () => {
  it('預設關閉：抵達第 30 關不會自動召喚', () => {
    const engine = engineWith(atStage(STRONG_LEVEL, 1, 29));
    expect(engine.getState().settings.firstBossAuto).toBe(tuning.boss.firstAutoChallengeDefault);
    expect(engine.getState().settings.firstBossAuto).toBe(false);
    const reached = runUntil(engine, 0, (event) => event.type === 'stageAdvanced', 120_000);
    const later = runFor(engine, reached.nowMs, reached.nowMs + 30_000);
    expect([...reached.events, ...later].some((event) => event.type === 'bossStarted')).toBe(false);
    const state = engine.getState();
    expect(state.progress.mode).toBe('BOSS_READY');
    expect(state.progress.firstAutoTriedMaps).toEqual([]);
    expect(state.totals.bossAttempts).toBe(0);
  });

  it('開啟後每張地圖恰好自動挑戰一次：第 1 圖勝利後，第 2 圖抵達第 30 關再自動一次', () => {
    const engine = engineWith(atStage(STRONG_LEVEL, 1, 29));
    expect(expectSucceeded(send(engine, 'updateGameSettings', { firstBossAuto: true }, 0))).toEqual({ firstBossAuto: true });
    expect(engine.getState().settings.firstBossAuto).toBe(true);

    const first = runUntil(engine, 0, (event) => event.type === 'bossStarted', 120_000);
    expect(first.events.filter((event) => event.type === 'bossStarted')).toHaveLength(1);
    expect(engine.getState().boss.active).toMatchObject({ mapNumber: 1, autoTriggered: true });
    expect(engine.getState().progress.mode).toBe('BOSS_FIGHT');

    const win = runUntil(engine, first.nowMs, (event) => event.type === 'bossResolved', BOSS_DURATION_MS + 1_000, 1_000);
    expect(lastHistory(engine)).toMatchObject({ mapNumber: 1, result: 'success', autoTriggered: true });
    expect(engine.getState().progress).toMatchObject({ mapNumber: 2, localStage: 1, mode: 'PROGRESS' });

    // 第 2 圖一路推進到第 30 關（約 29 關 × 數秒）。
    const second = runUntil(engine, win.nowMs, (event) => event.type === 'bossStarted', 30 * 60_000, 1_000);
    const autoStarts = second.events.filter((event) => event.type === 'bossStarted');
    expect(autoStarts).toHaveLength(1);
    expect(autoStarts[0]).toMatchObject({ autoTriggered: true });
    expect(engine.getState().boss.active).toMatchObject({ mapNumber: 2, autoTriggered: true, stageId: bossStageId(2) });
    expect(engine.getState().progress.firstAutoTriedMaps).toEqual([1, 2]);
    expect(engine.getState().totals.bossAttempts).toBe(2);
    // 自動挑戰不寫玩家操作紀錄，也不改 revision 之外的資源。
    expect(engine.getState().wallet.gold).toBe(0);
  });
});

describe('主動退出 BOSS', () => {
  it('abortBossAttempt → FARM_BLOCKED、紀錄 aborted、沒有任何獎勵；原截止時間到也不再結算', () => {
    const engine = engineWith(atBossStage(MID_LEVEL));
    runFor(engine, 0, 5_000);
    const startAt = 5_000;
    const attempt = startBoss(engine, startAt);
    runFor(engine, startAt, startAt + 3_000);
    const before = engine.exportState();

    expectRejected(send(engine, 'abortBossAttempt', { attemptId: 'boss999-wrong' }, startAt + 3_500), 'STAGE_MISMATCH');
    expect(engine.getState().boss.active?.attemptId).toBe(attempt.attemptId);

    const abortOp = 'op-abort-boss-0001';
    const res = send(engine, 'abortBossAttempt', { attemptId: attempt.attemptId }, startAt + 4_000, abortOp);
    expect(expectSucceeded(res)).toEqual({ attemptId: attempt.attemptId, result: 'aborted' });
    const events = engine.drainEvents();
    expect(events.filter((event) => event.type === 'bossResolved')).toEqual([
      expect.objectContaining({ type: 'bossResolved', mapAfter: 1, endgame: false }),
    ]);

    const state = engine.exportState();
    expect(state.progress).toMatchObject({ mapNumber: 1, localStage: 30, mode: 'FARM_BLOCKED', highestClearedMap: 0 });
    expect(state.boss.active).toBeNull();
    expect(state.boss.history.at(-1)).toMatchObject({ attemptId: attempt.attemptId, result: 'aborted', resolvedAtMs: startAt + 4_000 });
    expect(state.wallet).toEqual(before.wallet);
    expect(state.player).toEqual(before.player);
    expect(state.totals.bossAttempts).toBe(1);

    // 重送退出：回原結果，不再寫第二筆紀錄。
    const replay = send(engine, 'abortBossAttempt', { attemptId: attempt.attemptId }, startAt + 5_000, abortOp);
    expect(replay.replayed).toBe(true);
    expect(engine.getState().boss.history).toHaveLength(1);
    // 新 ID 再退出：沒有進行中的挑戰。
    expectRejected(send(engine, 'abortBossAttempt', { attemptId: attempt.attemptId }, startAt + 5_000), 'BOSS_NOT_ACTIVE');

    // 推進超過原截止時間：不會補判成功，也不會自動再召喚；回到刷普通怪。
    const killsBefore = engine.getState().totals.kills;
    const later = runFor(engine, startAt + 5_000, startAt + BOSS_DURATION_MS + 30_000);
    expect(later.some((event) => event.type === 'bossResolved' || event.type === 'bossStarted')).toBe(false);
    expect(engine.getState().progress).toMatchObject({ mapNumber: 1, localStage: 30, mode: 'FARM_BLOCKED' });
    expect(engine.getState().boss.history).toHaveLength(1);
    expect(engine.getState().totals.kills).toBeGreaterThan(killsBefore);
  });
});

describe('BOSS 副目標不產出古物', () => {
  const map1Adds = catalog.maps.get(1)!.bossMechanics.find(
    (mechanic): mechanic is Extract<BossMechanicDef, { kind: 'periodicAdds' }> => mechanic.kind === 'periodicAdds',
  )!;

  it('第 1 圖枝芽：被擊殺時 rewardPoints = 0（tuning.relic.bossAddPoints），本體也是 0', () => {
    expect(tuning.relic.bossAddPoints).toBe(0);
    expect(tuning.relic.bossBodyPoints).toBe(0);
    // 優先機制目標：先清副目標，確保真的有副目標死亡事件。
    const { events } = runBossSim(Math.ceil(bossHp(catalog, 1, 30) / 20), tuning.hero.basicAttackIntervalMs, {
      targetPolicy: 'mechanicFirst',
    });
    const spawned = events.filter((event) => event.type === 'addsSpawned');
    expect(spawned.length).toBeGreaterThan(0);
    expect(spawned.every((event) => event.type === 'addsSpawned' && event.name === map1Adds.addName)).toBe(true);
    const defeated = events.filter((event): event is Extract<BattleEvent, { type: 'enemyDefeated' }> => event.type === 'enemyDefeated');
    const adds = defeated.filter((event) => event.kind === 'add');
    expect(adds.length).toBeGreaterThan(0);
    expect(adds.every((event) => event.rewardPoints === tuning.relic.bossAddPoints)).toBe(true);
    expect(defeated.filter((event) => event.kind === 'boss').every((event) => event.rewardPoints === tuning.relic.bossBodyPoints)).toBe(true);
  });

  it('引擎：打王配置設「優先機制目標」清掉枝芽，整場古物、產出點與擊殺統計都不變', () => {
    const engine = engineWith(atBossStage(MID_LEVEL));
    expectSucceeded(
      send(engine, 'saveLoadoutSkills', { purpose: 'boss', skillIds: [], conditions: {}, targetPolicy: 'mechanicFirst' }, 0),
    );
    const before = engine.exportState();
    const attempt = startBoss(engine, 1_000);
    expect(attempt.hero.targetPolicy).toBe('mechanicFirst');
    const fight = runFor(engine, 1_000, 1_000 + BOSS_DURATION_MS + 1_000);
    const addKills = battleEvents(fight).filter((event) => event.type === 'enemyDefeated' && event.kind === 'add');
    expect(addKills.length).toBeGreaterThan(0);
    // 只看戰鬥結算的瞬間：BOSS 結束前的狀態。
    const resolvedIndex = fight.findIndex((event) => event.type === 'bossResolved');
    expect(resolvedIndex).toBeGreaterThanOrEqual(0);
    expect(fight.slice(0, resolvedIndex).some((event) => event.type === 'relicGranted')).toBe(false);
    const finished = lastHistory(engine);
    const state = engine.getState();
    // 結算後回到刷怪可能已再擊殺普通怪；扣除結算後的普通怪產出，BOSS 期間應為 0。
    const postFight = battleEvents(fight.slice(resolvedIndex)).filter(
      (event): event is Extract<BattleEvent, { type: 'enemyDefeated' }> => event.type === 'enemyDefeated',
    );
    const postPoints = postFight.reduce((sum, event) => sum + event.rewardPoints, 0);
    const pointsOf = (s: { totals: { relicsGranted: number }; wallet: { relicProgress: number } }) =>
      s.totals.relicsGranted * tuning.relic.pointsPerRelic + s.wallet.relicProgress;
    expect(pointsOf(state) - pointsOf(before)).toBe(postPoints);
    expect(state.totals.kills - before.totals.kills).toBe(postFight.length);
    expect(['success', 'timeout']).toContain(finished.result);
  });
});

describe('存檔與版本', () => {
  it('serializeSave／parseSave 往返：BOSS 進行中存檔讀回後結果與不中斷相同', () => {
    const startAt = 3_000;
    const reference = engineWith(atBossStage(MID_LEVEL));
    startBoss(reference, startAt, 'op-save-start-boss');
    runFor(reference, startAt, startAt + BOSS_DURATION_MS + 1_000);
    const expected = lastHistory(reference);

    const engine = engineWith(atBossStage(MID_LEVEL));
    startBoss(engine, startAt, 'op-save-start-boss');
    runFor(engine, startAt, startAt + 10_000);
    const exported = engine.exportState();
    const raw = serializeSave(exported, startAt + 10_000);
    const loaded = parseSave(raw, catalog);
    if (!loaded.ok) throw new Error(`讀檔失敗：${loaded.reason}`);
    expect(loaded.state).toEqual(exported);
    expect(loaded.state.boss.active?.result).toBe('pending');

    const restored = new GameEngine({ catalog, nowMs: startAt + 20_000, state: loaded.state });
    expect(restored.getState().progress.mode).toBe('BOSS_FIGHT');
    runFor(restored, startAt + 20_000, startAt + BOSS_DURATION_MS + 1_000);
    expect(lastHistory(restored)).toEqual(expected);
  });

  it('parseSave 偵測內容版本不符（CONTENT_VERSION_MISMATCH），以及空檔／損壞', () => {
    const state = fixture(atBossStage(MID_LEVEL));
    const raw = serializeSave(state, 0);

    const fileMismatch = JSON.parse(raw) as { contentVersion: string; state: GameState };
    fileMismatch.contentVersion = 'old-version';
    const res1 = parseSave(JSON.stringify(fileMismatch), catalog);
    expect(res1.ok).toBe(false);
    if (!res1.ok) expect(res1.reason).toBe('CONTENT_VERSION_MISMATCH');

    const stateMismatch = JSON.parse(raw) as { contentVersion: string; state: GameState };
    stateMismatch.state.contentVersion = 'old-version';
    const res2 = parseSave(JSON.stringify(stateMismatch), catalog);
    expect(res2.ok).toBe(false);
    if (!res2.ok) expect(res2.reason).toBe('CONTENT_VERSION_MISMATCH');

    const empty = parseSave(null, catalog);
    expect(empty.ok === false && empty.reason).toBe('EMPTY');
    const corrupted = parseSave('{not json', catalog);
    expect(corrupted.ok === false && corrupted.reason).toBe('CORRUPTED');
  });

  it('召喚命令帶舊 contentVersion → CONTENT_VERSION_MISMATCH，不建立挑戰；帶正確版本才成功', () => {
    const engine = engineWith(atBossStage(MID_LEVEL));
    const before = stateWithoutOperations(engine);
    const stale = engine.execute(
      { operationId: nextOpId(), contentVersion: 'old-version', command: { type: 'startBossAttempt', payload: { stageId: bossStageId(1) } } },
      1_000,
    );
    expectRejected(stale, 'CONTENT_VERSION_MISMATCH');
    expect(stateWithoutOperations(engine)).toEqual(before);
    expect(engine.getState().progress.mode).toBe('BOSS_READY');

    const fresh = engine.execute(
      {
        operationId: nextOpId(),
        contentVersion: catalog.contentVersion,
        command: { type: 'startBossAttempt', payload: { stageId: bossStageId(1) } },
      },
      1_000,
    );
    expect(expectSucceeded<StartBossResult>(fresh).attempt.contentVersion).toBe(catalog.contentVersion);
    expect(engine.getState().progress.mode).toBe('BOSS_FIGHT');
  });
});
