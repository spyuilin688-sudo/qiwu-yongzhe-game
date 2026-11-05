import type { LegendEffectDef, PassiveEffectDef } from './types.ts';

/** 已實作的被動（N）。被動只繼承同路線祖先，不跨分支疊加；由引擎依職業祖先鏈組合。 */
const PASSIVES: readonly PassiveEffectDef[] = [
  {
    passiveId: 'PS001',
    procs: [
      {
        procId: 'PS001_RHYTHM',
        trigger: { kind: 'basicAttackCount', every: 4 },
        payload: { kind: 'extraHit', coefBp: 4000, target: 'same', timing: 'immediate' },
      },
    ],
  },
  {
    passiveId: 'PS002',
    procs: [],
    resource: { resource: 'FIGHTING_SPIRIT', max: 5, gainOnBasicAttack: 1, gainOnRegularSkillCast: 1 },
  },
  {
    passiveId: 'PS003',
    procs: [],
    consumeModifier: { skillIds: ['SK004'], reduceConsumedBy: 1, retain: 1 },
  },
  {
    passiveId: 'PS006',
    procs: [
      {
        procId: 'PS006_VOLLEY',
        trigger: { kind: 'basicAttackCount', every: 4 },
        payload: { kind: 'extraHit', coefBp: 4000, target: 'same', timing: 'nextBasic' },
      },
    ],
  },
  {
    passiveId: 'PS011',
    procs: [],
    rulesNote: '火印與冰印由火球術、冰錐術以同名狀態套用：各 1 枚、8 秒、只刷新不疊層。',
  },
  {
    passiveId: 'PS016',
    procs: [
      {
        procId: 'PS016_QUICK_HANDS',
        trigger: { kind: 'distinctRegularSequence', length: 2 },
        payload: { kind: 'extraHit', coefBp: 3500, target: 'same', timing: 'nextBasic' },
      },
    ],
  },
  {
    passiveId: 'PS021',
    procs: [
      {
        procId: 'PS021_ECHO',
        trigger: { kind: 'regularSkillCastCount', every: 3 },
        payload: { kind: 'extraHit', coefBp: 4500, target: 'main', timing: 'immediate' },
      },
    ],
  },
  {
    passiveId: 'PS026',
    procs: [
      {
        procId: 'PS026_DEFT',
        trigger: { kind: 'basicAttackCount', every: 4 },
        payload: { kind: 'extraHit', coefBp: 4000, target: 'otherPreferred', timing: 'immediate' },
      },
    ],
  },
  {
    passiveId: 'PS031',
    procs: [
      {
        procId: 'PS031_TOOL_LINK',
        trigger: { kind: 'distinctRegularSequence', length: 2 },
        payload: { kind: 'extraHit', coefBp: 3500, target: 'same', timing: 'nextBasic' },
      },
    ],
  },
  {
    passiveId: 'PS034',
    procs: [],
    rulesNote: '砲台上限 2 由「架設砲台」的上限實現；召喚傷害依來源分類，不觸發工具連動或其他本體被動。',
  },
  {
    passiveId: 'PS035',
    procs: [
      {
        procId: 'PS035_CALIBRATION',
        trigger: { kind: 'bodyHitOnTargetWithStatus', statusId: 'BEACON' },
        payload: { kind: 'nextUnitRoundBonus', unitKind: 'turret', pctBp: 2000, maxUnits: 2 },
        internalCooldownMs: 1000,
      },
    ],
  },
];

/**
 * 已實作的傳說特效（只在傳說品質生效，遵守一層追加鏈）。
 * 只收錄能以共用觸發器精確表達的條目；其餘條目在介面標示「原型尚未實作」，不默默替換效果。
 */
const LEGENDS: readonly LegendEffectDef[] = [
  {
    baseId: 'EQ001',
    procs: [
      {
        procId: 'EQ001_LEGEND',
        trigger: { kind: 'skillCast', skillId: 'SK001' },
        payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'nextBasic' },
      },
    ],
  },
  {
    baseId: 'EQ005',
    procs: [
      {
        procId: 'EQ005_LEGEND',
        trigger: { kind: 'skillCast', skillId: 'SK021' },
        payload: { kind: 'extraHit', coefBp: 2000, target: 'otherOnly', timing: 'immediate' },
      },
    ],
  },
  {
    baseId: 'EQ006',
    procs: [
      {
        procId: 'EQ006_LEGEND',
        trigger: { kind: 'skillCast', skillId: 'SK022' },
        payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'nextBasic' },
      },
    ],
  },
  {
    baseId: 'EQ009',
    procs: [
      {
        procId: 'EQ009_LEGEND',
        trigger: { kind: 'skillCast', skillId: 'SK041' },
        payload: { kind: 'extraHit', coefBp: 2500, target: 'otherOnly', timing: 'immediate' },
      },
    ],
  },
  {
    baseId: 'EQ011',
    procs: [
      {
        procId: 'EQ011_LEGEND',
        trigger: { kind: 'skillCast', skillId: 'SK051' },
        payload: { kind: 'extraHit', coefBp: 2500, target: 'otherOnly', timing: 'immediate' },
      },
    ],
  },
  {
    baseId: 'EQ013',
    procs: [
      {
        procId: 'EQ013_LEGEND',
        trigger: { kind: 'skillCast', skillId: 'SK061' },
        payload: { kind: 'extraHit', coefBp: 3000, target: 'same', timing: 'nextBasic' },
      },
    ],
  },
  {
    baseId: 'EQ071',
    procs: [
      {
        procId: 'EQ071_LEGEND',
        trigger: { kind: 'basicAttackCount', every: 5 },
        payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'nextRegularSkill' },
      },
    ],
  },
  {
    baseId: 'EQ073',
    procs: [
      {
        procId: 'EQ073_LEGEND',
        trigger: { kind: 'ultimateCast' },
        payload: { kind: 'extraHit', coefBp: 5000, target: 'same', timing: 'nextBasic' },
      },
    ],
  },
  {
    baseId: 'EQ074',
    procs: [
      {
        procId: 'EQ074_LEGEND',
        trigger: { kind: 'distinctRegularSequence', length: 2 },
        payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'nextBasic' },
      },
    ],
  },
  {
    baseId: 'EQ075',
    procs: [
      {
        procId: 'EQ075_LEGEND',
        trigger: { kind: 'armorBreakApplied' },
        payload: { kind: 'extraHit', coefBp: 3000, target: 'same', timing: 'nextBasic' },
        internalCooldownMs: 3000,
      },
    ],
  },
  {
    baseId: 'EQ077',
    procs: [
      {
        procId: 'EQ077_LEGEND',
        trigger: { kind: 'basicAttackCount', every: 5 },
        payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'immediate' },
      },
    ],
  },
  {
    baseId: 'EQ078',
    procs: [
      {
        procId: 'EQ078_LEGEND',
        trigger: { kind: 'basicCrit' },
        payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'nextRegularSkill' },
        internalCooldownMs: 3000,
      },
    ],
  },
  {
    baseId: 'EQ080',
    procs: [
      {
        procId: 'EQ080_LEGEND',
        trigger: { kind: 'waveStartFirstBasic' },
        payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'immediate' },
        internalCooldownMs: 3000,
      },
    ],
  },
  {
    baseId: 'EQ081',
    procs: [
      {
        procId: 'EQ081_LEGEND',
        trigger: { kind: 'basicKill' },
        payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'nextBasic' },
      },
    ],
  },
  {
    baseId: 'EQ082',
    procs: [
      {
        procId: 'EQ082_LEGEND',
        trigger: { kind: 'distinctRegularSequence', length: 3 },
        payload: { kind: 'extraHit', coefBp: 5000, target: 'main', timing: 'nextUltimate' },
      },
    ],
  },
  {
    baseId: 'EQ086',
    procs: [
      {
        procId: 'EQ086_LEGEND',
        trigger: { kind: 'basicAttackCount', every: 6 },
        payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'nextBasic' },
      },
    ],
  },
  {
    baseId: 'EQ087',
    procs: [
      {
        procId: 'EQ087_LEGEND',
        trigger: { kind: 'directSkillCrit' },
        payload: { kind: 'extraHit', coefBp: 3000, target: 'same', timing: 'nextBasic' },
        internalCooldownMs: 3000,
      },
    ],
  },
];

export const PASSIVE_EFFECTS: ReadonlyMap<string, PassiveEffectDef> = new Map(PASSIVES.map((def) => [def.passiveId, def]));
export const LEGEND_EFFECTS: ReadonlyMap<string, LegendEffectDef> = new Map(LEGENDS.map((def) => [def.baseId, def]));
