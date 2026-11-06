import type {
  ContentCatalog,
  EliteTemplateDef,
  ResourceId,
  SelfBuffEffect,
  StageDef,
  StatusSpec,
  TargetRule,
  UnitKind,
} from '@qiwu/content';
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

/** 一個持續傷害計時器；傷害以施加時的攻擊與持續加成快照計算。 */
export interface DotTicker {
  coefPerTickBp: number;
  ticksLeft: number;
  intervalMs: number;
  nextTickAtMs: number;
  attack: number;
  dotBonusBp: number;
}

export interface StatusInstance {
  statusId: string;
  kind: StatusSpec['kind'];
  label: string;
  expiresAtMs: number;
  pctBp: number;
  /** 召喚易傷適用的單位種類；其他狀態為空陣列。 */
  unitKinds: UnitKind[];
  /** 疊層狀態的目前層數與上限；其他狀態為 0。 */
  stacks: number;
  maxStacks: number;
  /** 單一持續傷害（燃燒、熔痕）。 */
  dot: DotTicker | null;
  /** 獨立毒層，每層各自計時。 */
  poison: DotTicker[];
  /** 指定來源／技能標籤易傷的適用範圍。 */
  sources: DamageSource[];
  skillTags: string[];
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
  /** 本體最近一次命中此目標的時間（默契追獵）。 */
  lastBodyHitAtMs: number;
  /** 此目標累積承受的本體普攻次數（琥珀項鍊）。 */
  basicAttacksTaken: number;
  /** 每目標一次的觸發是否已用過（月紋長袍、木牙墜飾）。 */
  cleanHitBonusUsed: boolean;
  dotEverApplied: boolean;
}

export type HitTargeting =
  | { readonly mode: 'fixed'; readonly uid: number }
  | { readonly mode: 'reacquire'; readonly rule: TargetRule; readonly distribute: boolean }
  /** 命中時依「主目標、其餘生成序」輪替存活目標，第 index 段打第 index % n 名。 */
  | { readonly mode: 'rotate'; readonly index: number };

/**
 * 命中後才執行的附帶效果（確保「傷害後加層」順序）。targetUid 省略時套用在被命中的目標；
 * 指定時（輪替技能對主目標加層）在攜帶它的那一段結算後套用到該目標一次。
 */
export type HitRider =
  | { readonly kind: 'status'; readonly spec: StatusSpec; readonly targetUid?: number }
  | { readonly kind: 'copyDot'; readonly statusId: string; readonly toOthers: number; readonly targetUid?: number };

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
  /** 增益、花色、單體加成等額外加成（萬分位，與屬性加成相加）。 */
  bonusPctBp: number;
  skillId: string | null;
  /** 召喚來源命中的單位種類（召喚易傷、召喚命中觸發）。 */
  unitKind: UnitKind | null;
  riders: readonly HitRider[];
  /** 屬於技能本身的段數（追加與召喚以外），用來判斷「最後一段」與本次施放首殺。 */
  tracked: boolean;
  /** 原目標死亡時可依優先序重新選目標一次（餘箭追獵）。 */
  retargetOnce: boolean;
  /** 推入時的波次序號；重新選目標的命中只在同一波內有效。 */
  waveSerial: number;
}

export interface UnitState {
  uid: number;
  kind: UnitKind;
  capGroup: string;
  spawnedAtMs: number;
  /** 常駐單位（戰獸）為 Infinity。 */
  expiresAtMs: number;
  intervalMs: number;
  nextAttackAtMs: number;
  coefBp: number;
  stats: CombatStatsSnapshot;
  attackTargets: TargetRule;
  damageSource: 'summon' | 'dot';
  onResolve: { readonly coefBp: number; readonly targets: TargetRule; readonly when: 'always' | 'early' } | null;
  attacksMade: number;
  /** 第一次攻擊的追加（鏡界線輪、發條機芯）。 */
  firstAttackExtra: { readonly coefBp: number; readonly target: 'same' | 'otherOnly' } | null;
  /** 下一次攻擊的追加係數（銅管手砲），用完歸零。 */
  pendingExtraCoefBp: number;
  /** 下一次攻擊的傷害加成（協同校準），用完歸零。 */
  pendingRoundBonusBp: number;
}

export interface BuffState {
  buffId: string;
  label: string;
  expiresAtMs: number;
  effect: SelfBuffEffect;
  /** 次數型增益剩餘次數；非次數型為 0。 */
  charges: number;
  /** 本次增益期間已觸發過的「每次增益一次」效果。 */
  firedProcIds: string[];
  /** 攻擊間隔增益（超頻）施放時已在場、因此受影響的單位。 */
  affectedUnitUids: number[];
}

export type UnitRemovedReason = 'expired' | 'replaced' | 'resolved' | 'consumed';

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
  | { readonly type: 'unitRemoved'; readonly atMs: number; readonly kind: UnitKind; readonly uid: number; readonly reason: UnitRemovedReason }
  | { readonly type: 'cardPlayed'; readonly atMs: number; readonly suit: CardSuit; readonly actionId: number }
  | { readonly type: 'bossResolved'; readonly atMs: number; readonly result: 'success' | 'timeout'; readonly bossHpRemainingBp: number };

/** 花色索引：0 紅心、1 方塊、2 梅花、3 黑桃。 */
export type CardSuit = 0 | 1 | 2 | 3;

export interface EnemyStatusView {
  readonly statusId: string;
  readonly label: string;
  readonly remainingMs: number;
  /** 疊層或毒層數；不可疊層的狀態為 0。 */
  readonly stacks: number;
}

export interface EnemyView {
  readonly uid: number;
  readonly monsterId: string;
  readonly name: string;
  readonly kind: EnemyKind;
  readonly hp: number;
  readonly maxHp: number;
  readonly statuses: readonly EnemyStatusView[];
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
    /** 常駐單位 permanent 為 true，remainingMs 為 0。 */
    readonly units: readonly { readonly uid: number; readonly kind: UnitKind; readonly remainingMs: number; readonly permanent: boolean }[];
    readonly buffs: readonly { readonly buffId: string; readonly label: string; readonly remainingMs: number; readonly charges: number }[];
    /** 牌術師的下一張花色；沒有花色被動時為 null。 */
    readonly cards: { readonly nextSuit: CardSuit; readonly setPending: boolean } | null;
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
