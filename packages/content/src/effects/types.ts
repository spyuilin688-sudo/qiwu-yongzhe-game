import type { ResourceId, StatKey, UnitKind } from '../ids.ts';

/**
 * 技能效果以「策略組合」描述（規格 08：DirectDamage、ApplyStatus、ConsumeStacks、SpawnUnit…），
 * 讓 35 個職業共用同一個戰鬥引擎；新增技能只需新增資料，必要時新增一個明確策略。
 * 所有倍率為萬分位（15000 = 1.50A），時間為毫秒。全部屬 N 原型值。
 */

/** 傷害來源分類（規格 02：本體普攻、本體技能、持續、召喚、追加各有獨立標籤）。 */
export type EffectDamageSource = 'basic' | 'skill' | 'ultimate' | 'dot' | 'summon' | 'followUp';

/** 目標規則：主目標優先，其餘依生成順序；不足數量時不補打主目標（除非明寫集中）。 */
export type TargetRule =
  | { readonly kind: 'main' }
  | { readonly kind: 'upTo'; readonly count: number }
  /** 只打主目標以外的敵人，最多 count 名（「其他最多 2 名敵人」）；沒有其他敵人就不打。 */
  | { readonly kind: 'others'; readonly count: number }
  | { readonly kind: 'othersPreferred' };

/** 消耗來源：角色資源、目標層數、目標印記種類、目標毒層、場上召喚單位。 */
export type ConsumeSpec =
  | { readonly from: 'selfResource'; readonly resource: ResourceId; readonly perUnitCoefBp: number; readonly max: number }
  | { readonly from: 'targetStacks'; readonly statusId: string; readonly perUnitCoefBp: number; readonly max: number }
  | { readonly from: 'targetMarks'; readonly statusIds: readonly string[]; readonly perUnitCoefBp: number; readonly max: number }
  | {
      readonly from: 'targetDots';
      readonly statusId: string;
      readonly max: number;
      /** 被消耗毒層剩餘傷害的結算比例（萬分位），另以持續傷害來源打出。 */
      readonly remainingDamagePctBp: number;
    }
  | { readonly from: 'units'; readonly capGroup: string; readonly perUnitCoefBp: number; readonly max: number };

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
   * rotate：每段命中時依「主目標、其餘生成序」輪替存活目標，不足時回到主目標（追星箭、疾影連殺、聖光連禱）。
   */
  readonly retarget?: 'fixed' | 'reacquire' | 'rotate';
  /** 每段的總量平均分配給存活目標（萬劍歸流「固定總量」）。 */
  readonly distributeTotal?: boolean;
  /** 計傷時忽略剩餘護甲比例（穿甲）。 */
  readonly armorIgnoreBp?: number;
  readonly consume?: ConsumeSpec;
  /** 目標類消耗只看主目標並只加在主目標命中（main，預設），或每個被打到的目標各自消耗與加傷（each）。 */
  readonly consumePer?: 'main' | 'each';
  /** 額外適用的流派加成（印記／碎冰／處決等），只吃對應標籤。 */
  readonly extraBonusStats?: readonly StatKey[];
  /** 由召喚單位打出的部分（協同撲擊的戰獸段）：只套召喚來源規則；該單位不存在時此步驟不執行。 */
  readonly unitPart?: UnitKind;
  /** 相對本行動第一段的延遲（依序攻擊：本體先、戰獸後）。 */
  readonly delayMs?: number;
  /** 只有角色擁有指定被動時才執行（例如冰咒師分支的冰錐才加寒霜）。 */
  readonly requiresPassive?: string;
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
  /** 可疊層狀態（破陣、寒霜、聖印）：加層並刷新持續時間，上限 max。 */
  | {
      readonly kind: 'stack';
      readonly statusId: string;
      readonly label: string;
      readonly add: number;
      readonly max: number;
      readonly durationMs: number;
    }
  /** 獨立毒層：每層各自保存剩餘次數與傷害快照；滿層時刷新最早到期的一層，未跳的傷害不另結算。 */
  | {
      readonly kind: 'dotStack';
      readonly statusId: string;
      readonly label: string;
      readonly add: number;
      readonly maxStacks: number;
      readonly coefPerTickBp: number;
      readonly ticks: number;
      readonly intervalMs: number;
    }
  /** 指定來源或技能標籤對此目標的傷害提高（弱點標記：本體射擊；破綻標記：處決類）。 */
  | {
      readonly kind: 'damageTakenFor';
      readonly statusId: string;
      readonly label: string;
      readonly pctBp: number;
      readonly durationMs: number;
      readonly sources?: readonly EffectDamageSource[];
      readonly skillTags?: readonly string[];
    }
  | {
      readonly kind: 'summonDamageTaken';
      readonly statusId: string;
      readonly label: string;
      readonly pctBp: number;
      readonly durationMs: number;
      /** 只有這些召喚單位吃此易傷（集火信標＝砲台；掠食標記＝戰獸）。 */
      readonly unitKinds: readonly UnitKind[];
    };

export interface ApplyStatusStep {
  readonly type: 'applyStatus';
  /**
   * sameAsPreviousDamage：套用在上一個傷害步驟鎖定的目標（在該目標第一段命中後）；
   * mainOfPreviousDamage：只套用在上一個傷害步驟的主目標；
   * othersOfPreviousDamage：上一個傷害步驟中主目標以外的目標。
   */
  readonly targets: TargetRule | 'sameAsPreviousDamage' | 'mainOfPreviousDamage' | 'othersOfPreviousDamage';
  readonly status: StatusSpec;
  readonly requiresPassive?: string;
}

/** 把主目標的一層獨立毒層複製到其他敵人，沿用剩餘期（蔓毒之刃）；在主目標第一段命中後執行。 */
export interface CopyDotStackStep {
  readonly type: 'copyDotStack';
  readonly statusId: string;
  readonly toOthers: number;
}

export interface SpawnUnitStep {
  readonly type: 'spawnUnit';
  readonly unitKind: UnitKind;
  readonly durationMs: number;
  /** 0 表示不週期攻擊（替身只在結算時爆炸）。 */
  readonly attackIntervalMs: number;
  readonly coefBp: number;
  /** 每次攻擊的目標（預設主目標）；區域陣法為 upTo 3。 */
  readonly attackTargets?: TargetRule;
  /** 傷害來源；區域持續技為 dot，其餘為 summon。 */
  readonly damageSource?: 'summon' | 'dot';
  /** 同上限群組內的單位合計上限；超額時先結算最舊者（替身爆炸、幻影補一擊），不重複發獎。 */
  readonly cap: number;
  /** 省略時以 unitKind 為群組。 */
  readonly capGroup?: string;
  /**
   * 結算時打出一次。always：自然到期與提前結算都會（替身爆彈）；
   * early：只有被超額替換或被戲法換位提前結算時（幻影補一擊）。
   */
  readonly onResolve?: { readonly coefBp: number; readonly targets: TargetRule; readonly when: 'always' | 'early' };
}

/** 提前結算最舊的單位（戲法換位）。 */
export interface ResolveOldestUnitStep {
  readonly type: 'resolveOldestUnit';
  readonly capGroup: string;
}

export type SelfBuffEffect =
  | { readonly kind: 'unitAttackIntervalMult'; readonly unitKind: UnitKind; readonly multBp: number }
  /** 本體直接傷害提高（祝禱之歌：普攻與本體直接技能，不套召喚物）。 */
  | { readonly kind: 'bodyDamageBonus'; readonly pctBp: number }
  /** 指定召喚單位傷害提高（獸王號令：戰獸 +40%）。 */
  | { readonly kind: 'unitDamageBonus'; readonly unitKind: UnitKind; readonly pctBp: number }
  /** 接下來 charges 次本體直接攻擊各追加一次（符文刻印），施放本技能自己不消耗。 */
  | { readonly kind: 'chargedFollowUp'; readonly charges: number; readonly coefBp: number }
  /** 持續期間本體普攻每次附加狀態（淬毒）。 */
  | { readonly kind: 'basicAppliesStatus'; readonly status: StatusSpec }
  /** 下一張預定花色的效果提高（王牌封印），僅一次。 */
  | { readonly kind: 'suitBoost'; readonly pctBp: number };

export interface SelfBuffStep {
  readonly type: 'selfBuff';
  readonly buffId: string;
  readonly label: string;
  readonly durationMs: number;
  readonly effect: SelfBuffEffect;
}

export interface GainResourceStep {
  readonly type: 'gainResource';
  readonly resource: ResourceId;
  readonly amount: number;
}

/**
 * 出牌（牌術師花色輪轉）。pointer：依花色指標出 count 張並逐張推進；
 * fixedSequence：固定紅心→方塊→梅花→黑桃（四象牌陣），不移動指標；setNext：把下一張設為預定花色（切牌）。
 * 角色沒有花色被動時，牌就是普通的直接傷害。
 */
export interface PlayCardsStep {
  readonly type: 'playCards';
  readonly mode: 'pointer' | 'fixedSequence' | 'setNext';
  readonly count: number;
  readonly coefBp: number;
  readonly hitIntervalMs?: number;
  /**
   * 刷怪時多張牌依「主目標、其餘生成序」輪替目標；只有一名敵人或 BOSS 戰時集中主目標
   * （連環牌擊「單目標可集中」：BOSS 副目標零產出，散到副目標沒有收益）。
   */
  readonly spreadTargets?: boolean;
}

export type EffectStep =
  | DamageStep
  | ApplyStatusStep
  | CopyDotStackStep
  | SpawnUnitStep
  | ResolveOldestUnitStep
  | SelfBuffStep
  | GainResourceStep
  | PlayCardsStep;

/**
 * 自動施放條件。requires* 是「缺乏必要對象」的硬條件；其餘條件未成立時，
 * 最多等待 conditionFallbackMs 後允許基礎施放（規格：避免永遠等條件）。
 */
export type AutoCastRule =
  | { readonly kind: 'hasEnemy' }
  | { readonly kind: 'mainTargetLacksStatus'; readonly statusKind: 'armorBreak'; readonly refreshBelowMs: number }
  /** 主目標沒有指定狀態，或剩餘不足 refreshBelowMs。 */
  | { readonly kind: 'mainTargetLacksStatusId'; readonly statusId: string; readonly refreshBelowMs: number }
  | { readonly kind: 'mainTargetHasStatusId'; readonly statusId: string }
  /** 主目標層數（疊層狀態的層數，或獨立毒層中剩餘 ≥ minRemainingMs 的層數）至少 amount。 */
  | { readonly kind: 'targetStacksAtLeast'; readonly statusId: string; readonly amount: number; readonly minRemainingMs?: number }
  | { readonly kind: 'targetStacksBelow'; readonly statusId: string; readonly amount: number }
  | { readonly kind: 'targetMarkKindsAtLeast'; readonly statusIds: readonly string[]; readonly amount: number }
  | { readonly kind: 'selfResourceAtLeast'; readonly resource: ResourceId; readonly amount: number }
  | { readonly kind: 'selfResourceBelow'; readonly resource: ResourceId; readonly amount: number }
  | { readonly kind: 'selfBuffAbsent'; readonly buffId: string }
  | {
      readonly kind: 'unitsBelowCapOrOldestExpiring';
      readonly unitKind: UnitKind;
      readonly below: number;
      readonly oldestRemainingAtMostMs: number;
    }
  /** 上限群組（幻影＋替身）：有空位或最舊者即將結束。 */
  | { readonly kind: 'groupBelowCapOrOldestExpiring'; readonly capGroup: string; readonly below: number; readonly oldestRemainingAtMostMs: number }
  | { readonly kind: 'groupCountAtLeast'; readonly capGroup: string; readonly amount: number }
  | { readonly kind: 'groupOldestExpiring'; readonly capGroup: string; readonly remainingAtMostMs: number }
  | { readonly kind: 'requiresUnit'; readonly unitKind: UnitKind; readonly atLeast: number }
  | {
      readonly kind: 'requiresUnitAndMainLacksStatus';
      readonly unitKind: UnitKind;
      readonly statusId: string;
    }
  /** 硬條件：需該單位存在；soft：主目標帶指定狀態時優先（協同撲擊在標記後）。 */
  | { readonly kind: 'requiresUnitPreferStatus'; readonly unitKind: UnitKind; readonly statusId: string }
  | { readonly kind: 'nextSuitIsNotPreferred' }
  | { readonly kind: 'nextSuitIsPreferred' }
  | { readonly kind: 'pendingSetSuit' }
  /**
   * 「清怪或 X」：場上 2 名以上敵人（清怪中）即成立，否則看內層條件（打王、只剩一隻時）。
   * 例：追星箭「清怪或標記後」、連鎖閃電「清怪或缺雷印」、毒霧「清怪或毒層不足」。
   */
  | { readonly kind: 'clearingOr'; readonly inner: AutoCastRule }
  /** 打王時等 BOSS 弱點窗口（易傷循環）；非 BOSS 戰或該 BOSS 沒有易傷循環時直接成立（萬劍歸流）。 */
  | { readonly kind: 'bossWeaknessWindow' }
  /**
   * 主目標沒有指定狀態，且「即將消耗」：角色資源已達 atLeast；配置中沒有消耗該資源的技能時只看狀態（破綻標記「處決前且無標記」）。
   */
  | { readonly kind: 'mainLacksStatusBeforeConsumer'; readonly statusId: string; readonly resource: ResourceId; readonly atLeast: number };

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
  /** 指定技能之一施放；singleTargetOnly：該技能第一個傷害步驟只選到 1 名目標時才觸發。 */
  | { readonly kind: 'skillCast'; readonly skillIds: readonly string[]; readonly singleTargetOnly?: boolean }
  /**
   * 指定技能施放且實際消耗達 minConsumed 以上（資源、層數、印記種類、毒層或單位數）。
   * unit 是文案用的計量單位（「層寒霜」「種印記」），避免只顯示「消耗至少 3」。
   */
  | { readonly kind: 'skillCastConsumed'; readonly skillIds: readonly string[]; readonly minConsumed: number; readonly unit: string }
  /** 消耗時因被動保留了層數（霜痕）。 */
  | { readonly kind: 'skillCastRetained'; readonly skillIds: readonly string[] }
  /**
   * 指定技能（或任一絕招）的最後一段結算後；requireLastHitLanded：最後一段必須實際命中
   * （「最後一段命中後」），否則只要行動結束即可（「結束後」）。
   */
  | { readonly kind: 'skillEnded'; readonly skillId?: string; readonly ultimate?: boolean; readonly requireLastHitLanded?: boolean }
  /** 指定技能本次施放的第一次擊殺。 */
  | { readonly kind: 'skillKill'; readonly skillId: string }
  | { readonly kind: 'ultimateCast' }
  | { readonly kind: 'basicCrit' }
  | { readonly kind: 'directSkillCrit' }
  | { readonly kind: 'basicKill' }
  | { readonly kind: 'waveStartFirstBasic' }
  | { readonly kind: 'armorBreakApplied' }
  /** 本體命中帶指定狀態的目標；可限普攻、限最少層數、每 every 次觸發一次。 */
  | {
      readonly kind: 'bodyHitOnTargetWithStatus';
      readonly statusId: string;
      readonly basicOnly?: boolean;
      readonly minStacks?: number;
      readonly every?: number;
    }
  /** 召喚單位命中「本體在 windowMs 內命中過」的同一目標（默契追獵）。 */
  | { readonly kind: 'unitHitAfterBodyHit'; readonly unitKind: UnitKind; readonly windowMs: number }
  /** 召喚單位命中帶指定狀態的目標，每 every 次觸發（狼牙骨笛）。 */
  | { readonly kind: 'unitHitOnTargetWithStatus'; readonly unitKind: UnitKind; readonly statusId: string; readonly every: number }
  /** 連續兩張同花色（同花迴響）。 */
  | { readonly kind: 'sameSuitTwice' }
  /** 狀態自然到期且目標仍存活；被刷新不算到期。 */
  | { readonly kind: 'statusExpired'; readonly statusId: string }
  | { readonly kind: 'buffExpired'; readonly buffId: string }
  /** 次數型增益最後一次被使用（符文刻印最後一次觸發）。 */
  | { readonly kind: 'buffChargesDepleted'; readonly buffId: string }
  /** 主目標死亡（被擊殺，不含替換或到期）。 */
  | { readonly kind: 'mainTargetDied' }
  /** 本體直接技能第一次命中「沒有任何狀態」的目標；每個目標一次。 */
  | { readonly kind: 'directSkillHitCleanTarget' }
  /** 第一次對某目標施加持續傷害；每個目標一次。 */
  | { readonly kind: 'dotFirstOnTarget' }
  /** 同一目標累積 count 次本體普攻（每滿 count 次觸發）。 */
  | { readonly kind: 'sameTargetBasicCount'; readonly count: number }
  /** 持續攻擊同一目標滿 durationMs（之後每 durationMs 一次，搭配內置間隔）。 */
  | { readonly kind: 'sameTargetDuration'; readonly durationMs: number };

/** 追加命中目標：相對觸發行動的目標。othersEach：其他最多 count 名各一次。 */
export type ProcTarget = 'same' | 'main' | 'otherPreferred' | 'otherOnly' | 'othersEach' | 'upToEach';

export type ProcTiming =
  | 'immediate'
  | 'afterAction'
  | 'nextBasic'
  /** 下一次常規「直接傷害」技能（旅人軟帽「常規直接技能」）。 */
  | 'nextRegularSkill'
  /** 下一次任何常規技能（含召喚、增益技能；銀扣護手、琥珀項鍊、王冠印戒「常規技能」）。 */
  | 'nextRegularSkillAny'
  | 'nextUltimate'
  | 'nextSkillId'
  | 'nextCard'
  | 'nextSummonHit';

export type ProcPayload =
  | {
      readonly kind: 'extraHit';
      readonly coefBp: number;
      /**
       * same：觸發行動的目標；otherPreferred：優先另一名敵人，無則主目標；
       * otherOnly：只打另一名敵人，沒有其他存活敵人就不發動；
       * othersEach／upToEach：其他最多 count 名／含主目標最多 count 名各一次。
       */
      readonly target: ProcTarget;
      readonly count?: number;
      /** 沒有其他目標時改打主目標的係數（星核墜飾：無其他目標則主目標 0.25A）。 */
      readonly fallbackMainCoefBp?: number;
      /**
       * immediate：與觸發行動同時命中；afterAction：觸發行動最後一段之後；
       * next*：存到下一次該類行動；nextSummonHit：下一次召喚物命中（沒有召喚物則改為下一次普攻）。
       */
      readonly timing: ProcTiming;
      /**
       * flat（預設）：coefBp 就是追加倍率。
       * cardBase：coefBp 是「釋放這筆追加的那張牌」基礎倍率的比例（10000 = 100%），
       * 讓重演跟著那張牌的強度走（同花迴響：下一張本體出牌重演 40%）；只能搭配 timing nextCard。
       */
      readonly coefBasis?: 'flat' | 'cardBase';
      /** timing 為 nextSkillId 時指定的技能。 */
      readonly skillId?: string;
      /** 可使用次數（殘影回刃 2 次、餘勁 3 次）；預設 1。再次觸發只補滿，不可囤積。 */
      readonly charges?: number;
    }
  | { readonly kind: 'nextUnitRoundBonus'; readonly unitKind: UnitKind; readonly pctBp: number; readonly maxUnits: number }
  /** 指定召喚單位下一輪攻擊每座各追加一次（銅管手砲）。 */
  | { readonly kind: 'nextUnitRoundExtra'; readonly unitKind: UnitKind; readonly coefBp: number }
  /** 下一次指定技能的召喚段傷害提高（默契追獵：協同撲擊戰獸段 +30%）。 */
  | { readonly kind: 'nextSkillUnitPartBonus'; readonly skillId: string; readonly pctBp: number }
  /** 生成一個單位（謝幕返場的幻影、熔心巨鎚的餘燼區域）；此生成不再觸發其他生成效果。 */
  | { readonly kind: 'spawnUnit'; readonly unit: SpawnUnitStep }
  /** 對目標施加狀態（蛇牙匕首：對另一目標加 1 層毒）；施加不再觸發其他效果。 */
  | { readonly kind: 'applyStatus'; readonly target: 'same' | 'otherOnly'; readonly status: StatusSpec }
  /** 複製一層獨立毒層到其他目標（黑棘毒囊）。 */
  | { readonly kind: 'copyDot'; readonly statusId: string; readonly toOthers: number };

export interface ProcDef {
  readonly procId: string;
  readonly trigger: ProcTrigger;
  readonly payload: ProcPayload;
  readonly internalCooldownMs?: number;
  /** 只在指定召喚單位存在時計數與觸發（機甲存在時每 4 次普攻）。 */
  readonly requireUnit?: UnitKind;
  /** 只在指定增益期間觸發；oncePerBuff：每次增益只觸發一次（號令期間首次協同攻擊）。 */
  readonly requireBuff?: string;
  readonly oncePerBuff?: boolean;
}

export interface ResourceRuleDef {
  readonly resource: ResourceId;
  readonly max: number;
  readonly gainOnBasicAttack: number;
  readonly gainOnRegularSkillCast: number;
  /** 每 N 次本體普攻才 +gainOnBasicAttack（氣脈：每 2 次普攻 1 層）。 */
  readonly basicAttacksPerGain?: number;
  /** 本體直接攻擊行動（普攻或帶傷害的技能，含絕招）各 +N（連擊點）。 */
  readonly gainOnBodyDirectAction?: number;
  /** 只有普攻「命中」同一主目標才累積（專注）；換目標歸零，主目標死亡時保留至多 keepOnTargetDeath 層。 */
  readonly sameTargetOnly?: boolean;
  readonly keepOnTargetDeath?: number;
}

export interface ConsumeModifierDef {
  readonly skillIds: readonly string[];
  /** 實際消耗層數 = max(0, 擁有層數 − reduceConsumedBy)，等於保留 reduceConsumedBy 層；保留層不計入消耗加傷。 */
  readonly reduceConsumedBy?: number;
  /** 最多消耗層數上限（毒性殘留：最多 4 層）。 */
  readonly maxConsumed?: number;
  /** 依消耗數給消耗部分的額外加成（萬分位），索引＝消耗數（元素共鳴：2 種 +15%、3 種 +30%）。 */
  readonly bonusByConsumedBp?: readonly number[];
}

/**
 * 目標死亡時把狀態轉移給下一個目標（餘燼傳承：依序最多 1 種印記；餘光傳誦：1 層聖印；
 * 木紋劍鞘／夜行忍具：剩餘時間的一半）。下一名敵人不存在則清除。
 */
export interface DeathTransferDef {
  readonly statusIds: readonly string[];
  readonly kinds: number;
  readonly stackAmount: number;
  /** 轉移後的剩餘時間比例（萬分位，10000 = 沿用）。 */
  readonly durationFactorBp: number;
}

/** 花色輪轉（牌術師）：紅心、方塊、梅花、黑桃各自的效果參數。 */
export interface SuitRuleDef {
  readonly heartNextBasicBonusBp: number;
  readonly diamondArmorBreakBp: number;
  readonly diamondDurationMs: number;
  readonly clubExtraCoefBp: number;
  readonly spadeExtraCoefBp: number;
  /** 切牌與王牌封印的預定花色（N：黑桃）。 */
  readonly preferredSuit: 0 | 1 | 2 | 3;
}

/** 固定召喚物（獵伴戰獸）：開戰與轉入該職業時生成，沒有血量、裝備或經驗。 */
export interface CompanionDef {
  readonly unitKind: UnitKind;
  readonly attackIntervalMs: number;
  readonly coefBp: number;
}

/** 被動與傳說共用的靜態修正（不是觸發器）。 */
export interface StaticModifiers {
  readonly deathTransfer?: DeathTransferDef;
  /** 指定增益的持續時間增加（零式動力核：超頻 +2 秒）。 */
  readonly buffDurationBonus?: { readonly buffId: string; readonly addMs: number };
  /** 指定技能施放時場上只有一名敵人，整次傷害提高（不滅劍鞘）。 */
  readonly singleEnemyCastBonus?: { readonly skillId: string; readonly pctBp: number };
  /** 切牌指定的那張牌花色效果提高（命運牌匣，與王牌封印加算）。 */
  readonly setSuitEffectBonusBp?: number;
  /** 指定技能生成的單位第一次攻擊追加一次（鏡界線輪、發條機芯）。 */
  readonly unitFirstAttackExtra?: { readonly skillId: string; readonly coefBp: number; readonly target: 'same' | 'otherOnly' };
}

export interface PassiveEffectDef extends StaticModifiers {
  readonly passiveId: string;
  readonly procs: readonly ProcDef[];
  readonly resource?: ResourceRuleDef;
  readonly consumeModifier?: ConsumeModifierDef;
  readonly suits?: SuitRuleDef;
  readonly companion?: CompanionDef;
  /** 已發射的本體攻擊原目標死亡時，依優先序重新選目標一次（餘箭追獵）。 */
  readonly projectileRetargetOnce?: boolean;
  /**
   * 為什麼要有 rulesNote：部分被動（例如元素殘印、機關協作）的規則已由技能狀態或召喚上限實現，
   * 此處只記錄引擎落點，避免誤以為該被動沒有實作。
   */
  readonly rulesNote?: string;
}

export interface LegendEffectDef extends StaticModifiers {
  readonly baseId: string;
  readonly procs: readonly ProcDef[];
  readonly rulesNote?: string;
}
