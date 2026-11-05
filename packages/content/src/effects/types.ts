import type { ResourceId, StatKey, UnitKind } from '../ids.ts';

/**
 * 技能效果以「策略組合」描述（規格 08：DirectDamage、ApplyStatus、ConsumeStacks、SpawnUnit…），
 * 讓 35 個職業共用同一個戰鬥引擎；新增技能只需新增資料，必要時新增一個明確策略。
 * 所有倍率為萬分位（15000 = 1.50A），時間為毫秒。全部屬 N 原型值。
 */

/** 目標規則：主目標優先，其餘依生成順序；不足數量時不補打主目標（除非明寫集中）。 */
export type TargetRule =
  | { readonly kind: 'main' }
  | { readonly kind: 'upTo'; readonly count: number }
  | { readonly kind: 'othersPreferred' };

export interface ConsumeSelfResource {
  readonly from: 'selfResource';
  readonly resource: ResourceId;
  readonly perUnitCoefBp: number;
  readonly max: number;
}

export interface DamageStep {
  readonly type: 'damage';
  readonly targets: TargetRule;
  readonly coefBp: number;
  /** 段數；同一次行動的多段共用一個 action_id，資源只算一次。 */
  readonly hits?: number;
  readonly hitIntervalMs?: number;
  /**
   * fixed：施放時鎖定目標，目標已死則此段落空（預設）。
   * reacquire：每段依目標規則重新選取（旋風、萬劍歸流）。
   */
  readonly retarget?: 'fixed' | 'reacquire';
  /** 每段的總量平均分配給存活目標（萬劍歸流「固定總量」）。 */
  readonly distributeTotal?: boolean;
  /** 計傷時忽略剩餘護甲比例（穿甲）。 */
  readonly armorIgnoreBp?: number;
  readonly consume?: ConsumeSelfResource;
  /** 額外適用的流派加成（印記／處決等），只吃對應標籤。 */
  readonly extraBonusStats?: readonly StatKey[];
}

export type StatusSpec =
  | { readonly kind: 'armorBreak'; readonly statusId: string; readonly label: string; readonly pctBp: number; readonly durationMs: number }
  | { readonly kind: 'mark'; readonly statusId: string; readonly label: string; readonly durationMs: number }
  | {
      readonly kind: 'dot';
      readonly statusId: string;
      readonly label: string;
      readonly coefPerTickBp: number;
      readonly ticks: number;
      readonly intervalMs: number;
    }
  | {
      readonly kind: 'summonDamageTaken';
      readonly statusId: string;
      readonly label: string;
      readonly pctBp: number;
      readonly durationMs: number;
      /** 只有這些召喚單位吃此易傷（集火信標＝砲台）。 */
      readonly unitKinds: readonly UnitKind[];
    };

export interface ApplyStatusStep {
  readonly type: 'applyStatus';
  /** 'sameAsPreviousDamage'：套用在上一個傷害步驟鎖定的目標。 */
  readonly targets: TargetRule | 'sameAsPreviousDamage';
  readonly status: StatusSpec;
}

export interface SpawnUnitStep {
  readonly type: 'spawnUnit';
  readonly unitKind: UnitKind;
  readonly durationMs: number;
  readonly attackIntervalMs: number;
  readonly coefBp: number;
  /** 同類單位上限；超額時先移除最舊者，移除不爆炸、不結算獎勵。 */
  readonly cap: number;
}

export interface SelfBuffStep {
  readonly type: 'selfBuff';
  readonly buffId: string;
  readonly label: string;
  readonly durationMs: number;
  readonly effect: { readonly kind: 'unitAttackIntervalMult'; readonly unitKind: UnitKind; readonly multBp: number };
}

export type EffectStep = DamageStep | ApplyStatusStep | SpawnUnitStep | SelfBuffStep;

/**
 * 自動施放條件。除 requires* 這類「缺乏必要對象」的硬條件外，
 * 條件未成立時最多等待 conditionFallbackMs 後允許基礎施放（規格：避免永遠等條件）。
 */
export type AutoCastRule =
  | { readonly kind: 'hasEnemy' }
  | { readonly kind: 'mainTargetLacksStatus'; readonly statusKind: 'armorBreak'; readonly refreshBelowMs: number }
  | { readonly kind: 'selfResourceAtLeast'; readonly resource: ResourceId; readonly amount: number }
  | {
      readonly kind: 'unitsBelowCapOrOldestExpiring';
      readonly unitKind: UnitKind;
      readonly below: number;
      readonly oldestRemainingAtMostMs: number;
    }
  | { readonly kind: 'requiresUnit'; readonly unitKind: UnitKind; readonly atLeast: number }
  | {
      readonly kind: 'requiresUnitAndMainLacksStatus';
      readonly unitKind: UnitKind;
      readonly statusId: string;
    };

export interface SkillEffectDef {
  readonly skillId: string;
  readonly steps: readonly EffectStep[];
  readonly autoCast: AutoCastRule;
  /** 消耗型技能不把同次施放再計為資源生成（戰意規則）。 */
  readonly generatesResource: boolean;
}

/** 觸發器：只由本體行動（普攻、常規技能、絕招）觸發；追加、持續、召喚傷害一律不觸發（一層追加鏈）。 */
export type ProcTrigger =
  | { readonly kind: 'basicAttackCount'; readonly every: number }
  | { readonly kind: 'regularSkillCastCount'; readonly every: number }
  | { readonly kind: 'distinctRegularSequence'; readonly length: number }
  | { readonly kind: 'skillCast'; readonly skillId: string }
  | { readonly kind: 'ultimateCast' }
  | { readonly kind: 'basicCrit' }
  | { readonly kind: 'directSkillCrit' }
  | { readonly kind: 'basicKill' }
  | { readonly kind: 'waveStartFirstBasic' }
  | { readonly kind: 'armorBreakApplied' }
  | { readonly kind: 'bodyHitOnTargetWithStatus'; readonly statusId: string };

export type ProcPayload =
  | {
      readonly kind: 'extraHit';
      readonly coefBp: number;
      /**
       * same：觸發行動的目標；otherPreferred：優先另一名敵人，無則主目標；
       * otherOnly：只打另一名敵人，沒有其他存活敵人就不發動。
       */
      readonly target: 'same' | 'main' | 'otherPreferred' | 'otherOnly';
      /** immediate：與觸發行動同時命中；next*：存到下一次該類行動。 */
      readonly timing: 'immediate' | 'nextBasic' | 'nextRegularSkill' | 'nextUltimate';
    }
  | { readonly kind: 'nextUnitRoundBonus'; readonly unitKind: UnitKind; readonly pctBp: number; readonly maxUnits: number };

export interface ProcDef {
  readonly procId: string;
  readonly trigger: ProcTrigger;
  readonly payload: ProcPayload;
  readonly internalCooldownMs?: number;
}

export interface ResourceRuleDef {
  readonly resource: ResourceId;
  readonly max: number;
  readonly gainOnBasicAttack: number;
  readonly gainOnRegularSkillCast: number;
}

export interface ConsumeModifierDef {
  readonly skillIds: readonly string[];
  /** 實際消耗層數 = max(0, 擁有層數 − reduceConsumedBy)，並保留 retain 層；保留層不計入消耗加傷。 */
  readonly reduceConsumedBy: number;
  readonly retain: number;
}

export interface PassiveEffectDef {
  readonly passiveId: string;
  readonly procs: readonly ProcDef[];
  readonly resource?: ResourceRuleDef;
  readonly consumeModifier?: ConsumeModifierDef;
  /**
   * 為什麼要有 rulesNote：部分被動（例如元素殘印、機關協作）的規則已由技能狀態或召喚上限實現，
   * 此處只記錄引擎落點，避免誤以為該被動沒有實作。
   */
  readonly rulesNote?: string;
}

export interface LegendEffectDef {
  readonly baseId: string;
  readonly procs: readonly ProcDef[];
}
