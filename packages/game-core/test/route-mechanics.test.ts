import { getStageAt, loadDefaultCatalog, passiveIdsForJob, type StageDef } from '@qiwu/content';
import { describe, expect, it } from 'vitest';
import { BattleSim, type BattleEvent, type BattleView, type CombatStatsSnapshot, type HeroLoadoutSnapshot } from '../src/index.ts';

/**
 * 第二輪新增的路線機制驗收：疊層、獨立毒層、角色資源、戰獸、花色、幻影／替身、死亡轉移、次數型增益。
 * 規則來源：設計資料 skills[].prototype_effect、passives[].prototype_rule（N 原型值從 catalog 讀取）。
 */

const catalog = loadDefaultCatalog();
const TICK_MS = catalog.globals.tickMs;
const HIT_DELAY_MS = catalog.tuning.battle.minHitDelayMs;
/** 第 12 圖第 29 關：高血量、高護甲，低攻擊時長時間不會擊殺，適合觀察疊層。 */
const TANKY_STAGE = getStageAt(catalog, 12, 29);
/** 第 1 圖第 1 關：低血量，高攻擊時一擊必殺，適合觀察死亡規則。 */
const WEAK_STAGE = getStageAt(catalog, 1, 1);

type HitEvent = Extract<BattleEvent, { type: 'hit' }>;

function stats(overrides: Partial<CombatStatsSnapshot> = {}): CombatStatsSnapshot {
  return {
    attack: 10,
    basicIntervalMs: 1000,
    critRateBp: 0,
    critMultBp: 15000,
    cdrBp: 0,
    bonusBp: { BASIC_DMG: 0, SKILL_DMG: 0, DOT_DMG: 0, SUMMON_DMG: 0, FOLLOWUP_DMG: 0, MARK_DMG: 0, SHATTER_DMG: 0, EXECUTE_DMG: 0 },
    ...overrides,
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

function sim(h: HeroLoadoutSnapshot, s: CombatStatsSnapshot = stats(), stage: StageDef = TANKY_STAGE): BattleSim {
  return new BattleSim({ catalog, seed: 4242, stats: s, hero: h, encounter: { kind: 'loop', stage } });
}

function runUntil(battle: BattleSim, untilMs: number, onTick?: (events: readonly BattleEvent[], view: BattleView) => void): BattleEvent[] {
  const all: BattleEvent[] = [];
  while (battle.currentTimeMs < untilMs) {
    const events = battle.tick();
    all.push(...events);
    onTick?.(events, battle.view());
  }
  return all;
}

function stacksOn(view: BattleView, statusId: string, uid?: number): number {
  const enemy = uid === undefined ? view.enemies[0] : view.enemies.find((candidate) => candidate.uid === uid);
  return enemy?.statuses.find((status) => status.statusId === statusId)?.stacks ?? 0;
}

describe('疊層：破陣、寒霜、聖印', () => {
  it('破陣最多 3 層（盾刃突擊每次 +1 並刷新 8 秒）', () => {
    const battle = sim(hero('JOB04', ['SK007']));
    let maxBreach = 0;
    runUntil(battle, 40_000, (_events, view) => (maxBreach = Math.max(maxBreach, stacksOn(view, 'BREACH'))));
    expect(maxBreach).toBe(3);
  });

  it('震地盾擊只消耗主目標的破陣，加傷只加在主目標那一下', () => {
    const battle = sim(hero('JOB04', ['SK007', 'SK008']));
    let consumedSeen = false;
    const events = runUntil(battle, 40_000, (tickEvents, view) => {
      if (tickEvents.some((event) => event.type === 'skillCast' && event.skillId === 'SK008') && stacksOn(view, 'BREACH') === 0) consumedSeen = true;
    });
    expect(consumedSeen).toBe(true);
    const cast = events.find((event) => event.type === 'skillCast' && event.skillId === 'SK008')!;
    const quake = events.filter((event): event is HitEvent => event.type === 'hit' && event.skillId === 'SK008' && event.atMs === cast.atMs + HIT_DELAY_MS);
    expect(quake.length).toBe(3);
    const [main, ...others] = quake;
    expect(main!.amount).toBeGreaterThan(others[0]!.amount);
    expect(others[0]!.amount).toBe(others[1]!.amount);
  });

  it('冰錐只有冰咒師分支（寒霜累積）才加寒霜', () => {
    const mage = sim(hero('JOB11', ['SK022']));
    const iceMage = sim(hero('JOB14', ['SK022']));
    let mageFrost = 0;
    let iceFrost = 0;
    runUntil(mage, 3000, (_events, view) => (mageFrost = Math.max(mageFrost, stacksOn(view, 'FROST'))));
    runUntil(iceMage, 3000, (_events, view) => (iceFrost = Math.max(iceFrost, stacksOn(view, 'FROST'))));
    expect(mageFrost).toBe(0);
    expect(iceFrost).toBe(1);
  });

  it('霜痕：碎冰消耗後保留 1 層寒霜', () => {
    const battle = sim(hero('JOB15', ['SK027', 'SK022', 'SK028']));
    let afterShatter: number | null = null;
    runUntil(battle, 60_000, (events, view) => {
      if (afterShatter !== null) return;
      const shatter = events.find((event) => event.type === 'skillCast' && event.skillId === 'SK028');
      if (shatter) afterShatter = stacksOn(view, 'FROST');
    });
    expect(afterShatter).toBe(1);
  });

  it('寒晶綻放：主目標 +2 層、其他目標 +1 層', () => {
    const battle = sim(hero('JOB15', ['SK029']));
    runUntil(battle, 1000);
    const view = battle.view();
    const [main, ...others] = view.enemies;
    expect(stacksOn(view, 'FROST', main!.uid)).toBe(2);
    for (const other of others) expect(stacksOn(view, 'FROST', other.uid)).toBe(1);
  });
});

describe('獨立毒層與毒爆', () => {
  it('同一目標最多 5 層；毒爆最多消耗 4 層、保留 1 層，剩餘傷害以持續傷害來源立即結算', () => {
    const battle = sim(hero('JOB20', ['SK037', 'SK038', 'SK039'], { ultimateId: 'SK040' }), stats({ basicIntervalMs: 500 }));
    let maxPoison = 0;
    let afterBurst: number | null = null;
    let burstCastAt: number | null = null;
    const events = runUntil(battle, 60_000, (tickEvents, view) => {
      maxPoison = Math.max(maxPoison, stacksOn(view, 'POISON'));
      const cast = tickEvents.find((event) => event.type === 'skillCast' && event.skillId === 'SK040');
      if (cast && afterBurst === null) {
        afterBurst = stacksOn(view, 'POISON');
        burstCastAt = cast.atMs;
      }
    });
    expect(maxPoison).toBe(5);
    expect(afterBurst).toBe(1);
    const burst = events.filter((event): event is HitEvent => event.type === 'hit' && event.skillId === 'SK040' && event.atMs === burstCastAt! + HIT_DELAY_MS);
    expect(burst.map((hit) => hit.source).sort()).toEqual(['dot', 'ultimate']);
  });

  it('淬毒期間每次本體普攻加 1 層毒', () => {
    const battle = sim(hero('JOB19', ['SK037']));
    runUntil(battle, 3100);
    // 普攻在 50、1050、2050、3050ms 出手並於命中時加層；淬毒在第一刻施放。
    expect(stacksOn(battle.view(), 'POISON')).toBe(3);
  });
});

describe('角色資源', () => {
  it('專注：同目標普攻累積到 3；主目標被擊殺時只保留 1 層', () => {
    const tanky = sim(hero('JOB07', []));
    runUntil(tanky, 6000);
    expect(tanky.view().hero.resources.FOCUS).toBe(3);

    const oneShot = sim(hero('JOB07', []), stats({ attack: 100_000 }), WEAK_STAGE);
    let afterKill = 0;
    runUntil(oneShot, 20_000, (events, view) => {
      if (events.some((event) => event.type === 'enemyDefeated')) afterKill = Math.max(afterKill, view.hero.resources.FOCUS ?? 0);
    });
    expect(afterKill).toBe(1);
  });

  it('連擊點：影襲 3 段只算 1 次行動，另加 1 點，共 +2', () => {
    const battle = sim(hero('JOB17', ['SK033']), stats({ basicIntervalMs: 600_000 }));
    const deltas: number[] = [];
    let before = 0;
    runUntil(battle, 20_000, (events, view) => {
      const now = view.hero.resources.COMBO ?? 0;
      if (events.some((event) => event.type === 'skillCast') && !events.some((event) => event.type === 'basicAttack')) deltas.push(now - before);
      before = now;
    });
    expect(deltas[0]).toBe(2);
  });

  it('氣脈：每 2 次普攻 +1 層', () => {
    const battle = sim(hero('JOB24', []));
    runUntil(battle, 3100);
    expect(battle.view().hero.resources.QI).toBe(2);
  });

  it('熱度：熔火重擊消耗熱度，且這次施放不反向加熱', () => {
    const battle = sim(hero('JOB32', ['SK063']), stats({ basicIntervalMs: 500 }));
    let afterCast: number | null = null;
    runUntil(battle, 30_000, (events, view) => {
      if (afterCast === null && events.some((event) => event.type === 'skillCast' && event.skillId === 'SK063')) afterCast = view.hero.resources.HEAT ?? 0;
    });
    // 同刻的普攻可能在施放前加 1 層後再被消耗；施放後剩下的只會來自同刻普攻之後，不會因技能本身加熱。
    expect(afterCast).toBe(0);
  });
});

describe('戰獸（獵伴）', () => {
  it('開戰即有 1 隻常駐戰獸，每 1.5 秒一次召喚傷害；換成沒有獵伴的職業就消失', () => {
    const battle = sim(hero('JOB09', []));
    runUntil(battle, TICK_MS);
    const beast = battle.view().hero.units.find((unit) => unit.kind === 'beast');
    expect(beast?.permanent).toBe(true);
    const events = runUntil(battle, 4600);
    const summonTimes = events.filter((event): event is HitEvent => event.type === 'hit' && event.source === 'summon').map((hit) => hit.atMs);
    expect(summonTimes).toEqual([1500, 3000, 4500]);
    battle.updateHero(hero('JOB06', []));
    expect(battle.view().hero.units).toEqual([]);
  });

  it('掠食標記只讓戰獸對該目標的傷害提高', () => {
    const maxSummon = (skillIds: string[]) => {
      const battle = sim(hero('JOB09', skillIds), stats({ attack: 1000 }));
      const events = runUntil(battle, 8000);
      return Math.max(...events.filter((event): event is HitEvent => event.type === 'hit' && event.source === 'summon').map((hit) => hit.amount));
    };
    expect(maxSummon(['SK017'])).toBeGreaterThan(maxSummon([]));
  });
});

describe('花色輪轉', () => {
  const suitsOf = (events: readonly BattleEvent[]) =>
    events.filter((event): event is Extract<BattleEvent, { type: 'cardPlayed' }> => event.type === 'cardPlayed').map((event) => event.suit);

  it('飛牌依紅心→方塊→梅花→黑桃前進；沒有花色被動的小丑不出花色', () => {
    const dealer = sim(hero('JOB27', ['SK051']));
    expect(suitsOf(runUntil(dealer, 40_000)).slice(0, 5)).toEqual([0, 1, 2, 3, 0]);
    const clown = sim(hero('JOB26', ['SK051']));
    expect(suitsOf(runUntil(clown, 40_000))).toEqual([]);
  });

  it('切牌把下一張設為預定花色（黑桃），只改一次', () => {
    const dealer = sim(hero('JOB27', ['SK053', 'SK051']));
    const suits = suitsOf(runUntil(dealer, 5000));
    expect(suits[0]).toBe(3);
  });

  it('四象牌陣固定紅心→方塊→梅花→黑桃，方塊留下破甲', () => {
    const battle = sim(hero('JOB28', [], { ultimateId: 'SK056' }));
    let diamond = false;
    const events = runUntil(battle, 2000, (_events, view) => {
      if (view.enemies[0]?.statuses.some((status) => status.statusId === 'DIAMOND_BREAK')) diamond = true;
    });
    expect(suitsOf(events)).toEqual([0, 1, 2, 3]);
    expect(diamond).toBe(true);
  });
});

describe('連環牌擊「單目標可集中」', () => {
  const cardHits = (events: readonly BattleEvent[]) =>
    events.filter((event): event is Extract<BattleEvent, { type: 'hit' }> => event.type === 'hit' && event.skillId === 'SK054');

  it('刷怪：3 張牌依序輪替打到不同敵人', () => {
    const events = runUntil(sim(hero('JOB27', ['SK054'], { passiveIds: [] }), stats({ basicIntervalMs: 600_000 })), 3_000);
    expect(new Set(cardHits(events).map((hit) => hit.targetUid)).size).toBeGreaterThan(1);
  });

  it('BOSS 戰：副目標零產出，牌全部集中主目標（BOSS）', () => {
    const stage = getStageAt(catalog, 9, 30);
    const battle = new BattleSim({
      catalog,
      seed: 4242,
      stats: stats({ basicIntervalMs: 600_000 }),
      hero: hero('JOB27', ['SK054'], { passiveIds: [] }),
      encounter: { kind: 'boss', stage, durationMs: catalog.globals.bossDurationMs },
    });
    let bossUid: number | null = null;
    let adds = 0;
    const events = runUntil(battle, 20_000, (_events, view) => {
      bossUid ??= view.enemies.find((enemy) => enemy.kind === 'boss')?.uid ?? null;
      adds = Math.max(adds, view.enemies.filter((enemy) => enemy.kind !== 'boss').length);
    });
    expect(adds, '這場 BOSS 要有副目標，測試才有意義').toBeGreaterThan(0);
    const hits = cardHits(events);
    expect(hits.length).toBeGreaterThanOrEqual(3);
    for (const hit of hits) expect(hit.targetUid).toBe(bossUid);
  });
});

describe('幻影與替身（幻影舞臺）', () => {
  it('合計最多 2 個；超額時先提前結算最舊者，替身到期爆炸打最多 3 名', () => {
    const battle = sim(hero('JOB29', ['SK057', 'SK058']), stats({ basicIntervalMs: 600_000 }));
    let maxUnits = 0;
    const events = runUntil(battle, 40_000, (_events, view) => (maxUnits = Math.max(maxUnits, view.hero.units.length)));
    expect(maxUnits).toBeLessThanOrEqual(2);
    const removed = events.filter((event): event is Extract<BattleEvent, { type: 'unitRemoved' }> => event.type === 'unitRemoved');
    const decoyExpired = removed.find((event) => event.kind === 'decoy' && event.reason === 'expired');
    expect(decoyExpired).toBeDefined();
    const explosion = events.filter((event): event is HitEvent => event.type === 'hit' && event.source === 'summon' && event.atMs === decoyExpired!.atMs);
    expect(explosion.length).toBeGreaterThanOrEqual(3);
  });

  it('終幕禮炮消耗的單位直接移除、不再結算；謝幕返場隨後生成 1 個幻影', () => {
    const battle = sim(hero('JOB30', ['SK057', 'SK058'], { ultimateId: 'SK060' }), stats({ basicIntervalMs: 600_000 }));
    const events = runUntil(battle, 40_000);
    const finale = events.find((event) => event.type === 'skillCast' && event.skillId === 'SK060');
    expect(finale).toBeDefined();
    const atFinale = events.filter((event) => event.atMs === finale!.atMs);
    const consumed = atFinale.filter((event) => event.type === 'unitRemoved' && event.reason === 'consumed');
    expect(consumed.length).toBe(2);
    expect(atFinale.some((event) => event.type === 'unitSpawned' && event.kind === 'phantom')).toBe(true);
    const resolveHits = atFinale.filter((event) => event.type === 'hit' && event.source === 'summon');
    expect(resolveHits).toEqual([]);
  });
});

describe('次數型增益與死亡轉移', () => {
  it('符文刻印：之後 3 次本體直接攻擊各追加一次，用完即消失', () => {
    // 只掛符文騎士自己的技能，不帶劍士節奏（每 4 次普攻追加）避免混入其他追加。
    const battle = sim(hero('JOB05', ['SK009'], { passiveIds: [] }));
    const events = runUntil(battle, 7000);
    const followUps = events.filter((event): event is HitEvent => event.type === 'hit' && event.source === 'followUp');
    expect(followUps.length).toBe(3);
    expect(battle.view().hero.buffs.find((buff) => buff.buffId === 'RUNE')).toBeUndefined();
  });

  it('餘燼傳承：帶火印的目標死亡後，火印轉移到下一名敵人', () => {
    // 攻擊 20：火球命中後目標仍存活並帶火印，下一次普攻才擊殺（擊殺那一下若是火球，火印不會掛上）。
    const battle = sim(hero('JOB13', ['SK021']), stats({ attack: 20 }), getStageAt(catalog, 1, 3));
    let transferred = false;
    let previous: BattleView | null = null;
    runUntil(battle, 30_000, (events, view) => {
      for (const event of events) {
        if (event.type !== 'enemyDefeated' || !previous) continue;
        const dead = previous.enemies.find((enemy) => enemy.uid === event.uid);
        if (!dead?.statuses.some((status) => status.statusId === 'FIRE_MARK')) continue;
        if (view.enemies[0]?.statuses.some((status) => status.statusId === 'FIRE_MARK')) transferred = true;
      }
      previous = view;
    });
    expect(transferred).toBe(true);
  });

  it('弱點標記讓本體普攻對該目標 +20%', () => {
    const battle = sim(hero('JOB07', ['SK013']), stats({ attack: 1000 }));
    const events = runUntil(battle, 3000);
    const basics = events.filter((event): event is HitEvent => event.type === 'hit' && event.source === 'basic').map((hit) => hit.amount);
    // 第一下普攻與弱點標記同刻出手，標記在命中後才生效；第二下起吃到加成。
    expect(basics[1]! / basics[0]!).toBeCloseTo(1.2, 2);
  });

  it('超頻持續時間 +2 秒（零式動力核）', () => {
    const buffMs = (legends: string[]) => {
      const battle = sim(hero('JOB34', ['SK067', 'SK068'], { legendBaseIds: legends }));
      let longest = 0;
      runUntil(battle, 4000, (_events, view) => {
        for (const buff of view.hero.buffs) if (buff.buffId === 'OVERCLOCK') longest = Math.max(longest, buff.remainingMs);
      });
      return longest;
    };
    expect(buffMs(['EQ070']) - buffMs([])).toBe(2000);
  });

});
