import { getStageAt, loadDefaultCatalog } from '@qiwu/content';
import { describe, expect, it } from 'vitest';
import { BattleSim, GameEngine, createInitialState, type CombatStatsSnapshot, type GameState } from '../src/index.ts';

const catalog = loadDefaultCatalog();

function stats(overrides: Partial<CombatStatsSnapshot> = {}): CombatStatsSnapshot {
  return {
    attack: 50,
    basicIntervalMs: 1000,
    critRateBp: 0,
    critMultBp: 15000,
    cdrBp: 0,
    bonusBp: { BASIC_DMG: 0, SKILL_DMG: 0, DOT_DMG: 0, SUMMON_DMG: 0, FOLLOWUP_DMG: 0, MARK_DMG: 0, SHATTER_DMG: 0, EXECUTE_DMG: 0 },
    ...overrides,
  };
}

function swordsman(level: number, jobs: string[], current: string): GameState {
  const state = createInitialState(catalog, 99);
  state.player.level = level;
  state.player.unlockedJobIds = jobs;
  state.player.currentJobId = current;
  state.identifySettings.targetJobId = current;
  return state;
}

describe('稽核回歸：冷卻不可因重新配置或換職重置', () => {
  it('把技能移出配置再放回，冷卻沿用原本剩餘時間', () => {
    const engine = new GameEngine({ catalog, nowMs: 0, state: swordsman(10, ['JOB01'], 'JOB01') });
    engine.advance(1000);
    const cooling = engine.getBattleView()!.hero.skills.find((skill) => skill.skillId === 'SK001')!;
    expect(cooling.remainingMs).toBeGreaterThan(0);
    const save = (id: string, skillIds: string[], at: number) =>
      engine.execute(
        { operationId: `op-save-${id}`, command: { type: 'saveLoadoutSkills', payload: { purpose: 'farm', skillIds, conditions: {}, targetPolicy: 'default' } } },
        at,
      );
    expect(save('a', ['SK002'], 1000).status).toBe('succeeded');
    expect(save('b', ['SK001', 'SK002'], 1000).status).toBe('succeeded');
    const after = engine.getBattleView()!.hero.skills.find((skill) => skill.skillId === 'SK001')!;
    expect(after.remainingMs).toBe(cooling.remainingMs);
  });

  it('三轉絕招不能靠「換到二轉再換回三轉」重置 24 秒冷卻', () => {
    const engine = new GameEngine({ catalog, nowMs: 0, state: swordsman(80, ['JOB01', 'JOB02', 'JOB03'], 'JOB03') });
    engine.advance(3000);
    const ultimate = engine.getBattleView()!.hero.skills.find((skill) => skill.skillId === 'SK006')!;
    expect(ultimate.remainingMs).toBeGreaterThan(10_000);
    const switchTo = (id: string, jobId: string) =>
      engine.execute({ operationId: `op-switch-${id}`, command: { type: 'switchJob', payload: { jobId, ackUnequipItemIds: [] } } }, 3000);
    expect(switchTo('a', 'JOB02').status).toBe('succeeded');
    expect(switchTo('b', 'JOB03').status).toBe('succeeded');
    const after = engine.getBattleView()!.hero.skills.find((skill) => skill.skillId === 'SK006')!;
    expect(after.remainingMs).toBe(ultimate.remainingMs);
  });
});

describe('稽核回歸：集火信標只加砲台，不加機甲', () => {
  it('信標讓砲台命中提高 25%，但機甲命中與無信標時相同', () => {
    const stage = getStageAt(catalog, 12, 29);
    const summonHits = (skillIds: string[]) => {
      const sim = new BattleSim({
        catalog,
        seed: 7,
        stats: stats({ attack: 1000 }),
        hero: { jobId: 'JOB35', skillIds, ultimateId: 'SK070', conditions: {}, targetPolicy: 'default', passiveIds: [], legendBaseIds: [] },
        encounter: { kind: 'stage', stage },
      });
      const hits: number[] = [];
      for (let tick = 0; tick < 200; tick += 1) {
        for (const event of sim.tick()) if (event.type === 'hit' && event.source === 'summon') hits.push(event.amount);
      }
      return hits;
    };
    const withBeacon = summonHits(['SK067', 'SK069']);
    const withoutBeacon = summonHits(['SK067']);
    // 機甲係數 0.70A 大於砲台 0.35A×1.25，因此最大的召喚命中一定是機甲。
    expect(Math.max(...withBeacon)).toBe(Math.max(...withoutBeacon));
    const turretBase = Math.min(...withoutBeacon);
    expect(withBeacon.some((amount) => amount > turretBase && amount < Math.max(...withoutBeacon))).toBe(true);
  });
});

describe('稽核回歸：可重試的拒絕不封存操作 ID', () => {
  it('古物不足被拒後，累積古物再用同一操作 ID 重試可以成功', () => {
    const engine = new GameEngine({ catalog, nowMs: 0, seed: 3 });
    const envelope = { operationId: 'op-retry-same-id', command: { type: 'identify' as const, payload: {} } };
    const first = engine.execute(envelope, 0);
    expect(first.status).toBe('rejected');
    if (first.status === 'rejected') {
      expect(first.error.code).toBe('NO_RELIC');
      expect(first.error.retryable).toBe(true);
    }
    for (let t = 100; t <= 180_000 && engine.getState().wallet.relics === 0; t += 100) engine.advance(t);
    expect(engine.getState().wallet.relics).toBeGreaterThan(0);
    const retry = engine.execute(envelope, 180_000);
    expect(retry.status).toBe('succeeded');
    const replay = engine.execute(envelope, 180_001);
    expect(replay).toMatchObject({ status: 'succeeded', replayed: true });
  });

  it('不可重試的拒絕（格式錯誤）仍封存，換 payload 視為重用 ID', () => {
    const engine = new GameEngine({ catalog, nowMs: 0, seed: 3 });
    const bad = engine.execute({ operationId: 'op-bad-payload', command: { type: 'lockItem', payload: { itemId: 'x', locked: true, extra: 1 } as never } }, 0);
    expect(bad).toMatchObject({ status: 'rejected', error: { code: 'INVALID_PAYLOAD' } });
    const reuse = engine.execute({ operationId: 'op-bad-payload', command: { type: 'lockItem', payload: { itemId: 'x', locked: false } } }, 1);
    expect(reuse).toMatchObject({ status: 'rejected', error: { code: 'OPERATION_REUSED' } });
  });
});

describe('稽核回歸：自動出售範圍擴大必須再確認', () => {
  const payload = (maxQuality: 'Q1' | 'Q2', slots: string[], confirmAutoSell: boolean, keepSlots: string[] = []) => ({
    targetJobId: 'NOVICE',
    keep: { minQuality: 'Q4' as const, slots: keepSlots as never, affixStats: [], upgradesOverEquipped: false },
    autoSell: { enabled: true, maxQuality, slots: slots as never },
    confirmAutoSell,
  });

  it('首次開啟、提高品質上限、增加部位都需要確認；縮小範圍不需要', () => {
    const engine = new GameEngine({ catalog, nowMs: 0, seed: 5 });
    let op = 0;
    const save = (p: ReturnType<typeof payload>) =>
      engine.execute({ operationId: `op-autosell-${++op}`, command: { type: 'updateIdentifySettings', payload: p } }, 0);
    expect(save(payload('Q1', ['head'], false))).toMatchObject({ status: 'rejected', error: { code: 'AUTO_SELL_NOT_CONFIRMED' } });
    expect(save(payload('Q1', ['head'], true)).status).toBe('succeeded');
    expect(save(payload('Q2', ['head'], false))).toMatchObject({ status: 'rejected', error: { code: 'AUTO_SELL_NOT_CONFIRMED' } });
    expect(save(payload('Q1', ['head', 'ring'], false))).toMatchObject({ status: 'rejected', error: { code: 'AUTO_SELL_NOT_CONFIRMED' } });
    expect(save(payload('Q1', ['head'], false, ['ring'])).status).toBe('succeeded');
    // 移除保留部位＝放寬保留條件，等於擴大出售範圍。
    expect(save(payload('Q1', ['head'], false, []))).toMatchObject({ status: 'rejected', error: { code: 'AUTO_SELL_NOT_CONFIRMED' } });
  });

  it('指定保留部位的裝備不會被自動出售', () => {
    const state = createInitialState(catalog, 21);
    state.wallet.relics = 30;
    state.identifySettings.keep.slots = ['head', 'body', 'hands', 'feet', 'necklace', 'ring'];
    state.identifySettings.autoSell = { enabled: true, maxQuality: 'Q3', slots: ['head', 'body', 'hands', 'feet', 'necklace', 'ring'] };
    const engine = new GameEngine({ catalog, nowMs: 0, state });
    for (let index = 0; index < 20; index += 1) {
      const response = engine.execute({ operationId: `op-keepslot-${index}`, command: { type: 'identify', payload: {} } }, 0);
      expect(response.status).toBe('succeeded');
      if (response.status === 'succeeded') {
        expect((response.result as { classification: { disposition: string } }).classification.disposition).toBe('keep');
      }
    }
  });
});
