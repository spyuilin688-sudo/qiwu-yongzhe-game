import type { AutoCastRule, EffectStep, ProcDef, StatusSpec, TargetRule } from './effects/types.ts';
import { RESOURCE_LABELS, UNIT_LABELS } from './ids.ts';

/**
 * 由同一份效果參數產生介面文案（規格 07：資料保存描述鍵與參數，由同一份參數生成文案，
 * 避免顯示 8 秒但程式跑 10 秒）。
 */

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

function describeTargets(targets: TargetRule): string {
  switch (targets.kind) {
    case 'main':
      return '主目標';
    case 'upTo':
      return `最多${targets.count}名敵人`;
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
    case 'summonDamageTaken':
      return `${status.label}：${status.unitKinds.map((kind) => UNIT_LABELS[kind]).join('、')}對此目標傷害+${formatPercentBp(status.pctBp)}，持續${formatSeconds(status.durationMs)}`;
  }
}

export function describeStep(step: EffectStep): string {
  switch (step.type) {
    case 'damage': {
      const hits = step.hits ?? 1;
      const parts: string[] = [];
      if (step.distributeTotal) {
        parts.push(
          `總量${formatCoef(step.coefBp * hits)}分${hits}段，每段${formatCoef(step.coefBp)}重新分配給${describeTargets(step.targets)}`,
        );
      } else if (hits > 1) {
        const interval = step.hitIntervalMs ? `每${formatSeconds(step.hitIntervalMs)}1段，` : '';
        parts.push(`${describeTargets(step.targets)}${interval}共${hits}段，每段${formatCoef(step.coefBp)}`);
      } else {
        parts.push(`${describeTargets(step.targets)}${step.targets.kind === 'upTo' ? '各' : ''}造成${formatCoef(step.coefBp)}`);
      }
      if (step.armorIgnoreBp) parts.push(`計傷時忽略${formatPercentBp(step.armorIgnoreBp)}剩餘護甲`);
      if (step.consume) {
        parts.push(
          `每消耗1層${RESOURCE_LABELS[step.consume.resource]}額外${formatCoef(step.consume.perUnitCoefBp)}，最多${step.consume.max}層`,
        );
      }
      return parts.join('；');
    }
    case 'applyStatus':
      return describeStatus(step.status);
    case 'spawnUnit':
      return `建立${UNIT_LABELS[step.unitKind]}${formatSeconds(step.durationMs)}，每${formatSeconds(step.attackIntervalMs)}對1名敵人${formatCoef(step.coefBp)}；最多${step.cap}${step.unitKind === 'turret' ? '座' : '架'}`;
    case 'selfBuff':
      return `${step.label}：${UNIT_LABELS[step.effect.unitKind]}攻擊間隔×${(step.effect.multBp / 10000).toFixed(2)}，持續${formatSeconds(step.durationMs)}`;
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
    case 'selfResourceAtLeast':
      return `${RESOURCE_LABELS[rule.resource]}達${rule.amount}層${wait}`;
    case 'unitsBelowCapOrOldestExpiring':
      return `${UNIT_LABELS[rule.unitKind]}少於${rule.below}或最舊剩餘≤${formatSeconds(rule.oldestRemainingAtMostMs)}${wait}`;
    case 'requiresUnit':
      return `至少${rule.atLeast}${rule.unitKind === 'turret' ? '座' : '架'}${UNIT_LABELS[rule.unitKind]}存在；沒有則持續跳過`;
    case 'requiresUnitAndMainLacksStatus':
      return `有${UNIT_LABELS[rule.unitKind]}且主目標無同名信標${wait}；沒有${UNIT_LABELS[rule.unitKind]}則持續跳過`;
  }
}

export function describeProc(proc: ProcDef): string {
  const trigger = (() => {
    const t = proc.trigger;
    switch (t.kind) {
      case 'basicAttackCount':
        return `每${t.every}次本體普攻後`;
      case 'regularSkillCastCount':
        return `每${t.every}次本體常規技能施放`;
      case 'distinctRegularSequence':
        return `${t.length === 2 ? '兩' : '三'}種不同常規技能依序施放後`;
      case 'skillCast':
        return `施放指定技能（${t.skillId}）後`;
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
      case 'bodyHitOnTargetWithStatus':
        return `本體命中帶有${t.statusId === 'BEACON' ? '集火信標' : t.statusId}的目標後`;
    }
  })();
  const payload = (() => {
    const p = proc.payload;
    if (p.kind === 'nextUnitRoundBonus') {
      return `下一輪最多${p.maxUnits}${p.unitKind === 'turret' ? '座' : '架'}${UNIT_LABELS[p.unitKind]}各加${formatPercentBp(p.pctBp)}傷害`;
    }
    const timing = {
      immediate: '追加',
      nextBasic: '下一次本體普攻追加',
      nextRegularSkill: '下一次常規直接技能追加',
      nextUltimate: '下一次絕招對主目標追加',
    }[p.timing];
    const target = { same: '', main: '主目標', otherPreferred: '（優先另一目標，無則主目標）', otherOnly: '另一目標' }[p.target];
    return `${timing}${target}${formatCoef(p.coefBp)}；追加不再觸發其他追加`;
  })();
  const icd = proc.internalCooldownMs ? `；內置間隔${formatSeconds(proc.internalCooldownMs)}` : '';
  return `${trigger}，${payload}${icd}。`;
}
