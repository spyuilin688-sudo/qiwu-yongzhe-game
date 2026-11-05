import { ELEMENT_MARK_IDS } from '../ids.ts';
import type { SkillEffectDef, SpawnUnitStep, StatusSpec } from './types.ts';

/**
 * 全部 70 個技能的效果（N 原型值，對照設計資料 skills[].prototype_effect）。
 * 段與段的間隔（hitIntervalMs）與協同攻擊的延遲是原型值，設計資料未指定。
 * 與設計倍率不同的地方全部列在 balanceAdjustments.ts（附原因），驗證器只接受清單內的差異。
 */

// ── 共用狀態規格：同一狀態只在這裡定義一次，避免不同技能各寫一份造成層數或秒數不一致 ──

const BREACH: StatusSpec = { kind: 'stack', statusId: 'BREACH', label: '破陣', add: 1, max: 3, durationMs: 8000 };
const FROST_1: StatusSpec = { kind: 'stack', statusId: 'FROST', label: '寒霜', add: 1, max: 5, durationMs: 8000 };
const FROST_2: StatusSpec = { ...FROST_1, add: 2 };
const SEAL_1: StatusSpec = { kind: 'stack', statusId: 'SEAL', label: '聖印', add: 1, max: 3, durationMs: 8000 };
const SEAL_2: StatusSpec = { ...SEAL_1, add: 2 };
export const POISON_STACK: StatusSpec = {
  kind: 'dotStack',
  statusId: 'POISON',
  label: '毒',
  add: 1,
  maxStacks: 5,
  coefPerTickBp: 1200,
  ticks: 6,
  intervalMs: 1000,
};
const POISON_2: StatusSpec = { ...POISON_STACK, add: 2 };

/** 幻影與替身共用的上限群組（幻影舞臺：合計 2 個）。 */
export const STAGE_GROUP = 'STAGE';

/** 基本幻影：鏡像飛牌、戲法換位、謝幕返場共用同一規格。 */
export const BASIC_PHANTOM: SpawnUnitStep = {
  type: 'spawnUnit',
  unitKind: 'phantom',
  durationMs: 8000,
  attackIntervalMs: 2000,
  // 設計 0.35A；平衡調整為 0.55A（見 balanceAdjustments.ts）。提前結算的補一擊維持 0.35A。
  coefBp: 5500,
  cap: 2,
  capGroup: STAGE_GROUP,
  onResolve: { coefBp: 3500, targets: { kind: 'main' }, when: 'early' },
};

const DEFS: readonly SkillEffectDef[] = [
  // ── 劍士 JOB01 ──
  {
    skillId: 'SK001',
    steps: [{ type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 15000 }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK002',
    steps: [
      { type: 'damage', targets: { kind: 'main' }, coefBp: 18000 },
      {
        type: 'applyStatus',
        targets: 'sameAsPreviousDamage',
        status: { kind: 'armorBreak', statusId: 'SK002_ARMOR_BREAK', label: '破甲', pctBp: 2000, durationMs: 6000 },
      },
    ],
    autoCast: { kind: 'mainTargetLacksStatus', statusKind: 'armorBreak', refreshBelowMs: 1000 },
    generatesResource: true,
  },
  // ── 狂劍士 JOB02 ──
  {
    skillId: 'SK003',
    steps: [{ type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 4000, hits: 4, hitIntervalMs: 250, retarget: 'reacquire' }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK004',
    steps: [
      {
        type: 'damage',
        targets: { kind: 'main' },
        coefBp: 24000,
        consume: { from: 'selfResource', resource: 'FIGHTING_SPIRIT', perUnitCoefBp: 4000, max: 5 },
      },
    ],
    autoCast: { kind: 'selfResourceAtLeast', resource: 'FIGHTING_SPIRIT', amount: 5 },
    generatesResource: false,
  },
  // ── 劍聖 JOB03 ──
  {
    skillId: 'SK005',
    steps: [{ type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 12000 }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK006',
    steps: [
      {
        type: 'damage',
        targets: { kind: 'upTo', count: 3 },
        // 總量 6.00A（設計 9.00A，見平衡調整），依序 6 段，每段 1.00A 重新分配給存活敵人。
        coefBp: 10000,
        hits: 6,
        hitIntervalMs: 200,
        retarget: 'reacquire',
        distributeTotal: true,
      },
    ],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: false,
  },
  // ── 破陣騎士 JOB04 ──
  {
    skillId: 'SK007',
    steps: [
      { type: 'damage', targets: { kind: 'main' }, coefBp: 16000 },
      { type: 'applyStatus', targets: 'sameAsPreviousDamage', status: BREACH },
    ],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK008',
    steps: [
      {
        type: 'damage',
        targets: { kind: 'upTo', count: 3 },
        coefBp: 16000,
        consume: { from: 'targetStacks', statusId: 'BREACH', perUnitCoefBp: 3500, max: 3 },
      },
    ],
    autoCast: { kind: 'targetStacksAtLeast', statusId: 'BREACH', amount: 3 },
    generatesResource: true,
  },
  // ── 符文騎士 JOB05 ──
  {
    skillId: 'SK009',
    steps: [
      { type: 'selfBuff', buffId: 'RUNE', label: '符文刻印', durationMs: 8000, effect: { kind: 'chargedFollowUp', charges: 3, coefBp: 3500 } },
    ],
    autoCast: { kind: 'selfBuffAbsent', buffId: 'RUNE' },
    generatesResource: true,
  },
  {
    skillId: 'SK010',
    steps: [
      { type: 'damage', targets: { kind: 'main' }, coefBp: 65000 },
      { type: 'damage', targets: { kind: 'others', count: 2 }, coefBp: 18000 },
    ],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: false,
  },
  // ── 弓手 JOB06 ──
  {
    skillId: 'SK011',
    steps: [{ type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 15000 }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK012',
    steps: [{ type: 'damage', targets: { kind: 'main' }, coefBp: 22000 }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  // ── 神射手 JOB07 ──
  {
    skillId: 'SK013',
    steps: [
      { type: 'damage', targets: { kind: 'main' }, coefBp: 5000 },
      {
        type: 'applyStatus',
        targets: 'sameAsPreviousDamage',
        status: {
          kind: 'damageTakenFor',
          statusId: 'WEAK_POINT',
          label: '弱點標記',
          pctBp: 2000,
          durationMs: 8000,
          sources: ['basic', 'skill', 'ultimate'],
        },
      },
    ],
    autoCast: { kind: 'mainTargetLacksStatusId', statusId: 'WEAK_POINT', refreshBelowMs: 1000 },
    generatesResource: true,
  },
  {
    skillId: 'SK014',
    steps: [{ type: 'damage', targets: { kind: 'main' }, coefBp: 24000, armorIgnoreBp: 3000 }],
    autoCast: { kind: 'mainTargetHasStatusId', statusId: 'WEAK_POINT' },
    generatesResource: true,
  },
  // ── 星隼遊俠 JOB08 ──
  {
    skillId: 'SK015',
    steps: [{ type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 7000, hits: 4, hitIntervalMs: 150, retarget: 'rotate' }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK016',
    steps: [
      {
        type: 'damage',
        targets: { kind: 'main' },
        coefBp: 55000,
        consume: { from: 'selfResource', resource: 'FOCUS', perUnitCoefBp: 9000, max: 3 },
      },
    ],
    autoCast: { kind: 'selfResourceAtLeast', resource: 'FOCUS', amount: 3 },
    generatesResource: false,
  },
  // ── 馴獸師 JOB09 ──
  {
    skillId: 'SK017',
    steps: [
      { type: 'damage', targets: { kind: 'main' }, coefBp: 4000 },
      {
        type: 'applyStatus',
        targets: 'sameAsPreviousDamage',
        status: { kind: 'summonDamageTaken', statusId: 'PREY_MARK', label: '掠食標記', pctBp: 2500, durationMs: 8000, unitKinds: ['beast'] },
      },
    ],
    autoCast: { kind: 'mainTargetLacksStatusId', statusId: 'PREY_MARK', refreshBelowMs: 0 },
    generatesResource: true,
  },
  {
    skillId: 'SK018',
    steps: [
      { type: 'damage', targets: { kind: 'main' }, coefBp: 13000 },
      { type: 'damage', targets: { kind: 'main' }, coefBp: 15000, unitPart: 'beast', delayMs: 200 },
    ],
    autoCast: { kind: 'requiresUnitPreferStatus', unitKind: 'beast', statusId: 'PREY_MARK' },
    generatesResource: true,
  },
  // ── 獸王獵手 JOB10 ──
  {
    skillId: 'SK019',
    steps: [{ type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 16000 }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK020',
    steps: [
      {
        type: 'selfBuff',
        buffId: 'BEAST_COMMAND',
        label: '獸王號令',
        durationMs: 8000,
        effect: { kind: 'unitDamageBonus', unitKind: 'beast', pctBp: 4000 },
      },
      { type: 'damage', targets: { kind: 'main' }, coefBp: 10000 },
      { type: 'damage', targets: { kind: 'main' }, coefBp: 15000, unitPart: 'beast', delayMs: 200 },
    ],
    autoCast: { kind: 'requiresUnit', unitKind: 'beast', atLeast: 1 },
    generatesResource: false,
  },
  // ── 法師 JOB11 ──
  {
    skillId: 'SK021',
    steps: [
      { type: 'damage', targets: { kind: 'main' }, coefBp: 14000 },
      {
        type: 'applyStatus',
        targets: 'sameAsPreviousDamage',
        status: { kind: 'dot', statusId: 'BURN', label: '燃燒', coefPerTickBp: 1800, ticks: 4, intervalMs: 1000 },
      },
      { type: 'applyStatus', targets: 'sameAsPreviousDamage', status: { kind: 'mark', statusId: 'FIRE_MARK', label: '火印', durationMs: 8000 } },
    ],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK022',
    steps: [
      { type: 'damage', targets: { kind: 'main' }, coefBp: 16000 },
      { type: 'applyStatus', targets: 'sameAsPreviousDamage', status: { kind: 'mark', statusId: 'ICE_MARK', label: '冰印', durationMs: 8000 } },
      { type: 'applyStatus', targets: 'sameAsPreviousDamage', status: FROST_1, requiresPassive: 'PS014' },
    ],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  // ── 元素術士 JOB12 ──
  {
    skillId: 'SK023',
    steps: [
      { type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 15000 },
      { type: 'applyStatus', targets: 'sameAsPreviousDamage', status: { kind: 'mark', statusId: 'THUNDER_MARK', label: '雷印', durationMs: 8000 } },
    ],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK024',
    steps: [
      {
        type: 'damage',
        targets: { kind: 'main' },
        coefBp: 10000,
        consume: { from: 'targetMarks', statusIds: ELEMENT_MARK_IDS, perUnitCoefBp: 8000, max: 3 },
        extraBonusStats: ['MARK_DMG'],
      },
    ],
    autoCast: { kind: 'targetMarkKindsAtLeast', statusIds: ELEMENT_MARK_IDS, amount: 2 },
    generatesResource: true,
  },
  // ── 星界賢者 JOB13 ──
  {
    skillId: 'SK025',
    steps: [
      {
        type: 'spawnUnit',
        unitKind: 'zone',
        durationMs: 4000,
        attackIntervalMs: 1000,
        coefBp: 6000,
        attackTargets: { kind: 'upTo', count: 3 },
        damageSource: 'dot',
        cap: 1,
      },
    ],
    autoCast: { kind: 'unitsBelowCapOrOldestExpiring', unitKind: 'zone', below: 1, oldestRemainingAtMostMs: 0 },
    generatesResource: true,
  },
  {
    skillId: 'SK026',
    steps: [
      {
        type: 'damage',
        targets: { kind: 'upTo', count: 3 },
        coefBp: 30000,
        consume: { from: 'targetMarks', statusIds: ELEMENT_MARK_IDS, perUnitCoefBp: 8000, max: 3 },
        consumePer: 'each',
        extraBonusStats: ['MARK_DMG'],
      },
      { type: 'damage', targets: { kind: 'main' }, coefBp: 15000 },
    ],
    autoCast: { kind: 'targetMarkKindsAtLeast', statusIds: ELEMENT_MARK_IDS, amount: 2 },
    generatesResource: false,
  },
  // ── 冰咒師 JOB14 ──
  {
    skillId: 'SK027',
    steps: [
      { type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 14000 },
      { type: 'applyStatus', targets: 'sameAsPreviousDamage', status: FROST_1 },
    ],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK028',
    steps: [
      {
        type: 'damage',
        targets: { kind: 'main' },
        coefBp: 13000,
        consume: { from: 'targetStacks', statusId: 'FROST', perUnitCoefBp: 5500, max: 5 },
        extraBonusStats: ['SHATTER_DMG'],
      },
    ],
    autoCast: { kind: 'targetStacksAtLeast', statusId: 'FROST', amount: 5 },
    generatesResource: true,
  },
  // ── 永冬魔導士 JOB15 ──
  {
    skillId: 'SK029',
    steps: [
      { type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 18000 },
      { type: 'applyStatus', targets: 'mainOfPreviousDamage', status: FROST_2 },
      { type: 'applyStatus', targets: 'othersOfPreviousDamage', status: FROST_1 },
    ],
    autoCast: { kind: 'targetStacksBelow', statusId: 'FROST', amount: 5 },
    generatesResource: true,
  },
  {
    skillId: 'SK030',
    steps: [
      {
        type: 'damage',
        targets: { kind: 'upTo', count: 3 },
        coefBp: 35000,
        consume: { from: 'targetStacks', statusId: 'FROST', perUnitCoefBp: 6000, max: 5 },
        consumePer: 'each',
        extraBonusStats: ['SHATTER_DMG'],
      },
    ],
    autoCast: { kind: 'targetStacksAtLeast', statusId: 'FROST', amount: 5 },
    generatesResource: false,
  },
  // ── 盜賊 JOB16 ──
  {
    skillId: 'SK031',
    steps: [{ type: 'damage', targets: { kind: 'main' }, coefBp: 9000, hits: 2, hitIntervalMs: 150 }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK032',
    steps: [{ type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 16000 }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  // ── 影刃刺客 JOB17 ──
  {
    skillId: 'SK033',
    steps: [
      { type: 'damage', targets: { kind: 'main' }, coefBp: 7500, hits: 3, hitIntervalMs: 150 },
      { type: 'gainResource', resource: 'COMBO', amount: 1 },
    ],
    autoCast: { kind: 'selfResourceBelow', resource: 'COMBO', amount: 5 },
    generatesResource: true,
  },
  {
    skillId: 'SK034',
    steps: [
      { type: 'damage', targets: { kind: 'main' }, coefBp: 6000 },
      {
        type: 'applyStatus',
        targets: 'sameAsPreviousDamage',
        status: { kind: 'damageTakenFor', statusId: 'EXPOSE_MARK', label: '破綻標記', pctBp: 2500, durationMs: 8000, skillTags: ['處決'] },
      },
    ],
    autoCast: { kind: 'mainTargetLacksStatusId', statusId: 'EXPOSE_MARK', refreshBelowMs: 0 },
    generatesResource: true,
  },
  // ── 影舞者 JOB18 ──
  {
    skillId: 'SK035',
    steps: [{ type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 8000, hits: 4, hitIntervalMs: 150, retarget: 'rotate' }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK036',
    steps: [
      {
        type: 'damage',
        targets: { kind: 'main' },
        coefBp: 45000,
        consume: { from: 'selfResource', resource: 'COMBO', perUnitCoefBp: 7500, max: 5 },
        extraBonusStats: ['EXECUTE_DMG'],
      },
    ],
    autoCast: { kind: 'selfResourceAtLeast', resource: 'COMBO', amount: 5 },
    generatesResource: false,
  },
  // ── 毒刃獵手 JOB19 ──
  {
    skillId: 'SK037',
    steps: [
      { type: 'selfBuff', buffId: 'ENVENOM', label: '淬毒', durationMs: 10000, effect: { kind: 'basicAppliesStatus', status: POISON_STACK } },
    ],
    autoCast: { kind: 'selfBuffAbsent', buffId: 'ENVENOM' },
    generatesResource: true,
  },
  {
    skillId: 'SK038',
    steps: [
      { type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 8000 },
      { type: 'applyStatus', targets: 'sameAsPreviousDamage', status: POISON_2 },
    ],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  // ── 劇毒使徒 JOB20 ──
  {
    skillId: 'SK039',
    steps: [
      { type: 'damage', targets: { kind: 'main' }, coefBp: 18000 },
      { type: 'applyStatus', targets: 'sameAsPreviousDamage', status: POISON_STACK },
      { type: 'copyDotStack', statusId: 'POISON', toOthers: 2 },
    ],
    autoCast: { kind: 'mainTargetHasStatusId', statusId: 'POISON' },
    generatesResource: true,
  },
  {
    skillId: 'SK040',
    steps: [
      {
        type: 'damage',
        targets: { kind: 'main' },
        coefBp: 30000,
        consume: { from: 'targetDots', statusId: 'POISON', max: 5, remainingDamagePctBp: 8000 },
      },
    ],
    autoCast: { kind: 'targetStacksAtLeast', statusId: 'POISON', amount: 5, minRemainingMs: 3000 },
    generatesResource: false,
  },
  // ── 祭司 JOB21 ──
  {
    skillId: 'SK041',
    steps: [
      { type: 'damage', targets: { kind: 'main' }, coefBp: 18000 },
      { type: 'applyStatus', targets: 'sameAsPreviousDamage', status: SEAL_1, requiresPassive: 'PS022' },
    ],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK042',
    steps: [
      { type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 15000 },
      { type: 'applyStatus', targets: 'sameAsPreviousDamage', status: SEAL_1, requiresPassive: 'PS022' },
    ],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  // ── 聖詠祭司 JOB22 ──
  {
    skillId: 'SK043',
    steps: [
      { type: 'selfBuff', buffId: 'HYMN', label: '祝禱之歌', durationMs: 8000, effect: { kind: 'bodyDamageBonus', pctBp: 2000 } },
    ],
    autoCast: { kind: 'selfBuffAbsent', buffId: 'HYMN' },
    generatesResource: true,
  },
  {
    skillId: 'SK044',
    steps: [
      { type: 'damage', targets: { kind: 'main' }, coefBp: 12000 },
      { type: 'applyStatus', targets: 'sameAsPreviousDamage', status: SEAL_2 },
    ],
    autoCast: { kind: 'targetStacksBelow', statusId: 'SEAL', amount: 3 },
    generatesResource: true,
  },
  // ── 審判主教 JOB23 ──
  {
    skillId: 'SK045',
    steps: [
      { type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 10000, hits: 3, hitIntervalMs: 200, retarget: 'rotate' },
      { type: 'applyStatus', targets: { kind: 'main' }, status: SEAL_1 },
    ],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK046',
    steps: [
      {
        type: 'damage',
        targets: { kind: 'main' },
        coefBp: 40000,
        consume: { from: 'targetStacks', statusId: 'SEAL', perUnitCoefBp: 9000, max: 3 },
      },
      { type: 'damage', targets: { kind: 'others', count: 2 }, coefBp: 15000 },
    ],
    autoCast: { kind: 'targetStacksAtLeast', statusId: 'SEAL', amount: 3 },
    generatesResource: false,
  },
  // ── 武僧 JOB24 ──
  {
    skillId: 'SK047',
    steps: [
      { type: 'damage', targets: { kind: 'main' }, coefBp: 7000, hits: 3, hitIntervalMs: 150 },
      { type: 'gainResource', resource: 'QI', amount: 1 },
    ],
    autoCast: { kind: 'selfResourceBelow', resource: 'QI', amount: 5 },
    generatesResource: true,
  },
  {
    skillId: 'SK048',
    steps: [{ type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 19000 }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  // ── 修羅武聖 JOB25 ──
  {
    skillId: 'SK049',
    steps: [
      { type: 'damage', targets: { kind: 'main' }, coefBp: 7500, hits: 4, hitIntervalMs: 150 },
      { type: 'damage', targets: { kind: 'others', count: 2 }, coefBp: 8000 },
    ],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK050',
    steps: [
      {
        type: 'damage',
        targets: { kind: 'main' },
        coefBp: 35000,
        consume: { from: 'selfResource', resource: 'QI', perUnitCoefBp: 9000, max: 5 },
      },
    ],
    autoCast: { kind: 'selfResourceAtLeast', resource: 'QI', amount: 5 },
    generatesResource: false,
  },
  // ── 小丑 JOB26 ──
  {
    skillId: 'SK051',
    steps: [{ type: 'playCards', mode: 'pointer', count: 1, coefBp: 18000 }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK052',
    steps: [{ type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 15000 }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  // ── 牌術師 JOB27 ──
  {
    skillId: 'SK053',
    steps: [{ type: 'playCards', mode: 'setNext', count: 0, coefBp: 0 }],
    autoCast: { kind: 'nextSuitIsNotPreferred' },
    generatesResource: true,
  },
  {
    skillId: 'SK054',
    steps: [{ type: 'playCards', mode: 'pointer', count: 3, coefBp: 12000, hitIntervalMs: 200, spreadTargets: true }],
    autoCast: { kind: 'pendingSetSuit' },
    generatesResource: true,
  },
  // ── 命運魔術師 JOB28 ──
  {
    skillId: 'SK055',
    steps: [{ type: 'selfBuff', buffId: 'ACE_SEAL', label: '王牌封印', durationMs: 8000, effect: { kind: 'suitBoost', pctBp: 5000 } }],
    autoCast: { kind: 'nextSuitIsPreferred' },
    generatesResource: true,
  },
  {
    skillId: 'SK056',
    steps: [{ type: 'playCards', mode: 'fixedSequence', count: 4, coefBp: 22000, hitIntervalMs: 200 }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: false,
  },
  // ── 幻戲師 JOB29 ──
  {
    skillId: 'SK057',
    steps: [BASIC_PHANTOM],
    autoCast: { kind: 'groupBelowCapOrOldestExpiring', capGroup: STAGE_GROUP, below: 2, oldestRemainingAtMostMs: 2000 },
    generatesResource: true,
  },
  {
    skillId: 'SK058',
    steps: [
      {
        type: 'spawnUnit',
        unitKind: 'decoy',
        durationMs: 3000,
        attackIntervalMs: 0,
        coefBp: 0,
        cap: 2,
        capGroup: STAGE_GROUP,
        onResolve: { coefBp: 16000, targets: { kind: 'upTo', count: 3 }, when: 'always' },
      },
    ],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  // ── 千面幻術師 JOB30 ──
  {
    skillId: 'SK059',
    steps: [{ type: 'resolveOldestUnit', capGroup: STAGE_GROUP }, BASIC_PHANTOM],
    autoCast: { kind: 'groupOldestExpiring', capGroup: STAGE_GROUP, remainingAtMostMs: 2000 },
    generatesResource: true,
  },
  {
    skillId: 'SK060',
    steps: [
      {
        type: 'damage',
        targets: { kind: 'upTo', count: 3 },
        coefBp: 32000,
        consume: { from: 'units', capGroup: STAGE_GROUP, perUnitCoefBp: 8000, max: 2 },
      },
    ],
    autoCast: { kind: 'groupCountAtLeast', capGroup: STAGE_GROUP, amount: 2 },
    generatesResource: false,
  },
  // ── 工匠 JOB31 ──
  {
    skillId: 'SK061',
    steps: [
      { type: 'damage', targets: { kind: 'main' }, coefBp: 19000 },
      {
        type: 'applyStatus',
        targets: 'sameAsPreviousDamage',
        status: { kind: 'armorBreak', statusId: 'SK061_ARMOR_BREAK', label: '破甲', pctBp: 1500, durationMs: 6000 },
      },
    ],
    autoCast: { kind: 'mainTargetLacksStatus', statusKind: 'armorBreak', refreshBelowMs: 0 },
    generatesResource: true,
  },
  {
    skillId: 'SK062',
    steps: [{ type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 15000 }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  // ── 戰鎚鐵匠 JOB32 ──
  {
    skillId: 'SK063',
    steps: [
      {
        type: 'damage',
        targets: { kind: 'main' },
        coefBp: 22000,
        consume: { from: 'selfResource', resource: 'HEAT', perUnitCoefBp: 3000, max: 5 },
      },
      {
        type: 'applyStatus',
        targets: 'sameAsPreviousDamage',
        status: { kind: 'dot', statusId: 'FORGE_BURN', label: '燃燒', coefPerTickBp: 2000, ticks: 4, intervalMs: 1000 },
      },
    ],
    autoCast: { kind: 'selfResourceAtLeast', resource: 'HEAT', amount: 5 },
    generatesResource: false,
  },
  {
    skillId: 'SK064',
    steps: [{ type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 19000 }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  // ── 熔爐神匠 JOB33 ──
  {
    skillId: 'SK065',
    steps: [
      { type: 'damage', targets: { kind: 'main' }, coefBp: 10000 },
      {
        type: 'applyStatus',
        targets: 'sameAsPreviousDamage',
        status: { kind: 'dot', statusId: 'MOLTEN_SCAR', label: '熔痕', coefPerTickBp: 3000, ticks: 6, intervalMs: 1000 },
      },
    ],
    autoCast: { kind: 'mainTargetLacksStatusId', statusId: 'MOLTEN_SCAR', refreshBelowMs: 1000 },
    generatesResource: true,
  },
  {
    skillId: 'SK066',
    steps: [
      {
        type: 'damage',
        targets: { kind: 'upTo', count: 3 },
        coefBp: 30000,
        consume: { from: 'selfResource', resource: 'HEAT', perUnitCoefBp: 2500, max: 5 },
      },
    ],
    autoCast: { kind: 'selfResourceAtLeast', resource: 'HEAT', amount: 5 },
    generatesResource: false,
  },
  // ── 機械師 JOB34 ──
  {
    skillId: 'SK067',
    steps: [{ type: 'spawnUnit', unitKind: 'turret', durationMs: 14000, attackIntervalMs: 1000, coefBp: 3500, cap: 2 }],
    autoCast: { kind: 'unitsBelowCapOrOldestExpiring', unitKind: 'turret', below: 2, oldestRemainingAtMostMs: 7000 },
    generatesResource: true,
  },
  {
    skillId: 'SK068',
    steps: [
      {
        type: 'selfBuff',
        buffId: 'OVERCLOCK',
        label: '超頻',
        durationMs: 6000,
        effect: { kind: 'unitAttackIntervalMult', unitKind: 'turret', multBp: 7500 },
      },
    ],
    autoCast: { kind: 'requiresUnit', unitKind: 'turret', atLeast: 1 },
    generatesResource: true,
  },
  // ── 機械統帥 JOB35 ──
  {
    skillId: 'SK069',
    steps: [
      { type: 'damage', targets: { kind: 'main' }, coefBp: 6000 },
      {
        type: 'applyStatus',
        targets: 'sameAsPreviousDamage',
        status: { kind: 'summonDamageTaken', statusId: 'BEACON', label: '集火信標', pctBp: 2500, durationMs: 8000, unitKinds: ['turret'] },
      },
    ],
    autoCast: { kind: 'requiresUnitAndMainLacksStatus', unitKind: 'turret', statusId: 'BEACON' },
    generatesResource: true,
  },
  {
    skillId: 'SK070',
    steps: [{ type: 'spawnUnit', unitKind: 'mech', durationMs: 10000, attackIntervalMs: 1000, coefBp: 7000, cap: 1 }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: false,
  },
];

export const SKILL_EFFECTS: ReadonlyMap<string, SkillEffectDef> = new Map(DEFS.map((def) => [def.skillId, def]));
