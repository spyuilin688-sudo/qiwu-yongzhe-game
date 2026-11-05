import type {
  AutoCastRule,
  ConsumeModifierDef,
  ConsumeSpec,
  EffectStep,
  LegendEffectDef,
  PassiveEffectDef,
  ProcDef,
  ProcPayload,
  ProcTarget,
  ProcTrigger,
  ResourceRuleDef,
  SelfBuffEffect,
  SpawnUnitStep,
  StaticModifiers,
  StatusSpec,
  SuitRuleDef,
  TargetRule,
} from './effects/types.ts';
import { RESOURCE_LABELS, UNIT_LABELS, type UnitKind } from './ids.ts';

/**
 * 由同一份效果參數產生介面文案（規格 07：資料保存描述鍵與參數，由同一份參數生成文案，
 * 避免顯示 8 秒但程式跑 10 秒）。驗證器會檢查設計文字中的每個倍率都出現在生成文案裡。
 */

export const SUIT_NAMES = ['紅心', '方塊', '梅花', '黑桃'] as const;

/** 由技能 ID 查名稱；文案需要「下一次聖光彈」而不是「下一次 SK041」。 */
export type SkillNameLookup = (skillId: string) => string;
const ID_ONLY: SkillNameLookup = (skillId) => skillId;

export function formatCoef(coefBp: number): string {
  return `${(coefBp / 10000).toFixed(2)}A`;
}

export function formatPercentBp(bp: number): string {
  const percent = bp / 100;
  return `${Number.isInteger(percent) ? percent.toFixed(0) : percent.toFixed(2).replace(/0$/, '')}%`;
}

export function formatSeconds(ms: number): string {
  const seconds = ms / 1000;
  return `${Number.isInteger(seconds) ? seconds.toFixed(0) : String(seconds)}秒`;
}

function unitCounter(kind: UnitKind): string {
  switch (kind) {
    case 'turret':
      return '座';
    case 'mech':
    case 'beast':
      return '隻';
    case 'zone':
      return '個';
    case 'phantom':
    case 'decoy':
      return '個';
  }
}

function describeTargets(targets: TargetRule): string {
  switch (targets.kind) {
    case 'main':
      return '主目標';
    case 'upTo':
      return `最多${targets.count}名敵人`;
    case 'others':
      return `其他最多${targets.count}名敵人`;
    case 'othersPreferred':
      return '優先另一名敵人';
  }
}

function describeStatus(status: StatusSpec): string {
  switch (status.kind) {
    case 'armorBreak':
      return `${status.label}：護甲降低${formatPercentBp(status.pctBp)}，維持${formatSeconds(status.durationMs)}，同名只刷新`;
    case 'mark':
      return `留下${status.label}${formatSeconds(status.durationMs)}，同名只刷新`;
    case 'dot':
      return `${status.label}：每${formatSeconds(status.intervalMs)}${formatCoef(status.coefPerTickBp)}，共${status.ticks}次（持續傷害不暴擊）`;
    case 'stack':
      return `加${status.add}層${status.label}（上限${status.max}層、${formatSeconds(status.durationMs)}，加層刷新時間）`;
    case 'dotStack':
      return `加${status.add}層${status.label}：每層每${formatSeconds(status.intervalMs)}${formatCoef(status.coefPerTickBp)}，共${status.ticks}次（上限${status.maxStacks}層，各層獨立計時）`;
    case 'damageTakenFor': {
      const scope = status.skillTags?.length ? `${status.skillTags.join('、')}類傷害` : '後續本體攻擊';
      return `${status.label}：${scope}對此目標+${formatPercentBp(status.pctBp)}，持續${formatSeconds(status.durationMs)}`;
    }
    case 'summonDamageTaken':
      return `${status.label}：${status.unitKinds.map((kind) => UNIT_LABELS[kind]).join('、')}對此目標傷害+${formatPercentBp(status.pctBp)}，持續${formatSeconds(status.durationMs)}`;
  }
}

function describeConsume(consume: ConsumeSpec, per: 'main' | 'each' | undefined): string {
  const scope = per === 'each' ? '各目標每消耗' : '每消耗';
  switch (consume.from) {
    case 'selfResource':
      return `每消耗1層${RESOURCE_LABELS[consume.resource]}額外${formatCoef(consume.perUnitCoefBp)}，最多${consume.max}層`;
    case 'targetStacks':
      return `${per === 'each' ? '各目標' : '主目標'}${scope.replace('各目標', '')}1層${statusLabel(consume.statusId)}額外${formatCoef(consume.perUnitCoefBp)}，最多${consume.max}層`;
    case 'targetMarks':
      return `${scope}1種印記額外${formatCoef(consume.perUnitCoefBp)}，最多${consume.max}種`;
    case 'targetDots':
      return `消耗主目標最多${consume.max}層${statusLabel(consume.statusId)}，以其剩餘傷害的${formatPercentBp(consume.remainingDamagePctBp)}立即結算，被消耗層移除`;
    case 'units':
      return `每消耗1個場上單位額外${formatCoef(consume.perUnitCoefBp)}，最多${consume.max}個`;
  }
}

/** 狀態 ID 對應的顯示名稱（消耗與觸發條件文案用）。 */
const STATUS_LABELS: Readonly<Record<string, string>> = {
  BREACH: '破陣',
  FROST: '寒霜',
  SEAL: '聖印',
  POISON: '毒',
  FIRE_MARK: '火印',
  ICE_MARK: '冰印',
  THUNDER_MARK: '雷印',
  WEAK_POINT: '弱點標記',
  PREY_MARK: '掠食標記',
  EXPOSE_MARK: '破綻標記',
  BEACON: '集火信標',
  MOLTEN_SCAR: '熔痕',
  SK002_ARMOR_BREAK: '破甲',
  SK061_ARMOR_BREAK: '破甲',
};

export function statusLabel(statusId: string): string {
  return STATUS_LABELS[statusId] ?? statusId;
}

function describeSpawn(step: SpawnUnitStep): string {
  const name = UNIT_LABELS[step.unitKind];
  const attack =
    step.attackIntervalMs > 0
      ? `每${formatSeconds(step.attackIntervalMs)}對${describeTargets(step.attackTargets ?? { kind: 'main' })}${step.attackTargets?.kind === 'upTo' ? '各' : ''}${formatCoef(step.coefBp)}${step.damageSource === 'dot' ? '（持續傷害）' : ''}`
      : '本身不攻擊';
  const resolve = step.onResolve
    ? `；${step.onResolve.when === 'always' ? '結算時' : '被提前結算時'}對${describeTargets(step.onResolve.targets)}${step.onResolve.targets.kind === 'upTo' ? '各' : ''}${formatCoef(step.onResolve.coefBp)}`
    : '';
  const cap = step.capGroup ? `與同群組單位合計最多${step.cap}${unitCounter(step.unitKind)}` : `最多${step.cap}${unitCounter(step.unitKind)}`;
  return `建立${name}${formatSeconds(step.durationMs)}，${attack}${resolve}；${cap}，超額先結算最舊者`;
}

function describeBuffEffect(effect: SelfBuffEffect): string {
  switch (effect.kind) {
    case 'unitAttackIntervalMult':
      return `${UNIT_LABELS[effect.unitKind]}攻擊間隔×${(effect.multBp / 10000).toFixed(2)}`;
    case 'bodyDamageBonus':
      return `本體普攻與本體直接技能傷害+${formatPercentBp(effect.pctBp)}（不套用召喚物）`;
    case 'unitDamageBonus':
      return `${UNIT_LABELS[effect.unitKind]}傷害+${formatPercentBp(effect.pctBp)}`;
    case 'chargedFollowUp':
      return `下${effect.charges}次本體直接攻擊各追加${formatCoef(effect.coefBp)}（不能由施放本技能觸發）`;
    case 'basicAppliesStatus':
      return `本體普攻每次${describeStatus(effect.status)}`;
    case 'suitBoost':
      return `下一張預定花色的效果+${formatPercentBp(effect.pctBp)}，僅一次`;
  }
}

export function describeStep(step: EffectStep): string {
  switch (step.type) {
    case 'damage': {
      const hits = step.hits ?? 1;
      const parts: string[] = [];
      const who = step.unitPart ? `${UNIT_LABELS[step.unitPart]}對` : '';
      const each = step.targets.kind === 'upTo' || step.targets.kind === 'others' ? '各' : '';
      if (step.distributeTotal) {
        parts.push(`總量${formatCoef(step.coefBp * hits)}分${hits}段，每段${formatCoef(step.coefBp)}重新分配給${describeTargets(step.targets)}`);
      } else if (step.retarget === 'rotate') {
        parts.push(`${hits}段各${formatCoef(step.coefBp)}，依主目標、生成序輪替目標，不足時回到主目標`);
      } else if (hits > 1) {
        const interval = step.hitIntervalMs ? `每${formatSeconds(step.hitIntervalMs)}1段，` : '';
        parts.push(`${who}${describeTargets(step.targets)}${interval}共${hits}段，每段${formatCoef(step.coefBp)}`);
      } else {
        parts.push(`${who}${describeTargets(step.targets)}${each}造成${formatCoef(step.coefBp)}`);
      }
      if (step.unitPart) parts.push(`此段屬召喚傷害，沒有${UNIT_LABELS[step.unitPart]}時不出手`);
      if (step.armorIgnoreBp) parts.push(`計傷時忽略${formatPercentBp(step.armorIgnoreBp)}剩餘護甲`);
      if (step.consume) parts.push(describeConsume(step.consume, step.consumePer));
      if (step.requiresPassive) parts[0] = `（分支被動生效時）${parts[0]}`;
      return parts.join('；');
    }
    case 'applyStatus': {
      const where =
        step.targets === 'sameAsPreviousDamage'
          ? ''
          : step.targets === 'mainOfPreviousDamage'
            ? '主目標'
            : step.targets === 'othersOfPreviousDamage'
              ? '其他目標'
              : describeTargets(step.targets);
      const text = `${where}${describeStatus(step.status)}`;
      return step.requiresPassive ? `（分支被動生效時）${text}` : text;
    }
    case 'copyDotStack':
      return `複製主目標1層${statusLabel(step.statusId)}到其他最多${step.toOthers}名敵人，沿用剩餘期`;
    case 'spawnUnit':
      return describeSpawn(step);
    case 'resolveOldestUnit':
      return '提前結算最舊的幻影或替身（沒有也可施放）';
    case 'selfBuff':
      return `${step.label}：${describeBuffEffect(step.effect)}，持續${formatSeconds(step.durationMs)}`;
    case 'gainResource':
      return `額外獲得${step.amount}層${RESOURCE_LABELS[step.resource]}`;
    case 'playCards':
      switch (step.mode) {
        case 'setNext':
          return '把下一張牌設為預定花色（只改1次，不增加出牌）';
        case 'fixedSequence':
          return `依序打出紅心→方塊→梅花→黑桃${step.count}張，各${formatCoef(step.coefBp)}並執行花色效果`;
        case 'pointer':
          return step.count > 1
            ? `${step.count}張牌各${formatCoef(step.coefBp)}，依花色指標逐張推進並執行花色效果，${step.spreadTargets ? '依序輪替目標，只有一名敵人時集中' : '集中主目標'}`
            : `主目標${formatCoef(step.coefBp)}；有花色被動時使用並前進一次花色指標`;
      }
  }
}

export function describeSteps(steps: readonly EffectStep[]): string {
  return steps.map(describeStep).join('；') + '。';
}

export function describeAutoCast(rule: AutoCastRule, fallbackMs: number): string {
  const wait = `；最多等待${formatSeconds(fallbackMs)}仍可施放`;
  switch (rule.kind) {
    case 'hasEnemy':
      return '有敵人即施放';
    case 'mainTargetLacksStatus':
      return rule.refreshBelowMs > 0
        ? `主目標無破甲或剩餘不足${formatSeconds(rule.refreshBelowMs)}${wait}`
        : `主目標無破甲時優先${wait}`;
    case 'mainTargetLacksStatusId':
      return rule.refreshBelowMs > 0
        ? `主目標無${statusLabel(rule.statusId)}或剩餘不足${formatSeconds(rule.refreshBelowMs)}${wait}`
        : `主目標沒有${statusLabel(rule.statusId)}時優先${wait}`;
    case 'mainTargetHasStatusId':
      return `主目標帶有${statusLabel(rule.statusId)}時優先${wait}`;
    case 'targetStacksAtLeast':
      return `主目標${statusLabel(rule.statusId)}達${rule.amount}層${rule.minRemainingMs ? `且剩餘至少${formatSeconds(rule.minRemainingMs)}` : ''}${wait}`;
    case 'targetStacksBelow':
      return `主目標${statusLabel(rule.statusId)}未滿${rule.amount}層時優先${wait}`;
    case 'targetMarkKindsAtLeast':
      return `主目標至少${rule.amount}種印記${wait}`;
    case 'selfResourceAtLeast':
      return `${RESOURCE_LABELS[rule.resource]}達${rule.amount}層${wait}`;
    case 'selfResourceBelow':
      return `${RESOURCE_LABELS[rule.resource]}未滿${rule.amount}層時優先${wait}`;
    case 'selfBuffAbsent':
      return `沒有同名增益時施放${wait}`;
    case 'unitsBelowCapOrOldestExpiring':
      return rule.oldestRemainingAtMostMs > 0
        ? `${UNIT_LABELS[rule.unitKind]}少於${rule.below}或最舊剩餘≤${formatSeconds(rule.oldestRemainingAtMostMs)}${wait}`
        : `場上沒有${UNIT_LABELS[rule.unitKind]}時施放${wait}`;
    case 'groupBelowCapOrOldestExpiring':
      return `幻影與替身少於${rule.below}個或最舊剩餘≤${formatSeconds(rule.oldestRemainingAtMostMs)}${wait}`;
    case 'groupCountAtLeast':
      return `場上至少${rule.amount}個幻影或替身${wait}`;
    case 'groupOldestExpiring':
      return `有單位且剩餘≤${formatSeconds(rule.remainingAtMostMs)}時優先${wait}`;
    case 'requiresUnit':
      return `至少${rule.atLeast}${unitCounter(rule.unitKind)}${UNIT_LABELS[rule.unitKind]}存在；沒有則持續跳過`;
    case 'requiresUnitAndMainLacksStatus':
      return `有${UNIT_LABELS[rule.unitKind]}且主目標無同名${statusLabel(rule.statusId)}${wait}；沒有${UNIT_LABELS[rule.unitKind]}則持續跳過`;
    case 'requiresUnitPreferStatus':
      return `需要${UNIT_LABELS[rule.unitKind]}；主目標有${statusLabel(rule.statusId)}時優先${wait}`;
    case 'nextSuitIsNotPreferred':
      return `下一張不是預定花色時施放${wait}`;
    case 'nextSuitIsPreferred':
      return `預定花色即將出現時施放${wait}`;
    case 'pendingSetSuit':
      return `切牌後優先${wait}`;
  }
}

function describeTrigger(trigger: ProcTrigger, name: SkillNameLookup): string {
  switch (trigger.kind) {
    case 'basicAttackCount':
      return `每${trigger.every}次本體普攻後`;
    case 'regularSkillCastCount':
      return `每${trigger.every}次本體常規技能施放`;
    case 'distinctRegularSequence':
      return `${trigger.length === 2 ? '兩' : '三'}種不同常規技能依序施放後`;
    case 'skillCast':
      return trigger.singleTargetOnly ? `${name(trigger.skillId)}只有一名目標時` : `施放${name(trigger.skillId)}後`;
    case 'skillCastConsumed':
      return `${trigger.skillIds.map(name).join('或')}消耗至少${trigger.minConsumed}後`;
    case 'skillCastRetained':
      return `${trigger.skillIds.map(name).join('或')}因被動保留層數後`;
    case 'skillEnded': {
      const who = trigger.ultimate ? '每次絕招' : name(trigger.skillId ?? '');
      return trigger.requireLastHitLanded ? `${who}最後一段命中後` : `${who}結束後`;
    }
    case 'skillKill':
      return `${name(trigger.skillId)}本次施放首次擊殺後`;
    case 'ultimateCast':
      return '絕招施放後';
    case 'basicCrit':
      return '普攻暴擊後';
    case 'directSkillCrit':
      return '本體直接技能暴擊後';
    case 'basicKill':
      return '本體普攻擊殺後';
    case 'waveStartFirstBasic':
      return '新波次首次本體普攻';
    case 'armorBreakApplied':
      return '破甲生效後';
    case 'bodyHitOnTargetWithStatus': {
      const stacks = trigger.minStacks ? `滿${trigger.minStacks}層` : '帶有';
      const who = trigger.basicOnly ? '本體普攻' : '本體';
      const every = trigger.every ? `，每${trigger.every}次` : '';
      return `${who}命中${stacks}${statusLabel(trigger.statusId)}的目標${every}`;
    }
    case 'unitHitAfterBodyHit':
      return `本體命中後${formatSeconds(trigger.windowMs)}內${UNIT_LABELS[trigger.unitKind]}命中同一目標`;
    case 'unitHitOnTargetWithStatus':
      return `${UNIT_LABELS[trigger.unitKind]}命中帶${statusLabel(trigger.statusId)}的目標，每${trigger.every}次`;
    case 'sameSuitTwice':
      return '連續兩張同花色後';
    case 'statusExpired':
      return `${statusLabel(trigger.statusId)}自然到期且目標存活時（被刷新不觸發）`;
    case 'buffExpired':
      return '該增益結束後';
    case 'buffChargesDepleted':
      return '刻印最後一次觸發時';
    case 'mainTargetDied':
      return '主目標死亡時';
    case 'directSkillHitCleanTarget':
      return '本體直接技能首次命中無狀態目標時（每目標一次）';
    case 'dotFirstOnTarget':
      return '首次對新目標施加持續傷害時（每目標一次）';
    case 'sameTargetBasicCount':
      return `同一目標累積${trigger.count}次本體普攻後`;
    case 'sameTargetDuration':
      return `攻擊同一目標滿${formatSeconds(trigger.durationMs)}後`;
  }
}

function describeProcTarget(target: ProcTarget, count: number | undefined): string {
  switch (target) {
    case 'same':
      return '';
    case 'main':
      return '主目標';
    case 'otherPreferred':
      return '（優先另一目標，無則主目標）';
    case 'otherOnly':
      return '另一目標';
    case 'othersEach':
      return `其他最多${count ?? 2}名敵人各`;
    case 'upToEach':
      return `最多${count ?? 3}名敵人各`;
  }
}

function describePayload(payload: ProcPayload, name: SkillNameLookup): string {
  switch (payload.kind) {
    case 'nextUnitRoundBonus':
      return `下一輪最多${payload.maxUnits}${unitCounter(payload.unitKind)}${UNIT_LABELS[payload.unitKind]}各加${formatPercentBp(payload.pctBp)}傷害`;
    case 'nextUnitRoundExtra':
      return `${UNIT_LABELS[payload.unitKind]}下一輪每${unitCounter(payload.unitKind)}追加${formatCoef(payload.coefBp)}`;
    case 'nextSkillUnitPartBonus':
      return `下一次${name(payload.skillId)}的召喚段傷害+${formatPercentBp(payload.pctBp)}`;
    case 'spawnUnit':
      return `${describeSpawn(payload.unit)}（此生成不再觸發其他生成效果）`;
    case 'applyStatus':
      return `對${payload.target === 'same' ? '該目標' : '另一目標'}${describeStatus(payload.status)}`;
    case 'copyDot':
      return `把保留的1層${statusLabel(payload.statusId)}傳播到另一目標${payload.toOthers > 1 ? `（最多${payload.toOthers}名）` : ''}，沿用剩餘期`;
    case 'extraHit': {
      const timing = {
        immediate: '追加',
        afterAction: '行動結束後追加',
        nextBasic: '下一次本體普攻追加',
        nextRegularSkill: '下一次常規直接技能追加',
        nextUltimate: '下一次絕招追加',
        nextSkillId: `下一次${name(payload.skillId ?? '')}追加`,
        nextCard: '下一張牌追加',
        nextSummonHit: '下一次召喚物命中追加（沒有召喚物則改為下一次普攻）',
      }[payload.timing];
      const charges = payload.charges && payload.charges > 1 ? `，可用${payload.charges}次` : '';
      const fallback = payload.fallbackMainCoefBp ? `；沒有其他目標則主目標${formatCoef(payload.fallbackMainCoefBp)}` : '';
      return `${timing}${describeProcTarget(payload.target, payload.count)}${formatCoef(payload.coefBp)}${charges}${fallback}；追加不再觸發其他追加`;
    }
  }
}

export function describeProc(proc: ProcDef, name: SkillNameLookup = ID_ONLY): string {
  const conditions: string[] = [];
  if (proc.requireUnit) conditions.push(`${UNIT_LABELS[proc.requireUnit]}存在時`);
  if (proc.requireBuff) conditions.push(proc.oncePerBuff ? '增益期間首次' : '增益期間');
  const prefix = conditions.length > 0 ? `${conditions.join('、')}，` : '';
  const icd = proc.internalCooldownMs ? `；內置間隔${formatSeconds(proc.internalCooldownMs)}` : '';
  return `${prefix}${describeTrigger(proc.trigger, name)}，${describePayload(proc.payload, name)}${icd}。`;
}

function describeResource(rule: ResourceRuleDef): string {
  const label = RESOURCE_LABELS[rule.resource];
  const parts: string[] = [];
  if (rule.gainOnBasicAttack > 0) {
    const every = rule.basicAttacksPerGain && rule.basicAttacksPerGain > 1 ? `每${rule.basicAttacksPerGain}次` : '每次';
    parts.push(`${rule.sameTargetOnly ? '本體普攻命中同一主目標' : `本體普攻${every}`}+${rule.gainOnBasicAttack}`);
  }
  if (rule.gainOnRegularSkillCast > 0) parts.push(`非消耗常規技能每次+${rule.gainOnRegularSkillCast}`);
  if (rule.gainOnBodyDirectAction) parts.push(`本體直接攻擊行動每次+${rule.gainOnBodyDirectAction}（多段只算一次）`);
  if (rule.sameTargetOnly) parts.push(`主目標死亡保留${rule.keepOnTargetDeath ?? 0}層，換目標歸零`);
  return `${label}：${parts.join('，')}，上限${rule.max}。`;
}

function describeConsumeModifier(modifier: ConsumeModifierDef, name: SkillNameLookup): string {
  const parts: string[] = [];
  if (modifier.maxConsumed) parts.push(`最多消耗${modifier.maxConsumed}層`);
  if (modifier.reduceConsumedBy) parts.push(`保留${modifier.reduceConsumedBy}層且不計入消耗加傷`);
  if (modifier.bonusByConsumedBp) {
    const bonuses = modifier.bonusByConsumedBp
      .map((bp, count) => (bp > 0 ? `消耗${count}種時消耗部分+${formatPercentBp(bp)}` : null))
      .filter((text): text is string => text !== null);
    parts.push(bonuses.join('、'));
  }
  return `${modifier.skillIds.map(name).join('、')}：${parts.join('，')}。`;
}

function describeSuits(suits: SuitRuleDef): string {
  return (
    `紅心：下一次本體普攻+${formatPercentBp(suits.heartNextBasicBonusBp)}；` +
    `方塊：護甲-${formatPercentBp(suits.diamondArmorBreakBp)}持續${formatSeconds(suits.diamondDurationMs)}；` +
    `梅花：另一目標${formatCoef(suits.clubExtraCoefBp)}；黑桃：本張+${formatCoef(suits.spadeExtraCoefBp)}；` +
    `預定花色為${SUIT_NAMES[suits.preferredSuit]}。`
  );
}

function describeStatic(mods: StaticModifiers, name: SkillNameLookup): string[] {
  const lines: string[] = [];
  if (mods.deathTransfer) {
    const transfer = mods.deathTransfer;
    const what = transfer.statusIds.map(statusLabel).join('→');
    const amount = transfer.stackAmount > 0 ? `${transfer.stackAmount}層` : `最多${transfer.kinds}種`;
    const time = transfer.durationFactorBp === 10000 ? '沿用剩餘時間' : `剩餘時間的${formatPercentBp(transfer.durationFactorBp)}`;
    lines.push(`目標死亡時把${what}${amount}轉移給下一名敵人，${time}；沒有下一名敵人則清除。`);
  }
  if (mods.buffDurationBonus) lines.push(`該增益持續時間+${formatSeconds(mods.buffDurationBonus.addMs)}。`);
  if (mods.singleEnemyCastBonus) {
    lines.push(`${name(mods.singleEnemyCastBonus.skillId)}施放時只有一名敵人，整次傷害+${formatPercentBp(mods.singleEnemyCastBonus.pctBp)}。`);
  }
  if (mods.setSuitEffectBonusBp) lines.push(`切牌指定的那張牌花色效果+${formatPercentBp(mods.setSuitEffectBonusBp)}（與王牌封印加算）。`);
  if (mods.unitFirstAttackExtra) {
    const extra = mods.unitFirstAttackExtra;
    lines.push(`${name(extra.skillId)}生成的單位第一次攻擊${extra.target === 'otherOnly' ? '向另一目標' : ''}追加${formatCoef(extra.coefBp)}，每次生成一次。`);
  }
  return lines;
}

/** 被動完整規則文案：資源、消耗修正、花色、常駐單位、觸發與靜態修正。 */
export function describePassive(effect: PassiveEffectDef, name: SkillNameLookup = ID_ONLY): string {
  const lines: string[] = [];
  if (effect.resource) lines.push(describeResource(effect.resource));
  if (effect.consumeModifier) lines.push(describeConsumeModifier(effect.consumeModifier, name));
  if (effect.suits) lines.push(describeSuits(effect.suits));
  if (effect.companion) {
    const unit = effect.companion;
    lines.push(`常駐1${unitCounter(unit.unitKind)}${UNIT_LABELS[unit.unitKind]}，每${formatSeconds(unit.attackIntervalMs)}對主目標${formatCoef(unit.coefBp)}；沒有血量、裝備與經驗。`);
  }
  if (effect.projectileRetargetOnce) lines.push('已發射的本體攻擊在命中前原目標死亡時，依優先序重新選目標一次；沒有活目標則銷毀。');
  lines.push(...describeStatic(effect, name));
  lines.push(...effect.procs.map((proc) => describeProc(proc, name)));
  if (lines.length === 0 && effect.rulesNote) lines.push(effect.rulesNote);
  return lines.join('');
}

export function describeLegend(legend: LegendEffectDef, name: SkillNameLookup = ID_ONLY): string {
  return [...describeStatic(legend, name), ...legend.procs.map((proc) => describeProc(proc, name))].join('');
}
