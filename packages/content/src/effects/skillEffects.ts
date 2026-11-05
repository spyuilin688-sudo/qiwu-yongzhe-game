import type { SkillEffectDef } from './types.ts';

/**
 * 已實作的技能效果（N 原型值，對照設計資料 skills[].prototype_effect）。
 * 第一階段範圍：七個一轉職業全部可玩，另以兩條完整路線驗證差異機制：
 *  - 劍士 → 狂劍士 → 劍聖：本體資源「戰意」、多段範圍、固定總量分配絕招。
 *  - 工匠 → 機械師 → 機械統帥：限時召喚物（砲台／機甲）、召喚物增益與信標。
 * 未列在此表的技能在介面顯示「原型尚未實作」，對應路線不可切換為戰鬥職業。
 */
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
    steps: [
      {
        type: 'damage',
        targets: { kind: 'upTo', count: 3 },
        coefBp: 5500,
        hits: 4,
        hitIntervalMs: 250,
        retarget: 'reacquire',
      },
    ],
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
    steps: [{ type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 22000 }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK006',
    steps: [
      {
        type: 'damage',
        targets: { kind: 'upTo', count: 3 },
        // 總量 9.00A，依序 6 段，每段 1.50A 重新分配給存活敵人。
        coefBp: 15000,
        hits: 6,
        hitIntervalMs: 200,
        retarget: 'reacquire',
        distributeTotal: true,
      },
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
      {
        type: 'applyStatus',
        targets: 'sameAsPreviousDamage',
        status: { kind: 'mark', statusId: 'FIRE_MARK', label: '火印', durationMs: 8000 },
      },
    ],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK022',
    steps: [
      { type: 'damage', targets: { kind: 'main' }, coefBp: 16000 },
      {
        type: 'applyStatus',
        targets: 'sameAsPreviousDamage',
        status: { kind: 'mark', statusId: 'ICE_MARK', label: '冰印', durationMs: 8000 },
      },
    ],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
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
  // ── 祭司 JOB21 ──
  {
    skillId: 'SK041',
    steps: [{ type: 'damage', targets: { kind: 'main' }, coefBp: 18000 }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK042',
    steps: [{ type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 15000 }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  // ── 小丑 JOB26 ──
  {
    skillId: 'SK051',
    steps: [{ type: 'damage', targets: { kind: 'main' }, coefBp: 18000 }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
  },
  {
    skillId: 'SK052',
    steps: [{ type: 'damage', targets: { kind: 'upTo', count: 3 }, coefBp: 15000 }],
    autoCast: { kind: 'hasEnemy' },
    generatesResource: true,
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
  // ── 機械師 JOB34 ──
  {
    skillId: 'SK067',
    steps: [
      { type: 'spawnUnit', unitKind: 'turret', durationMs: 14000, attackIntervalMs: 1000, coefBp: 3500, cap: 2 },
    ],
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
