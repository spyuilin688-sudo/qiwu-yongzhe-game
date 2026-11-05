import { ELEMENT_MARK_IDS } from '../ids.ts';
import { BASIC_PHANTOM, POISON_STACK } from './skillEffects.ts';
import type { LegendEffectDef, PassiveEffectDef, ProcDef } from './types.ts';

/** 被動只繼承同路線祖先，不跨分支疊加；由引擎依職業祖先鏈組合（N）。 */
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
    consumeModifier: { skillIds: ['SK004'], reduceConsumedBy: 1 },
  },
  {
    passiveId: 'PS004',
    procs: [],
    rulesNote: '破陣由盾刃突擊加層（上限 3、8 秒）；只有帶破陣生成標籤的本體技能能加層。',
  },
  {
    passiveId: 'PS005',
    procs: [
      {
        procId: 'PS005_RUNE_LINK',
        trigger: { kind: 'distinctRegularSequence', length: 2 },
        payload: { kind: 'extraHit', coefBp: 4000, target: 'same', timing: 'nextBasic' },
      },
    ],
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
    passiveId: 'PS007',
    procs: [],
    resource: { resource: 'FOCUS', max: 3, gainOnBasicAttack: 1, gainOnRegularSkillCast: 0, sameTargetOnly: true, keepOnTargetDeath: 1 },
  },
  {
    passiveId: 'PS008',
    procs: [],
    projectileRetargetOnce: true,
  },
  {
    passiveId: 'PS009',
    procs: [],
    companion: { unitKind: 'beast', attackIntervalMs: 1500, coefBp: 5000 },
  },
  {
    passiveId: 'PS010',
    procs: [
      {
        procId: 'PS010_TEAMWORK',
        trigger: { kind: 'unitHitAfterBodyHit', unitKind: 'beast', windowMs: 2000 },
        payload: { kind: 'nextSkillUnitPartBonus', skillId: 'SK018', pctBp: 3000 },
        internalCooldownMs: 3000,
      },
    ],
  },
  {
    passiveId: 'PS011',
    procs: [],
    rulesNote: '火印與冰印由火球術、冰錐術以同名狀態套用：各 1 枚、8 秒、只刷新不疊層。',
  },
  {
    passiveId: 'PS012',
    procs: [],
    consumeModifier: { skillIds: ['SK024', 'SK026'], bonusByConsumedBp: [0, 0, 1500, 3000] },
  },
  {
    passiveId: 'PS013',
    procs: [],
    deathTransfer: { statusIds: ELEMENT_MARK_IDS, kinds: 1, stackAmount: 0, durationFactorBp: 10000 },
  },
  {
    passiveId: 'PS014',
    procs: [],
    rulesNote: '寒霜由冰錐（冰系分支）、霜環、寒晶綻放加層，上限 5、8 秒；凍結只是演出，敵人不攻擊角色。',
  },
  {
    passiveId: 'PS015',
    procs: [],
    consumeModifier: { skillIds: ['SK028', 'SK030'], reduceConsumedBy: 1 },
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
    passiveId: 'PS017',
    procs: [],
    resource: { resource: 'COMBO', max: 5, gainOnBasicAttack: 0, gainOnRegularSkillCast: 0, gainOnBodyDirectAction: 1 },
  },
  {
    passiveId: 'PS018',
    procs: [
      {
        procId: 'PS018_AFTERIMAGE',
        trigger: { kind: 'skillCastConsumed', skillIds: ['SK036'], minConsumed: 5 },
        payload: { kind: 'extraHit', coefBp: 4500, target: 'same', timing: 'nextBasic', charges: 2 },
      },
    ],
  },
  {
    passiveId: 'PS019',
    procs: [],
    rulesNote: '毒層由淬毒、毒霧、蔓毒之刃施加：同目標上限 5 層，各層獨立計時與快照；滿層只刷新最早到期層，持續傷害不暴擊。',
  },
  {
    passiveId: 'PS020',
    procs: [],
    consumeModifier: { skillIds: ['SK040'], maxConsumed: 4, reduceConsumedBy: 1 },
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
    passiveId: 'PS022',
    procs: [],
    rulesNote: '聖印由聖光彈、淨罪之環（聖印分支）、裁決烙印、聖光連禱加層，上限 3、8 秒；同次行動不雙算。',
  },
  {
    passiveId: 'PS023',
    procs: [],
    deathTransfer: { statusIds: ['SEAL'], kinds: 1, stackAmount: 1, durationFactorBp: 10000 },
  },
  {
    passiveId: 'PS024',
    procs: [],
    resource: { resource: 'QI', max: 5, gainOnBasicAttack: 1, basicAttacksPerGain: 2, gainOnRegularSkillCast: 0 },
  },
  {
    passiveId: 'PS025',
    procs: [
      {
        procId: 'PS025_AFTERFORCE',
        trigger: { kind: 'skillCast', skillId: 'SK050' },
        payload: { kind: 'extraHit', coefBp: 4000, target: 'same', timing: 'nextBasic', charges: 3 },
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
    passiveId: 'PS027',
    procs: [],
    suits: {
      heartNextBasicBonusBp: 3000,
      diamondArmorBreakBp: 1500,
      diamondDurationMs: 4000,
      clubExtraCoefBp: 3500,
      spadeExtraCoefBp: 4000,
      preferredSuit: 3,
    },
  },
  {
    passiveId: 'PS028',
    procs: [
      {
        procId: 'PS028_SUIT_ECHO',
        trigger: { kind: 'sameSuitTwice' },
        // 重演飛牌基礎傷害 1.80A 的 40%。
        payload: { kind: 'extraHit', coefBp: 7200, target: 'same', timing: 'nextSkillId', skillId: 'SK051' },
      },
    ],
  },
  {
    passiveId: 'PS029',
    procs: [],
    rulesNote: '幻影與替身共用上限群組（合計 2）：超額時先提前結算最舊者，幻影補 1 次 0.35A，替身執行一次爆炸。',
  },
  {
    passiveId: 'PS030',
    procs: [
      {
        procId: 'PS030_ENCORE',
        trigger: { kind: 'skillCast', skillId: 'SK060' },
        payload: { kind: 'spawnUnit', unit: BASIC_PHANTOM },
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
    passiveId: 'PS032',
    procs: [],
    resource: { resource: 'HEAT', max: 5, gainOnBasicAttack: 1, gainOnRegularSkillCast: 1 },
  },
  {
    passiveId: 'PS033',
    procs: [
      {
        procId: 'PS033_TEMPER',
        trigger: { kind: 'skillCastConsumed', skillIds: ['SK063', 'SK066'], minConsumed: 1 },
        payload: { kind: 'extraHit', coefBp: 5000, target: 'same', timing: 'nextBasic' },
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

/** 傳說只有一個觸發時的簡寫，procId 固定為「裝備 ID_LEGEND」。 */
function legend(baseId: string, proc: Omit<ProcDef, 'procId'>): LegendEffectDef {
  return { baseId, procs: [{ procId: `${baseId}_LEGEND`, ...proc }] };
}

/**
 * 全部 88 件傳說特效（只在傳說品質生效，遵守一層追加鏈：追加、持續、召喚傷害不再觸發其他追加）。
 * 係數為設計值；觸發時機的細節（例如「結束後」以最後一段結算為準）記錄在 IMPLEMENTATION_NOTES。
 */
const LEGENDS: readonly LegendEffectDef[] = [
  // ── 一轉職業武器 ──
  legend('EQ001', { trigger: { kind: 'skillCast', skillId: 'SK001' }, payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'nextBasic' } }),
  {
    baseId: 'EQ002',
    procs: [],
    deathTransfer: { statusIds: ['SK002_ARMOR_BREAK'], kinds: 1, stackAmount: 0, durationFactorBp: 5000 },
  },
  legend('EQ003', {
    trigger: { kind: 'skillCast', skillId: 'SK011' },
    payload: { kind: 'extraHit', coefBp: 3000, target: 'same', timing: 'nextSkillId', skillId: 'SK012' },
  }),
  legend('EQ004', { trigger: { kind: 'skillKill', skillId: 'SK012' }, payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'nextBasic' } }),
  legend('EQ005', { trigger: { kind: 'skillCast', skillId: 'SK021' }, payload: { kind: 'extraHit', coefBp: 2000, target: 'otherOnly', timing: 'immediate' } }),
  legend('EQ006', { trigger: { kind: 'skillCast', skillId: 'SK022' }, payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'nextBasic' } }),
  legend('EQ007', {
    trigger: { kind: 'skillEnded', skillId: 'SK031', requireLastHitLanded: true },
    payload: { kind: 'extraHit', coefBp: 2500, target: 'otherOnly', timing: 'immediate' },
  }),
  legend('EQ008', { trigger: { kind: 'skillKill', skillId: 'SK032' }, payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'nextBasic' } }),
  legend('EQ009', { trigger: { kind: 'skillCast', skillId: 'SK041' }, payload: { kind: 'extraHit', coefBp: 2500, target: 'otherOnly', timing: 'immediate' } }),
  legend('EQ010', {
    trigger: { kind: 'skillCast', skillId: 'SK042', singleTargetOnly: true },
    payload: { kind: 'extraHit', coefBp: 3500, target: 'same', timing: 'immediate' },
  }),
  legend('EQ011', { trigger: { kind: 'skillCast', skillId: 'SK051' }, payload: { kind: 'extraHit', coefBp: 2500, target: 'otherOnly', timing: 'immediate' } }),
  legend('EQ012', {
    trigger: { kind: 'skillKill', skillId: 'SK052' },
    payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'nextSkillId', skillId: 'SK051' },
  }),
  legend('EQ013', { trigger: { kind: 'skillCast', skillId: 'SK061' }, payload: { kind: 'extraHit', coefBp: 3000, target: 'same', timing: 'nextBasic' } }),
  legend('EQ014', {
    trigger: { kind: 'skillCast', skillId: 'SK062', singleTargetOnly: true },
    payload: { kind: 'extraHit', coefBp: 3500, target: 'same', timing: 'immediate' },
  }),
  // ── 劍士系 ──
  legend('EQ015', {
    trigger: { kind: 'skillCastConsumed', skillIds: ['SK004'], minConsumed: 3 },
    payload: { kind: 'extraHit', coefBp: 4000, target: 'othersEach', count: 2, timing: 'immediate' },
  }),
  legend('EQ016', {
    trigger: { kind: 'skillEnded', skillId: 'SK003', requireLastHitLanded: true },
    payload: { kind: 'extraHit', coefBp: 3500, target: 'same', timing: 'nextBasic' },
  }),
  legend('EQ017', {
    trigger: { kind: 'skillEnded', skillId: 'SK006' },
    payload: { kind: 'extraHit', coefBp: 6000, target: 'upToEach', count: 3, timing: 'immediate' },
  }),
  { baseId: 'EQ018', procs: [], singleEnemyCastBonus: { skillId: 'SK003', pctBp: 2500 } },
  legend('EQ019', { trigger: { kind: 'skillCast', skillId: 'SK007' }, payload: { kind: 'extraHit', coefBp: 3000, target: 'same', timing: 'nextBasic' } }),
  legend('EQ020', {
    trigger: { kind: 'skillCastConsumed', skillIds: ['SK008'], minConsumed: 2 },
    payload: { kind: 'extraHit', coefBp: 5000, target: 'main', timing: 'afterAction' },
  }),
  legend('EQ021', {
    trigger: { kind: 'buffChargesDepleted', buffId: 'RUNE' },
    payload: { kind: 'extraHit', coefBp: 5000, target: 'otherOnly', timing: 'immediate' },
  }),
  legend('EQ022', {
    trigger: { kind: 'skillCast', skillId: 'SK010' },
    payload: { kind: 'extraHit', coefBp: 7000, target: 'same', timing: 'nextSkillId', skillId: 'SK007' },
  }),
  // ── 弓手系 ──
  legend('EQ023', { trigger: { kind: 'skillKill', skillId: 'SK014' }, payload: { kind: 'extraHit', coefBp: 4000, target: 'main', timing: 'immediate' } }),
  legend('EQ024', {
    trigger: { kind: 'statusExpired', statusId: 'WEAK_POINT' },
    payload: { kind: 'extraHit', coefBp: 3500, target: 'same', timing: 'immediate' },
  }),
  legend('EQ025', { trigger: { kind: 'skillCast', skillId: 'SK016' }, payload: { kind: 'extraHit', coefBp: 8000, target: 'main', timing: 'afterAction' } }),
  legend('EQ026', { trigger: { kind: 'skillKill', skillId: 'SK015' }, payload: { kind: 'extraHit', coefBp: 4000, target: 'main', timing: 'immediate' } }),
  legend('EQ027', { trigger: { kind: 'skillCast', skillId: 'SK018' }, payload: { kind: 'extraHit', coefBp: 3500, target: 'same', timing: 'nextBasic' } }),
  legend('EQ028', {
    trigger: { kind: 'unitHitOnTargetWithStatus', unitKind: 'beast', statusId: 'PREY_MARK', every: 4 },
    payload: { kind: 'extraHit', coefBp: 3000, target: 'same', timing: 'immediate' },
  }),
  legend('EQ029', {
    trigger: { kind: 'skillCast', skillId: 'SK019', singleTargetOnly: true },
    payload: { kind: 'extraHit', coefBp: 10000, target: 'same', timing: 'afterAction' },
  }),
  legend('EQ030', {
    trigger: { kind: 'skillCast', skillId: 'SK018' },
    payload: { kind: 'extraHit', coefBp: 7000, target: 'othersEach', count: 2, timing: 'afterAction' },
    requireBuff: 'BEAST_COMMAND',
    oncePerBuff: true,
  }),
  // ── 法師系 ──
  legend('EQ031', { trigger: { kind: 'skillEnded', skillId: 'SK023' }, payload: { kind: 'extraHit', coefBp: 3500, target: 'main', timing: 'immediate' } }),
  legend('EQ032', { trigger: { kind: 'skillCast', skillId: 'SK024' }, payload: { kind: 'extraHit', coefBp: 3000, target: 'same', timing: 'nextBasic' } }),
  legend('EQ033', {
    trigger: { kind: 'skillCast', skillId: 'SK026' },
    payload: { kind: 'extraHit', coefBp: 8000, target: 'same', timing: 'nextSkillId', skillId: 'SK021' },
  }),
  legend('EQ034', {
    trigger: { kind: 'skillCastConsumed', skillIds: ['SK024'], minConsumed: 2 },
    payload: { kind: 'extraHit', coefBp: 6000, target: 'main', timing: 'afterAction' },
  }),
  legend('EQ035', {
    trigger: { kind: 'skillCast', skillId: 'SK027', singleTargetOnly: true },
    payload: { kind: 'extraHit', coefBp: 4000, target: 'same', timing: 'immediate' },
  }),
  legend('EQ036', {
    trigger: { kind: 'skillCastConsumed', skillIds: ['SK028'], minConsumed: 3 },
    payload: { kind: 'extraHit', coefBp: 4500, target: 'otherOnly', timing: 'afterAction' },
  }),
  legend('EQ037', {
    trigger: { kind: 'skillCast', skillId: 'SK030' },
    payload: { kind: 'extraHit', coefBp: 8000, target: 'main', timing: 'nextSkillId', skillId: 'SK029' },
  }),
  legend('EQ038', {
    trigger: { kind: 'skillCastRetained', skillIds: ['SK028', 'SK030'] },
    payload: { kind: 'extraHit', coefBp: 5000, target: 'same', timing: 'nextSkillId', skillId: 'SK022' },
  }),
  // ── 盜賊系 ──
  legend('EQ039', {
    trigger: { kind: 'skillEnded', skillId: 'SK033', requireLastHitLanded: true },
    payload: { kind: 'extraHit', coefBp: 3500, target: 'same', timing: 'nextBasic' },
  }),
  {
    baseId: 'EQ040',
    procs: [],
    deathTransfer: { statusIds: ['EXPOSE_MARK'], kinds: 1, stackAmount: 0, durationFactorBp: 5000 },
  },
  legend('EQ041', {
    trigger: { kind: 'skillCastConsumed', skillIds: ['SK036'], minConsumed: 5 },
    payload: { kind: 'extraHit', coefBp: 6000, target: 'othersEach', count: 2, timing: 'immediate' },
  }),
  legend('EQ042', { trigger: { kind: 'skillEnded', skillId: 'SK035' }, payload: { kind: 'extraHit', coefBp: 5000, target: 'main', timing: 'immediate' } }),
  legend('EQ043', {
    trigger: { kind: 'bodyHitOnTargetWithStatus', statusId: 'POISON', basicOnly: true, minStacks: 5, every: 4 },
    payload: { kind: 'applyStatus', target: 'otherOnly', status: POISON_STACK },
  }),
  legend('EQ044', { trigger: { kind: 'skillEnded', skillId: 'SK038' }, payload: { kind: 'extraHit', coefBp: 3000, target: 'same', timing: 'nextBasic' } }),
  legend('EQ045', {
    trigger: { kind: 'skillCast', skillId: 'SK040' },
    payload: { kind: 'extraHit', coefBp: 7000, target: 'same', timing: 'nextSkillId', skillId: 'SK039' },
  }),
  legend('EQ046', { trigger: { kind: 'skillCastRetained', skillIds: ['SK040'] }, payload: { kind: 'copyDot', statusId: 'POISON', toOthers: 1 } }),
  // ── 祭司系 ──
  legend('EQ047', {
    trigger: { kind: 'skillCast', skillId: 'SK044' },
    payload: { kind: 'extraHit', coefBp: 3500, target: 'otherOnly', timing: 'nextSkillId', skillId: 'SK041' },
  }),
  legend('EQ048', { trigger: { kind: 'buffExpired', buffId: 'HYMN' }, payload: { kind: 'extraHit', coefBp: 4000, target: 'same', timing: 'nextBasic' } }),
  legend('EQ049', {
    trigger: { kind: 'skillCastConsumed', skillIds: ['SK046'], minConsumed: 3 },
    payload: { kind: 'extraHit', coefBp: 7000, target: 'same', timing: 'nextSkillId', skillId: 'SK041' },
  }),
  legend('EQ050', { trigger: { kind: 'skillEnded', skillId: 'SK045' }, payload: { kind: 'extraHit', coefBp: 5000, target: 'otherOnly', timing: 'immediate' } }),
  legend('EQ051', {
    trigger: { kind: 'skillEnded', skillId: 'SK047', requireLastHitLanded: true },
    payload: { kind: 'extraHit', coefBp: 3500, target: 'otherOnly', timing: 'immediate' },
  }),
  legend('EQ052', {
    trigger: { kind: 'skillCast', skillId: 'SK048', singleTargetOnly: true },
    payload: { kind: 'extraHit', coefBp: 4000, target: 'same', timing: 'immediate' },
  }),
  legend('EQ053', { trigger: { kind: 'skillEnded', skillId: 'SK049' }, payload: { kind: 'extraHit', coefBp: 6000, target: 'same', timing: 'nextBasic' } }),
  legend('EQ054', {
    trigger: { kind: 'skillCastConsumed', skillIds: ['SK050'], minConsumed: 5 },
    payload: { kind: 'extraHit', coefBp: 8000, target: 'othersEach', count: 2, timing: 'immediate' },
  }),
  // ── 小丑系 ──
  legend('EQ055', { trigger: { kind: 'skillEnded', skillId: 'SK054' }, payload: { kind: 'extraHit', coefBp: 3500, target: 'main', timing: 'immediate' } }),
  legend('EQ056', { trigger: { kind: 'skillCast', skillId: 'SK053' }, payload: { kind: 'extraHit', coefBp: 3000, target: 'otherOnly', timing: 'nextCard' } }),
  legend('EQ057', { trigger: { kind: 'skillEnded', skillId: 'SK056' }, payload: { kind: 'extraHit', coefBp: 8000, target: 'main', timing: 'immediate' } }),
  { baseId: 'EQ058', procs: [], setSuitEffectBonusBp: 2500 },
  legend('EQ059', { trigger: { kind: 'skillCast', skillId: 'SK057' }, payload: { kind: 'extraHit', coefBp: 3000, target: 'main', timing: 'immediate' } }),
  legend('EQ060', {
    trigger: { kind: 'skillCast', skillId: 'SK058', singleTargetOnly: true },
    payload: { kind: 'extraHit', coefBp: 4000, target: 'main', timing: 'immediate' },
  }),
  legend('EQ061', {
    trigger: { kind: 'skillCastConsumed', skillIds: ['SK060'], minConsumed: 2 },
    payload: { kind: 'extraHit', coefBp: 7000, target: 'same', timing: 'nextSkillId', skillId: 'SK051' },
  }),
  { baseId: 'EQ062', procs: [], unitFirstAttackExtra: { skillId: 'SK059', coefBp: 4500, target: 'same' } },
  // ── 工匠系 ──
  legend('EQ063', {
    trigger: { kind: 'skillCastConsumed', skillIds: ['SK063'], minConsumed: 3 },
    payload: { kind: 'extraHit', coefBp: 4000, target: 'otherOnly', timing: 'immediate' },
  }),
  legend('EQ064', {
    trigger: { kind: 'skillCast', skillId: 'SK064', singleTargetOnly: true },
    payload: { kind: 'extraHit', coefBp: 4000, target: 'same', timing: 'immediate' },
  }),
  legend('EQ065', {
    trigger: { kind: 'skillCast', skillId: 'SK066' },
    payload: {
      kind: 'spawnUnit',
      unit: {
        type: 'spawnUnit',
        unitKind: 'zone',
        durationMs: 2000,
        attackIntervalMs: 1000,
        coefBp: 3000,
        attackTargets: { kind: 'upTo', count: 3 },
        damageSource: 'dot',
        cap: 1,
        capGroup: 'FORGE_EMBER',
      },
    },
  }),
  legend('EQ066', {
    trigger: { kind: 'statusExpired', statusId: 'MOLTEN_SCAR' },
    payload: { kind: 'extraHit', coefBp: 6000, target: 'same', timing: 'immediate' },
  }),
  legend('EQ067', { trigger: { kind: 'basicAttackCount', every: 6 }, payload: { kind: 'nextUnitRoundExtra', unitKind: 'turret', coefBp: 2000 } }),
  { baseId: 'EQ068', procs: [], unitFirstAttackExtra: { skillId: 'SK067', coefBp: 2500, target: 'otherOnly' } },
  legend('EQ069', {
    trigger: { kind: 'basicAttackCount', every: 4 },
    payload: { kind: 'extraHit', coefBp: 4000, target: 'same', timing: 'immediate' },
    requireUnit: 'mech',
  }),
  { baseId: 'EQ070', procs: [], buffDurationBonus: { buffId: 'OVERCLOCK', addMs: 2000 } },
  // ── 共用部位 ──
  legend('EQ071', { trigger: { kind: 'basicAttackCount', every: 5 }, payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'nextRegularSkill' } }),
  legend('EQ072', {
    trigger: { kind: 'mainTargetDied' },
    payload: { kind: 'extraHit', coefBp: 2500, target: 'otherOnly', timing: 'nextBasic' },
    internalCooldownMs: 3000,
  }),
  legend('EQ073', { trigger: { kind: 'ultimateCast' }, payload: { kind: 'extraHit', coefBp: 5000, target: 'same', timing: 'nextBasic' } }),
  legend('EQ074', { trigger: { kind: 'distinctRegularSequence', length: 2 }, payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'nextBasic' } }),
  legend('EQ075', {
    trigger: { kind: 'armorBreakApplied' },
    payload: { kind: 'extraHit', coefBp: 3000, target: 'same', timing: 'nextBasic' },
    internalCooldownMs: 3000,
  }),
  legend('EQ076', { trigger: { kind: 'directSkillHitCleanTarget' }, payload: { kind: 'extraHit', coefBp: 3000, target: 'same', timing: 'immediate' } }),
  legend('EQ077', { trigger: { kind: 'basicAttackCount', every: 5 }, payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'immediate' } }),
  legend('EQ078', {
    trigger: { kind: 'basicCrit' },
    payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'nextRegularSkill' },
    internalCooldownMs: 3000,
  }),
  legend('EQ079', { trigger: { kind: 'basicAttackCount', every: 6 }, payload: { kind: 'extraHit', coefBp: 3500, target: 'same', timing: 'nextSummonHit' } }),
  legend('EQ080', {
    trigger: { kind: 'waveStartFirstBasic' },
    payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'immediate' },
    internalCooldownMs: 3000,
  }),
  legend('EQ081', { trigger: { kind: 'basicKill' }, payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'nextBasic' } }),
  legend('EQ082', { trigger: { kind: 'distinctRegularSequence', length: 3 }, payload: { kind: 'extraHit', coefBp: 5000, target: 'main', timing: 'nextUltimate' } }),
  legend('EQ083', { trigger: { kind: 'dotFirstOnTarget' }, payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'immediate' } }),
  legend('EQ084', { trigger: { kind: 'sameTargetBasicCount', count: 6 }, payload: { kind: 'extraHit', coefBp: 3500, target: 'same', timing: 'nextRegularSkill' } }),
  legend('EQ085', {
    trigger: { kind: 'skillEnded', ultimate: true },
    payload: { kind: 'extraHit', coefBp: 5000, target: 'otherOnly', fallbackMainCoefBp: 2500, timing: 'immediate' },
  }),
  legend('EQ086', { trigger: { kind: 'basicAttackCount', every: 6 }, payload: { kind: 'extraHit', coefBp: 2500, target: 'same', timing: 'nextBasic' } }),
  legend('EQ087', {
    trigger: { kind: 'directSkillCrit' },
    payload: { kind: 'extraHit', coefBp: 3000, target: 'same', timing: 'nextBasic' },
    internalCooldownMs: 3000,
  }),
  legend('EQ088', {
    trigger: { kind: 'sameTargetDuration', durationMs: 8000 },
    payload: { kind: 'extraHit', coefBp: 4000, target: 'same', timing: 'nextRegularSkill' },
    internalCooldownMs: 8000,
  }),
];

export const PASSIVE_EFFECTS: ReadonlyMap<string, PassiveEffectDef> = new Map(PASSIVES.map((def) => [def.passiveId, def]));
export const LEGEND_EFFECTS: ReadonlyMap<string, LegendEffectDef> = new Map(LEGENDS.map((def) => [def.baseId, def]));
