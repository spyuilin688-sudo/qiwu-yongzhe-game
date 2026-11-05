import {
  getMap,
  type AutoCastRule,
  type BossMechanicDef,
  type CompanionDef,
  type ConsumeModifierDef,
  type ContentCatalog,
  type DamageStep,
  type DeathTransferDef,
  type EffectStep,
  type MapDef,
  type PlayCardsStep,
  type ProcDef,
  type ProcPayload,
  type ProcTarget,
  type ProcTiming,
  type ProcTrigger,
  type ResourceId,
  type ResourceRuleDef,
  type SelfBuffStep,
  type SkillDef,
  type SpawnUnitStep,
  type StaticModifiers,
  type StatusSpec,
  type SuitRuleDef,
  type TargetRule,
  type UnitKind,
} from '@qiwu/content';
import type { CombatStatsSnapshot, DamageBonusKey, HeroLoadoutSnapshot, SkillConditionMode } from '../model/types.ts';
import { bossHp, eliteHp, eliteRelicPoints, monsterArmor, normalMonsterHp, normalRelicPoints } from '../rules/formulas.ts';
import { ceilSafe, floorSafe } from '../util/math.ts';
import { SeededRandom } from '../util/rng.ts';
import {
  applyStatusSpec,
  copyPoisonTo,
  findStatus,
  longestPoison,
  removeStacks,
  removeStatus,
  stackCount,
  takeShortestPoison,
  tickerEndsAtMs,
  transferStatus,
} from './statusOps.ts';
import type {
  BattleEvent,
  BattleSetup,
  BattleView,
  BuffState,
  CardSuit,
  DamageSource,
  DotTicker,
  Encounter,
  EnemyState,
  EnemyView,
  HitRider,
  PendingHit,
  UnitRemovedReason,
  UnitState,
} from './types.ts';

interface SkillSlot {
  readonly skill: SkillDef;
  readonly ultimate: boolean;
  readonly mode: SkillConditionMode;
  readyAtMs: number;
  waitingSinceMs: number | null;
}

interface ActiveProc {
  readonly def: ProcDef;
  counter: number;
  sequence: string[];
  lastTriggeredAtMs: number;
}

type StoredTiming = Exclude<ProcTiming, 'immediate' | 'afterAction'>;

interface StoredExtraHit {
  readonly procId: string;
  readonly coefBp: number;
  readonly target: ProcTarget;
  readonly count: number | undefined;
  readonly fallbackMainCoefBp: number;
  readonly timing: StoredTiming;
  readonly skillId: string | null;
  charges: number;
}

/** 技能本身的段數追蹤：判斷「最後一段」與「本次施放首殺」。 */
interface ActionTrack {
  readonly actionId: number;
  readonly skillId: string;
  readonly ultimate: boolean;
  remaining: number;
  lastLanded: boolean;
  killed: number;
  lastTargetUid: number;
}

interface ProcOrigin {
  readonly actionId: number;
  readonly atMs: number;
  /** 觸發行動最後一段之後的時間（afterAction）。 */
  readonly endAtMs?: number;
}

interface CastContext {
  readonly now: number;
  readonly atMs: number;
  readonly actionId: number;
  readonly stats: CombatStatsSnapshot;
  readonly source: 'skill' | 'ultimate';
  readonly skillId: string;
  /** 本體增益（祝禱）與單體加成（不滅劍鞘），只加在本體直接命中。 */
  readonly bodyBonusPct: number;
  previousTargets: EnemyState[];
  previousMain: EnemyState | null;
  consumedTotal: number;
  retained: boolean;
  firstDamageTargetCount: number | null;
  hasDamage: boolean;
  firstCardPlayed: boolean;
}

/** 由被動與傳說組合出的靜態規則；配置改變時整份重建。 */
interface HeroKit {
  readonly resourceRules: ResourceRuleDef[];
  readonly consumeModifiers: ConsumeModifierDef[];
  readonly deathTransfers: DeathTransferDef[];
  readonly buffDurationBonus: { readonly buffId: string; readonly addMs: number }[];
  readonly singleEnemyCastBonus: { readonly skillId: string; readonly pctBp: number }[];
  readonly unitFirstAttackExtra: { readonly skillId: string; readonly coefBp: number; readonly target: 'same' | 'otherOnly' }[];
  setSuitEffectBonusBp: number;
  suits: SuitRuleDef | null;
  companion: CompanionDef | null;
  projectileRetargetOnce: boolean;
}

interface CardState {
  pointer: CardSuit;
  setPending: boolean;
  lastSuit: CardSuit | null;
  streak: number;
  /** 紅心：下一次本體普攻的加成（萬分位），不疊加只取高。 */
  heartBonusBp: number;
}

interface BossRuntime {
  readonly bodyUid: number;
  readonly durationMs: number;
  readonly mechanics: readonly BossMechanicDef[];
  readonly nextSpawnAtMs: number[];
  armorDownUntilMs: number;
  armorDownBp: number;
  vulnerableUntilMs: number;
  vulnerableBp: number;
  shellBroken: boolean;
  shellVulnUntilMs: number;
  bodyDamageTaken: number;
  resolved: 'success' | 'timeout' | null;
}

const BODY_ACTION_SOURCES: ReadonlySet<DamageSource> = new Set(['basic', 'skill', 'ultimate']);
/** 每個敵人記住的最近行動 ID 數；遠大於任一多段技能的命中期間內可能交錯的行動數。 */
const COUNTED_ACTION_MEMORY = 32;
const MAIN_TARGET: TargetRule = { kind: 'main' };
const SUIT_HEART: CardSuit = 0;
const SUIT_DIAMOND: CardSuit = 1;
const SUIT_CLUB: CardSuit = 2;
const SUIT_SPADE: CardSuit = 3;
const SUIT_COUNT = 4;
const DIAMOND_STATUS_ID = 'DIAMOND_BREAK';

function emptyKit(): HeroKit {
  return {
    resourceRules: [],
    consumeModifiers: [],
    deathTransfers: [],
    buffDurationBonus: [],
    singleEnemyCastBonus: [],
    unitFirstAttackExtra: [],
    setSuitEffectBonusBp: 0,
    suits: null,
    companion: null,
    projectileRetargetOnce: false,
  };
}

function emptyCards(): CardState {
  return { pointer: SUIT_HEART, setPending: false, lastSuit: null, streak: 0, heartBonusBp: 0 };
}

function scaleBp(value: number, multBp: number): number {
  return Math.round((value * multBp) / 10000);
}

/**
 * 固定 50ms 邏輯刻的戰鬥模擬（純邏輯，不依賴畫面或時鐘）。
 * 同一刻固定順序：BOSS 時間軸 → 狀態到期 → 持續傷害 → 召喚／區域攻擊 → 單位與增益到期 → 已排程命中 →
 * 清理死亡與過關 → 生成下一波 → 排程普攻／技能 → 回傳畫面事件（規格 02）。
 * 相同設定、種子與輸入必定重播相同結果。角色沒有 HP，敵人不攻擊角色。
 */
export class BattleSim {
  private readonly catalog: ContentCatalog;
  private readonly rng: SeededRandom;
  private readonly tickMs: number;
  private stats: CombatStatsSnapshot;
  private hero: HeroLoadoutSnapshot;
  private encounter: Encounter;
  private map: MapDef;

  private timeMs = 0;
  private nextUid = 1;
  private nextActionId = 1;
  private nextHitSeq = 1;
  private enemies: EnemyState[] = [];
  private hits: PendingHit[] = [];
  private units: UnitState[] = [];
  private buffs: BuffState[] = [];
  private events: BattleEvent[] = [];

  private waveIndex = 0;
  private nextWaveAtMs: number | null = 0;
  private stageCleared = false;
  private waveFirstBasicPending = false;

  private skillSlots: SkillSlot[] = [];
  /** 每個技能最後一次的可施放時間；移出再放回配置或換職再換回都沿用，避免重置冷卻。 */
  private readonly cooldownMemory = new Map<string, number>();
  private procs: ActiveProc[] = [];
  private kit: HeroKit = emptyKit();
  private resources: Partial<Record<ResourceId, number>> = {};
  private resourceBasicCounters: Partial<Record<ResourceId, number>> = {};
  private focusTargetUid: number | null = null;
  private stored: StoredExtraHit[] = [];
  private unitRoundBonus: { unitKind: UnitKind; pctBp: number; remaining: number } | null = null;
  private readonly unitPartBonus = new Map<string, number>();
  private readonly actions = new Map<number, ActionTrack>();
  private cards: CardState = emptyCards();
  private engagedUid: number | null = null;
  private engagedSinceMs = 0;
  private nextBasicAtMs = 0;
  private castLockUntilMs = 0;
  private boss: BossRuntime | null = null;

  constructor(setup: BattleSetup) {
    this.catalog = setup.catalog;
    this.rng = new SeededRandom(setup.seed);
    this.tickMs = setup.catalog.globals.tickMs;
    this.stats = setup.stats;
    this.hero = setup.hero;
    this.encounter = setup.encounter;
    this.map = getMap(this.catalog, setup.encounter.stage.mapNumber);
    this.rebuildHeroKit();
    if (setup.encounter.kind === 'boss') this.startBoss(setup.encounter.durationMs);
  }

  // ───────────── 外部控制 ─────────────

  get currentTimeMs(): number {
    return this.timeMs;
  }

  get bossResult(): 'success' | 'timeout' | null {
    return this.boss?.resolved ?? null;
  }

  get isStageCleared(): boolean {
    return this.stageCleared;
  }

  /** 普通戰鬥換裝：新行動使用新屬性；已排程命中沿用施放時快照。常駐戰獸跟著角色屬性。BOSS 整場不得呼叫。 */
  updateStats(stats: CombatStatsSnapshot): void {
    if (this.encounter.kind === 'boss') throw new Error('BOSS 戰使用開戰快照，不能中途換屬性');
    this.stats = stats;
    for (const unit of this.units) if (unit.expiresAtMs === Number.POSITIVE_INFINITY) unit.stats = stats;
  }

  /** 配置或職業改變：重建技能與被動；職業不同時清除資源、召喚物與花色（換職要重驗上限）。 */
  updateHero(hero: HeroLoadoutSnapshot): void {
    if (this.encounter.kind === 'boss') throw new Error('BOSS 戰凍結配置');
    const jobChanged = hero.jobId !== this.hero.jobId;
    this.hero = hero;
    if (jobChanged) {
      this.resources = {};
      this.resourceBasicCounters = {};
      this.focusTargetUid = null;
      this.stored = [];
      for (const unit of this.units) this.emit({ type: 'unitRemoved', atMs: this.timeMs, kind: unit.kind, uid: unit.uid, reason: 'replaced' });
      this.units = [];
      this.buffs = [];
      this.unitRoundBonus = null;
      this.unitPartBonus.clear();
      this.cards = emptyCards();
    }
    this.rebuildHeroKit();
  }

  /** 進入下一關（由引擎在收到 stageCleared 後呼叫）；角色冷卻、資源與召喚物延續。 */
  enterEncounter(encounter: Encounter): void {
    if (encounter.kind === 'boss' || this.encounter.kind === 'boss') throw new Error('BOSS 戰需建立新的模擬');
    this.encounter = encounter;
    this.map = getMap(this.catalog, encounter.stage.mapNumber);
    for (const enemy of this.enemies) enemy.alive = false;
    this.enemies = [];
    this.hits = [];
    this.actions.clear();
    this.focusTargetUid = null;
    this.engagedUid = null;
    this.waveIndex = 0;
    this.stageCleared = false;
    this.nextWaveAtMs = this.timeMs + this.catalog.tuning.battle.waveSpawnDelayMs;
  }

  /** 推進一個邏輯刻並回傳本刻事件。 */
  tick(): BattleEvent[] {
    this.events = [];
    if (this.boss?.resolved) return this.events;
    this.timeMs += this.tickMs;
    const now = this.timeMs;

    this.processBossTimeline(now);
    this.expireEnemyStatuses(now);
    this.processDots(now);
    this.processUnits(now);
    this.expireUnitsAndBuffs(now);
    this.processHits(now);
    this.resolveDeathsAndProgress(now);
    if (this.boss?.resolved) return this.events;
    this.spawnWaveIfDue(now);
    this.scheduleHeroActions(now);
    return this.events;
  }

  /** 推進到指定刻數（BOSS 重播用），回傳全部事件。 */
  runUntilTick(targetTick: number): BattleEvent[] {
    const collected: BattleEvent[] = [];
    while (this.timeMs / this.tickMs < targetTick && !this.boss?.resolved) collected.push(...this.tick());
    return collected;
  }

  // ───────────── 角色配置 ─────────────

  private rebuildHeroKit(): void {
    const slots: SkillSlot[] = [];
    const ids = [...this.hero.skillIds.map((id) => ({ id, ultimate: false }))];
    if (this.hero.ultimateId) ids.push({ id: this.hero.ultimateId, ultimate: true });
    for (const { id, ultimate } of ids) {
      const skill = this.catalog.skills.get(id);
      if (!skill?.effect) continue;
      slots.push({
        skill,
        ultimate,
        mode: this.hero.conditions[id] ?? 'default',
        readyAtMs: Math.max(this.timeMs, this.cooldownMemory.get(id) ?? this.timeMs),
        waitingSinceMs: null,
      });
    }
    this.skillSlots = slots;

    const previousProcs = new Map(this.procs.map((proc) => [proc.def.procId, proc]));
    const procDefs: ProcDef[] = [];
    const kit = emptyKit();
    for (const passiveId of this.hero.passiveIds) {
      const effect = this.catalog.passives.get(passiveId)?.effect;
      if (!effect) continue;
      procDefs.push(...effect.procs);
      if (effect.resource) kit.resourceRules.push(effect.resource);
      if (effect.consumeModifier) kit.consumeModifiers.push(effect.consumeModifier);
      if (effect.suits) kit.suits = effect.suits;
      if (effect.companion) kit.companion = effect.companion;
      if (effect.projectileRetargetOnce) kit.projectileRetargetOnce = true;
      this.addStaticModifiers(kit, effect);
    }
    for (const baseId of this.hero.legendBaseIds) {
      const legend = this.catalog.equipment.get(baseId)?.legend;
      if (!legend) continue;
      procDefs.push(...legend.procs);
      this.addStaticModifiers(kit, legend);
    }
    this.kit = kit;
    this.procs = procDefs.map(
      (def) => previousProcs.get(def.procId) ?? { def, counter: 0, sequence: [], lastTriggeredAtMs: Number.NEGATIVE_INFINITY },
    );
    this.ensureCompanion();
  }

  private addStaticModifiers(kit: HeroKit, mods: StaticModifiers): void {
    if (mods.deathTransfer) kit.deathTransfers.push(mods.deathTransfer);
    if (mods.buffDurationBonus) kit.buffDurationBonus.push(mods.buffDurationBonus);
    if (mods.singleEnemyCastBonus) kit.singleEnemyCastBonus.push(mods.singleEnemyCastBonus);
    if (mods.unitFirstAttackExtra) kit.unitFirstAttackExtra.push(mods.unitFirstAttackExtra);
    kit.setSuitEffectBonusBp += mods.setSuitEffectBonusBp ?? 0;
  }

  /** 獵伴戰獸是常駐單位：開戰或轉入該職業時生成一次，不受召喚上限與到期影響。 */
  private ensureCompanion(): void {
    const companion = this.kit.companion;
    if (!companion) return;
    if (this.units.some((unit) => unit.kind === companion.unitKind && unit.expiresAtMs === Number.POSITIVE_INFINITY)) return;
    this.addUnit({
      kind: companion.unitKind,
      capGroup: companion.unitKind,
      expiresAtMs: Number.POSITIVE_INFINITY,
      intervalMs: companion.attackIntervalMs,
      coefBp: companion.coefBp,
      stats: this.stats,
      attackTargets: MAIN_TARGET,
      damageSource: 'summon',
      onResolve: null,
      firstAttackExtra: null,
    });
  }

  private hasPassive(passiveId: string): boolean {
    return this.hero.passiveIds.includes(passiveId);
  }

  // ───────────── BOSS ─────────────

  private startBoss(durationMs: number): void {
    const stage = this.encounter.stage;
    const body = this.createEnemy({
      monsterId: this.map.boss.id,
      name: this.map.boss.name,
      kind: 'boss',
      maxHp: bossHp(this.catalog, stage.mapNumber, stage.localNumber),
      baseArmor: monsterArmor(this.catalog, stage.mapNumber, stage.localNumber),
      rewardPoints: this.catalog.tuning.relic.bossBodyPoints,
    });
    this.enemies = [body];
    this.nextWaveAtMs = null;
    this.boss = {
      bodyUid: body.uid,
      durationMs,
      mechanics: this.map.bossMechanics,
      nextSpawnAtMs: this.map.bossMechanics.map((mechanic) => (mechanic.kind === 'periodicAdds' ? mechanic.firstAtMs : Number.POSITIVE_INFINITY)),
      armorDownUntilMs: 0,
      armorDownBp: 0,
      vulnerableUntilMs: 0,
      vulnerableBp: 0,
      shellBroken: false,
      shellVulnUntilMs: 0,
      bodyDamageTaken: 0,
      resolved: null,
    };
    this.emit({ type: 'waveSpawned', atMs: 0, waveIndex: 0, totalWaves: 1, uids: [body.uid] });
  }

  private processBossTimeline(now: number): void {
    const boss = this.boss;
    if (!boss) return;
    boss.mechanics.forEach((mechanic, index) => {
      if (mechanic.kind !== 'periodicAdds') return;
      const due = boss.nextSpawnAtMs[index] ?? Number.POSITIVE_INFINITY;
      if (now < due) return;
      boss.nextSpawnAtMs[index] = mechanic.everyMs === null ? Number.POSITIVE_INFINITY : due + mechanic.everyMs;
      if (mechanic.active && (now < mechanic.active.fromMs || now >= mechanic.active.toMs)) return;
      const body = this.enemyByUid(boss.bodyUid);
      if (!body?.alive) return;
      const spawned: number[] = [];
      for (let count = 0; count < mechanic.count; count += 1) {
        const cap = Math.min(mechanic.maxAdds, this.catalog.tuning.enemies.maxBossAdds);
        const adds = this.enemies.filter((enemy) => enemy.alive && enemy.kind === 'add');
        if (adds.length >= cap) {
          // 超額時替換最舊副目標；替換視為移除，不觸發死亡獎勵或擊殺型效果。
          const oldest = adds[0]!;
          oldest.alive = false;
          this.emit({ type: 'enemyRemoved', atMs: now, uid: oldest.uid, reason: 'replaced' });
        }
        const add = this.createEnemy({
          monsterId: `${this.map.boss.id}-ADD`,
          name: mechanic.addName,
          kind: 'add',
          maxHp: Math.max(1, ceilSafe((body.maxHp * mechanic.hpPctOfBodyBp) / 10000)),
          baseArmor: body.baseArmor,
          rewardPoints: this.catalog.tuning.relic.bossAddPoints,
        });
        add.mechanicIndex = index;
        add.expiresAtMs = mechanic.lifetimeMs ? now + mechanic.lifetimeMs : null;
        add.damageTransferBp = mechanic.damageTransferBp ?? 0;
        this.enemies.push(add);
        spawned.push(add.uid);
      }
      this.enemies = this.enemies.filter((enemy) => enemy.alive);
      this.emit({ type: 'addsSpawned', atMs: now, uids: spawned, name: mechanic.addName });
    });
  }

  private bossPhaseLabels(now: number): string[] {
    const boss = this.boss;
    if (!boss) return [];
    const labels: string[] = [];
    for (const mechanic of boss.mechanics) {
      switch (mechanic.kind) {
        case 'armorCycle': {
          const offset = now % mechanic.cycleMs;
          const segment = mechanic.segments.find((seg) => offset >= seg.fromMs && offset < seg.toMs);
          if (segment) labels.push(`${segment.label} ${Math.ceil((segment.toMs - offset) / 1000)}秒`);
          break;
        }
        case 'vulnerabilityCycle': {
          if (mechanic.active && (now < mechanic.active.fromMs || now >= mechanic.active.toMs)) break;
          const offset = now % mechanic.cycleMs;
          if (offset >= mechanic.windowFromMs && offset < mechanic.windowToMs) labels.push(`${mechanic.label}：易傷`);
          break;
        }
        case 'armorWindow':
          if (now >= mechanic.active.fromMs && now < mechanic.active.toMs) labels.push(mechanic.label);
          break;
        case 'shell':
          labels.push(boss.shellBroken ? `${mechanic.label}已破` : mechanic.label);
          break;
        case 'periodicAdds': {
          const alive = this.enemies.filter((enemy) => enemy.alive && enemy.kind === 'add').length;
          if (alive > 0) labels.push(`${mechanic.addName} ×${alive}`);
          break;
        }
      }
    }
    if (now < boss.armorDownUntilMs) labels.push('護甲削弱');
    if (now < boss.vulnerableUntilMs) labels.push('弱點開啟');
    return labels;
  }

  // ───────────── 刷怪與波次 ─────────────

  private createEnemy(input: {
    monsterId: string;
    name: string;
    kind: EnemyState['kind'];
    maxHp: number;
    baseArmor: number;
    rewardPoints: number;
  }): EnemyState {
    const enemy: EnemyState = {
      uid: this.nextUid,
      monsterId: input.monsterId,
      name: input.name,
      kind: input.kind,
      maxHp: input.maxHp,
      hp: input.maxHp,
      baseArmor: input.baseArmor,
      spawnedAtMs: this.timeMs,
      alive: true,
      rewardPoints: input.rewardPoints,
      statuses: [],
      eliteTemplate: null,
      reactiveCount: 0,
      reactiveUntilMs: 0,
      countedActionIds: [],
      shellBroken: false,
      mechanicIndex: null,
      expiresAtMs: null,
      damageTransferBp: 0,
      lastBodyHitAtMs: Number.NEGATIVE_INFINITY,
      basicAttacksTaken: 0,
      cleanHitBonusUsed: false,
      dotEverApplied: false,
    };
    this.nextUid += 1;
    return enemy;
  }

  private spawnWaveIfDue(now: number): void {
    if (this.nextWaveAtMs === null || now < this.nextWaveAtMs || this.encounter.kind === 'boss') return;
    this.nextWaveAtMs = null;
    const stage = this.encounter.stage;
    const { mapNumber, localNumber } = stage;
    const spawned: EnemyState[] = [];
    if (this.encounter.kind === 'stage' && stage.type === 'elite') {
      const monster = stage.eliteMonsterId ? this.catalog.monsters.get(stage.eliteMonsterId) : undefined;
      const elite = this.createEnemy({
        monsterId: monster?.id ?? 'ELITE',
        name: monster?.name ?? '小首領',
        kind: 'elite',
        maxHp: eliteHp(this.catalog, mapNumber, localNumber),
        baseArmor: monsterArmor(this.catalog, mapNumber, localNumber),
        rewardPoints: eliteRelicPoints(this.catalog, mapNumber),
      });
      elite.eliteTemplate = stage.eliteTemplate;
      spawned.push(elite);
    } else {
      const { monstersPerWave } = this.catalog.tuning.battle;
      for (let index = 0; index < monstersPerWave; index += 1) {
        const monster = this.map.normalMonsters[(this.waveIndex + index) % this.map.normalMonsters.length]!;
        spawned.push(
          this.createEnemy({
            monsterId: monster.id,
            name: monster.name,
            kind: 'normal',
            maxHp: normalMonsterHp(this.catalog, mapNumber, localNumber),
            baseArmor: monsterArmor(this.catalog, mapNumber, localNumber),
            rewardPoints: normalRelicPoints(this.catalog, mapNumber),
          }),
        );
      }
    }
    this.enemies = spawned;
    this.waveFirstBasicPending = true;
    this.emit({
      type: 'waveSpawned',
      atMs: now,
      waveIndex: this.waveIndex,
      totalWaves: this.totalWaves(),
      uids: spawned.map((enemy) => enemy.uid),
    });
  }

  private totalWaves(): number | null {
    if (this.encounter.kind === 'loop') return null;
    if (this.encounter.kind === 'boss') return 1;
    return this.encounter.stage.type === 'elite' ? 1 : this.catalog.tuning.battle.wavesPerNormalStage;
  }

  // ───────────── 到期與持續 ─────────────

  private expireEnemyStatuses(now: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const expired: string[] = [];
      enemy.statuses = enemy.statuses.filter((status) => {
        if (status.kind === 'dot') return status.dot !== null && status.dot.ticksLeft > 0;
        if (status.kind === 'dotStack') return status.poison.length > 0;
        if (status.expiresAtMs > now) return true;
        expired.push(status.statusId);
        return false;
      });
      if (enemy.kind === 'add' && enemy.expiresAtMs !== null && enemy.expiresAtMs <= now) {
        enemy.alive = false;
        this.emit({ type: 'enemyRemoved', atMs: now, uid: enemy.uid, reason: 'expired' });
        continue;
      }
      for (const statusId of expired) this.fireStatusExpired(statusId, enemy, now);
    }
  }

  private processDots(now: number): void {
    for (const enemy of this.enemies) {
      for (const status of [...enemy.statuses]) {
        if (!enemy.alive) break;
        if (status.dot) {
          const finished = this.runTicker(enemy, status.dot, now);
          // 熔痕等持續傷害「到期」＝最後一跳結算完且目標仍活著；被刷新會換成新計時器，不算到期。
          if (finished && enemy.alive) this.fireStatusExpired(status.statusId, enemy, now);
        } else if (status.kind === 'dotStack') {
          for (const ticker of status.poison) this.runTicker(enemy, ticker, now);
          status.poison = status.poison.filter((ticker) => ticker.ticksLeft > 0);
          status.expiresAtMs = status.poison.reduce((latest, ticker) => Math.max(latest, tickerEndsAtMs(ticker)), 0);
        }
      }
    }
  }

  /** 回傳此計時器是否在本刻跳完最後一次。 */
  private runTicker(enemy: EnemyState, ticker: DotTicker, now: number): boolean {
    let finished = false;
    while (ticker.ticksLeft > 0 && ticker.nextTickAtMs <= now && enemy.alive) {
      ticker.ticksLeft -= 1;
      ticker.nextTickAtMs += ticker.intervalMs;
      const amount = this.calculateDamage({
        attack: ticker.attack,
        coefBp: ticker.coefPerTickBp,
        bonusBp: ticker.dotBonusBp,
        critMultBp: 10000,
        target: enemy,
        armorIgnoreBp: 0,
        source: 'dot',
        unitKind: null,
        skillId: null,
      });
      this.applyDamage(enemy, amount, false, 'dot', null, 0, now);
      if (ticker.ticksLeft === 0) finished = true;
    }
    return finished;
  }

  private processUnits(now: number): void {
    for (const unit of [...this.units]) {
      // 最後一擊可與到期同刻（幻影第 8 秒、星陣第 4 次），因此到期前先攻擊。
      if (unit.intervalMs <= 0 || unit.nextAttackAtMs > now || unit.nextAttackAtMs > unit.expiresAtMs) continue;
      const targets = this.selectTargets(unit.attackTargets);
      if (targets.length === 0) continue;
      let roundBonus = 0;
      if (unit.damageSource === 'summon' && this.unitRoundBonus && this.unitRoundBonus.unitKind === unit.kind && this.unitRoundBonus.remaining > 0) {
        roundBonus = this.unitRoundBonus.pctBp;
        this.unitRoundBonus.remaining -= 1;
        if (this.unitRoundBonus.remaining === 0) this.unitRoundBonus = null;
      }
      const actionId = this.newActionId();
      for (const target of targets) {
        this.pushHit({
          atMs: now,
          actionId,
          source: unit.damageSource,
          coefBp: unit.coefBp,
          targeting: { mode: 'fixed', uid: target.uid },
          stats: unit.stats,
          critAllowed: false,
          armorIgnoreBp: 0,
          bonusKeys: [unit.damageSource === 'dot' ? 'DOT_DMG' : 'SUMMON_DMG'],
          bonusPctBp: roundBonus + this.unitBuffBonusPct(unit.kind),
          skillId: null,
          unitKind: unit.kind,
          riders: [],
          tracked: false,
          retargetOnce: false,
        });
      }
      const first = targets[0]!;
      if (unit.attacksMade === 0 && unit.firstAttackExtra) {
        const extraTarget = unit.firstAttackExtra.target === 'same' ? first : this.otherThan(first);
        if (extraTarget) this.pushFollowUp(extraTarget, unit.firstAttackExtra.coefBp, actionId, now);
      }
      if (unit.pendingExtraCoefBp > 0) {
        this.pushFollowUp(first, unit.pendingExtraCoefBp, actionId, now);
        unit.pendingExtraCoefBp = 0;
      }
      unit.attacksMade += 1;
      const overclock = this.buffs.find((buff) => buff.effect.kind === 'unitAttackIntervalMult' && buff.effect.unitKind === unit.kind);
      const interval =
        overclock?.effect.kind === 'unitAttackIntervalMult' ? scaleBp(unit.intervalMs, overclock.effect.multBp) : unit.intervalMs;
      unit.nextAttackAtMs = now + interval;
    }
  }

  private expireUnitsAndBuffs(now: number): void {
    for (const unit of this.units.filter((candidate) => candidate.expiresAtMs <= now)) this.removeUnit(unit, 'expired', now);
    const expired = this.buffs.filter((buff) => buff.expiresAtMs <= now);
    if (expired.length === 0) return;
    this.buffs = this.buffs.filter((buff) => buff.expiresAtMs > now);
    for (const buff of expired) {
      this.fireMatching((trigger) => trigger.kind === 'buffExpired' && trigger.buffId === buff.buffId, now, this.mainTarget());
    }
  }

  // ───────────── 命中 ─────────────

  private processHits(now: number): void {
    const due = this.hits.filter((hit) => hit.atMs <= now).sort((a, b) => a.atMs - b.atMs || a.seq - b.seq);
    if (due.length === 0) return;
    this.hits = this.hits.filter((hit) => hit.atMs > now);
    for (const hit of due) this.resolveHit(hit, now);
  }

  private resolveHit(hit: PendingHit, now: number): void {
    let landedOn: EnemyState | null = null;
    switch (hit.targeting.mode) {
      case 'fixed': {
        let target = this.enemyByUid(hit.targeting.uid) ?? null;
        // 目標已死：此段落空，不把空箭轉向主目標（規格：一般技能不補足空段）；餘箭追獵可重選一次。
        if (!target && hit.retargetOnce) target = this.mainTarget();
        if (target) {
          this.strike(hit, target, hit.coefBp, now);
          landedOn = target;
        }
        break;
      }
      case 'reacquire': {
        const targets = this.selectTargets(hit.targeting.rule);
        const coef = hit.targeting.distribute && targets.length > 0 ? hit.coefBp / targets.length : hit.coefBp;
        for (const target of targets) this.strike(hit, target, coef, now);
        landedOn = targets[0] ?? null;
        break;
      }
      case 'rotate': {
        const rotation = this.rotationList();
        const target = rotation.length > 0 ? rotation[hit.targeting.index % rotation.length]! : null;
        if (target) {
          this.strike(hit, target, hit.coefBp, now);
          landedOn = target;
        }
        break;
      }
    }
    if (hit.tracked) this.onTrackedHitResolved(hit, landedOn, now);
  }

  private onTrackedHitResolved(hit: PendingHit, landedOn: EnemyState | null, now: number): void {
    const track = this.actions.get(hit.actionId);
    if (!track) return;
    track.remaining -= 1;
    track.lastLanded = landedOn !== null;
    if (landedOn) track.lastTargetUid = landedOn.uid;
    if (track.remaining > 0) return;
    this.actions.delete(hit.actionId);
    this.fireSkillEnded(track, now);
  }

  private fireSkillEnded(track: ActionTrack, now: number): void {
    const reference = this.enemyByUid(track.lastTargetUid) ?? this.mainTarget();
    const origin: ProcOrigin = { actionId: track.actionId, atMs: now + this.catalog.tuning.battle.minHitDelayMs };
    this.fireMatching(
      (trigger) =>
        trigger.kind === 'skillEnded' &&
        (trigger.skillId === track.skillId || (trigger.ultimate === true && track.ultimate)) &&
        (!trigger.requireLastHitLanded || track.lastLanded),
      now,
      reference,
      origin,
    );
  }

  private strike(hit: PendingHit, target: EnemyState, coefBp: number, now: number): void {
    let critMultBp = 10000;
    let crit = false;
    if (hit.critAllowed) {
      crit = this.rng.nextInt(10000) < hit.stats.critRateBp;
      if (crit) critMultBp = hit.stats.critMultBp;
    }
    const hadStatuses = target.statuses.length > 0;
    const bonusBp = hit.bonusKeys.reduce((sum, key) => sum + hit.stats.bonusBp[key], 0) + hit.bonusPctBp;
    const amount = this.calculateDamage({
      attack: hit.stats.attack,
      coefBp,
      bonusBp,
      critMultBp,
      target,
      armorIgnoreBp: hit.armorIgnoreBp,
      source: hit.source,
      unitKind: hit.unitKind,
      skillId: hit.skillId,
    });
    const isBodyAction = BODY_ACTION_SOURCES.has(hit.source);
    if (isBodyAction) {
      this.registerBodyAction(target, hit.actionId, now);
      target.lastBodyHitAtMs = now;
    }
    // 專注先計入這次命中，再由死亡規則決定保留層數（擊殺那一下不會讓保留層多 1）。
    if (hit.source === 'basic') this.gainFocusOnBasicHit(target);
    const killed = this.applyDamage(target, amount, crit, hit.source, hit.skillId, hit.actionId, now);

    if (target.alive) {
      for (const rider of hit.riders) {
        if (rider.kind === 'status') this.applyStatusFrom(target, rider.spec, hit.stats, now, isBodyAction);
        else this.copyDotTo(target, rider.statusId, rider.toOthers, now, isBodyAction);
      }
    }
    if (hit.source === 'summon' && hit.unitKind) this.onSummonHit(hit.unitKind, target, hit.actionId, now);
    if (hit.tracked && killed) this.onTrackedKill(hit, target, now);
    if (!isBodyAction) return;
    // 只有本體直接行動會觸發被動／裝備；追加、持續、召喚傷害一律不觸發（一層追加鏈）。
    if (crit) this.fireProcs(hit.source === 'basic' ? 'basicCrit' : 'directSkillCrit', now, target);
    if (killed && hit.source === 'basic') this.fireProcs('basicKill', now, target);
    if (hit.source !== 'basic' && !hadStatuses && !target.cleanHitBonusUsed) {
      target.cleanHitBonusUsed = true;
      this.fireProcs('directSkillHitCleanTarget', now, target);
    }
    for (const proc of this.procs) {
      const trigger = proc.def.trigger;
      if (trigger.kind !== 'bodyHitOnTargetWithStatus') continue;
      if (trigger.basicOnly && hit.source !== 'basic') continue;
      const status = findStatus(target, trigger.statusId);
      if (!status) continue;
      if (trigger.minStacks !== undefined && stackCount(target, trigger.statusId, now) < trigger.minStacks) continue;
      if (trigger.every !== undefined) {
        proc.counter += 1;
        if (proc.counter % trigger.every !== 0) continue;
      }
      this.triggerProc(proc, now, target);
    }
  }

  private onTrackedKill(hit: PendingHit, target: EnemyState, now: number): void {
    const track = this.actions.get(hit.actionId);
    if (!track) return;
    track.killed += 1;
    if (track.killed !== 1) return;
    this.fireMatching((trigger) => trigger.kind === 'skillKill' && trigger.skillId === track.skillId, now, target);
  }

  private onSummonHit(unitKind: UnitKind, target: EnemyState, actionId: number, now: number): void {
    this.releaseStored('nextSummonHit', target, actionId, now + this.catalog.tuning.battle.minHitDelayMs, null);
    for (const proc of this.procs) {
      const trigger = proc.def.trigger;
      if (trigger.kind === 'unitHitAfterBodyHit') {
        if (trigger.unitKind === unitKind && now - target.lastBodyHitAtMs <= trigger.windowMs) this.triggerProc(proc, now, target);
      } else if (trigger.kind === 'unitHitOnTargetWithStatus') {
        if (trigger.unitKind !== unitKind || !findStatus(target, trigger.statusId)) continue;
        proc.counter += 1;
        if (proc.counter % trigger.every === 0) this.triggerProc(proc, now, target);
      }
    }
  }

  private calculateDamage(input: {
    attack: number;
    coefBp: number;
    bonusBp: number;
    critMultBp: number;
    target: EnemyState;
    armorIgnoreBp: number;
    source: DamageSource;
    unitKind: UnitKind | null;
    skillId: string | null;
  }): number {
    const armorFactorConstant = this.catalog.tuning.armor.factorConstant;
    const armor = this.effectiveArmor(input.target, this.timeMs) * (1 - input.armorIgnoreBp / 10000);
    const armorFactor = armorFactorConstant / (armorFactorConstant + Math.max(0, armor));
    const takenBp = this.damageTakenBp(input.target, this.timeMs, input.source, input.unitKind, input.skillId);
    const raw =
      input.attack *
      (input.coefBp / 10000) *
      (1 + input.bonusBp / 10000) *
      (input.critMultBp / 10000) *
      armorFactor *
      (1 + takenBp / 10000);
    return Math.max(1, floorSafe(raw));
  }

  /** 護甲：基底 × 敵方模板／BOSS 機制倍率 × (1 − 最大破甲)。多個破甲取最大，不相乘。 */
  private effectiveArmor(enemy: EnemyState, now: number): number {
    let armor = enemy.baseArmor;
    const template = enemy.eliteTemplate;
    if (template?.kind === 'armorMult') armor *= template.armorMultBp / 10000;
    if (template?.kind === 'shellUntilHpLoss' && !enemy.shellBroken) armor *= template.armorMultBp / 10000;
    if (template?.kind === 'armorDropBelowHp' && enemy.hp * 10000 < enemy.maxHp * template.hpBelowBp) {
      armor *= 1 - template.armorReductionBp / 10000;
    }
    if (enemy.kind === 'boss' && this.boss) armor *= this.bossArmorMultiplier(now);
    let maxBreak = 0;
    for (const status of enemy.statuses) if (status.kind === 'armorBreak') maxBreak = Math.max(maxBreak, status.pctBp);
    return armor * (1 - maxBreak / 10000);
  }

  private bossArmorMultiplier(now: number): number {
    const boss = this.boss!;
    let multiplier = 1;
    boss.mechanics.forEach((mechanic, index) => {
      switch (mechanic.kind) {
        case 'periodicAdds':
          if (mechanic.whilePresentBodyArmorBp && this.enemies.some((enemy) => enemy.alive && enemy.mechanicIndex === index)) {
            multiplier *= 1 + mechanic.whilePresentBodyArmorBp / 10000;
          }
          break;
        case 'armorCycle': {
          const offset = now % mechanic.cycleMs;
          const segment = mechanic.segments.find((seg) => offset >= seg.fromMs && offset < seg.toMs);
          if (segment) multiplier *= segment.armorMultBp / 10000;
          break;
        }
        case 'armorWindow':
          if (now >= mechanic.active.fromMs && now < mechanic.active.toMs) multiplier *= mechanic.armorMultBp / 10000;
          break;
        case 'shell':
          if (!boss.shellBroken) multiplier *= mechanic.armorMultBp / 10000;
          break;
        case 'vulnerabilityCycle':
          break;
      }
    });
    if (now < boss.armorDownUntilMs) multiplier *= 1 - boss.armorDownBp / 10000;
    return multiplier;
  }

  /**
   * 受傷增益以加總計算（N）。召喚物另吃目標上的召喚易傷（集火信標只加砲台、掠食標記只加戰獸）；
   * 弱點標記只加本體來源，破綻標記只加帶「處決」標籤的技能。
   */
  private damageTakenBp(enemy: EnemyState, now: number, source: DamageSource, unitKind: UnitKind | null, skillId: string | null): number {
    let taken = 0;
    const template = enemy.eliteTemplate;
    if (template?.kind === 'periodicVulnerability') {
      const offset = (now - enemy.spawnedAtMs) % template.cycleMs;
      if (offset >= template.cycleMs - template.windowMs) taken += template.takenBp;
    }
    if (template?.kind === 'reactiveCore' && now < enemy.reactiveUntilMs) taken += template.takenBp;
    if (enemy.kind === 'boss' && this.boss) {
      const boss = this.boss;
      for (const mechanic of boss.mechanics) {
        if (mechanic.kind !== 'vulnerabilityCycle') continue;
        if (mechanic.active && (now < mechanic.active.fromMs || now >= mechanic.active.toMs)) continue;
        const offset = now % mechanic.cycleMs;
        if (offset >= mechanic.windowFromMs && offset < mechanic.windowToMs) taken += mechanic.takenBp;
      }
      if (now < boss.vulnerableUntilMs) taken += boss.vulnerableBp;
      if (now < boss.shellVulnUntilMs) {
        const shell = boss.mechanics.find((mechanic) => mechanic.kind === 'shell');
        if (shell?.kind === 'shell') taken += shell.afterBreakTakenBp;
      }
    }
    const skillTags = skillId ? (this.catalog.skills.get(skillId)?.tags ?? []) : [];
    let summonTaken = 0;
    for (const status of enemy.statuses) {
      if (status.kind === 'summonDamageTaken' && source === 'summon' && unitKind && status.unitKinds.includes(unitKind)) {
        summonTaken = Math.max(summonTaken, status.pctBp);
      }
      if (status.kind === 'damageTakenFor') {
        const bySource = status.sources.includes(source);
        const byTag = status.skillTags.some((tag) => skillTags.includes(tag));
        if (bySource || byTag) taken += status.pctBp;
      }
    }
    return taken + summonTaken;
  }

  /** 回傳是否擊殺。死亡只在此標記一次，同一隻怪只會結算一次產出（T-02）。 */
  private applyDamage(
    enemy: EnemyState,
    amount: number,
    crit: boolean,
    source: DamageSource,
    skillId: string | null,
    actionId: number,
    now: number,
  ): boolean {
    if (!enemy.alive) return false;
    const effective = Math.min(enemy.hp, amount);
    enemy.hp -= effective;
    this.emit({ type: 'hit', atMs: now, targetUid: enemy.uid, amount, crit, source, skillId, actionId });

    if (enemy.eliteTemplate?.kind === 'shellUntilHpLoss' && !enemy.shellBroken) {
      if ((enemy.maxHp - enemy.hp) * 10000 >= enemy.maxHp * enemy.eliteTemplate.removeAfterHpLossBp) enemy.shellBroken = true;
    }
    const boss = this.boss;
    if (boss && enemy.uid === boss.bodyUid) {
      boss.bodyDamageTaken += effective;
      const shell = boss.mechanics.find((mechanic) => mechanic.kind === 'shell');
      if (shell?.kind === 'shell' && !boss.shellBroken && boss.bodyDamageTaken * 10000 >= enemy.maxHp * shell.breakAfterDamagePctBp) {
        boss.shellBroken = true;
        boss.shellVulnUntilMs = now + shell.afterBreakDurationMs;
      }
    }
    // 副目標有效傷害（扣除過量）按比例回傳本體；回傳不暴擊、不觸發追加或再次回傳。
    if (boss && enemy.kind === 'add' && enemy.damageTransferBp > 0 && source !== 'mechanic') {
      const body = this.enemyByUid(boss.bodyUid);
      const transfer = floorSafe((effective * enemy.damageTransferBp) / 10000);
      if (body?.alive && transfer > 0) this.applyDamage(body, transfer, false, 'mechanic', null, 0, now);
    }

    if (enemy.hp > 0) return false;
    const wasMain = this.mainTarget()?.uid === enemy.uid;
    enemy.alive = false;
    this.emit({
      type: 'enemyDefeated',
      atMs: now,
      uid: enemy.uid,
      monsterId: enemy.monsterId,
      kind: enemy.kind,
      rewardPoints: enemy.rewardPoints,
    });
    if (boss && enemy.kind === 'add' && enemy.mechanicIndex !== null) this.onAddDestroyed(enemy, now);
    this.onEnemyKilled(enemy, wasMain, now);
    return true;
  }

  private onAddDestroyed(add: EnemyState, now: number): void {
    const boss = this.boss!;
    const mechanic = boss.mechanics[add.mechanicIndex!];
    if (mechanic?.kind !== 'periodicAdds' || !mechanic.onDestroyed) return;
    const effect = mechanic.onDestroyed;
    switch (effect.kind) {
      case 'bodyArmorDown':
        boss.armorDownBp = effect.pctBp;
        boss.armorDownUntilMs = now + effect.durationMs;
        break;
      case 'bodyVulnerable':
        // 另一個副目標仍可攻擊但不疊加：只刷新時間。
        boss.vulnerableBp = effect.pctBp;
        boss.vulnerableUntilMs = now + effect.durationMs;
        break;
      case 'bodyFixedDamage': {
        const body = this.enemyByUid(boss.bodyUid);
        if (body?.alive) {
          // 固定機制傷害：不暴擊、不吃角色加成、不觸發裝備。
          this.applyDamage(body, Math.max(1, floorSafe((body.maxHp * effect.pctOfMaxHpBp) / 10000)), false, 'mechanic', null, 0, now);
        }
        break;
      }
    }
  }

  /** 擊殺後的角色規則：專注保留、狀態轉移、主目標死亡觸發。轉移與觸發都只發生一次。 */
  private onEnemyKilled(enemy: EnemyState, wasMain: boolean, now: number): void {
    if (this.focusTargetUid === enemy.uid) {
      this.focusTargetUid = null;
      for (const rule of this.kit.resourceRules) {
        if (!rule.sameTargetOnly) continue;
        this.resources[rule.resource] = Math.min(this.resources[rule.resource] ?? 0, rule.keepOnTargetDeath ?? 0);
      }
    }
    if (this.engagedUid === enemy.uid) this.engagedUid = null;
    const next = this.mainTarget();
    for (const transfer of this.kit.deathTransfers) {
      let moved = 0;
      for (const statusId of transfer.statusIds) {
        if (moved >= transfer.kinds) break;
        const status = findStatus(enemy, statusId);
        if (!status || status.expiresAtMs <= now) continue;
        // 下一名敵人不存在則清除：狀態隨死亡目標消失，不保留到下一波。
        if (next) transferStatus(status, next, now, transfer.stackAmount, transfer.durationFactorBp);
        moved += 1;
      }
    }
    if (wasMain) this.fireProcs('mainTargetDied', now, next);
  }

  private registerBodyAction(target: EnemyState, actionId: number, now: number): void {
    // 反應核心：按行動不按段數，同一 action_id 只算一次（多段之間夾雜其他行動也不重算）。
    if (target.countedActionIds.includes(actionId)) return;
    target.countedActionIds.push(actionId);
    if (target.countedActionIds.length > COUNTED_ACTION_MEMORY) target.countedActionIds.shift();
    const template = target.eliteTemplate;
    if (template?.kind !== 'reactiveCore') return;
    target.reactiveCount += 1;
    if (target.reactiveCount >= template.actionsPerTrigger) {
      target.reactiveCount = 0;
      target.reactiveUntilMs = now + template.durationMs;
    }
  }

  /**
   * 套用狀態。fromBody：由本體行動套用時才觸發「破甲生效」「首次持續傷害」等效果；
   * 被動、傳說或死亡轉移施加的狀態不再觸發（一層追加鏈）。
   */
  private applyStatusFrom(target: EnemyState, spec: StatusSpec, stats: CombatStatsSnapshot, now: number, fromBody: boolean): void {
    const outcome = applyStatusSpec(target, spec, stats, now);
    const firstDot = outcome.isDot && !target.dotEverApplied;
    if (outcome.isDot) target.dotEverApplied = true;
    if (!fromBody) return;
    if (outcome.isArmorBreak) this.fireProcs('armorBreakApplied', now, target);
    if (firstDot) this.fireProcs('dotFirstOnTarget', now, target);
  }

  private copyDotTo(source: EnemyState, statusId: string, toOthers: number, now: number, fromBody: boolean): void {
    const found = longestPoison(source, statusId);
    if (!found) return;
    const others = this.aliveEnemies().filter((enemy) => enemy.uid !== source.uid).slice(0, toOthers);
    for (const other of others) {
      const firstDot = !other.dotEverApplied;
      copyPoisonTo(other, found.status, found.ticker);
      other.dotEverApplied = true;
      if (fromBody && firstDot) this.fireProcs('dotFirstOnTarget', now, other);
    }
  }

  // ───────────── 死亡、過關、BOSS 勝負 ─────────────

  private resolveDeathsAndProgress(now: number): void {
    this.enemies = this.enemies.filter((enemy) => enemy.alive);
    const boss = this.boss;
    if (boss) {
      const body = this.enemyByUid(boss.bodyUid);
      if (!body && now <= boss.durationMs) {
        boss.resolved = 'success';
        this.emit({ type: 'bossResolved', atMs: now, result: 'success', bossHpRemainingBp: 0 });
      } else if (now >= boss.durationMs) {
        boss.resolved = 'timeout';
        const remaining = body ? Math.ceil((body.hp * 10000) / body.maxHp) : 0;
        this.emit({ type: 'bossResolved', atMs: now, result: 'timeout', bossHpRemainingBp: remaining });
      }
      return;
    }
    if (this.enemies.length > 0 || this.nextWaveAtMs !== null || this.stageCleared) return;
    const total = this.totalWaves();
    if (total !== null && this.waveIndex + 1 >= total) {
      this.stageCleared = true;
      this.emit({ type: 'stageCleared', atMs: now, stageId: this.encounter.stage.id });
      return;
    }
    this.waveIndex += 1;
    this.nextWaveAtMs = now + this.catalog.tuning.battle.waveSpawnDelayMs;
  }

  // ───────────── 角色資源 ─────────────

  private gainResource(rule: ResourceRuleDef, amount: number): void {
    if (amount <= 0) return;
    this.resources[rule.resource] = Math.min(rule.max, (this.resources[rule.resource] ?? 0) + amount);
  }

  /** 專注：普攻命中同一主目標才累積；仍存活的舊目標被換掉（改目標）時歸零。 */
  private gainFocusOnBasicHit(target: EnemyState): void {
    for (const rule of this.kit.resourceRules) {
      if (!rule.sameTargetOnly) continue;
      if (this.focusTargetUid !== null && this.focusTargetUid !== target.uid && this.enemyByUid(this.focusTargetUid)) {
        this.resources[rule.resource] = 0;
      }
      this.focusTargetUid = target.uid;
      this.gainResource(rule, rule.gainOnBasicAttack);
    }
  }

  private gainOnBasicAttack(): void {
    for (const rule of this.kit.resourceRules) {
      if (rule.sameTargetOnly) continue;
      if (rule.gainOnBasicAttack > 0) {
        const every = rule.basicAttacksPerGain ?? 1;
        const count = (this.resourceBasicCounters[rule.resource] ?? 0) + 1;
        this.resourceBasicCounters[rule.resource] = count;
        if (count % every === 0) this.gainResource(rule, rule.gainOnBasicAttack);
      }
      this.gainResource(rule, rule.gainOnBodyDirectAction ?? 0);
    }
  }

  // ───────────── 角色行動 ─────────────

  private scheduleHeroActions(now: number): void {
    if (this.stageCleared) return;
    this.tryBasicAttack(now);
    this.tryCastSkill(now);
  }

  private tryBasicAttack(now: number): void {
    if (now < this.nextBasicAtMs) return;
    const target = this.mainTarget();
    if (!target) return;
    const actionId = this.newActionId();
    const stats = this.stats;
    const atMs = now + this.catalog.tuning.battle.minHitDelayMs;
    const riders: HitRider[] = [];
    for (const buff of this.buffs) if (buff.effect.kind === 'basicAppliesStatus') riders.push({ kind: 'status', spec: buff.effect.status });
    const heartBonus = this.cards.heartBonusBp;
    this.cards.heartBonusBp = 0;
    this.pushHit({
      atMs,
      actionId,
      source: 'basic',
      coefBp: this.catalog.tuning.hero.basicAttackCoefBp,
      targeting: { mode: 'fixed', uid: target.uid },
      stats,
      critAllowed: true,
      armorIgnoreBp: 0,
      bonusKeys: ['BASIC_DMG'],
      bonusPctBp: this.bodyBonusPct() + heartBonus,
      skillId: null,
      unitKind: null,
      riders,
      tracked: false,
      retargetOnce: this.kit.projectileRetargetOnce,
    });
    this.emit({ type: 'basicAttack', atMs: now, targetUid: target.uid, actionId });
    this.nextBasicAtMs = now + stats.basicIntervalMs;
    target.basicAttacksTaken += 1;

    this.gainOnBasicAttack();
    this.useChargedFollowUp(target, actionId, atMs, now);
    this.releaseStored('nextBasic', target, actionId, atMs, null);
    if (this.engagedUid !== target.uid) {
      this.engagedUid = target.uid;
      this.engagedSinceMs = now;
    }
    const origin: ProcOrigin = { actionId, atMs };
    for (const proc of this.procs) {
      const trigger = proc.def.trigger;
      switch (trigger.kind) {
        case 'basicAttackCount':
          if (proc.def.requireUnit && !this.hasUnit(proc.def.requireUnit)) break;
          proc.counter += 1;
          if (proc.counter % trigger.every === 0) this.triggerProc(proc, now, target, origin);
          break;
        case 'waveStartFirstBasic':
          if (this.waveFirstBasicPending) this.triggerProc(proc, now, target, origin);
          break;
        case 'sameTargetBasicCount':
          if (target.basicAttacksTaken % trigger.count === 0) this.triggerProc(proc, now, target, origin);
          break;
        case 'sameTargetDuration':
          if (now - this.engagedSinceMs >= trigger.durationMs) this.triggerProc(proc, now, target, origin);
          break;
        default:
          break;
      }
    }
    this.waveFirstBasicPending = false;
  }

  private tryCastSkill(now: number): void {
    if (now < this.castLockUntilMs) return;
    const main = this.mainTarget();
    if (!main) return;
    for (const slot of this.skillSlots) {
      if (now < slot.readyAtMs) continue;
      if (!this.shouldCast(slot, now)) continue;
      this.castSkill(slot, now, main);
      return;
    }
  }

  private shouldCast(slot: SkillSlot, now: number): boolean {
    const rule = slot.skill.effect!.autoCast;
    if (!this.hardRequirementMet(rule)) {
      slot.waitingSinceMs = null;
      return false;
    }
    if (slot.mode === 'immediate' || !this.loadoutCanProduce(rule) || this.softConditionMet(rule, now)) return true;
    slot.waitingSinceMs ??= now;
    return now - slot.waitingSinceMs >= this.catalog.tuning.battle.conditionFallbackMs;
  }

  /**
   * 等待條件只對「目前配置做得到」的條件有意義：例如沒帶切牌卻等「切牌後」、沒帶弱點標記卻等「標記後」，
   * 只會每次白等 3 秒。配置裡沒有任何來源時，視為條件成立直接施放。
   */
  private loadoutCanProduce(rule: AutoCastRule): boolean {
    const steps = this.skillSlots.flatMap((slot) => slot.skill.effect?.steps ?? []);
    const appliesStatus = (statusId: string): boolean =>
      steps.some(
        (step) =>
          (step.type === 'applyStatus' && step.status.statusId === statusId) ||
          (step.type === 'selfBuff' && step.effect.kind === 'basicAppliesStatus' && step.effect.status.statusId === statusId),
      );
    switch (rule.kind) {
      case 'pendingSetSuit':
        return steps.some((step) => step.type === 'playCards' && step.mode === 'setNext');
      case 'mainTargetHasStatusId':
      case 'requiresUnitPreferStatus':
      case 'targetStacksAtLeast':
        return appliesStatus(rule.statusId);
      case 'targetMarkKindsAtLeast':
        return rule.statusIds.filter((statusId) => appliesStatus(statusId)).length >= rule.amount;
      default:
        return true;
    }
  }

  /** 硬條件：缺乏必要對象（例如沒有砲台或戰獸）時持續跳過，不走等待後施放。 */
  private hardRequirementMet(rule: AutoCastRule): boolean {
    switch (rule.kind) {
      case 'requiresUnit':
        return this.units.filter((unit) => unit.kind === rule.unitKind).length >= rule.atLeast;
      case 'requiresUnitAndMainLacksStatus':
      case 'requiresUnitPreferStatus':
        return this.hasUnit(rule.unitKind);
      default:
        return true;
    }
  }

  private softConditionMet(rule: AutoCastRule, now: number): boolean {
    const main = this.mainTarget();
    switch (rule.kind) {
      case 'hasEnemy':
      case 'requiresUnit':
        return true;
      case 'mainTargetLacksStatus':
        return !main?.statuses.some((status) => status.kind === rule.statusKind && status.expiresAtMs - now > rule.refreshBelowMs);
      case 'mainTargetLacksStatusId':
        return !main?.statuses.some((status) => status.statusId === rule.statusId && status.expiresAtMs - now > rule.refreshBelowMs);
      case 'mainTargetHasStatusId':
        return Boolean(main && findStatus(main, rule.statusId));
      case 'targetStacksAtLeast':
        return stackCount(main, rule.statusId, now, rule.minRemainingMs ?? 0) >= rule.amount;
      case 'targetStacksBelow':
        return stackCount(main, rule.statusId, now) < rule.amount;
      case 'targetMarkKindsAtLeast':
        return main !== null && rule.statusIds.filter((statusId) => findStatus(main, statusId)).length >= rule.amount;
      case 'selfResourceAtLeast':
        return (this.resources[rule.resource] ?? 0) >= rule.amount;
      case 'selfResourceBelow':
        return (this.resources[rule.resource] ?? 0) < rule.amount;
      case 'selfBuffAbsent':
        return !this.buffs.some((buff) => buff.buffId === rule.buffId);
      case 'unitsBelowCapOrOldestExpiring': {
        const units = this.units.filter((unit) => unit.kind === rule.unitKind);
        if (units.length < rule.below) return true;
        return units.some((unit) => unit.expiresAtMs - now <= rule.oldestRemainingAtMostMs);
      }
      case 'groupBelowCapOrOldestExpiring': {
        const units = this.groupUnits(rule.capGroup);
        if (units.length < rule.below) return true;
        return units.some((unit) => unit.expiresAtMs - now <= rule.oldestRemainingAtMostMs);
      }
      case 'groupCountAtLeast':
        return this.groupUnits(rule.capGroup).length >= rule.amount;
      case 'groupOldestExpiring':
        return this.groupUnits(rule.capGroup).some((unit) => unit.expiresAtMs - now <= rule.remainingAtMostMs);
      case 'requiresUnitAndMainLacksStatus':
        return !main?.statuses.some((status) => status.statusId === rule.statusId);
      case 'requiresUnitPreferStatus':
        return Boolean(main && findStatus(main, rule.statusId));
      case 'nextSuitIsNotPreferred':
        return this.kit.suits !== null && this.nextSuit() !== this.kit.suits.preferredSuit;
      case 'nextSuitIsPreferred':
        return this.kit.suits !== null && this.nextSuit() === this.kit.suits.preferredSuit;
      case 'pendingSetSuit':
        return this.cards.setPending;
    }
  }

  private castSkill(slot: SkillSlot, now: number, main: EnemyState): void {
    const effect = slot.skill.effect!;
    const skillId = slot.skill.id;
    const actionId = this.newActionId();
    const stats = this.stats;
    const cooldown = scaleBp(slot.skill.cooldownMs, 10000 - stats.cdrBp);
    slot.readyAtMs = now + cooldown;
    this.cooldownMemory.set(skillId, slot.readyAtMs);
    slot.waitingSinceMs = null;
    this.castLockUntilMs = now + this.catalog.tuning.battle.castLockMs;
    this.emit({ type: 'skillCast', atMs: now, skillId, ultimate: slot.ultimate, actionId });

    const singleEnemyBonus =
      this.aliveEnemies().length === 1
        ? this.kit.singleEnemyCastBonus.filter((bonus) => bonus.skillId === skillId).reduce((sum, bonus) => sum + bonus.pctBp, 0)
        : 0;
    const ctx: CastContext = {
      now,
      atMs: now + this.catalog.tuning.battle.minHitDelayMs,
      actionId,
      stats,
      source: slot.ultimate ? 'ultimate' : 'skill',
      skillId,
      bodyBonusPct: this.bodyBonusPct() + singleEnemyBonus,
      previousTargets: [],
      previousMain: null,
      consumedTotal: 0,
      retained: false,
      firstDamageTargetCount: null,
      hasDamage: false,
      firstCardPlayed: false,
    };
    for (const step of effect.steps) this.executeStep(step, ctx);

    if (effect.generatesResource) {
      for (const rule of this.kit.resourceRules) {
        if (!slot.ultimate) this.gainResource(rule, rule.gainOnRegularSkillCast);
        if (ctx.hasDamage) this.gainResource(rule, rule.gainOnBodyDirectAction ?? 0);
      }
    }
    if (ctx.hasDamage) this.useChargedFollowUp(main, actionId, ctx.atMs, now);

    const trackedHits = this.hits.filter((hit) => hit.actionId === actionId && hit.tracked);
    const lastHitAtMs = trackedHits.reduce((latest, hit) => Math.max(latest, hit.atMs), ctx.atMs);
    const track: ActionTrack = {
      actionId,
      skillId,
      ultimate: slot.ultimate,
      remaining: trackedHits.length,
      lastLanded: false,
      killed: 0,
      lastTargetUid: main.uid,
    };
    if (trackedHits.length > 0) this.actions.set(actionId, track);
    const origin: ProcOrigin = { actionId, atMs: ctx.atMs, endAtMs: lastHitAtMs + this.tickMs };

    if (ctx.hasDamage) {
      this.releaseStored(slot.ultimate ? 'nextUltimate' : 'nextRegularSkill', main, actionId, ctx.atMs, null);
      this.releaseStored('nextSkillId', main, actionId, ctx.atMs, skillId);
    }
    if (slot.ultimate) this.fireProcs('ultimateCast', now, main, origin);
    const singleTarget = (ctx.firstDamageTargetCount ?? this.aliveEnemies().length) === 1;
    for (const proc of this.procs) {
      const trigger = proc.def.trigger;
      switch (trigger.kind) {
        case 'regularSkillCastCount':
          if (slot.ultimate) break;
          proc.counter += 1;
          if (proc.counter % trigger.every === 0) this.triggerProc(proc, now, main, origin);
          break;
        case 'distinctRegularSequence':
          if (slot.ultimate) break;
          proc.sequence.push(skillId);
          if (proc.sequence.length > trigger.length) proc.sequence.shift();
          if (proc.sequence.length === trigger.length && new Set(proc.sequence).size === trigger.length) {
            proc.sequence = [];
            this.triggerProc(proc, now, main, origin);
          }
          break;
        case 'skillCast':
          if (trigger.skillId === skillId && (!trigger.singleTargetOnly || singleTarget)) this.triggerProc(proc, now, main, origin);
          break;
        case 'skillCastConsumed':
          if (trigger.skillIds.includes(skillId) && ctx.consumedTotal >= trigger.minConsumed) this.triggerProc(proc, now, main, origin);
          break;
        case 'skillCastRetained':
          if (trigger.skillIds.includes(skillId) && ctx.retained) this.triggerProc(proc, now, main, origin);
          break;
        default:
          break;
      }
    }
    // 沒有命中段的技能（增益、召喚）施放即視為結束。
    if (trackedHits.length === 0) this.fireSkillEnded(track, now);
  }

  private executeStep(step: EffectStep, ctx: CastContext): void {
    switch (step.type) {
      case 'damage':
        this.executeDamage(step, ctx);
        return;
      case 'applyStatus': {
        if (step.requiresPassive && !this.hasPassive(step.requiresPassive)) return;
        let targets: EnemyState[];
        if (step.targets === 'sameAsPreviousDamage') targets = ctx.previousTargets;
        else if (step.targets === 'mainOfPreviousDamage') targets = ctx.previousMain ? [ctx.previousMain] : [];
        else if (step.targets === 'othersOfPreviousDamage') targets = ctx.previousTargets.filter((target) => target !== ctx.previousMain);
        else targets = this.selectTargets(step.targets);
        for (const target of targets) this.attachRider(ctx, target, { kind: 'status', spec: step.status });
        return;
      }
      case 'copyDotStack':
        if (ctx.previousMain) this.attachRider(ctx, ctx.previousMain, { kind: 'copyDot', statusId: step.statusId, toOthers: step.toOthers });
        return;
      case 'spawnUnit':
        this.spawnUnit(step, ctx.now, ctx.stats, ctx.skillId);
        return;
      case 'resolveOldestUnit': {
        const oldest = this.groupUnits(step.capGroup)[0];
        if (oldest) this.removeUnit(oldest, 'resolved', ctx.now);
        return;
      }
      case 'selfBuff':
        this.applySelfBuff(step, ctx.now);
        return;
      case 'gainResource': {
        const rule = this.kit.resourceRules.find((candidate) => candidate.resource === step.resource);
        if (rule) this.gainResource(rule, step.amount);
        return;
      }
      case 'playCards':
        this.playCards(step, ctx);
        return;
    }
  }

  /** 附帶效果掛在該目標本次行動的第一段命中後，確保「傷害後加層」；沒有命中段則立即套用。 */
  private attachRider(ctx: CastContext, target: EnemyState, rider: HitRider): void {
    const firstHit = this.hits.find(
      (hit) => hit.actionId === ctx.actionId && hit.tracked && hit.targeting.mode === 'fixed' && hit.targeting.uid === target.uid,
    );
    if (firstHit) {
      firstHit.riders = [...firstHit.riders, rider];
      return;
    }
    if (rider.kind === 'status') this.applyStatusFrom(target, rider.spec, ctx.stats, ctx.now, true);
    else this.copyDotTo(target, rider.statusId, rider.toOthers, ctx.now, true);
  }

  private executeDamage(step: DamageStep, ctx: CastContext): void {
    if (step.requiresPassive && !this.hasPassive(step.requiresPassive)) return;
    const unitPart = step.unitPart ?? null;
    if (unitPart && !this.hasUnit(unitPart)) return;
    const selected = this.selectTargets(step.targets);
    ctx.firstDamageTargetCount ??= selected.length;
    if (selected.length === 0) return;
    const main = this.mainTarget();
    const mode = step.distributeTotal ? 'reacquire' : (step.retarget ?? 'fixed');
    const consumed = step.consume ? this.consume(step, ctx, selected, main) : { global: 0, perTarget: new Map<number, number>() };

    const hits = step.hits ?? 1;
    const interval = step.hitIntervalMs ?? 0;
    const firstAtMs = ctx.atMs + (step.delayMs ?? 0);
    const base: Omit<PendingHit, 'seq' | 'atMs' | 'coefBp' | 'targeting'> = {
      actionId: ctx.actionId,
      source: unitPart ? 'summon' : ctx.source,
      stats: ctx.stats,
      critAllowed: !unitPart,
      armorIgnoreBp: step.armorIgnoreBp ?? 0,
      bonusKeys: unitPart ? ['SUMMON_DMG'] : ['SKILL_DMG', ...((step.extraBonusStats ?? []) as DamageBonusKey[])],
      bonusPctBp: unitPart ? this.unitPartBonusPct(unitPart, ctx.skillId) : ctx.bodyBonusPct,
      skillId: ctx.skillId,
      unitKind: unitPart,
      riders: [],
      tracked: true,
      retargetOnce: !unitPart && mode === 'fixed' && this.kit.projectileRetargetOnce,
    };
    const coefBp = step.coefBp + consumed.global;
    if (mode === 'reacquire') {
      for (let index = 0; index < hits; index += 1) {
        this.pushHit({
          ...base,
          atMs: firstAtMs + index * interval,
          coefBp,
          targeting: { mode: 'reacquire', rule: step.targets, distribute: Boolean(step.distributeTotal) },
        });
      }
    } else if (mode === 'rotate') {
      for (let index = 0; index < hits; index += 1) {
        this.pushHit({ ...base, atMs: firstAtMs + index * interval, coefBp, targeting: { mode: 'rotate', index } });
      }
    } else {
      for (const target of selected) {
        const targetCoef = coefBp + (consumed.perTarget.get(target.uid) ?? 0);
        for (let index = 0; index < hits; index += 1) {
          this.pushHit({ ...base, atMs: firstAtMs + index * interval, coefBp: targetCoef, targeting: { mode: 'fixed', uid: target.uid } });
        }
      }
    }
    if (!unitPart) ctx.hasDamage = true;
    ctx.previousTargets = selected;
    ctx.previousMain = selected.find((target) => target.uid === main?.uid) ?? null;
  }

  /**
   * 消耗資源／層數／印記／毒層／單位。保留層不計入消耗加傷（被動修正）；
   * 目標類消耗只看主目標（main）或每個被打到的目標各自計算（each）。
   */
  private consume(
    step: DamageStep,
    ctx: CastContext,
    selected: readonly EnemyState[],
    main: EnemyState | null,
  ): { global: number; perTarget: Map<number, number> } {
    const spec = step.consume!;
    const modifier = this.kit.consumeModifiers.find((candidate) => candidate.skillIds.includes(ctx.skillId));
    const take = (have: number): number => {
      const afterRetain = Math.max(0, have - (modifier?.reduceConsumedBy ?? 0));
      const count = Math.min(spec.max, modifier?.maxConsumed ?? Number.POSITIVE_INFINITY, afterRetain);
      if (have - count > 0 && (modifier?.reduceConsumedBy ?? 0) > 0) ctx.retained = true;
      return count;
    };
    const perUnitPart = (count: number, perUnitCoefBp: number): number =>
      Math.round(count * perUnitCoefBp * (1 + (modifier?.bonusByConsumedBp?.[count] ?? 0) / 10000));
    const perTarget = new Map<number, number>();
    const targetsForConsume = step.consumePer === 'each' ? selected : selected.filter((target) => target.uid === main?.uid);

    switch (spec.from) {
      case 'selfResource': {
        const have = this.resources[spec.resource] ?? 0;
        const count = take(have);
        this.resources[spec.resource] = have - count;
        ctx.consumedTotal += count;
        return { global: perUnitPart(count, spec.perUnitCoefBp), perTarget };
      }
      case 'units': {
        const units = this.groupUnits(spec.capGroup);
        const count = take(units.length);
        // 被消耗的單位直接移除，不再走自然到期或提前結算（不重複爆炸）。
        for (const unit of units.slice(0, count)) this.removeUnit(unit, 'consumed', ctx.now);
        ctx.consumedTotal += count;
        return { global: perUnitPart(count, spec.perUnitCoefBp), perTarget };
      }
      case 'targetStacks': {
        for (const target of targetsForConsume) {
          const count = take(stackCount(target, spec.statusId, ctx.now));
          removeStacks(target, spec.statusId, count);
          perTarget.set(target.uid, perUnitPart(count, spec.perUnitCoefBp));
          if (target.uid === main?.uid) ctx.consumedTotal += count;
        }
        return { global: 0, perTarget };
      }
      case 'targetMarks': {
        for (const target of targetsForConsume) {
          const present = spec.statusIds.filter((statusId) => findStatus(target, statusId));
          const count = take(present.length);
          for (const statusId of present.slice(0, count)) removeStatus(target, statusId);
          perTarget.set(target.uid, perUnitPart(count, spec.perUnitCoefBp));
          if (target.uid === main?.uid) ctx.consumedTotal += count;
        }
        return { global: 0, perTarget };
      }
      case 'targetDots': {
        if (!main || !selected.includes(main)) return { global: 0, perTarget };
        const count = take(stackCount(main, spec.statusId, ctx.now));
        const taken = takeShortestPoison(main, spec.statusId, count);
        ctx.consumedTotal += taken.length;
        if (taken.length > 0) this.pushDotBurst(main, taken, spec.remainingDamagePctBp, ctx);
        return { global: 0, perTarget };
      }
    }
  }

  /** 毒爆：被消耗毒層的剩餘傷害（各自快照）乘比例，以持續傷害來源一次打出；不暴擊、不觸發。 */
  private pushDotBurst(target: EnemyState, tickers: readonly DotTicker[], pctBp: number, ctx: CastContext): void {
    const raw = tickers.reduce(
      (sum, ticker) => sum + ticker.attack * ticker.coefPerTickBp * ticker.ticksLeft * (1 + ticker.dotBonusBp / 10000),
      0,
    );
    const coefBp = Math.round(((raw / ctx.stats.attack) * pctBp) / 10000);
    if (coefBp <= 0) return;
    this.pushHit({
      atMs: ctx.atMs,
      actionId: ctx.actionId,
      source: 'dot',
      coefBp,
      targeting: { mode: 'fixed', uid: target.uid },
      stats: ctx.stats,
      critAllowed: false,
      armorIgnoreBp: 0,
      bonusKeys: [],
      bonusPctBp: 0,
      skillId: ctx.skillId,
      unitKind: null,
      riders: [],
      tracked: false,
      retargetOnce: false,
    });
  }

  private applySelfBuff(step: SelfBuffStep, now: number): void {
    const extraMs = this.kit.buffDurationBonus.filter((bonus) => bonus.buffId === step.buffId).reduce((sum, bonus) => sum + bonus.addMs, 0);
    this.buffs = this.buffs.filter((buff) => buff.buffId !== step.buffId);
    const effect = step.effect;
    const charges = effect.kind === 'chargedFollowUp' ? effect.charges : effect.kind === 'suitBoost' ? 1 : 0;
    this.buffs.push({ buffId: step.buffId, label: step.label, expiresAtMs: now + step.durationMs + extraMs, effect, charges, firedProcIds: [] });
    if (effect.kind !== 'unitAttackIntervalMult') return;
    // 超頻立即作用於下一發：已排程的下一次攻擊依新間隔重新計算。
    for (const unit of this.units) {
      if (unit.kind !== effect.unitKind) continue;
      unit.nextAttackAtMs = now + scaleBp(unit.nextAttackAtMs - now, effect.multBp);
    }
  }

  /** 符文刻印：本體直接攻擊各用 1 次，最後一次用完觸發「刻印用盡」。 */
  private useChargedFollowUp(target: EnemyState, actionId: number, atMs: number, now: number): void {
    const buff = this.buffs.find((candidate) => candidate.effect.kind === 'chargedFollowUp' && candidate.charges > 0);
    if (buff?.effect.kind !== 'chargedFollowUp') return;
    buff.charges -= 1;
    this.pushFollowUp(target, buff.effect.coefBp, actionId, atMs);
    if (buff.charges > 0) return;
    this.buffs = this.buffs.filter((candidate) => candidate !== buff);
    this.fireMatching((trigger) => trigger.kind === 'buffChargesDepleted' && trigger.buffId === buff.buffId, now, target, { actionId, atMs });
  }

  private bodyBonusPct(): number {
    let total = 0;
    for (const buff of this.buffs) if (buff.effect.kind === 'bodyDamageBonus') total += buff.effect.pctBp;
    return total;
  }

  private unitBuffBonusPct(unitKind: UnitKind): number {
    let total = 0;
    for (const buff of this.buffs) if (buff.effect.kind === 'unitDamageBonus' && buff.effect.unitKind === unitKind) total += buff.effect.pctBp;
    return total;
  }

  /** 技能中的召喚段：吃該單位的增益與「下一次協同撲擊戰獸段」加成（用完即清）。 */
  private unitPartBonusPct(unitKind: UnitKind, skillId: string): number {
    const pending = this.unitPartBonus.get(skillId) ?? 0;
    this.unitPartBonus.delete(skillId);
    return this.unitBuffBonusPct(unitKind) + pending;
  }

  // ───────────── 召喚單位 ─────────────

  private addUnit(input: Omit<UnitState, 'uid' | 'spawnedAtMs' | 'nextAttackAtMs' | 'attacksMade' | 'pendingExtraCoefBp'>): UnitState {
    const unit: UnitState = {
      ...input,
      uid: this.nextUid,
      spawnedAtMs: this.timeMs,
      nextAttackAtMs: input.intervalMs > 0 ? this.timeMs + input.intervalMs : Number.POSITIVE_INFINITY,
      attacksMade: 0,
      pendingExtraCoefBp: 0,
    };
    this.nextUid += 1;
    this.units.push(unit);
    this.emit({ type: 'unitSpawned', atMs: this.timeMs, kind: unit.kind, uid: unit.uid });
    return unit;
  }

  /**
   * 生成單位；同群組達上限時先提前結算最舊者（替身爆炸、幻影補一擊）。
   * sourceSkillId 為 null 表示由被動或傳說生成，不再套用「生成時」效果（謝幕返場）。
   */
  private spawnUnit(step: SpawnUnitStep, now: number, stats: CombatStatsSnapshot, sourceSkillId: string | null): void {
    const capGroup = step.capGroup ?? step.unitKind;
    let existing = this.groupUnits(capGroup);
    while (existing.length >= step.cap && existing.length > 0) {
      const oldest = existing[0]!;
      this.removeUnit(oldest, oldest.onResolve ? 'resolved' : 'replaced', now);
      existing = this.groupUnits(capGroup);
    }
    const extra = sourceSkillId ? this.kit.unitFirstAttackExtra.find((candidate) => candidate.skillId === sourceSkillId) : undefined;
    this.addUnit({
      kind: step.unitKind,
      capGroup,
      expiresAtMs: now + step.durationMs,
      intervalMs: step.attackIntervalMs,
      coefBp: step.coefBp,
      stats,
      attackTargets: step.attackTargets ?? MAIN_TARGET,
      damageSource: step.damageSource ?? 'summon',
      onResolve: step.onResolve ?? null,
      firstAttackExtra: extra ? { coefBp: extra.coefBp, target: extra.target } : null,
    });
  }

  /** 移除單位；resolved（提前結算）與 expired（自然到期）依 onResolve 規則打出一次，consumed／replaced 不結算。 */
  private removeUnit(unit: UnitState, reason: UnitRemovedReason, now: number): void {
    this.units = this.units.filter((candidate) => candidate.uid !== unit.uid);
    this.emit({ type: 'unitRemoved', atMs: now, kind: unit.kind, uid: unit.uid, reason });
    const resolve = unit.onResolve;
    if (!resolve) return;
    const shouldResolve = reason === 'resolved' || (reason === 'expired' && resolve.when === 'always');
    if (!shouldResolve) return;
    const actionId = this.newActionId();
    for (const target of this.selectTargets(resolve.targets)) {
      this.pushHit({
        atMs: now,
        actionId,
        source: 'summon',
        coefBp: resolve.coefBp,
        targeting: { mode: 'fixed', uid: target.uid },
        stats: unit.stats,
        critAllowed: false,
        armorIgnoreBp: 0,
        bonusKeys: ['SUMMON_DMG'],
        bonusPctBp: this.unitBuffBonusPct(unit.kind),
        skillId: null,
        unitKind: unit.kind,
        riders: [],
        tracked: false,
        retargetOnce: false,
      });
    }
  }

  /** 同上限群組的有期限單位，依生成先後排序（最舊在前）。 */
  private groupUnits(capGroup: string): UnitState[] {
    return this.units
      .filter((unit) => unit.capGroup === capGroup && unit.expiresAtMs !== Number.POSITIVE_INFINITY)
      .sort((a, b) => a.spawnedAtMs - b.spawnedAtMs || a.uid - b.uid);
  }

  private hasUnit(unitKind: UnitKind): boolean {
    return this.units.some((unit) => unit.kind === unitKind);
  }

  private hasSummonUnit(): boolean {
    return this.units.some((unit) => unit.damageSource === 'summon' && unit.intervalMs > 0);
  }

  // ───────────── 花色輪轉 ─────────────

  private nextSuit(): CardSuit {
    const suits = this.kit.suits;
    return this.cards.setPending && suits ? suits.preferredSuit : this.cards.pointer;
  }

  private playCards(step: PlayCardsStep, ctx: CastContext): void {
    const suits = this.kit.suits;
    if (step.mode === 'setNext') {
      if (suits) this.cards.setPending = true;
      return;
    }
    const rotation = this.rotationList();
    const main = rotation[0];
    if (!main) return;
    ctx.firstDamageTargetCount ??= step.spreadTargets ? Math.min(step.count, rotation.length) : 1;
    for (let index = 0; index < step.count; index += 1) {
      let suit: CardSuit | null = null;
      let isSetCard = false;
      if (suits) {
        if (step.mode === 'fixedSequence') {
          suit = (index % SUIT_COUNT) as CardSuit;
        } else {
          // 切牌只改這一張的花色；花色指標照常前進一格（不造成額外出牌）。
          isSetCard = this.cards.setPending;
          suit = isSetCard ? suits.preferredSuit : this.cards.pointer;
          this.cards.setPending = false;
          this.cards.pointer = ((this.cards.pointer + 1) % SUIT_COUNT) as CardSuit;
        }
      }
      const target = step.spreadTargets ? rotation[index % rotation.length]! : main;
      this.playCard(suit, isSetCard, step, index, ctx, target);
    }
    ctx.hasDamage = true;
    ctx.previousTargets = [main];
    ctx.previousMain = main;
  }

  private playCard(suit: CardSuit | null, isSetCard: boolean, step: PlayCardsStep, index: number, ctx: CastContext, target: EnemyState): void {
    const suits = this.kit.suits;
    const atMs = ctx.atMs + index * (step.hitIntervalMs ?? 0);
    let effectMultBp = 10000;
    if (suit !== null && suits) {
      if (suit === suits.preferredSuit) {
        const boost = this.buffs.find((buff) => buff.effect.kind === 'suitBoost' && buff.charges > 0);
        if (boost?.effect.kind === 'suitBoost') {
          effectMultBp += boost.effect.pctBp;
          this.buffs = this.buffs.filter((buff) => buff !== boost);
        }
      }
      if (isSetCard) effectMultBp += this.kit.setSuitEffectBonusBp;
    }
    let coefBp = step.coefBp;
    const riders: HitRider[] = [];
    if (suits && suit === SUIT_SPADE) coefBp += scaleBp(suits.spadeExtraCoefBp, effectMultBp);
    if (suits && suit === SUIT_DIAMOND) {
      riders.push({
        kind: 'status',
        spec: {
          kind: 'armorBreak',
          statusId: DIAMOND_STATUS_ID,
          label: '方塊破甲',
          pctBp: scaleBp(suits.diamondArmorBreakBp, effectMultBp),
          durationMs: suits.diamondDurationMs,
        },
      });
    }
    this.pushHit({
      atMs,
      actionId: ctx.actionId,
      source: ctx.source,
      coefBp,
      targeting: { mode: 'fixed', uid: target.uid },
      stats: ctx.stats,
      critAllowed: true,
      armorIgnoreBp: 0,
      bonusKeys: ['SKILL_DMG'],
      bonusPctBp: ctx.bodyBonusPct,
      skillId: ctx.skillId,
      unitKind: null,
      riders,
      tracked: true,
      retargetOnce: false,
    });
    if (suits && suit === SUIT_HEART) this.cards.heartBonusBp = Math.max(this.cards.heartBonusBp, scaleBp(suits.heartNextBasicBonusBp, effectMultBp));
    if (suits && suit === SUIT_CLUB) {
      const other = this.otherThan(target);
      if (other) this.pushFollowUp(other, scaleBp(suits.clubExtraCoefBp, effectMultBp), ctx.actionId, atMs);
    }
    if (!ctx.firstCardPlayed) {
      ctx.firstCardPlayed = true;
      this.releaseStored('nextCard', target, ctx.actionId, atMs, null);
    }
    if (suit === null) return;
    this.emit({ type: 'cardPlayed', atMs: ctx.now, suit, actionId: ctx.actionId });
    this.cards.streak = this.cards.lastSuit === suit ? this.cards.streak + 1 : 1;
    this.cards.lastSuit = suit;
    if (this.cards.streak >= 2) {
      // 每湊成一組同花只觸發一次，第三張同花重新起算。
      this.cards.streak = 0;
      this.cards.lastSuit = null;
      this.fireProcs('sameSuitTwice', ctx.now, target, { actionId: ctx.actionId, atMs });
    }
  }

  // ───────────── 被動／裝備觸發 ─────────────

  private fireProcs(kind: ProcTrigger['kind'], now: number, target: EnemyState | null, origin?: ProcOrigin): void {
    for (const proc of this.procs) if (proc.def.trigger.kind === kind) this.triggerProc(proc, now, target, origin);
  }

  private fireMatching(predicate: (trigger: ProcTrigger) => boolean, now: number, target: EnemyState | null, origin?: ProcOrigin): void {
    for (const proc of this.procs) if (predicate(proc.def.trigger)) this.triggerProc(proc, now, target, origin);
  }

  private fireStatusExpired(statusId: string, enemy: EnemyState, now: number): void {
    this.fireMatching((trigger) => trigger.kind === 'statusExpired' && trigger.statusId === statusId, now, enemy);
  }

  private triggerProc(proc: ActiveProc, now: number, target: EnemyState | null, origin?: ProcOrigin): void {
    const def = proc.def;
    if (def.requireUnit && !this.hasUnit(def.requireUnit)) return;
    let buff: BuffState | undefined;
    if (def.requireBuff) {
      buff = this.buffs.find((candidate) => candidate.buffId === def.requireBuff);
      if (!buff) return;
      if (def.oncePerBuff && buff.firedProcIds.includes(def.procId)) return;
    }
    const icd = def.internalCooldownMs ?? 0;
    if (now - proc.lastTriggeredAtMs < icd) return;
    proc.lastTriggeredAtMs = now;
    if (buff && def.oncePerBuff) buff.firedProcIds.push(def.procId);
    this.applyPayload(def.procId, def.payload, now, target, origin);
  }

  private applyPayload(procId: string, payload: ProcPayload, now: number, target: EnemyState | null, origin?: ProcOrigin): void {
    switch (payload.kind) {
      case 'nextUnitRoundBonus':
        this.unitRoundBonus = { unitKind: payload.unitKind, pctBp: payload.pctBp, remaining: payload.maxUnits };
        return;
      case 'nextUnitRoundExtra':
        for (const unit of this.units) if (unit.kind === payload.unitKind) unit.pendingExtraCoefBp = payload.coefBp;
        return;
      case 'nextSkillUnitPartBonus':
        this.unitPartBonus.set(payload.skillId, payload.pctBp);
        return;
      case 'spawnUnit':
        this.spawnUnit(payload.unit, now, this.stats, null);
        return;
      case 'applyStatus': {
        const destination = payload.target === 'same' ? target : target ? this.otherThan(target) : null;
        if (destination?.alive) this.applyStatusFrom(destination, payload.status, this.stats, now, false);
        return;
      }
      case 'copyDot':
        if (target?.alive) this.copyDotTo(target, payload.statusId, payload.toOthers, now, false);
        return;
      case 'extraHit':
        break;
    }
    const fallbackAtMs = now + this.catalog.tuning.battle.minHitDelayMs;
    switch (payload.timing) {
      case 'immediate':
      case 'afterAction': {
        const atMs = payload.timing === 'afterAction' ? (origin?.endAtMs ?? origin?.atMs ?? fallbackAtMs) : (origin?.atMs ?? fallbackAtMs);
        const actionId = origin?.actionId ?? this.newActionId();
        for (const entry of this.resolveProcTargets(payload.target, payload.count, payload.coefBp, payload.fallbackMainCoefBp ?? 0, target)) {
          this.pushFollowUp(entry.target, entry.coefBp, actionId, atMs);
        }
        return;
      }
      case 'nextSummonHit':
        this.storeExtraHit(procId, payload, this.hasSummonUnit() ? 'nextSummonHit' : 'nextBasic');
        return;
      default:
        this.storeExtraHit(procId, payload, payload.timing);
    }
  }

  /** 同一來源最多存一筆；再次觸發只把次數補滿，不可囤積。 */
  private storeExtraHit(procId: string, payload: Extract<ProcPayload, { kind: 'extraHit' }>, timing: StoredTiming): void {
    const charges = payload.charges ?? 1;
    const existing = this.stored.find((entry) => entry.procId === procId);
    if (existing) {
      existing.charges = Math.max(existing.charges, charges);
      return;
    }
    this.stored.push({
      procId,
      coefBp: payload.coefBp,
      target: payload.target,
      count: payload.count,
      fallbackMainCoefBp: payload.fallbackMainCoefBp ?? 0,
      timing,
      skillId: payload.skillId ?? null,
      charges,
    });
  }

  private releaseStored(timing: StoredTiming, target: EnemyState, actionId: number, atMs: number, skillId: string | null): void {
    const due = this.stored.filter((entry) => entry.timing === timing && (timing !== 'nextSkillId' || entry.skillId === skillId));
    if (due.length === 0) return;
    for (const entry of due) {
      for (const hit of this.resolveProcTargets(entry.target, entry.count, entry.coefBp, entry.fallbackMainCoefBp, target)) {
        this.pushFollowUp(hit.target, hit.coefBp, actionId, atMs);
      }
      entry.charges -= 1;
    }
    this.stored = this.stored.filter((entry) => entry.charges > 0);
  }

  private resolveProcTargets(
    rule: ProcTarget,
    count: number | undefined,
    coefBp: number,
    fallbackMainCoefBp: number,
    reference: EnemyState | null,
  ): { target: EnemyState; coefBp: number }[] {
    const main = this.mainTarget();
    const anchor = reference?.alive ? reference : main;
    const others = this.aliveEnemies().filter((enemy) => enemy.uid !== anchor?.uid);
    const each = (targets: readonly EnemyState[]) => targets.map((target) => ({ target, coefBp }));
    switch (rule) {
      case 'same':
        return anchor ? each([anchor]) : [];
      case 'main':
        return main ? each([main]) : [];
      case 'otherPreferred': {
        const target = others[0] ?? anchor;
        return target ? each([target]) : [];
      }
      case 'otherOnly':
        if (others[0]) return each([others[0]]);
        return fallbackMainCoefBp > 0 && main ? [{ target: main, coefBp: fallbackMainCoefBp }] : [];
      case 'othersEach':
        return each(others.slice(0, count ?? others.length));
      case 'upToEach':
        return each([...(anchor ? [anchor] : []), ...others].slice(0, count ?? this.catalog.tuning.battle.monstersPerWave));
    }
  }

  private pushFollowUp(target: EnemyState, coefBp: number, actionId: number, atMs: number): void {
    // 追加傷害：不暴擊、只吃追擊加成，且來源為 followUp，因此不會再觸發任何被動或裝備。
    this.pushHit({
      atMs,
      actionId,
      source: 'followUp',
      coefBp,
      targeting: { mode: 'fixed', uid: target.uid },
      stats: this.stats,
      critAllowed: false,
      armorIgnoreBp: 0,
      bonusKeys: ['FOLLOWUP_DMG'],
      bonusPctBp: 0,
      skillId: null,
      unitKind: null,
      riders: [],
      tracked: false,
      retargetOnce: false,
    });
  }

  // ───────────── 目標 ─────────────

  private aliveEnemies(): EnemyState[] {
    return this.enemies.filter((enemy) => enemy.alive).sort((a, b) => a.uid - b.uid);
  }

  /** 普通戰鬥：最早生成的存活敵人；BOSS 戰：本體，除非開戰前設定優先機制目標。 */
  private mainTarget(): EnemyState | null {
    const alive = this.aliveEnemies();
    if (this.boss) {
      if (this.hero.targetPolicy === 'mechanicFirst') {
        const add = alive.find((enemy) => enemy.kind === 'add');
        if (add) return add;
      }
      return alive.find((enemy) => enemy.uid === this.boss!.bodyUid) ?? alive[0] ?? null;
    }
    return alive[0] ?? null;
  }

  /** 輪替順序：主目標在前，其餘依生成序。 */
  private rotationList(): EnemyState[] {
    const main = this.mainTarget();
    if (!main) return [];
    return [main, ...this.aliveEnemies().filter((enemy) => enemy.uid !== main.uid)];
  }

  private otherThan(reference: EnemyState): EnemyState | null {
    return this.aliveEnemies().find((enemy) => enemy.uid !== reference.uid) ?? null;
  }

  /** 範圍攻擊按主目標、生成序處理，最多 N 名；目標不足時不補足空段。 */
  private selectTargets(rule: TargetRule): EnemyState[] {
    const rotation = this.rotationList();
    const main = rotation[0];
    if (!main) return [];
    switch (rule.kind) {
      case 'main':
        return [main];
      case 'upTo':
        return rotation.slice(0, rule.count);
      case 'others':
        return rotation.slice(1, 1 + rule.count);
      case 'othersPreferred':
        return [rotation[1] ?? main];
    }
  }

  private enemyByUid(uid: number): EnemyState | undefined {
    return this.enemies.find((enemy) => enemy.uid === uid && enemy.alive);
  }

  private newActionId(): number {
    const id = this.nextActionId;
    this.nextActionId += 1;
    return id;
  }

  private pushHit(hit: Omit<PendingHit, 'seq'>): void {
    this.hits.push({ ...hit, seq: this.nextHitSeq });
    this.nextHitSeq += 1;
  }

  private emit(event: BattleEvent): void {
    this.events.push(event);
  }

  // ───────────── 畫面快照 ─────────────

  view(): BattleView {
    const now = this.timeMs;
    const enemies: EnemyView[] = this.aliveEnemies().map((enemy) => ({
      uid: enemy.uid,
      monsterId: enemy.monsterId,
      name: enemy.name,
      kind: enemy.kind,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      statuses: enemy.statuses.map((status) => ({
        statusId: status.statusId,
        label: status.label,
        remainingMs: Math.max(0, status.expiresAtMs - now),
        stacks: status.kind === 'dotStack' ? status.poison.length : status.stacks,
      })),
      traits: this.traitsOf(enemy, now),
    }));
    const boss = this.boss;
    const body = boss ? this.enemies.find((enemy) => enemy.uid === boss.bodyUid) : undefined;
    const suits = this.kit.suits;
    return {
      encounterKind: this.encounter.kind,
      stageId: this.encounter.stage.id,
      timeMs: now,
      waveIndex: this.waveIndex,
      totalWaves: this.totalWaves(),
      enemies,
      hero: {
        basicIntervalMs: this.stats.basicIntervalMs,
        skills: this.skillSlots.map((slot) => ({
          skillId: slot.skill.id,
          ultimate: slot.ultimate,
          cooldownMs: scaleBp(slot.skill.cooldownMs, 10000 - this.stats.cdrBp),
          remainingMs: Math.max(0, slot.readyAtMs - now),
          waitingForCondition: slot.waitingSinceMs !== null,
        })),
        resources: { ...this.resources },
        units: this.units.map((unit) => {
          const permanent = unit.expiresAtMs === Number.POSITIVE_INFINITY;
          return { uid: unit.uid, kind: unit.kind, remainingMs: permanent ? 0 : Math.max(0, unit.expiresAtMs - now), permanent };
        }),
        buffs: this.buffs.map((buff) => ({
          buffId: buff.buffId,
          label: buff.label,
          remainingMs: Math.max(0, buff.expiresAtMs - now),
          charges: buff.charges,
        })),
        cards: suits ? { nextSuit: this.nextSuit(), setPending: this.cards.setPending } : null,
      },
      boss: boss
        ? {
            name: this.map.boss.name,
            bodyUid: boss.bodyUid,
            elapsedMs: Math.min(now, boss.durationMs),
            durationMs: boss.durationMs,
            remainingMs: Math.max(0, boss.durationMs - now),
            hp: body?.alive ? body.hp : 0,
            maxHp: body?.maxHp ?? 1,
            phaseLabels: this.bossPhaseLabels(now),
            resolved: boss.resolved,
          }
        : null,
    };
  }

  private traitsOf(enemy: EnemyState, now: number): string[] {
    const template = enemy.eliteTemplate;
    if (!template) return [];
    switch (template.kind) {
      case 'armorMult':
        return [template.label];
      case 'periodicVulnerability': {
        const offset = (now - enemy.spawnedAtMs) % template.cycleMs;
        return [offset >= template.cycleMs - template.windowMs ? `${template.label}：易傷` : template.label];
      }
      case 'armorDropBelowHp':
        return [enemy.hp * 10000 < enemy.maxHp * template.hpBelowBp ? `${template.label}：護甲下降` : template.label];
      case 'reactiveCore':
        return [now < enemy.reactiveUntilMs ? `${template.label}：易傷` : `${template.label} ${enemy.reactiveCount}/${template.actionsPerTrigger}`];
      case 'shellUntilHpLoss':
        return [enemy.shellBroken ? `${template.label}已解除` : template.label];
    }
  }
}
