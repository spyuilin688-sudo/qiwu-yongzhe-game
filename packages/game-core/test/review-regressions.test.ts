import { getStageAt, loadDefaultCatalog, passiveIdsForJob, type StageDef } from '@qiwu/content';
import { describe, expect, it } from 'vitest';
import { BattleSim, type BattleEvent, type CombatStatsSnapshot, type HeroLoadoutSnapshot } from '../src/index.ts';

/**
 * 第二輪引擎審查發現的回歸測試（每條對應一個已修正的問題）。
 * 規則來源：設計資料 equipment[].legend_effect、passives[].prototype_rule 與「一層追加鏈」。
 */

const catalog = loadDefaultCatalog();
const HIT_DELAY_MS = catalog.tuning.battle.minHitDelayMs;
const TANKY_STAGE = getStageAt(catalog, 12, 29);
const WEAK_STAGE = getStageAt(catalog, 1, 3);
/** 讓普攻幾乎不出手（只有開場第一下）。 */
const NO_BASICS_MS = 600_000;

type HitEvent = Extract<BattleEvent, { type: 'hit' }>;

function stats(overrides: Partial<CombatStatsSnapshot> = {}, bonus: Partial<CombatStatsSnapshot['bonusBp']> = {}): CombatStatsSnapshot {
  return {
    attack: 10,
    basicIntervalMs: 1000,
    critRateBp: 0,
    critMultBp: 15000,
    cdrBp: 0,
    ...overrides,
    bonusBp: { BASIC_DMG: 0, SKILL_DMG: 0, DOT_DMG: 0, SUMMON_DMG: 0, FOLLOWUP_DMG: 0, MARK_DMG: 0, SHATTER_DMG: 0, EXECUTE_DMG: 0, ...bonus },
  };
}

function hero(jobId: string, skillIds: string[], extra: Partial<HeroLoadoutSnapshot> = {}): HeroLoadoutSnapshot {
  return {
    jobId,
    skillIds,
    ultimateId: null,
    conditions: {},
    targetPolicy: 'default',
    passiveIds: [...passiveIdsForJob(catalog, jobId)],
    legendBaseIds: [],
    ...extra,
  };
}

function sim(h: HeroLoadoutSnapshot, s: CombatStatsSnapshot, stage: StageDef = TANKY_STAGE): BattleSim {
  return new BattleSim({ catalog, seed: 777, stats: s, hero: h, encounter: { kind: 'loop', stage } });
}

function runUntil(battle: BattleSim, untilMs: number, onTick?: (events: readonly BattleEvent[]) => void): BattleEvent[] {
  const all: BattleEvent[] = [];
  while (battle.currentTimeMs < untilMs) {
    const events = battle.tick();
    all.push(...events);
    onTick?.(events);
  }
  return all;
}

const hitsOf = (events: readonly BattleEvent[], predicate: (hit: HitEvent) => boolean): HitEvent[] =>
  events.filter((event): event is HitEvent => event.type === 'hit' && predicate(event));

describe('審查回歸：一層追加鏈', () => {
  it('羽飾獵帽（EQ072）只在本體擊殺主目標時觸發；持續傷害擊殺不觸發', () => {
    // 普攻傷害 −99%、持續傷害 +900%：擊殺全部來自燃燒。法師沒有其他追加來源。
    const battle = sim(
      hero('JOB11', ['SK021'], { legendBaseIds: ['EQ072'] }),
      stats({ attack: 40 }, { BASIC_DMG: -9900, DOT_DMG: 90000 }),
      WEAK_STAGE,
    );
    const events = runUntil(battle, 30_000);
    const dotKills = events.filter((event) => event.type === 'enemyDefeated').length;
    expect(dotKills).toBeGreaterThan(3);
    expect(hitsOf(events, (hit) => hit.source === 'followUp')).toEqual([]);
  });
});

describe('審查回歸：觸發時機', () => {
  it('星冠頭盔（EQ073）在絕招最後一段之後才存起，下一次普攻的追加晚於絕招結束', () => {
    const battle = sim(hero('JOB03', [], { ultimateId: 'SK006', passiveIds: [], legendBaseIds: ['EQ073'] }), stats());
    const events = runUntil(battle, 4000);
    const ultimateHits = hitsOf(events, (hit) => hit.source === 'ultimate');
    const followUps = hitsOf(events, (hit) => hit.source === 'followUp');
    expect(ultimateHits.length).toBeGreaterThan(0);
    expect(followUps.length).toBeGreaterThan(0);
    const lastUltimateAt = Math.max(...ultimateHits.map((hit) => hit.atMs));
    expect(followUps[0]!.atMs).toBeGreaterThan(lastUltimateAt);
  });

  it('星核墜飾類「下一次絕招追加」（EQ082）對沒有傷害段的絕招（機甲總動員）也會釋放', () => {
    const battle = sim(
      hero('JOB35', ['SK062', 'SK067', 'SK068'], { ultimateId: 'SK070', passiveIds: [], legendBaseIds: ['EQ082'] }),
      stats({ basicIntervalMs: NO_BASICS_MS }),
    );
    const events = runUntil(battle, 60_000);
    const mechCasts = events.filter((event) => event.type === 'skillCast' && event.skillId === 'SK070').map((event) => event.atMs);
    const followUpTimes = new Set(hitsOf(events, (hit) => hit.source === 'followUp').map((hit) => hit.atMs));
    expect(mechCasts.length).toBeGreaterThan(1);
    // 第一次絕招之前已完成三種不同常規技能；之後每次機甲總動員都應帶出追加。
    expect(mechCasts.slice(1).some((atMs) => followUpTimes.has(atMs + HIT_DELAY_MS))).toBe(true);
  });
});

describe('審查回歸：「命中帶狀態的目標」以命中前狀態判斷', () => {
  it('施加集火信標的那一下不會觸發精準校正（PS035）', () => {
    // 有無精準校正，在第二次信標之前砲台命中應完全相同（第一次信標那一下不算命中信標目標）。
    const summonHitsBeforeSecondBeacon = (passiveIds: string[]) => {
      const battle = sim(hero('JOB35', ['SK067', 'SK069'], { passiveIds }), stats({ attack: 1000, basicIntervalMs: NO_BASICS_MS }));
      const events = runUntil(battle, 30_000);
      const beaconCasts = events.filter((event) => event.type === 'skillCast' && event.skillId === 'SK069').map((event) => event.atMs);
      expect(beaconCasts.length).toBeGreaterThan(1);
      return hitsOf(events, (hit) => hit.source === 'summon' && hit.atMs <= beaconCasts[1]!).map((hit) => hit.amount);
    };
    expect(summonHitsBeforeSecondBeacon(['PS035'])).toEqual(summonHitsBeforeSecondBeacon([]));
  });
});

describe('審查回歸：卸下來源後不保留舊效果', () => {
  it('已存起的普攻追加在卸下傳說（EQ086）後不再釋放', () => {
    const battle = sim(hero('JOB01', [], { passiveIds: [], legendBaseIds: ['EQ086'] }), stats());
    // 第 6 次普攻（5050ms）觸發並存到下一次普攻。
    runUntil(battle, 5200);
    battle.updateHero(hero('JOB01', [], { passiveIds: [], legendBaseIds: [] }));
    const events = runUntil(battle, 8000);
    expect(hitsOf(events, (hit) => hit.source === 'followUp')).toEqual([]);
  });
});

describe('審查回歸：輪替技能的加層在傷害之後', () => {
  it('聖光連禱（SK045）對主目標加的聖印在第一段命中後才出現', () => {
    const battle = sim(hero('JOB23', ['SK045']), stats({ basicIntervalMs: NO_BASICS_MS }));
    const sealAt: { castTick: number | null; afterFirstHit: number | null } = { castTick: null, afterFirstHit: null };
    let castAt: number | null = null;
    runUntil(battle, 1000, (events) => {
      const view = battle.view();
      const seals = view.enemies[0]?.statuses.find((status) => status.statusId === 'SEAL')?.stacks ?? 0;
      const cast = events.find((event) => event.type === 'skillCast' && event.skillId === 'SK045');
      if (cast) {
        castAt = cast.atMs;
        sealAt.castTick = seals;
      }
      if (castAt !== null && battle.currentTimeMs === castAt + HIT_DELAY_MS) sealAt.afterFirstHit = seals;
    });
    expect(sealAt.castTick).toBe(0);
    expect(sealAt.afterFirstHit).toBe(1);
  });
});

describe('審查回歸：多段技能不跨波', () => {
  it('旋風連斬（SK003）每一段都只打施放當波的敵人', () => {
    const battle = sim(hero('JOB02', ['SK003'], { passiveIds: [] }), stats({ attack: 2000, basicIntervalMs: NO_BASICS_MS }), WEAK_STAGE);
    let currentWave = -1;
    const waveOfUid = new Map<number, number>();
    const waveOfAction = new Map<number, number>();
    const events = runUntil(battle, 40_000, (tickEvents) => {
      for (const event of tickEvents) {
        if (event.type === 'waveSpawned') {
          currentWave += 1;
          for (const uid of event.uids) waveOfUid.set(uid, currentWave);
        }
        if (event.type === 'skillCast') waveOfAction.set(event.actionId, currentWave);
      }
    });
    const skillHits = hitsOf(events, (hit) => hit.skillId === 'SK003');
    expect(skillHits.length).toBeGreaterThan(0);
    for (const hit of skillHits) expect(waveOfUid.get(hit.targetUid)).toBe(waveOfAction.get(hit.actionId));
  });
});
