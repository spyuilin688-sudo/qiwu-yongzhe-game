import type { ContentCatalog } from './catalog.ts';
import { statusLabel } from './describe.ts';
import type { EffectStep, LegendEffectDef, ProcDef } from './effects/types.ts';
import type { UnitKind } from './ids.ts';
import { UNIT_LABELS } from './ids.ts';
import { skillNameLookup } from './queries.ts';

/**
 * 傳說特效在目前配置下能否觸發（規格：與目前技能不相容的共用部位傳說要標示「未啟用」）。
 * 只依內容資料推導（技能步驟會施加哪些狀態、增益、召喚物），不在介面另寫規則。
 */
export interface LoadoutForLegend {
  readonly skillIds: readonly string[];
  readonly ultimateId: string | null;
  readonly passiveIds: readonly string[];
}

interface LoadoutFacts {
  readonly equipped: ReadonlySet<string>;
  readonly regularCount: number;
  readonly hasUltimate: boolean;
  readonly steps: readonly EffectStep[];
  /** 只含常規技能（不含絕招）的步驟，用於「下一次常規直接技能」。 */
  readonly regularSteps: readonly EffectStep[];
  readonly hasSuits: boolean;
  readonly companions: ReadonlySet<UnitKind>;
}

function factsOf(catalog: ContentCatalog, loadout: LoadoutForLegend): LoadoutFacts {
  const equippedIds = [...loadout.skillIds, ...(loadout.ultimateId ? [loadout.ultimateId] : [])];
  const passives = loadout.passiveIds.map((id) => catalog.passives.get(id)?.effect).filter((effect) => effect !== null && effect !== undefined);
  return {
    equipped: new Set(equippedIds),
    regularCount: loadout.skillIds.length,
    hasUltimate: loadout.ultimateId !== null,
    steps: equippedIds.flatMap((id) => catalog.skills.get(id)?.effect?.steps ?? []),
    regularSteps: loadout.skillIds.flatMap((id) => catalog.skills.get(id)?.effect?.steps ?? []),
    hasSuits: passives.some((effect) => effect.suits !== undefined),
    companions: new Set(passives.flatMap((effect) => (effect.companion ? [effect.companion.unitKind] : []))),
  };
}

function producesStatus(facts: LoadoutFacts, statusId: string): boolean {
  return facts.steps.some(
    (step) =>
      (step.type === 'applyStatus' && step.status.statusId === statusId) ||
      (step.type === 'selfBuff' && step.effect.kind === 'basicAppliesStatus' && step.effect.status.statusId === statusId),
  );
}

function producesBuff(facts: LoadoutFacts, buffId: string): boolean {
  return facts.steps.some((step) => step.type === 'selfBuff' && step.buffId === buffId);
}

function producesUnit(facts: LoadoutFacts, unitKind: UnitKind): boolean {
  return facts.companions.has(unitKind) || facts.steps.some((step) => step.type === 'spawnUnit' && step.unitKind === unitKind);
}

function isDirectDamage(step: EffectStep): boolean {
  return (step.type === 'damage' && !step.unitPart) || (step.type === 'playCards' && step.mode !== 'setNext');
}

function hasDirectDamage(facts: LoadoutFacts): boolean {
  return facts.steps.some(isDirectDamage);
}

function hasDot(facts: LoadoutFacts): boolean {
  return facts.steps.some(
    (step) =>
      (step.type === 'applyStatus' && (step.status.kind === 'dot' || step.status.kind === 'dotStack')) ||
      (step.type === 'selfBuff' && step.effect.kind === 'basicAppliesStatus'),
  );
}

function hasArmorBreak(facts: LoadoutFacts): boolean {
  const cards = facts.hasSuits && facts.steps.some((step) => step.type === 'playCards' && step.mode !== 'setNext');
  return cards || facts.steps.some((step) => step.type === 'applyStatus' && step.status.kind === 'armorBreak');
}

function procBlocker(catalog: ContentCatalog, proc: ProcDef, facts: LoadoutFacts): string | null {
  const name = skillNameLookup(catalog);
  const needSkills = (ids: readonly string[]) => (ids.some((id) => facts.equipped.has(id)) ? null : `需要裝備${ids.map(name).join('或')}`);
  const trigger = proc.trigger;
  let reason: string | null = null;
  switch (trigger.kind) {
    case 'skillCast':
    case 'skillCastConsumed':
    case 'skillCastRetained':
      reason = needSkills(trigger.skillIds);
      break;
    case 'skillKill':
      reason = needSkills([trigger.skillId]);
      break;
    case 'skillEnded':
      if (trigger.ultimate) reason = facts.hasUltimate ? null : '需要三轉絕招';
      else if (trigger.skillId) reason = needSkills([trigger.skillId]);
      break;
    case 'ultimateCast':
      reason = facts.hasUltimate ? null : '需要三轉絕招';
      break;
    case 'distinctRegularSequence':
      reason = facts.regularCount >= trigger.length ? null : `需要至少${trigger.length}種常規技能`;
      break;
    case 'directSkillCrit':
    case 'directSkillHitCleanTarget':
      reason = hasDirectDamage(facts) ? null : '需要直接傷害技能';
      break;
    case 'armorBreakApplied':
      reason = hasArmorBreak(facts) ? null : '需要會破甲的技能';
      break;
    case 'dotFirstOnTarget':
      reason = hasDot(facts) ? null : '需要持續傷害技能';
      break;
    case 'bodyHitOnTargetWithStatus':
    case 'statusExpired':
      reason = producesStatus(facts, trigger.statusId) ? null : `需要能施加${statusLabel(trigger.statusId)}的技能`;
      break;
    case 'unitHitAfterBodyHit':
      reason = producesUnit(facts, trigger.unitKind) ? null : `需要${UNIT_LABELS[trigger.unitKind]}`;
      break;
    case 'unitHitOnTargetWithStatus':
      if (!producesUnit(facts, trigger.unitKind)) reason = `需要${UNIT_LABELS[trigger.unitKind]}`;
      else if (!producesStatus(facts, trigger.statusId)) reason = `需要能施加${statusLabel(trigger.statusId)}的技能`;
      break;
    case 'buffExpired':
    case 'buffChargesDepleted':
      reason = producesBuff(facts, trigger.buffId) ? null : '需要對應的增益技能';
      break;
    case 'sameSuitTwice':
      reason = facts.hasSuits ? null : '需要花色輪轉（牌術路線）';
      break;
    default:
      reason = null;
  }
  if (reason) return reason;
  if (proc.requireUnit && !producesUnit(facts, proc.requireUnit)) return `需要${UNIT_LABELS[proc.requireUnit]}`;
  if (proc.requireBuff && !producesBuff(facts, proc.requireBuff)) return '需要對應的增益技能';
  const payload = proc.payload;
  switch (payload.kind) {
    case 'extraHit':
      if (payload.timing === 'nextUltimate' && !facts.hasUltimate) return '需要三轉絕招';
      if (payload.timing === 'nextSkillId' && payload.skillId) return needSkills([payload.skillId]);
      if (payload.timing === 'nextRegularSkill' && !facts.regularSteps.some(isDirectDamage)) return '需要常規直接技能';
      if (payload.timing === 'nextRegularSkillAny' && facts.regularCount === 0) return '需要常規技能';
      if (payload.timing === 'nextCard' && !facts.steps.some((step) => step.type === 'playCards' && step.mode !== 'setNext')) return '需要出牌技能';
      return null;
    case 'nextUnitRoundBonus':
    case 'nextUnitRoundExtra':
      return producesUnit(facts, payload.unitKind) ? null : `需要${UNIT_LABELS[payload.unitKind]}`;
    case 'nextSkillUnitPartBonus':
      return needSkills([payload.skillId]);
    default:
      return null;
  }
}

/** 回傳不能觸發的原因；可以觸發時回傳 null。 */
export function legendInactiveReason(catalog: ContentCatalog, legend: LegendEffectDef, loadout: LoadoutForLegend): string | null {
  const facts = factsOf(catalog, loadout);
  const name = skillNameLookup(catalog);
  for (const proc of legend.procs) {
    const reason = procBlocker(catalog, proc, facts);
    if (reason) return reason;
  }
  if (legend.singleEnemyCastBonus && !facts.equipped.has(legend.singleEnemyCastBonus.skillId)) return `需要裝備${name(legend.singleEnemyCastBonus.skillId)}`;
  if (legend.unitFirstAttackExtra && !facts.equipped.has(legend.unitFirstAttackExtra.skillId)) return `需要裝備${name(legend.unitFirstAttackExtra.skillId)}`;
  if (legend.buffDurationBonus && !producesBuff(facts, legend.buffDurationBonus.buffId)) return '需要對應的增益技能';
  if (legend.setSuitEffectBonusBp && !facts.steps.some((step) => step.type === 'playCards' && step.mode === 'setNext')) return '需要切牌';
  if (legend.deathTransfer && !legend.deathTransfer.statusIds.some((statusId) => producesStatus(facts, statusId))) {
    return `需要能施加${legend.deathTransfer.statusIds.map(statusLabel).join('或')}的技能`;
  }
  return null;
}
