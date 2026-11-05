import {
  STAT_KEYS,
  getStageAt,
  loadDefaultCatalog,
  type DamageStep,
  type EffectStep,
  type ProcDef,
  type SpawnUnitStep,
  type StageDef,
} from '@qiwu/content';
import { describe, expect, it } from 'vitest';
import {
  BattleSim,
  GameEngine,
  createInitialState,
  monsterArmor,
  type BattleEvent,
  type BattleView,
  type CombatStatsSnapshot,
  type CommandResponse,
  type DamageBonusKey,
  type Encounter,
  type EngineEvent,
  type GameState,
  type HeroLoadoutSnapshot,
} from '../src/index.ts';

/**
 * 戰鬥機制驗收（規格 02「戰鬥計算／觸發限制」、10 章 T-17～T-22）。
 * 所有倍率、冷卻、上限皆從 catalog 讀取（N 原型值），不在測試內寫死。
 * BattleSim 的屬性／配置快照是「開戰前提」，被測行為一律透過 tick()／engine.advance()／engine.execute() 產生。
 */

const catalog = loadDefaultCatalog();
const { tuning } = catalog;
const TICK_MS = catalog.globals.tickMs;
const ARMOR_K = tuning.armor.factorConstant;
const HIT_DELAY_MS = tuning.battle.minHitDelayMs;

type HitEvent = Extract<BattleEvent, { type: 'hit' }>;
type UnitRemovedEvent = Extract<BattleEvent, { type: 'unitRemoved' }>;

// ───────────── 內容查詢 ─────────────

function skillSteps(skillId: string): readonly EffectStep[] {
  const effect = catalog.skills.get(skillId)?.effect;
  if (!effect) throw new Error(`技能 ${skillId} 沒有效果定義`);
  return effect.steps;
}

function damageStep(skillId: string): DamageStep {
  const step = skillSteps(skillId).find((candidate): candidate is DamageStep => candidate.type === 'damage');
  if (!step) throw new Error(`技能 ${skillId} 沒有傷害步驟`);
  return step;
}

function spawnStep(skillId: string): SpawnUnitStep {
  const step = skillSteps(skillId).find((candidate): candidate is SpawnUnitStep => candidate.type === 'spawnUnit');
  if (!step) throw new Error(`技能 ${skillId} 沒有召喚步驟`);
  return step;
}

function armorBreakPct(skillId: string): { statusId: string; pctBp: number } {
  for (const step of skillSteps(skillId)) {
    if (step.type === 'applyStatus' && step.status.kind === 'armorBreak') return { statusId: step.status.statusId, pctBp: step.status.pctBp };
  }
  throw new Error(`技能 ${skillId} 沒有破甲`);
}

function passiveProc(passiveId: string): ProcDef {
  const proc = catalog.passives.get(passiveId)?.effect?.procs[0];
  if (!proc) throw new Error(`被動 ${passiveId} 沒有觸發定義`);
  return proc;
}

function legendProc(baseId: string): ProcDef {
  const proc = catalog.equipment.get(baseId)?.legend?.procs[0];
  if (!proc) throw new Error(`裝備 ${baseId} 沒有傳說特效`);
  return proc;
}

function everyOf(proc: ProcDef): number {
  if (proc.trigger.kind !== 'basicAttackCount') throw new Error(`${proc.procId} 不是普攻計數觸發`);
  return proc.trigger.every;
}

function extraHitCoef(proc: ProcDef): number {
  if (proc.payload.kind !== 'extraHit') throw new Error(`${proc.procId} 不是追加命中`);
  return proc.payload.coefBp;
}

function cooldownAfterCdr(skillId: string, cdrBp: number): number {
  const skill = catalog.skills.get(skillId);
  if (!skill) throw new Error(`未知技能 ${skillId}`);
  return Math.round((skill.cooldownMs * (10000 - cdrBp)) / 10000);
}

// ───────────── 快照與模擬 ─────────────

const ZERO_BONUS: Record<DamageBonusKey, number> = {
  BASIC_DMG: 0,
  SKILL_DMG: 0,
  DOT_DMG: 0,
  SUMMON_DMG: 0,
  FOLLOWUP_DMG: 0,
  MARK_DMG: 0,
  SHATTER_DMG: 0,
  EXECUTE_DMG: 0,
};

type StatsInput = Partial<Omit<CombatStatsSnapshot, 'bonusBp'>> & { bonusBp?: Partial<Record<DamageBonusKey, number>> };

function makeStats(input: StatsInput = {}): CombatStatsSnapshot {
  const { bonusBp, ...rest } = input;
  return {
    attack: 10,
    basicIntervalMs: tuning.hero.basicAttackIntervalMs,
    critRateBp: 0,
    critMultBp: tuning.hero.baseCritMultBp,
    cdrBp: 0,
    ...rest,
    bonusBp: { ...ZERO_BONUS, ...bonusBp },
  };
}

function makeHero(input: Partial<HeroLoadoutSnapshot> = {}): HeroLoadoutSnapshot {
  return {
    jobId: 'NOVICE',
    skillIds: [],
    ultimateId: null,
    conditions: {},
    targetPolicy: 'default',
    passiveIds: [],
    legendBaseIds: [],
    ...input,
  };
}

/** 第 12 圖第 29 關：高血量、高護甲普通怪；以刷怪循環固定在此關，方便長時間觀察而不擊殺。 */
const TANKY_MAP = 12;
const TANKY_LOCAL = 29;
const TANKY_STAGE = getStageAt(catalog, TANKY_MAP, TANKY_LOCAL);
const TANKY_ARMOR = monsterArmor(catalog, TANKY_MAP, TANKY_LOCAL);

function eliteStageWith(kind: NonNullable<StageDef['eliteTemplate']>['kind'], mapNumber = TANKY_MAP): StageDef {
  const map = catalog.maps.get(mapNumber)!;
  for (const id of map.stageIds) {
    const stage = catalog.stages.get(id)!;
    if (stage.type === 'elite' && stage.eliteTemplate?.kind === kind) return stage;
  }
  throw new Error(`第 ${mapNumber} 圖沒有 ${kind} 小首領`);
}

type ReactiveCoreTemplate = Extract<NonNullable<StageDef['eliteTemplate']>, { kind: 'reactiveCore' }>;

function reactiveTemplateOf(stage: StageDef): ReactiveCoreTemplate {
  const template = stage.eliteTemplate;
  if (template?.kind !== 'reactiveCore') throw new Error(`${stage.id} 不是反應核心小首領`);
  return template;
}

function loopAt(stage: StageDef = TANKY_STAGE): Encounter {
  return { kind: 'loop', stage };
}

/** 小首領只在 kind=stage 生成（單一目標、單波）；高血量確保觀察期間不會過關。 */
function eliteEncounter(stage: StageDef): Encounter {
  return { kind: 'stage', stage };
}

function createSim(options: { stats: CombatStatsSnapshot; hero: HeroLoadoutSnapshot; encounter?: Encounter; seed?: number }): BattleSim {
  return new BattleSim({
    catalog,
    seed: options.seed ?? 20261105,
    stats: options.stats,
    hero: options.hero,
    encounter: options.encounter ?? loopAt(),
  });
}

/** 逐刻推進到 untilMs（含），回傳全部事件；onTick 可在每刻後檢查畫面快照。 */
function runSim(sim: BattleSim, untilMs: number, onTick?: (nowMs: number, events: readonly BattleEvent[], view: BattleView) => void): BattleEvent[] {
  const collected: BattleEvent[] = [];
  while (sim.currentTimeMs < untilMs) {
    const events = sim.tick();
    collected.push(...events);
    onTick?.(sim.currentTimeMs, events, sim.view());
  }
  return collected;
}

function hitsOf(events: readonly BattleEvent[], predicate: (hit: HitEvent) => boolean = () => true): HitEvent[] {
  return events.filter((event): event is HitEvent => event.type === 'hit' && predicate(event));
}

function castsOf(events: readonly BattleEvent[], skillId: string): Extract<BattleEvent, { type: 'skillCast' }>[] {
  return events.filter((event): event is Extract<BattleEvent, { type: 'skillCast' }> => event.type === 'skillCast' && event.skillId === skillId);
}

function basicsOf(events: readonly BattleEvent[]): Extract<BattleEvent, { type: 'basicAttack' }>[] {
  return events.filter((event): event is Extract<BattleEvent, { type: 'basicAttack' }> => event.type === 'basicAttack');
}

/** 規格 02：D = floor[A × 係數 × (1+對應加成) × 暴擊倍率 × K/(K+max(0,護甲)) × (1+受傷增益)]，最後至少 1。 */
function expectedDamage(input: { attack: number; coefBp: number; armor: number; bonusBp?: number; critMultBp?: number; takenBp?: number }): number {
  const armorFactor = ARMOR_K / (ARMOR_K + Math.max(0, input.armor));
  const raw =
    input.attack *
    (input.coefBp / 10000) *
    (1 + (input.bonusBp ?? 0) / 10000) *
    ((input.critMultBp ?? 10000) / 10000) *
    armorFactor *
    (1 + (input.takenBp ?? 0) / 10000);
  return Math.max(1, Math.floor(raw + 1e-9));
}

function fightingSpirit(view: BattleView): number {
  return view.hero.resources.FIGHTING_SPIRIT ?? 0;
}

function turretCount(view: BattleView): number {
  return view.hero.units.filter((unit) => unit.kind === 'turret').length;
}

// ───────────── 引擎 ─────────────

let opSerial = 0;
function nextOpId(prefix = 'op-battle'): string {
  opSerial += 1;
  return `${prefix}-${String(opSerial).padStart(6, '0')}`;
}

function expectSucceeded(res: CommandResponse): unknown {
  if (res.status !== 'succeeded') throw new Error(`預期成功，實際被拒：${res.error.code} ${res.error.message}`);
  return res.result;
}

/** Lv30 劍士（已一轉）的存檔前提；其餘為新存檔初值。 */
function swordsmanFixture(seed: number, extra?: (state: GameState) => void): GameState {
  const state = createInitialState(catalog, seed);
  state.player.level = 30;
  state.player.unlockedJobIds = ['JOB01'];
  state.player.currentJobId = 'JOB01';
  state.identifySettings.targetJobId = 'JOB01';
  extra?.(state);
  return state;
}

// ═════════════════════════════════════════════════════════════════════

describe('T-17 多段攻擊：資源按 action_id 計算', () => {
  it('T-17 旋風連斬 SK003 的 4 段命中共用一個 action_id，戰意只因「一次施放」加 1 層，不按段數加', () => {
    const step = damageStep('SK003');
    const segments = step.hits ?? 1;
    const interval = step.hitIntervalMs ?? 0;
    expect(segments).toBeGreaterThan(1);
    const sim = createSim({
      stats: makeStats({ attack: 10 }),
      hero: makeHero({ jobId: 'JOB02', skillIds: ['SK003'], passiveIds: ['PS001', 'PS002'] }),
    });

    // 第 1 刻：生成第一波 → 普攻（+1）→ 施放旋風連斬（+1）。
    const first = sim.tick();
    const cast = castsOf(first, 'SK003')[0];
    expect(cast).toBeDefined();
    expect(basicsOf(first)).toHaveLength(1);
    expect(fightingSpirit(sim.view())).toBe(2);

    // 4 段命中全部落地期間，下一次普攻之前戰意保持 2。
    const lastSegmentAt = cast!.atMs + HIT_DELAY_MS + (segments - 1) * interval;
    const nextBasicAt = TICK_MS + tuning.hero.basicAttackIntervalMs;
    expect(lastSegmentAt).toBeLessThan(nextBasicAt);
    const during = runSim(sim, nextBasicAt - TICK_MS, (_now, _events, view) => {
      expect(fightingSpirit(view)).toBe(2);
    });
    const skillHits = hitsOf(during, (hit) => hit.skillId === 'SK003');
    const targetsPerSegment = Math.min(tuning.battle.monstersPerWave, step.targets.kind === 'upTo' ? step.targets.count : 1);
    expect(skillHits).toHaveLength(segments * targetsPerSegment);
    expect(new Set(skillHits.map((hit) => hit.actionId))).toEqual(new Set([cast!.actionId]));
    expect(new Set(skillHits.map((hit) => hit.atMs)).size).toBe(segments);

    // 下一次普攻才再 +1。
    runSim(sim, nextBasicAt);
    expect(fightingSpirit(sim.view())).toBe(3);
  });

  it('T-17 長時間多段施放下戰意不超過 PS002 上限', () => {
    const max = catalog.passives.get('PS002')!.effect!.resource!.max;
    const sim = createSim({
      stats: makeStats({ attack: 10, basicIntervalMs: 500 }),
      hero: makeHero({ jobId: 'JOB02', skillIds: ['SK003', 'SK001'], passiveIds: ['PS001', 'PS002'] }),
    });
    let peak = 0;
    runSim(sim, 30_000, (_now, _events, view) => {
      peak = Math.max(peak, fightingSpirit(view));
      expect(fightingSpirit(view)).toBeLessThanOrEqual(max);
    });
    expect(peak).toBe(max);
  });
});

describe('PS003 餘勢：保留層不計入消耗加傷', () => {
  function runUntilCast(sim: BattleSim, skillId: string, limitMs: number): { castTick: BattleEvent[]; spiritBefore: number; spiritAfter: number } {
    let spiritBefore = fightingSpirit(sim.view());
    while (sim.currentTimeMs < limitMs) {
      const before = fightingSpirit(sim.view());
      const events = sim.tick();
      if (castsOf(events, skillId).length > 0) {
        spiritBefore = before;
        return { castTick: events, spiritBefore, spiritAfter: fightingSpirit(sim.view()) };
      }
    }
    throw new Error(`${limitMs}ms 內沒有施放 ${skillId}`);
  }

  function nextSkillHit(sim: BattleSim, skillId: string): HitEvent {
    for (let guard = 0; guard < 20; guard += 1) {
      const hit = hitsOf(sim.tick(), (candidate) => candidate.skillId === skillId)[0];
      if (hit) return hit;
    }
    throw new Error(`${skillId} 沒有命中`);
  }

  it('PS003 斷鋼重斬 SK004 在 5 層戰意時只消耗 4 層並保留 1 層；加傷只算消耗的 4 層', () => {
    const step = damageStep('SK004');
    const consume = step.consume!;
    const modifier = catalog.passives.get('PS003')!.effect!.consumeModifier!;
    const resourceMax = catalog.passives.get('PS002')!.effect!.resource!.max;
    const attack = 100;
    const sim = createSim({
      stats: makeStats({ attack, basicIntervalMs: 500 }),
      hero: makeHero({ jobId: 'JOB03', skillIds: ['SK004'], passiveIds: ['PS001', 'PS002', 'PS003'] }),
    });

    for (const round of [1, 2]) {
      const { castTick, spiritBefore, spiritAfter } = runUntilCast(sim, 'SK004', round * 30_000);
      // 同刻先普攻補到第 5 層，再施放。
      const spiritAtCast = Math.min(resourceMax, spiritBefore + basicsOf(castTick).length);
      expect(spiritAtCast).toBe(resourceMax);
      const consumed = spiritAtCast - modifier.reduceConsumedBy;
      expect(consumed).toBe(4);
      expect(spiritAfter).toBe(spiritAtCast - consumed);
      expect(spiritAfter).toBe(modifier.retain);

      const hit = nextSkillHit(sim, 'SK004');
      const withConsumed = expectedDamage({ attack, coefBp: step.coefBp + consumed * consume.perUnitCoefBp, armor: TANKY_ARMOR });
      const ifRetainedCounted = expectedDamage({ attack, coefBp: step.coefBp + spiritAtCast * consume.perUnitCoefBp, armor: TANKY_ARMOR });
      expect(withConsumed).not.toBe(ifRetainedCounted);
      expect(hit.amount).toBe(withConsumed);
      expect(hit.crit).toBe(false);
    }
  });

  it('PS003 對照：沒有餘勢時斷鋼重斬一次消耗全部 5 層，加傷計 5 層', () => {
    const step = damageStep('SK004');
    const consume = step.consume!;
    const attack = 100;
    const sim = createSim({
      stats: makeStats({ attack, basicIntervalMs: 500 }),
      hero: makeHero({ jobId: 'JOB02', skillIds: ['SK004'], passiveIds: ['PS001', 'PS002'] }),
    });
    const { spiritAfter } = runUntilCast(sim, 'SK004', 30_000);
    expect(spiritAfter).toBe(0);
    const hit = nextSkillHit(sim, 'SK004');
    expect(hit.amount).toBe(expectedDamage({ attack, coefBp: step.coefBp + consume.max * consume.perUnitCoefBp, armor: TANKY_ARMOR }));
  });
});

describe('T-19 召喚物上限與替換', () => {
  /** 依事件追蹤召喚物生命週期：每個 uid 只能生成一次、移除一次。 */
  function trackUnits(events: readonly BattleEvent[]): { spawned: Map<number, number>; removed: Map<number, UnitRemovedEvent[]> } {
    const spawned = new Map<number, number>();
    const removed = new Map<number, UnitRemovedEvent[]>();
    for (const event of events) {
      if (event.type === 'unitSpawned') {
        expect(spawned.has(event.uid)).toBe(false);
        spawned.set(event.uid, event.atMs);
      }
      if (event.type === 'unitRemoved') removed.set(event.uid, [...(removed.get(event.uid) ?? []), event]);
    }
    return { spawned, removed };
  }

  it('T-19 砲台上限 2：第三次架設替換最舊砲台（reason=replaced），替換不爆炸、不結算獎勵，每座只結算一次', () => {
    const turret = spawnStep('SK067');
    expect(turret.cap).toBe(2);
    // 冷卻縮減上限 40%：冷卻 < 砲台存活時間的一半，第三座出現時最舊砲台仍在場。
    const cdrBp = tuning.hero.cdrCapBp;
    const cooldown = cooldownAfterCdr('SK067', cdrBp);
    expect(cooldown * turret.cap).toBeLessThan(turret.durationMs);

    const sim = createSim({
      stats: makeStats({ attack: 1, cdrBp }),
      hero: makeHero({ jobId: 'JOB34', skillIds: ['SK067'], passiveIds: ['PS031', 'PS034'] }),
    });
    const spawnOrder: number[] = [];
    let replacementTick: readonly BattleEvent[] | null = null;
    let turretsBeforeReplacement = 0;
    let previousTurrets = 0;
    const all = runSim(sim, 40_000, (_now, events, view) => {
      for (const event of events) if (event.type === 'unitSpawned') spawnOrder.push(event.uid);
      if (!replacementTick && events.some((event) => event.type === 'unitRemoved')) {
        replacementTick = events;
        turretsBeforeReplacement = previousTurrets;
      }
      expect(turretCount(view)).toBeLessThanOrEqual(turret.cap);
      previousTurrets = turretCount(view);
    });

    expect(replacementTick).not.toBeNull();
    const tick = replacementTick! as readonly BattleEvent[];
    const removal = tick.find((event): event is UnitRemovedEvent => event.type === 'unitRemoved')!;
    expect(turretsBeforeReplacement).toBe(turret.cap);
    expect(removal).toMatchObject({ kind: 'turret', reason: 'replaced', uid: spawnOrder[0] });
    expect(castsOf(tick, 'SK067')).toHaveLength(1);
    expect(tick.filter((event) => event.type === 'unitSpawned')).toHaveLength(1);
    // 替換只發出移除事件：沒有擊殺／產出、沒有額外的召喚或機制傷害。
    expect(tick.some((event) => event.type === 'enemyDefeated')).toBe(false);
    expect(hitsOf(tick, (hit) => hit.source === 'summon' || hit.source === 'mechanic')).toHaveLength(0);

    const { spawned, removed } = trackUnits(all);
    expect(spawned.size).toBeGreaterThan(turret.cap + 1);
    for (const [uid, removals] of removed) {
      expect(spawned.has(uid)).toBe(true);
      expect(removals).toHaveLength(1);
    }
    // 存活數 = 生成 − 移除，且畫面與事件一致。
    expect(spawned.size - removed.size).toBe(turretCount(sim.view()));
    expect(all.some((event) => event.type === 'enemyDefeated')).toBe(false);
  });

  it('T-19 沒有冷卻縮減時舊砲台自然到期（reason=expired），到期與替換互斥、各 uid 只移除一次', () => {
    const turret = spawnStep('SK067');
    const sim = createSim({
      stats: makeStats({ attack: 1 }),
      hero: makeHero({ jobId: 'JOB34', skillIds: ['SK067'], passiveIds: ['PS031', 'PS034'] }),
    });
    const all = runSim(sim, 45_000, (_now, _events, view) => {
      expect(turretCount(view)).toBeLessThanOrEqual(turret.cap);
    });
    const { spawned, removed } = trackUnits(all);
    expect(removed.size).toBeGreaterThan(0);
    for (const [uid, removals] of removed) {
      expect(removals).toHaveLength(1);
      if (removals[0]!.reason === 'expired') expect(removals[0]!.atMs - spawned.get(uid)!).toBe(turret.durationMs);
    }
  });

  it('T-19 機甲上限 1：以超出冷卻縮減上限的合成快照強制重疊，新機甲替換舊機甲；砲台與機甲上限各自獨立', () => {
    const mech = spawnStep('SK070');
    const turret = spawnStep('SK067');
    expect(mech.cap).toBe(1);
    // 合法快照（CDR ≤ 40%）的絕招冷卻一定長於機甲存活時間；這裡刻意用 60% 讓兩架重疊以驗證上限。
    const syntheticCdr = 6000;
    expect(cooldownAfterCdr('SK070', tuning.hero.cdrCapBp)).toBeGreaterThan(mech.durationMs);
    expect(cooldownAfterCdr('SK070', syntheticCdr)).toBeLessThan(mech.durationMs);

    const sim = createSim({
      stats: makeStats({ attack: 1, cdrBp: syntheticCdr }),
      hero: makeHero({ jobId: 'JOB35', skillIds: ['SK067'], ultimateId: 'SK070', passiveIds: ['PS031', 'PS034', 'PS035'] }),
    });
    let peakMech = 0;
    let peakTurret = 0;
    const all = runSim(sim, 40_000, (_now, _events, view) => {
      const mechs = view.hero.units.filter((unit) => unit.kind === 'mech').length;
      peakMech = Math.max(peakMech, mechs);
      peakTurret = Math.max(peakTurret, turretCount(view));
      expect(mechs).toBeLessThanOrEqual(mech.cap);
      expect(turretCount(view)).toBeLessThanOrEqual(turret.cap);
    });
    expect(peakMech).toBe(mech.cap);
    expect(peakTurret).toBe(turret.cap);
    const mechReplacements = all.filter((event) => event.type === 'unitRemoved' && event.kind === 'mech' && event.reason === 'replaced');
    expect(mechReplacements.length).toBeGreaterThan(0);
    const { removed } = trackUnits(all);
    for (const removals of removed.values()) expect(removals).toHaveLength(1);
  });
});

describe('SK068 超頻指令：「至少 1 座砲台」是硬條件', () => {
  it('沒有任何砲台時，超頻指令即使等待超過 conditionFallbackMs 的 10 倍也從不施放', () => {
    const sim = createSim({
      stats: makeStats({ attack: 1 }),
      hero: makeHero({ jobId: 'JOB34', skillIds: ['SK068'], passiveIds: ['PS031', 'PS034'] }),
    });
    const events = runSim(sim, tuning.battle.conditionFallbackMs * 10);
    expect(castsOf(events, 'SK068')).toHaveLength(0);
    expect(sim.view().hero.buffs).toHaveLength(0);
    expect(sim.view().hero.skills.find((skill) => skill.skillId === 'SK068')!.remainingMs).toBe(0);
  });

  it('超頻指令只在場上至少 1 座砲台時施放；砲台全數消失後不再施放', () => {
    const turret = spawnStep('SK067');
    const sim = createSim({
      stats: makeStats({ attack: 1 }),
      hero: makeHero({ jobId: 'JOB34', skillIds: ['SK067', 'SK068'], passiveIds: ['PS031', 'PS034'] }),
    });
    const alive = new Set<number>();
    let overclockCasts = 0;
    let lastTurretGoneAt: number | null = null;
    const watch = (_now: number, events: readonly BattleEvent[]): void => {
      for (const event of events) {
        if (event.type === 'unitSpawned' && event.kind === 'turret') alive.add(event.uid);
        if (event.type === 'unitRemoved' && event.kind === 'turret') {
          alive.delete(event.uid);
          if (alive.size === 0) lastTurretGoneAt = event.atMs;
        }
        if (event.type === 'skillCast' && event.skillId === 'SK068') {
          expect(alive.size).toBeGreaterThanOrEqual(1);
          overclockCasts += 1;
        }
      }
    };
    runSim(sim, 30_000, watch);
    expect(overclockCasts).toBeGreaterThan(0);

    // 同職業移除架設砲台（玩家改配置）：既有砲台保留到自然到期，之後超頻不得再施放。
    sim.updateHero(makeHero({ jobId: 'JOB34', skillIds: ['SK068'], passiveIds: ['PS031', 'PS034'] }));
    const castsBefore = overclockCasts;
    runSim(sim, 30_000 + turret.durationMs + TICK_MS, watch);
    expect(alive.size).toBe(0);
    expect(lastTurretGoneAt).not.toBeNull();
    expect(turretCount(sim.view())).toBe(0);
    const castsWhileLastTurretsAlive = overclockCasts - castsBefore;
    const after = runSim(sim, sim.currentTimeMs + tuning.battle.conditionFallbackMs * 5, watch);
    expect(castsOf(after, 'SK068')).toHaveLength(0);
    expect(overclockCasts - castsBefore).toBe(castsWhileLastTurretsAlive);
    expect(sim.view().hero.skills.find((skill) => skill.skillId === 'SK068')!.remainingMs).toBe(0);
  });
});

describe('一般資源門檻：最多等待 conditionFallbackMs 後基礎施放', () => {
  it('斷鋼重斬 SK004（需 5 層戰意）戰意不足時，自首次等待起滿 conditionFallbackMs 才以現有層數施放', () => {
    const step = damageStep('SK004');
    const consume = step.consume!;
    const fallback = tuning.battle.conditionFallbackMs;
    const attack = 100;
    const sim = createSim({
      stats: makeStats({ attack }),
      hero: makeHero({ jobId: 'JOB02', skillIds: ['SK004'], passiveIds: ['PS001', 'PS002'] }),
    });
    const firstCheckAt = TICK_MS;
    let castAt: number | null = null;
    let spiritBeforeCast = 0;
    let basicsSeen = 0;
    while (castAt === null && sim.currentTimeMs < fallback * 3) {
      const before = fightingSpirit(sim.view());
      const events = sim.tick();
      basicsSeen += basicsOf(events).length;
      const cast = castsOf(events, 'SK004')[0];
      if (cast) {
        castAt = cast.atMs;
        spiritBeforeCast = before + basicsOf(events).length;
      } else {
        const slot = sim.view().hero.skills.find((skill) => skill.skillId === 'SK004')!;
        expect(slot.remainingMs).toBe(0);
        expect(slot.waitingForCondition).toBe(true);
      }
    }
    expect(castAt).toBe(firstCheckAt + fallback);
    expect(spiritBeforeCast).toBe(basicsSeen);
    expect(spiritBeforeCast).toBeLessThan(consume.max);
    expect(fightingSpirit(sim.view())).toBe(0);
    const hit = hitsOf(runSim(sim, sim.currentTimeMs + HIT_DELAY_MS), (candidate) => candidate.skillId === 'SK004')[0]!;
    expect(hit.amount).toBe(expectedDamage({ attack, coefBp: step.coefBp + spiritBeforeCast * consume.perUnitCoefBp, armor: TANKY_ARMOR }));
  });

  it('條件設為 immediate 時不等待資源門檻，第一刻即施放', () => {
    const sim = createSim({
      stats: makeStats({ attack: 10 }),
      hero: makeHero({ jobId: 'JOB02', skillIds: ['SK004'], conditions: { SK004: 'immediate' }, passiveIds: ['PS001', 'PS002'] }),
    });
    const first = sim.tick();
    expect(castsOf(first, 'SK004')).toHaveLength(1);
  });
});

describe('T-20 追加鏈只到第 1 層', () => {
  it('T-20 被動 PS001 與傳說 EQ077／EQ086 只由本體普攻計數觸發；追加命中不計普攻、不再觸發任何追加', () => {
    const ps001 = everyOf(passiveProc('PS001'));
    const eq077 = everyOf(legendProc('EQ077'));
    const eq086Proc = legendProc('EQ086');
    const eq086 = everyOf(eq086Proc);
    expect(eq086Proc.payload.kind === 'extraHit' && eq086Proc.payload.timing).toBe('nextBasic');
    const endMs = 60_000;
    const sim = createSim({
      stats: makeStats({ attack: 10, basicIntervalMs: 500 }),
      hero: makeHero({ jobId: 'JOB01', passiveIds: ['PS001'], legendBaseIds: ['EQ077', 'EQ086'] }),
    });
    const events = runSim(sim, endMs);
    const basics = basicsOf(events).filter((basic) => basic.atMs + HIT_DELAY_MS <= endMs);
    expect(basics.length).toBeGreaterThan(100);
    const indexByAction = new Map(basics.map((basic, index) => [basic.actionId, index + 1]));
    const followUps = hitsOf(events, (hit) => hit.source === 'followUp' && hit.atMs <= endMs);

    const perBasic = new Map<number, number>();
    for (const hit of followUps) {
      const index = indexByAction.get(hit.actionId);
      expect(index, `追加命中 action ${hit.actionId} 必須屬於某次本體普攻`).toBeDefined();
      perBasic.set(index!, (perBasic.get(index!) ?? 0) + 1);
    }
    let expectedTotal = 0;
    for (let index = 1; index <= basics.length; index += 1) {
      // 立即型：第 every 次普攻同 action；下一次普攻型：第 every 次存起，下一次普攻釋放。
      const expected = Number(index % ps001 === 0) + Number(index % eq077 === 0) + Number(index > 1 && (index - 1) % eq086 === 0);
      expect(perBasic.get(index) ?? 0, `第 ${index} 次普攻的追加數`).toBe(expected);
      expectedTotal += expected;
    }
    expect(followUps).toHaveLength(expectedTotal);
    // 普攻節奏不受追加影響：普攻次數 = 時間 / 間隔。
    expect(basicsOf(events)).toHaveLength(Math.floor((endMs - TICK_MS) / 500) + 1);
  });

  it('T-20 普攻／技能／暴擊類傳說混合時，每次本體行動的追加數不超過觸發來源數，且全部追加都歸屬本體行動', () => {
    const sources = ['PS001', 'EQ001', 'EQ071', 'EQ078', 'EQ087'];
    const sim = createSim({
      stats: makeStats({ attack: 10, basicIntervalMs: 500, critRateBp: 10000 }),
      hero: makeHero({ jobId: 'JOB01', skillIds: ['SK001', 'SK002'], passiveIds: ['PS001'], legendBaseIds: sources.slice(1) }),
    });
    const endMs = 60_000;
    const events = runSim(sim, endMs);
    const bodyActions = new Set<number>([
      ...basicsOf(events).map((basic) => basic.actionId),
      ...events.flatMap((event) => (event.type === 'skillCast' ? [event.actionId] : [])),
    ]);
    const followUps = hitsOf(events, (hit) => hit.source === 'followUp');
    expect(followUps.length).toBeGreaterThan(0);
    const perAction = new Map<number, number>();
    for (const hit of followUps) {
      expect(bodyActions.has(hit.actionId)).toBe(true);
      expect(hit.crit).toBe(false);
      perAction.set(hit.actionId, (perAction.get(hit.actionId) ?? 0) + 1);
    }
    for (const count of perAction.values()) expect(count).toBeLessThanOrEqual(sources.length);
  });
});

describe('T-21 戰鬥重播一致', () => {
  const swordSaintHero = makeHero({
    jobId: 'JOB03',
    skillIds: ['SK001', 'SK003', 'SK005'],
    ultimateId: 'SK006',
    passiveIds: ['PS001', 'PS002', 'PS003'],
    legendBaseIds: ['EQ001', 'EQ077', 'EQ078'],
  });
  const farmStats = makeStats({ attack: 40, critRateBp: 3000, critMultBp: 20000, bonusBp: { SKILL_DMG: 1500, FOLLOWUP_DMG: 1000 } });

  function farmRun(seed: number): { events: BattleEvent[]; view: BattleView } {
    const sim = createSim({ seed, stats: farmStats, hero: swordSaintHero, encounter: loopAt(getStageAt(catalog, 2, 4)) });
    const events = runSim(sim, 45_000);
    return { events, view: sim.view() };
  }

  it('T-21 相同版本、種子、快照與輸入：普通戰鬥事件序列、暴擊與總傷害完全相同', () => {
    const a = farmRun(777);
    const b = farmRun(777);
    expect(a.events.length).toBeGreaterThan(200);
    expect(JSON.stringify(b.events)).toBe(JSON.stringify(a.events));
    expect(b.view).toEqual(a.view);
    const total = (events: readonly BattleEvent[]): number => hitsOf(events).reduce((sum, hit) => sum + hit.amount, 0);
    expect(total(b.events)).toBe(total(a.events));
    expect(a.events.some((event) => event.type === 'enemyDefeated')).toBe(true);
    expect(hitsOf(a.events, (hit) => hit.crit).length).toBeGreaterThan(0);

    // 不同種子只改變暴擊抽取，證明亂數確實來自種子而非外部時鐘。
    const c = farmRun(778);
    const critPattern = (events: readonly BattleEvent[]): string => hitsOf(events).map((hit) => (hit.crit ? '1' : '0')).join('');
    expect(critPattern(c.events)).not.toBe(critPattern(a.events));
  });

  it('T-21 BOSS 重播：同一快照與種子從第 0 刻重跑得到相同勝負、時間與剩餘血量', () => {
    const stage = getStageAt(catalog, 4, catalog.maps.get(4)!.stageIds.length);
    const run = (): { events: BattleEvent[]; result: string | null; boss: BattleView['boss'] } => {
      const sim = createSim({
        seed: 4242,
        stats: makeStats({ attack: 220, critRateBp: 2500, critMultBp: 20000 }),
        hero: swordSaintHero,
        encounter: { kind: 'boss', stage, durationMs: catalog.globals.bossDurationMs },
      });
      const events = sim.runUntilTick(catalog.globals.bossDurationMs / TICK_MS);
      return { events, result: sim.bossResult, boss: sim.view().boss };
    };
    const first = run();
    const second = run();
    expect(first.result).not.toBeNull();
    expect(second.result).toBe(first.result);
    expect(second.boss).toEqual(first.boss);
    expect(JSON.stringify(second.events)).toBe(JSON.stringify(first.events));
    expect(first.events.filter((event) => event.type === 'bossResolved')).toHaveLength(1);
  });

  it('T-21 引擎層：同一存檔與同一命令序列，匯出狀態完全相同', () => {
    const run = (): GameState => {
      const engine = new GameEngine({ catalog, nowMs: 0, state: swordsmanFixture(31337) });
      let now = 0;
      for (let second = 1; second <= 90; second += 1) {
        now = second * 1000;
        engine.advance(now);
        engine.drainEvents();
        if (second % 30 === 0) {
          while (engine.getState().wallet.relics > 0) {
            expectSucceeded(engine.execute({ operationId: `op-replay-${second}-${engine.getState().totals.identified}`, command: { type: 'identify', payload: {} } }, now));
          }
        }
      }
      return engine.exportState();
    };
    const a = run();
    const b = run();
    expect(a.totals.identified).toBeGreaterThan(0);
    expect(b).toEqual(a);
  });
});

describe('T-22 畫面幀率與掉幀不影響結果', () => {
  const TOTAL_MS = 180_000;

  function schedule(stepMs: number): number[] {
    const times: number[] = [];
    for (let now = stepMs; now < TOTAL_MS; now += stepMs) times.push(now);
    times.push(TOTAL_MS);
    return times;
  }

  /**
   * 不規則掉幀：固定偽亂數步長。上限取 maxCatchUpMs − tickMs：引擎以「最後處理的邏輯刻」計算空白，
   * 未滿一刻的餘數會累加到下一幀，若單幀接近 maxCatchUpMs 會依設計丟棄超出容忍的時間。
   */
  function jankySchedule(): number[] {
    const times: number[] = [];
    let state = 12345;
    let now = 0;
    const maxStep = tuning.battle.maxCatchUpMs - TICK_MS;
    while (now < TOTAL_MS) {
      state = (Math.imul(state, 1103515245) + 12345) >>> 0;
      now = Math.min(TOTAL_MS, now + 1 + (state % maxStep));
      times.push(now);
    }
    return times;
  }

  function runEngine(times: readonly number[]) {
    const engine = new GameEngine({ catalog, nowMs: 0, state: swordsmanFixture(2026) });
    const events: EngineEvent[] = [];
    for (const now of times) {
      engine.advance(now);
      events.push(...engine.drainEvents());
    }
    const state = engine.getState();
    return {
      summary: {
        kills: state.totals.kills,
        relics: state.wallet.relics,
        relicProgress: state.wallet.relicProgress,
        relicsGranted: state.totals.relicsGranted,
        progress: { ...state.progress },
        gold: state.wallet.gold,
        xp: state.player.xp,
        battleTimeMs: engine.getBattleView()?.timeMs ?? -1,
      },
      eventsJson: JSON.stringify(events),
    };
  }

  it('T-22 以 16ms（60fps）／33ms（30fps）／1000ms／不規則掉幀推進相同總時間：擊殺、古物、關卡與事件序列一致', () => {
    const at60 = runEngine(schedule(16));
    const at30 = runEngine(schedule(33));
    const perSecond = runEngine(schedule(1000));
    const janky = runEngine(jankySchedule());

    expect(at60.summary.kills).toBeGreaterThan(0);
    expect(at60.summary.relicsGranted).toBeGreaterThan(0);
    expect(at60.summary.progress.localStage).toBeGreaterThan(1);
    // 推圖本身不給金幣、經驗（C）。
    expect(at60.summary.gold).toBe(0);
    expect(at60.summary.xp).toBe(0);

    for (const [label, other] of [['30fps', at30], ['1000ms', perSecond], ['janky', janky]] as const) {
      expect(other.summary, label).toEqual(at60.summary);
      expect(other.eventsJson === at60.eventsJson, label).toBe(true);
    }
  });
});

describe('傷害公式（規格 02「戰鬥計算」）', () => {
  it('普攻 = floor(A × 係數 × (1+普攻加成) × K/(K+護甲))；技能加成不被普攻雙吃', () => {
    const attack = 37;
    const basicBonus = 2500;
    const sim = createSim({ stats: makeStats({ attack, bonusBp: { BASIC_DMG: basicBonus, SKILL_DMG: 9000, FOLLOWUP_DMG: 9000 } }), hero: makeHero() });
    const basicHits = hitsOf(runSim(sim, 10_000), (hit) => hit.source === 'basic');
    expect(basicHits.length).toBeGreaterThan(5);
    const expected = expectedDamage({ attack, coefBp: tuning.hero.basicAttackCoefBp, bonusBp: basicBonus, armor: TANKY_ARMOR });
    expect(ARMOR_K).toBe(400);
    for (const hit of basicHits) {
      expect(hit.amount).toBe(expected);
      expect(hit.crit).toBe(false);
    }
  });

  it('傷害下限 1：攻擊極低、對高護甲時原始值 < 1 仍造成 1', () => {
    const attack = 1;
    const raw = attack * (ARMOR_K / (ARMOR_K + TANKY_ARMOR));
    expect(raw).toBeLessThan(1);
    const sim = createSim({ stats: makeStats({ attack }), hero: makeHero() });
    const basicHits = hitsOf(runSim(sim, 5_000), (hit) => hit.source === 'basic');
    expect(basicHits.length).toBeGreaterThan(0);
    for (const hit of basicHits) expect(hit.amount).toBe(1);
  });

  it('暴擊只對本體直接傷害：暴擊率 10000 時普攻與技能每段都暴擊並乘暴擊倍率', () => {
    const attack = 50;
    const critMultBp = 20000;
    const sim = createSim({
      stats: makeStats({ attack, critRateBp: 10000, critMultBp }),
      hero: makeHero({ jobId: 'JOB01', skillIds: ['SK001'] }),
    });
    const events = runSim(sim, 15_000);
    const basics = hitsOf(events, (hit) => hit.source === 'basic');
    const skills = hitsOf(events, (hit) => hit.source === 'skill');
    expect(basics.length).toBeGreaterThan(0);
    expect(skills.length).toBeGreaterThan(0);
    for (const hit of basics) {
      expect(hit.crit).toBe(true);
      expect(hit.amount).toBe(expectedDamage({ attack, coefBp: tuning.hero.basicAttackCoefBp, critMultBp, armor: TANKY_ARMOR }));
    }
    for (const hit of skills) {
      expect(hit.crit).toBe(true);
      expect(hit.amount).toBe(expectedDamage({ attack, coefBp: damageStep('SK001').coefBp, critMultBp, armor: TANKY_ARMOR }));
    }
  });

  it('持續傷害（火球術燃燒）在暴擊率 10000 下也不暴擊，只吃持續傷害加成', () => {
    const burn = skillSteps('SK021').find((step) => step.type === 'applyStatus' && step.status.kind === 'dot');
    if (burn?.type !== 'applyStatus' || burn.status.kind !== 'dot') throw new Error('SK021 缺少燃燒');
    const attack = 100;
    const dotBonus = 3000;
    const sim = createSim({
      stats: makeStats({ attack, critRateBp: 10000, critMultBp: 20000, bonusBp: { DOT_DMG: dotBonus, SKILL_DMG: 5000 } }),
      hero: makeHero({ jobId: 'JOB11', skillIds: ['SK021'], passiveIds: ['PS011'] }),
    });
    const events = runSim(sim, 20_000);
    const dots = hitsOf(events, (hit) => hit.source === 'dot');
    expect(dots.length).toBeGreaterThanOrEqual(burn.status.ticks);
    for (const hit of dots) {
      expect(hit.crit).toBe(false);
      expect(hit.amount).toBe(expectedDamage({ attack, coefBp: burn.status.coefPerTickBp, bonusBp: dotBonus, armor: TANKY_ARMOR }));
    }
    expect(hitsOf(events, (hit) => hit.source === 'skill').every((hit) => hit.crit)).toBe(true);
  });

  it('召喚傷害（砲台）在暴擊率 10000 下也不暴擊，只吃召喚加成', () => {
    const turret = spawnStep('SK067');
    const attack = 100;
    const summonBonus = 2000;
    const sim = createSim({
      stats: makeStats({ attack, critRateBp: 10000, critMultBp: 20000, bonusBp: { SUMMON_DMG: summonBonus, SKILL_DMG: 9000, BASIC_DMG: 9000 } }),
      hero: makeHero({ jobId: 'JOB34', skillIds: ['SK067'], passiveIds: ['PS031', 'PS034'] }),
    });
    const summons = hitsOf(runSim(sim, 20_000), (hit) => hit.source === 'summon');
    expect(summons.length).toBeGreaterThan(5);
    for (const hit of summons) {
      expect(hit.crit).toBe(false);
      expect(hit.skillId).toBeNull();
      expect(hit.amount).toBe(expectedDamage({ attack, coefBp: turret.coefBp, bonusBp: summonBonus, armor: TANKY_ARMOR }));
    }
  });

  it('追加傷害（PS001 劍術節奏）在暴擊率 10000 下也不暴擊，只吃追擊加成', () => {
    const coef = extraHitCoef(passiveProc('PS001'));
    const attack = 100;
    const followBonus = 1500;
    const sim = createSim({
      stats: makeStats({ attack, critRateBp: 10000, critMultBp: 20000, bonusBp: { FOLLOWUP_DMG: followBonus, BASIC_DMG: 5000 } }),
      hero: makeHero({ jobId: 'JOB01', passiveIds: ['PS001'] }),
    });
    const followUps = hitsOf(runSim(sim, 20_000), (hit) => hit.source === 'followUp');
    expect(followUps.length).toBeGreaterThan(2);
    for (const hit of followUps) {
      expect(hit.crit).toBe(false);
      expect(hit.amount).toBe(expectedDamage({ attack, coefBp: coef, bonusBp: followBonus, armor: TANKY_ARMOR }));
    }
  });
});

describe('目標選擇：範圍技能不補足空段', () => {
  const singleElite = eliteStageWith('armorMult');

  it('範圍技能最多 3 名：只剩 1 名敵人時，每次施放只命中 1 次，不把空段轉打主目標', () => {
    const sim = createSim({ stats: makeStats({ attack: 10 }), hero: makeHero({ jobId: 'JOB01', skillIds: ['SK001'] }), encounter: eliteEncounter(singleElite) });
    const events = runSim(sim, 40_000);
    const casts = castsOf(events, 'SK001');
    expect(casts.length).toBeGreaterThan(3);
    const elites = new Set(events.flatMap((event) => (event.type === 'waveSpawned' ? event.uids : [])));
    expect(elites.size).toBe(1);
    for (const cast of casts.filter((candidate) => candidate.atMs + HIT_DELAY_MS <= 40_000)) {
      const hits = hitsOf(events, (hit) => hit.actionId === cast.actionId);
      expect(hits).toHaveLength(1);
      expect(elites.has(hits[0]!.targetUid)).toBe(true);
    }
  });

  it('範圍技能對照：3 名敵人存活時，一次施放各命中 3 個不同目標一次', () => {
    const sim = createSim({ stats: makeStats({ attack: 10 }), hero: makeHero({ jobId: 'JOB01', skillIds: ['SK001'] }) });
    const events = runSim(sim, 1_000);
    const cast = castsOf(events, 'SK001')[0]!;
    const hits = hitsOf(events, (hit) => hit.actionId === cast.actionId);
    expect(hits).toHaveLength(3);
    expect(new Set(hits.map((hit) => hit.targetUid)).size).toBe(3);
  });

  it('多段範圍（旋風連斬，每段重新選目標）對單一小首領：每段只命中 1 次', () => {
    const segments = damageStep('SK003').hits!;
    const sim = createSim({ stats: makeStats({ attack: 10 }), hero: makeHero({ jobId: 'JOB02', skillIds: ['SK003'] }), encounter: eliteEncounter(singleElite) });
    const events = runSim(sim, 2_000);
    const cast = castsOf(events, 'SK003')[0]!;
    expect(hitsOf(events, (hit) => hit.actionId === cast.actionId)).toHaveLength(segments);
  });

  it('固定總量絕招（萬劍歸流）每段平均分配給存活敵人；只剩 1 名時每段全額集中', () => {
    const step = damageStep('SK006');
    expect(step.distributeTotal).toBe(true);
    const segments = step.hits!;
    const attack = 100;
    const hero = makeHero({ jobId: 'JOB03', ultimateId: 'SK006' });

    const single = createSim({ stats: makeStats({ attack }), hero, encounter: eliteEncounter(singleElite) });
    const singleEvents = runSim(single, 3_000);
    const singleCast = castsOf(singleEvents, 'SK006')[0]!;
    const singleHits = hitsOf(singleEvents, (hit) => hit.actionId === singleCast.actionId);
    expect(singleHits).toHaveLength(segments);
    const eliteArmor = monsterArmor(catalog, TANKY_MAP, singleElite.localNumber) * (singleElite.eliteTemplate!.kind === 'armorMult' ? singleElite.eliteTemplate!.armorMultBp / 10000 : 1);
    for (const hit of singleHits) {
      expect(hit.source).toBe('ultimate');
      expect(hit.amount).toBe(expectedDamage({ attack, coefBp: step.coefBp, armor: eliteArmor }));
    }

    const triple = createSim({ stats: makeStats({ attack }), hero });
    const tripleEvents = runSim(triple, 3_000);
    const tripleCast = castsOf(tripleEvents, 'SK006')[0]!;
    const tripleHits = hitsOf(tripleEvents, (hit) => hit.actionId === tripleCast.actionId);
    expect(tripleHits).toHaveLength(segments * 3);
    for (const hit of tripleHits) expect(hit.amount).toBe(expectedDamage({ attack, coefBp: step.coefBp / 3, armor: TANKY_ARMOR }));
  });

  it('固定目標的多段技能：目標在命中前死亡時該段落空，不轉打其他敵人', () => {
    // 第 1 圖第 1 關普通怪血量低：同刻的普攻先擊殺主目標，盜賊雙刃（固定主目標 2 段）兩段皆落空。
    const stage = getStageAt(catalog, 1, 1);
    const sim = createSim({
      stats: makeStats({ attack: 100, basicIntervalMs: 60_000 }),
      hero: makeHero({ jobId: 'JOB16', skillIds: ['SK031'] }),
      encounter: { kind: 'stage', stage },
    });
    const first = sim.tick();
    const cast = castsOf(first, 'SK031')[0]!;
    const basic = basicsOf(first)[0]!;
    expect(basic.targetUid).toBeDefined();
    const events = runSim(sim, 1_000);
    const killed = events.find((event) => event.type === 'enemyDefeated');
    expect(killed && killed.type === 'enemyDefeated' && killed.uid).toBe(basic.targetUid);
    expect(hitsOf(events, (hit) => hit.actionId === cast.actionId)).toHaveLength(0);
  });
});

describe('護甲與破甲', () => {
  it('多個不同來源破甲同時存在時取最大值，不相乘、不相加', () => {
    // 合成配置：同時帶劍士破甲斬（20%）與工匠重鎚敲擊（15%）兩種破甲來源（合法路線只會有其一）。
    const strong = armorBreakPct('SK002');
    const weak = armorBreakPct('SK061');
    expect(strong.statusId).not.toBe(weak.statusId);
    const attack = 1000;
    const sim = createSim({
      stats: makeStats({ attack }),
      hero: makeHero({ jobId: 'JOB01', skillIds: ['SK002', 'SK061'], conditions: { SK061: 'immediate' } }),
    });
    let bothSinceMs: number | null = null;
    let mainUid: number | null = null;
    const events = runSim(sim, 3_000, (now, _events, view) => {
      const main = view.enemies[0];
      if (bothSinceMs === null && main) {
        const ids = main.statuses.map((status) => status.statusId);
        if (ids.includes(strong.statusId) && ids.includes(weak.statusId)) {
          bothSinceMs = now;
          mainUid = main.uid;
        }
      }
    });
    expect(bothSinceMs).not.toBeNull();
    const laterBasic = hitsOf(events, (hit) => hit.source === 'basic' && hit.atMs > bothSinceMs! && hit.targetUid === mainUid)[0];
    expect(laterBasic).toBeDefined();
    const maxBreak = Math.max(strong.pctBp, weak.pctBp);
    const asMax = expectedDamage({ attack, coefBp: tuning.hero.basicAttackCoefBp, armor: TANKY_ARMOR * (1 - maxBreak / 10000) });
    const asProduct = expectedDamage({ attack, coefBp: tuning.hero.basicAttackCoefBp, armor: TANKY_ARMOR * (1 - strong.pctBp / 10000) * (1 - weak.pctBp / 10000) });
    const asSum = expectedDamage({ attack, coefBp: tuning.hero.basicAttackCoefBp, armor: TANKY_ARMOR * (1 - (strong.pctBp + weak.pctBp) / 10000) });
    expect(new Set([asMax, asProduct, asSum]).size).toBe(3);
    expect(laterBasic!.amount).toBe(asMax);
  });
});

describe('小首領反應核心：按行動不按段數', () => {
  const reactiveStage = eliteStageWith('reactiveCore');
  const template = reactiveTemplateOf(reactiveStage);

  function reactiveCount(view: BattleView): number {
    const trait = view.enemies[0]!.traits.join(' ');
    const match = trait.match(/(\d+)\/(\d+)/);
    if (!match) throw new Error(`沒有反應核心計數：${trait}`);
    expect(Number(match[2])).toBe(template.actionsPerTrigger);
    return Number(match[1]);
  }

  it('旋風連斬 4 段命中對反應核心只算 1 次本體行動（加上 1 次普攻共 2 次）', () => {
    const segments = damageStep('SK003').hits!;
    const sim = createSim({
      stats: makeStats({ attack: 10 }),
      hero: makeHero({ jobId: 'JOB02', skillIds: ['SK003'] }),
      encounter: eliteEncounter(reactiveStage),
    });
    const events = runSim(sim, tuning.hero.basicAttackIntervalMs - TICK_MS);
    expect(hitsOf(events, (hit) => hit.skillId === 'SK003')).toHaveLength(segments);
    const distinctActions = new Set(hitsOf(events).map((hit) => hit.actionId)).size;
    expect(distinctActions).toBe(2);
    expect(reactiveCount(sim.view())).toBe(distinctActions);
  });

  it('累積 actionsPerTrigger 次本體行動後，受到傷害 +takenBp 持續 durationMs（觸發那一擊本身不加成）', () => {
    const attack = 1000;
    const sim = createSim({ stats: makeStats({ attack }), hero: makeHero(), encounter: eliteEncounter(reactiveStage) });
    const armor = monsterArmor(catalog, TANKY_MAP, reactiveStage.localNumber);
    const base = expectedDamage({ attack, coefBp: tuning.hero.basicAttackCoefBp, armor });
    const boosted = expectedDamage({ attack, coefBp: tuning.hero.basicAttackCoefBp, armor, takenBp: template.takenBp });
    expect(boosted).toBeGreaterThan(base);
    const basics = hitsOf(runSim(sim, 16_000), (hit) => hit.source === 'basic');
    const trigger = basics[template.actionsPerTrigger - 1]!;
    for (const [index, hit] of basics.entries()) {
      if (index >= template.actionsPerTrigger * 2 - 1) break;
      const inWindow = hit.atMs > trigger.atMs && hit.atMs < trigger.atMs + template.durationMs;
      expect(hit.amount, `第 ${index + 1} 次普攻 @${hit.atMs}`).toBe(inWindow ? boosted : base);
    }
  });

  // 回歸測試（已修正的核心缺陷）: BattleSim.registerBodyAction 只記住「上一個」action_id（target.lastBodyActionId），
  // 當其他行動的命中插在多段技能各段之間時，同一 action_id 的後續段會再次計數。
  // 狂劍士預設清怪配置（SK003 + SK001，攻速 1 秒）就會發生：
  // 預期：普攻 a1、旋風連斬 a2、橫掃斬 a3 → 計數 3；實際：a1、a2、a3、a2(第 3 段) → 計數 4。
  // 規格 05 章第 20 關「每承受10次本體行動…按行動不按段數；避免特定多段職業暴利」。
  it('小首領反應核心：多段技能與其他行動交錯命中時，同一 action_id 仍只計 1 次', () => {
    const sim = createSim({
      stats: makeStats({ attack: 10 }),
      hero: makeHero({ jobId: 'JOB02', skillIds: ['SK003', 'SK001'] }),
      encounter: eliteEncounter(reactiveStage),
    });
    const events = runSim(sim, tuning.hero.basicAttackIntervalMs - TICK_MS);
    const bodyActions = new Set(hitsOf(events, (hit) => hit.source === 'basic' || hit.source === 'skill' || hit.source === 'ultimate').map((hit) => hit.actionId));
    expect(bodyActions.size).toBe(3);
    expect(reactiveCount(sim.view())).toBe(bodyActions.size);
  });
});

describe('C：角色沒有 HP／MP', () => {
  const FORBIDDEN_WORDS = new Set(['hp', 'mp', 'mana', 'health', 'shield', 'regen', 'heal', 'block', 'life']);
  /** 敵方（BOSS）血量萬分比是允許的：規則只禁止角色血量。 */
  const ALLOWED_KEYS = new Set(['bossHpRemainingBp']);

  function words(key: string): string[] {
    return key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .split(/[\s_-]+/)
      .filter(Boolean);
  }

  function forbiddenKeys(value: unknown, path = '$', found: string[] = []): string[] {
    if (Array.isArray(value)) {
      value.forEach((child, index) => forbiddenKeys(child, `${path}[${index}]`, found));
    } else if (value !== null && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        // 物品 id／操作 id 等「值」不檢查，只檢查欄位名稱。
        if (!ALLOWED_KEYS.has(key) && words(key).some((word) => FORBIDDEN_WORDS.has(word))) found.push(`${path}.${key}`);
        forbiddenKeys(child, `${path}.${key}`, found);
      }
    }
    return found;
  }

  it('GameState（含 BOSS 快照、配置、物品）、HeroLoadoutSnapshot、CombatStatsSnapshot 與戰鬥畫面角色區塊都沒有 HP／MP 類欄位', () => {
    const bossLocal = catalog.maps.get(1)!.stageIds.length;
    const engine = new GameEngine({
      catalog,
      nowMs: 0,
      state: swordsmanFixture(55, (state) => {
        state.wallet.relics = 3;
        state.progress.localStage = bossLocal;
        state.progress.mode = 'BOSS_READY';
      }),
    });
    let now = 0;
    for (let index = 0; index < 10; index += 1) {
      now += 1000;
      engine.advance(now);
    }
    for (let index = 0; index < 3; index += 1) {
      expectSucceeded(engine.execute({ operationId: nextOpId('op-identify'), command: { type: 'identify', payload: {} } }, now));
    }
    const firstItem = Object.keys(engine.getState().items)[0]!;
    expectSucceeded(engine.execute({ operationId: nextOpId('op-equip'), command: { type: 'equipItem', payload: { itemId: firstItem, purpose: 'boss' } } }, now));
    const stageId = getStageAt(catalog, 1, bossLocal).id;
    expectSucceeded(engine.execute({ operationId: nextOpId('op-boss'), command: { type: 'startBossAttempt', payload: { stageId } } }, now));
    const bossView = engine.getBattleView()!;
    for (let index = 0; index < 62; index += 1) {
      now += 1000;
      engine.advance(now);
    }
    const state = engine.exportState();
    expect(state.boss.history.length).toBe(1);

    expect(forbiddenKeys(state)).toEqual([]);
    const farm = engine.getHeroSnapshot('farm');
    const boss = engine.getHeroSnapshot('boss');
    for (const snapshot of [farm, boss, state.boss.history[0]!]) {
      expect(forbiddenKeys(snapshot.hero)).toEqual([]);
      expect(forbiddenKeys(snapshot.stats)).toEqual([]);
      expect(Object.keys(snapshot.hero).sort()).toEqual(['conditions', 'jobId', 'legendBaseIds', 'passiveIds', 'skillIds', 'targetPolicy', 'ultimateId']);
      expect(Object.keys(snapshot.stats).sort()).toEqual(['attack', 'basicIntervalMs', 'bonusBp', 'cdrBp', 'critMultBp', 'critRateBp']);
    }
    expect(Object.keys(state.player).sort()).toEqual(['currentJobId', 'level', 'unlockedJobIds', 'xp']);
    for (const view of [bossView, engine.getBattleView()!]) expect(forbiddenKeys(view.hero)).toEqual([]);
    expect(STAT_KEYS.filter((key) => words(key).some((word) => FORBIDDEN_WORDS.has(word)))).toEqual([]);
  });
});
