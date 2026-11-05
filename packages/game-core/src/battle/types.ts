import type { ContentCatalog, EliteTemplateDef, ResourceId, StageDef, StatusSpec, TargetRule, UnitKind } from '@qiwu/content';
import type { CombatStatsSnapshot, DamageBonusKey, HeroLoadoutSnapshot } from '../model/types.ts';

/** 傷害來源各有獨立標籤，只吃對應加成，不雙吃（規格 02「觸發限制」）。 */
export type DamageSource = 'basic' | 'skill' | 'ultimate' | 'dot' | 'summon' | 'followUp' | 'mechanic';

export type Encounter =
  /** 普通關／小首領關：清完推進下一關。 */
  | { readonly kind: 'stage'; readonly stage: StageDef }
  /** BOSS 關前（BOSS_READY／FARM_BLOCKED／ENDGAME_FARM）刷同關普通怪，關卡不進位。 */
  | { readonly kind: 'loop'; readonly stage: StageDef }
  | { readonly kind: 'boss'; readonly stage: StageDef; readonly durationMs: number };

export interface BattleSetup {
  readonly catalog: ContentCatalog;
  readonly seed: number;
  readonly stats: CombatStatsSnapshot;
  readonly hero: HeroLoadoutSnapshot;
  readonly encounter: Encounter;
}

export interface StatusInstance {
  statusId: string;
  kind: StatusSpec['kind'];
  label: string;
  expiresAtMs: number;
  pctBp: number;
  /** 召喚易傷適用的單位種類；其他狀態為空陣列。 */
  unitKinds: UnitKind[];
  dot: {
    coefPerTickBp: number;
    ticksLeft: number;
    intervalMs: number;
    nextTickAtMs: number;
    attack: number;
    dotBonusBp: number;
  } | null;
}

export type EnemyKind = 'normal' | 'elite' | 'boss' | 'add';

export interface EnemyState {
  uid: number;
  monsterId: string;
  name: string;
  kind: EnemyKind;
  maxHp: number;
  hp: number;
  baseArmor: number;
  spawnedAtMs: number;
  alive: boolean;
  rewardPoints: number;
  statuses: StatusInstance[];
  eliteTemplate: EliteTemplateDef | null;
  reactiveCount: number;
  reactiveUntilMs: number;
  /** 已計入反應核心的最近本體行動 ID。 */
  countedActionIds: number[];
  shellBroken: boolean;
  mechanicIndex: number | null;
  expiresAtMs: number | null;
  damageTransferBp: number;
}

export type HitTargeting =
  | { readonly mode: 'fixed'; readonly uid: number }
  | { readonly mode: 'reacquire'; readonly rule: TargetRule; readonly distribute: boolean };

export interface PendingHit {
  atMs: number;
  seq: number;
  actionId: number;
  source: DamageSource;
  coefBp: number;
  targeting: HitTargeting;
  stats: CombatStatsSnapshot;
  critAllowed: boolean;
  armorIgnoreBp: number;
  bonusKeys: readonly DamageBonusKey[];
  skillId: string | null;
  statuses: readonly StatusSpec[];
}

export interface UnitState {
  uid: number;
  kind: UnitKind;
  spawnedAtMs: number;
  expiresAtMs: number;
  intervalMs: number;
  nextAttackAtMs: number;
  coefBp: number;
  stats: CombatStatsSnapshot;
}

export interface BuffState {
  buffId: string;
  label: string;
  expiresAtMs: number;
  unitKind: UnitKind;
  intervalMultBp: number;
}

export type BattleEvent =
  | { readonly type: 'waveSpawned'; readonly atMs: number; readonly waveIndex: number; readonly totalWaves: number | null; readonly uids: readonly number[] }
  | {
      readonly type: 'hit';
      readonly atMs: number;
      readonly targetUid: number;
      readonly amount: number;
      readonly crit: boolean;
      readonly source: DamageSource;
      readonly skillId: string | null;
      readonly actionId: number;
    }
  | { readonly type: 'basicAttack'; readonly atMs: number; readonly targetUid: number; readonly actionId: number }
  | { readonly type: 'skillCast'; readonly atMs: number; readonly skillId: string; readonly ultimate: boolean; readonly actionId: number }
  | {
      readonly type: 'enemyDefeated';
      readonly atMs: number;
      readonly uid: number;
      readonly monsterId: string;
      readonly kind: EnemyKind;
      readonly rewardPoints: number;
    }
  | { readonly type: 'enemyRemoved'; readonly atMs: number; readonly uid: number; readonly reason: 'expired' | 'replaced' }
  | { readonly type: 'addsSpawned'; readonly atMs: number; readonly uids: readonly number[]; readonly name: string }
  | { readonly type: 'stageCleared'; readonly atMs: number; readonly stageId: string }
  | { readonly type: 'unitSpawned'; readonly atMs: number; readonly kind: UnitKind; readonly uid: number }
  | { readonly type: 'unitRemoved'; readonly atMs: number; readonly kind: UnitKind; readonly uid: number; readonly reason: 'expired' | 'replaced' }
  | { readonly type: 'bossResolved'; readonly atMs: number; readonly result: 'success' | 'timeout'; readonly bossHpRemainingBp: number };

export interface EnemyView {
  readonly uid: number;
  readonly monsterId: string;
  readonly name: string;
  readonly kind: EnemyKind;
  readonly hp: number;
  readonly maxHp: number;
  readonly statuses: readonly { readonly statusId: string; readonly label: string; readonly remainingMs: number }[];
  /** 介面用的效果標籤（小首領模板、BOSS 機制狀態）。 */
  readonly traits: readonly string[];
}

export interface SkillCooldownView {
  readonly skillId: string;
  readonly ultimate: boolean;
  readonly cooldownMs: number;
  readonly remainingMs: number;
  readonly waitingForCondition: boolean;
}

export interface BattleView {
  readonly encounterKind: Encounter['kind'];
  readonly stageId: string;
  readonly timeMs: number;
  readonly waveIndex: number;
  readonly totalWaves: number | null;
  readonly enemies: readonly EnemyView[];
  readonly hero: {
    readonly basicIntervalMs: number;
    readonly skills: readonly SkillCooldownView[];
    readonly resources: Readonly<Partial<Record<ResourceId, number>>>;
    readonly units: readonly { readonly uid: number; readonly kind: UnitKind; readonly remainingMs: number }[];
    readonly buffs: readonly { readonly buffId: string; readonly label: string; readonly remainingMs: number }[];
  };
  readonly boss: {
    readonly name: string;
    readonly bodyUid: number;
    readonly elapsedMs: number;
    readonly durationMs: number;
    readonly remainingMs: number;
    readonly hp: number;
    readonly maxHp: number;
    readonly phaseLabels: readonly string[];
    readonly resolved: 'success' | 'timeout' | null;
  } | null;
}
