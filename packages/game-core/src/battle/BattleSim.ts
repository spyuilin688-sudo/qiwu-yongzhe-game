import {
  getMap,
  type AutoCastRule,
  type BossMechanicDef,
  type ContentCatalog,
  type DamageStep,
  type EffectStep,
  type MapDef,
  type ProcDef,
  type ResourceId,
  type ResourceRuleDef,
  type SkillDef,
  type StatusSpec,
  type TargetRule,
  type UnitKind,
  type ConsumeModifierDef,
} from '@qiwu/content';
import type { CombatStatsSnapshot, DamageBonusKey, HeroLoadoutSnapshot, SkillConditionMode } from '../model/types.ts';
import { bossHp, eliteHp, eliteRelicPoints, monsterArmor, normalMonsterHp, normalRelicPoints } from '../rules/formulas.ts';
import { ceilSafe, floorSafe } from '../util/math.ts';
import { SeededRandom } from '../util/rng.ts';
import type {
  BattleEvent,
  BattleSetup,
  BattleView,
  BuffState,
  DamageSource,
  Encounter,
  EnemyState,
  EnemyView,
  PendingHit,
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

type PendingTiming = 'nextBasic' | 'nextRegularSkill' | 'nextUltimate';

interface StoredExtraHit {
  readonly procId: string;
  readonly coefBp: number;
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

/**
 * 固定 50ms 邏輯刻的戰鬥模擬（純邏輯，不依賴畫面或時鐘）。
 * 同一刻固定順序：到期／持續傷害 → 已排程命中 → 清理死亡 → 一次性產出與過關 → 生成下一波 →
 * 排程普攻／技能 → 回傳畫面事件（規格 02）。相同設定、種子與輸入必定重播相同結果。
 * 角色沒有 HP，敵人不攻擊角色。
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
  private resourceRules: ResourceRuleDef[] = [];
  private consumeModifiers: ConsumeModifierDef[] = [];
  private resources: Partial<Record<ResourceId, number>> = {};
  private stored: Record<PendingTiming, StoredExtraHit[]> = { nextBasic: [], nextRegularSkill: [], nextUltimate: [] };
  private unitRoundBonus: { unitKind: UnitKind; pctBp: number; remaining: number } | null = null;
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

  /** 普通戰鬥換裝：新行動使用新屬性；已排程命中沿用施放時快照。BOSS 整場不得呼叫。 */
  updateStats(stats: CombatStatsSnapshot): void {
    if (this.encounter.kind === 'boss') throw new Error('BOSS 戰使用開戰快照，不能中途換屬性');
    this.stats = stats;
  }

  /** 配置或職業改變：重建技能與被動；職業不同時清除資源與召喚物（換職要重驗上限）。 */
  updateHero(hero: HeroLoadoutSnapshot): void {
    if (this.encounter.kind === 'boss') throw new Error('BOSS 戰凍結配置');
    const jobChanged = hero.jobId !== this.hero.jobId;
    this.hero = hero;
    this.rebuildHeroKit();
    if (jobChanged) {
      this.resources = {};
      this.stored = { nextBasic: [], nextRegularSkill: [], nextUltimate: [] };
      for (const unit of this.units) this.emit({ type: 'unitRemoved', atMs: this.timeMs, kind: unit.kind, uid: unit.uid, reason: 'replaced' });
      this.units = [];
      this.buffs = [];
      this.unitRoundBonus = null;
    }
  }

  /** 進入下一關（由引擎在收到 stageCleared 後呼叫）；角色冷卻、資源與召喚物延續。 */
  enterEncounter(encounter: Encounter): void {
    if (encounter.kind === 'boss' || this.encounter.kind === 'boss') throw new Error('BOSS 戰需建立新的模擬');
    this.encounter = encounter;
    this.map = getMap(this.catalog, encounter.stage.mapNumber);
    for (const enemy of this.enemies) enemy.alive = false;
    this.enemies = [];
    this.hits = [];
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
    this.expireTimedEffects(now);
    this.processDots(now);
    this.processUnits(now);
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
    this.resourceRules = [];
    this.consumeModifiers = [];
    for (const passiveId of this.hero.passiveIds) {
      const effect = this.catalog.passives.get(passiveId)?.effect;
      if (!effect) continue;
      procDefs.push(...effect.procs);
      if (effect.resource) this.resourceRules.push(effect.resource);
      if (effect.consumeModifier) this.consumeModifiers.push(effect.consumeModifier);
    }
    for (const baseId of this.hero.legendBaseIds) {
      const legend = this.catalog.equipment.get(baseId)?.legend;
      if (legend) procDefs.push(...legend.procs);
    }
    this.procs = procDefs.map(
      (def) => previousProcs.get(def.procId) ?? { def, counter: 0, sequence: [], lastTriggeredAtMs: Number.NEGATIVE_INFINITY },
    );
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

  private expireTimedEffects(now: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      enemy.statuses = enemy.statuses.filter((status) => {
        if (status.kind === 'dot') return status.dot !== null && status.dot.ticksLeft > 0;
        return status.expiresAtMs > now;
      });
      if (enemy.kind === 'add' && enemy.expiresAtMs !== null && enemy.expiresAtMs <= now) {
        enemy.alive = false;
        this.emit({ type: 'enemyRemoved', atMs: now, uid: enemy.uid, reason: 'expired' });
      }
    }
    this.units = this.units.filter((unit) => {
      if (unit.expiresAtMs > now) return true;
      this.emit({ type: 'unitRemoved', atMs: now, kind: unit.kind, uid: unit.uid, reason: 'expired' });
      return false;
    });
    this.buffs = this.buffs.filter((buff) => buff.expiresAtMs > now);
  }

  private processDots(now: number): void {
    for (const enemy of this.enemies) {
      for (const status of enemy.statuses) {
        const dot = status.dot;
        if (!dot || !enemy.alive) continue;
        while (dot.ticksLeft > 0 && dot.nextTickAtMs <= now && enemy.alive) {
          dot.ticksLeft -= 1;
          dot.nextTickAtMs += dot.intervalMs;
          const amount = this.calculateDamage({
            attack: dot.attack,
            coefBp: dot.coefPerTickBp,
            bonusBp: dot.dotBonusBp,
            critMultBp: 10000,
            target: enemy,
            armorIgnoreBp: 0,
            source: 'dot',
          });
          this.applyDamage(enemy, amount, false, 'dot', null, 0, now);
        }
      }
    }
  }

  private processUnits(now: number): void {
    for (const unit of this.units) {
      if (unit.nextAttackAtMs > now) continue;
      const target = this.mainTarget();
      if (!target) continue;
      let bonusBp = unit.stats.bonusBp.SUMMON_DMG;
      if (this.unitRoundBonus && this.unitRoundBonus.unitKind === unit.kind && this.unitRoundBonus.remaining > 0) {
        bonusBp += this.unitRoundBonus.pctBp;
        this.unitRoundBonus.remaining -= 1;
        if (this.unitRoundBonus.remaining === 0) this.unitRoundBonus = null;
      }
      const amount = this.calculateDamage({
        attack: unit.stats.attack,
        coefBp: unit.coefBp,
        bonusBp,
        critMultBp: 10000,
        target,
        armorIgnoreBp: 0,
        source: 'summon',
        unitKind: unit.kind,
      });
      this.applyDamage(target, amount, false, 'summon', null, 0, now);
      const overclock = this.buffs.find((buff) => buff.unitKind === unit.kind);
      const interval = overclock ? Math.round((unit.intervalMs * overclock.intervalMultBp) / 10000) : unit.intervalMs;
      unit.nextAttackAtMs = now + interval;
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
    if (hit.targeting.mode === 'fixed') {
      const target = this.enemyByUid(hit.targeting.uid);
      // 目標已死：此段落空，不把空箭轉向主目標（規格：一般技能不補足空段）。
      if (!target?.alive) return;
      this.strike(hit, target, hit.coefBp, now);
      return;
    }
    const targets = this.selectTargets(hit.targeting.rule);
    if (targets.length === 0) return;
    const coef = hit.targeting.distribute ? hit.coefBp / targets.length : hit.coefBp;
    for (const target of targets) this.strike(hit, target, coef, now);
  }

  private strike(hit: PendingHit, target: EnemyState, coefBp: number, now: number): void {
    let critMultBp = 10000;
    let crit = false;
    if (hit.critAllowed) {
      crit = this.rng.nextInt(10000) < hit.stats.critRateBp;
      if (crit) critMultBp = hit.stats.critMultBp;
    }
    const bonusBp = hit.bonusKeys.reduce((sum, key) => sum + hit.stats.bonusBp[key], 0);
    const amount = this.calculateDamage({
      attack: hit.stats.attack,
      coefBp,
      bonusBp,
      critMultBp,
      target,
      armorIgnoreBp: hit.armorIgnoreBp,
      source: hit.source,
    });
    const isBodyAction = BODY_ACTION_SOURCES.has(hit.source);
    if (isBodyAction) this.registerBodyAction(target, hit.actionId, now);
    const killed = this.applyDamage(target, amount, crit, hit.source, hit.skillId, hit.actionId, now);

    if (target.alive) {
      for (const status of hit.statuses) this.applyStatus(target, status, hit.stats, now);
    }
    if (!isBodyAction) return;
    // 只有本體直接行動會觸發被動／裝備；追加、持續、召喚傷害一律不觸發（一層追加鏈）。
    if (crit) this.fireProcs(hit.source === 'basic' ? 'basicCrit' : 'directSkillCrit', now, target);
    if (killed && hit.source === 'basic') this.fireProcs('basicKill', now, target);
    if (target.statuses.length > 0 || killed) {
      for (const proc of this.procs) {
        if (proc.def.trigger.kind !== 'bodyHitOnTargetWithStatus') continue;
        const statusId = proc.def.trigger.statusId;
        if (target.statuses.some((status) => status.statusId === statusId)) this.triggerProc(proc, now, target);
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
    unitKind?: UnitKind;
  }): number {
    const armorFactorConstant = this.catalog.tuning.armor.factorConstant;
    const armor = this.effectiveArmor(input.target, this.timeMs) * (1 - input.armorIgnoreBp / 10000);
    const armorFactor = armorFactorConstant / (armorFactorConstant + Math.max(0, armor));
    const takenBp = this.damageTakenBp(input.target, this.timeMs, input.source, input.unitKind);
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

  /** 受傷增益以加總計算（N）；召喚物另吃目標上的召喚易傷（集火信標）。 */
  private damageTakenBp(enemy: EnemyState, now: number, source: DamageSource, unitKind?: UnitKind): number {
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
    if (source === 'summon' && unitKind) {
      // 召喚易傷只對指定單位生效（集火信標只加砲台，不加機甲）。
      let beacon = 0;
      for (const status of enemy.statuses) {
        if (status.kind === 'summonDamageTaken' && status.unitKinds.includes(unitKind)) beacon = Math.max(beacon, status.pctBp);
      }
      taken += beacon;
    }
    return taken;
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

  private applyStatus(target: EnemyState, spec: StatusSpec, stats: CombatStatsSnapshot, now: number): void {
    const existing = target.statuses.find((status) => status.statusId === spec.statusId);
    switch (spec.kind) {
      case 'armorBreak':
      case 'summonDamageTaken':
      case 'mark': {
        const pctBp = spec.kind === 'mark' ? 0 : spec.pctBp;
        // 同名狀態只刷新／取較高值，不疊層。
        if (existing) {
          existing.expiresAtMs = now + spec.durationMs;
          existing.pctBp = Math.max(existing.pctBp, pctBp);
        } else {
          target.statuses.push({
            statusId: spec.statusId,
            kind: spec.kind,
            label: spec.label,
            expiresAtMs: now + spec.durationMs,
            pctBp,
            unitKinds: spec.kind === 'summonDamageTaken' ? [...spec.unitKinds] : [],
            dot: null,
          });
        }
        if (spec.kind === 'armorBreak') this.fireProcs('armorBreakApplied', now, target);
        break;
      }
      case 'dot': {
        const dot = {
          coefPerTickBp: spec.coefPerTickBp,
          ticksLeft: spec.ticks,
          intervalMs: spec.intervalMs,
          nextTickAtMs: now + spec.intervalMs,
          attack: stats.attack,
          dotBonusBp: stats.bonusBp.DOT_DMG,
        };
        const expiresAtMs = now + spec.intervalMs * spec.ticks;
        if (existing) {
          existing.dot = dot;
          existing.expiresAtMs = expiresAtMs;
        } else {
          target.statuses.push({ statusId: spec.statusId, kind: 'dot', label: spec.label, expiresAtMs, pctBp: 0, unitKinds: [], dot });
        }
        break;
      }
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
      skillId: null,
      statuses: [],
    });
    this.emit({ type: 'basicAttack', atMs: now, targetUid: target.uid, actionId });
    this.nextBasicAtMs = now + stats.basicIntervalMs;

    for (const rule of this.resourceRules) this.gainResource(rule, rule.gainOnBasicAttack);
    this.releaseStored('nextBasic', target, actionId, atMs);
    for (const proc of this.procs) {
      const trigger = proc.def.trigger;
      if (trigger.kind === 'basicAttackCount') {
        proc.counter += 1;
        if (proc.counter % trigger.every === 0) this.triggerProc(proc, now, target, { actionId, atMs });
      } else if (trigger.kind === 'waveStartFirstBasic' && this.waveFirstBasicPending) {
        this.triggerProc(proc, now, target, { actionId, atMs });
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
    if (slot.mode === 'immediate' || this.softConditionMet(rule, now)) return true;
    slot.waitingSinceMs ??= now;
    return now - slot.waitingSinceMs >= this.catalog.tuning.battle.conditionFallbackMs;
  }

  private hardRequirementMet(rule: AutoCastRule): boolean {
    if (rule.kind === 'requiresUnit') return this.units.filter((unit) => unit.kind === rule.unitKind).length >= rule.atLeast;
    if (rule.kind === 'requiresUnitAndMainLacksStatus') return this.units.some((unit) => unit.kind === rule.unitKind);
    return true;
  }

  private softConditionMet(rule: AutoCastRule, now: number): boolean {
    const main = this.mainTarget();
    switch (rule.kind) {
      case 'hasEnemy':
      case 'requiresUnit':
        return true;
      case 'mainTargetLacksStatus':
        return !main?.statuses.some((status) => status.kind === rule.statusKind && status.expiresAtMs - now > rule.refreshBelowMs);
      case 'selfResourceAtLeast':
        return (this.resources[rule.resource] ?? 0) >= rule.amount;
      case 'unitsBelowCapOrOldestExpiring': {
        const units = this.units.filter((unit) => unit.kind === rule.unitKind);
        if (units.length < rule.below) return true;
        return units.some((unit) => unit.expiresAtMs - now <= rule.oldestRemainingAtMostMs);
      }
      case 'requiresUnitAndMainLacksStatus':
        return !main?.statuses.some((status) => status.statusId === rule.statusId);
    }
  }

  private castSkill(slot: SkillSlot, now: number, main: EnemyState): void {
    const effect = slot.skill.effect!;
    const actionId = this.newActionId();
    const stats = this.stats;
    const cooldown = Math.round((slot.skill.cooldownMs * (10000 - stats.cdrBp)) / 10000);
    slot.readyAtMs = now + cooldown;
    this.cooldownMemory.set(slot.skill.id, slot.readyAtMs);
    slot.waitingSinceMs = null;
    this.castLockUntilMs = now + this.catalog.tuning.battle.castLockMs;
    this.emit({ type: 'skillCast', atMs: now, skillId: slot.skill.id, ultimate: slot.ultimate, actionId });

    const source: DamageSource = slot.ultimate ? 'ultimate' : 'skill';
    const atMs = now + this.catalog.tuning.battle.minHitDelayMs;
    let previousTargets: EnemyState[] = [];
    let hasDamage = false;
    for (const step of effect.steps) {
      previousTargets = this.executeStep(step, { now, atMs, actionId, stats, source, skillId: slot.skill.id, previousTargets });
      if (step.type === 'damage') hasDamage = true;
    }

    if (!slot.ultimate && effect.generatesResource) {
      for (const rule of this.resourceRules) this.gainResource(rule, rule.gainOnRegularSkillCast);
    }
    if (slot.ultimate) {
      if (hasDamage) this.releaseStored('nextUltimate', main, actionId, atMs);
      this.fireProcs('ultimateCast', now, main, { actionId, atMs });
      return;
    }
    if (hasDamage) this.releaseStored('nextRegularSkill', main, actionId, atMs);
    for (const proc of this.procs) {
      const trigger = proc.def.trigger;
      if (trigger.kind === 'regularSkillCastCount') {
        proc.counter += 1;
        if (proc.counter % trigger.every === 0) this.triggerProc(proc, now, main, { actionId, atMs });
      } else if (trigger.kind === 'distinctRegularSequence') {
        proc.sequence.push(slot.skill.id);
        if (proc.sequence.length > trigger.length) proc.sequence.shift();
        if (proc.sequence.length === trigger.length && new Set(proc.sequence).size === trigger.length) {
          proc.sequence = [];
          this.triggerProc(proc, now, main, { actionId, atMs });
        }
      } else if (trigger.kind === 'skillCast' && trigger.skillId === slot.skill.id) {
        this.triggerProc(proc, now, main, { actionId, atMs });
      }
    }
  }

  private executeStep(
    step: EffectStep,
    ctx: {
      now: number;
      atMs: number;
      actionId: number;
      stats: CombatStatsSnapshot;
      source: DamageSource;
      skillId: string;
      previousTargets: EnemyState[];
    },
  ): EnemyState[] {
    switch (step.type) {
      case 'damage':
        return this.executeDamage(step, ctx);
      case 'applyStatus': {
        const targets = step.targets === 'sameAsPreviousDamage' ? ctx.previousTargets : this.selectTargets(step.targets);
        // 狀態附在該目標本次行動的第一段命中後套用，確保「傷害後加層」的順序。
        for (const target of targets) {
          const firstHit = this.hits.find(
            (hit) => hit.actionId === ctx.actionId && hit.targeting.mode === 'fixed' && hit.targeting.uid === target.uid,
          );
          if (firstHit) firstHit.statuses = [...firstHit.statuses, step.status];
          else this.applyStatus(target, step.status, ctx.stats, ctx.now);
        }
        return targets;
      }
      case 'spawnUnit': {
        const existing = this.units.filter((unit) => unit.kind === step.unitKind);
        if (existing.length >= step.cap) {
          // 超額先移除最舊者；移除不爆炸、不結算任何獎勵。
          const oldest = existing[0]!;
          this.units = this.units.filter((unit) => unit.uid !== oldest.uid);
          this.emit({ type: 'unitRemoved', atMs: ctx.now, kind: oldest.kind, uid: oldest.uid, reason: 'replaced' });
        }
        const unit: UnitState = {
          uid: this.nextUid,
          kind: step.unitKind,
          spawnedAtMs: ctx.now,
          expiresAtMs: ctx.now + step.durationMs,
          intervalMs: step.attackIntervalMs,
          nextAttackAtMs: ctx.now + step.attackIntervalMs,
          coefBp: step.coefBp,
          stats: ctx.stats,
        };
        this.nextUid += 1;
        this.units.push(unit);
        this.emit({ type: 'unitSpawned', atMs: ctx.now, kind: unit.kind, uid: unit.uid });
        return ctx.previousTargets;
      }
      case 'selfBuff': {
        this.buffs = this.buffs.filter((buff) => buff.buffId !== step.buffId);
        this.buffs.push({
          buffId: step.buffId,
          label: step.label,
          expiresAtMs: ctx.now + step.durationMs,
          unitKind: step.effect.unitKind,
          intervalMultBp: step.effect.multBp,
        });
        // 超頻立即作用於下一發：已排程的下一次攻擊依新間隔重新計算。
        for (const unit of this.units) {
          if (unit.kind !== step.effect.unitKind) continue;
          const remaining = unit.nextAttackAtMs - ctx.now;
          unit.nextAttackAtMs = ctx.now + Math.round((remaining * step.effect.multBp) / 10000);
        }
        return ctx.previousTargets;
      }
    }
  }

  private executeDamage(
    step: DamageStep,
    ctx: { now: number; atMs: number; actionId: number; stats: CombatStatsSnapshot; source: DamageSource; skillId: string },
  ): EnemyState[] {
    let coefBp = step.coefBp;
    if (step.consume) {
      const have = this.resources[step.consume.resource] ?? 0;
      const modifier = this.consumeModifiers.find((mod) => mod.skillIds.includes(ctx.skillId));
      const reducible = modifier ? Math.max(0, have - modifier.reduceConsumedBy) : have;
      const consumed = Math.min(step.consume.max, reducible);
      // 保留層不計入消耗加傷，也不再算一次生成。
      this.resources[step.consume.resource] = have - consumed;
      coefBp += consumed * step.consume.perUnitCoefBp;
    }
    const hits = step.hits ?? 1;
    const interval = step.hitIntervalMs ?? 0;
    const bonusKeys: DamageBonusKey[] = ['SKILL_DMG', ...((step.extraBonusStats ?? []) as DamageBonusKey[])];
    const base = {
      actionId: ctx.actionId,
      source: ctx.source,
      stats: ctx.stats,
      critAllowed: true,
      armorIgnoreBp: step.armorIgnoreBp ?? 0,
      bonusKeys,
      skillId: ctx.skillId,
      statuses: [] as StatusSpec[],
    };
    if (step.retarget === 'reacquire' || step.distributeTotal) {
      for (let index = 0; index < hits; index += 1) {
        this.pushHit({
          ...base,
          atMs: ctx.atMs + index * interval,
          coefBp,
          targeting: { mode: 'reacquire', rule: step.targets, distribute: Boolean(step.distributeTotal) },
        });
      }
      return [];
    }
    const targets = this.selectTargets(step.targets);
    for (const target of targets) {
      for (let index = 0; index < hits; index += 1) {
        this.pushHit({ ...base, atMs: ctx.atMs + index * interval, coefBp, targeting: { mode: 'fixed', uid: target.uid } });
      }
    }
    return targets;
  }

  private gainResource(rule: ResourceRuleDef, amount: number): void {
    if (amount <= 0) return;
    this.resources[rule.resource] = Math.min(rule.max, (this.resources[rule.resource] ?? 0) + amount);
  }

  // ───────────── 被動／裝備觸發 ─────────────

  private fireProcs(kind: ProcDef['trigger']['kind'], now: number, target: EnemyState, origin?: { actionId: number; atMs: number }): void {
    for (const proc of this.procs) if (proc.def.trigger.kind === kind) this.triggerProc(proc, now, target, origin);
  }

  private triggerProc(proc: ActiveProc, now: number, target: EnemyState, origin?: { actionId: number; atMs: number }): void {
    const icd = proc.def.internalCooldownMs ?? 0;
    if (now - proc.lastTriggeredAtMs < icd) return;
    proc.lastTriggeredAtMs = now;
    const payload = proc.def.payload;
    if (payload.kind === 'nextUnitRoundBonus') {
      this.unitRoundBonus = { unitKind: payload.unitKind, pctBp: payload.pctBp, remaining: payload.maxUnits };
      return;
    }
    if (payload.timing !== 'immediate') {
      const list = this.stored[payload.timing];
      // 同一來源最多存 1 次，不可囤積。
      if (!list.some((entry) => entry.procId === proc.def.procId)) list.push({ procId: proc.def.procId, coefBp: payload.coefBp });
      return;
    }
    const hitTarget = this.resolveProcTarget(payload.target, target);
    if (!hitTarget) return;
    this.pushFollowUp(hitTarget, payload.coefBp, origin?.actionId ?? this.newActionId(), origin?.atMs ?? now + this.catalog.tuning.battle.minHitDelayMs);
  }

  private resolveProcTarget(rule: 'same' | 'main' | 'otherPreferred' | 'otherOnly', reference: EnemyState): EnemyState | null {
    const alive = this.aliveEnemies();
    switch (rule) {
      case 'same':
        return reference.alive ? reference : this.mainTarget();
      case 'main':
        return this.mainTarget();
      case 'otherPreferred':
        return alive.find((enemy) => enemy.uid !== reference.uid) ?? this.mainTarget();
      case 'otherOnly':
        return alive.find((enemy) => enemy.uid !== reference.uid) ?? null;
    }
  }

  private releaseStored(timing: PendingTiming, target: EnemyState, actionId: number, atMs: number): void {
    const list = this.stored[timing];
    if (list.length === 0) return;
    this.stored[timing] = [];
    for (const entry of list) this.pushFollowUp(target, entry.coefBp, actionId, atMs);
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
      skillId: null,
      statuses: [],
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

  /** 範圍攻擊按主目標、生成序處理，最多 N 名；目標不足時不補足空段。 */
  private selectTargets(rule: TargetRule): EnemyState[] {
    const main = this.mainTarget();
    if (!main) return [];
    switch (rule.kind) {
      case 'main':
        return [main];
      case 'upTo':
        return [main, ...this.aliveEnemies().filter((enemy) => enemy.uid !== main.uid)].slice(0, rule.count);
      case 'othersPreferred':
        return [this.aliveEnemies().find((enemy) => enemy.uid !== main.uid) ?? main];
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
      })),
      traits: this.traitsOf(enemy, now),
    }));
    const boss = this.boss;
    const body = boss ? this.enemies.find((enemy) => enemy.uid === boss.bodyUid) : undefined;
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
          cooldownMs: Math.round((slot.skill.cooldownMs * (10000 - this.stats.cdrBp)) / 10000),
          remainingMs: Math.max(0, slot.readyAtMs - now),
          waitingForCondition: slot.waitingSinceMs !== null,
        })),
        resources: { ...this.resources },
        units: this.units.map((unit) => ({ uid: unit.uid, kind: unit.kind, remainingMs: Math.max(0, unit.expiresAtMs - now) })),
        buffs: this.buffs.map((buff) => ({ buffId: buff.buffId, label: buff.label, remainingMs: Math.max(0, buff.expiresAtMs - now) })),
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
