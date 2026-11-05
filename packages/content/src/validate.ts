import type { ContentCatalog } from './catalog.ts';
import { BALANCE_ADJUSTMENTS } from './effects/balanceAdjustments.ts';
import type { ProcDef } from './effects/types.ts';
import { TIER3_DEFAULT_SKILLS } from './defaultLoadouts.ts';
import { describeLegend, describePassive, describeSteps } from './describe.ts';
import { STAT_KEYS } from './ids.ts';
import { skillSelectionRule } from './queries.ts';
import type { DesignData } from './schema.ts';

/**
 * 內容資料自動檢查（規格 10「內容資料自動檢查」）：
 * 數量一致、每圖 24/5/1、前置無循環、ID 唯一、品質機率每列 100%、關卡連續、
 * 不含 HP／MP，以及效果參數與設計文字的數值一致。
 */
export interface ValidationReport {
  readonly ok: boolean;
  readonly issues: readonly string[];
  readonly summary: Readonly<Record<string, number>>;
}

const EXPECTED_COUNTS = { classes: 35, active_skills: 70, passives: 35, equipment_bases: 88, maps: 12, stages: 360 } as const;
const FORBIDDEN_STAT_PATTERN = /HP|MP|生命|魔力|法力|防禦|回血|吸血|護盾|格擋|回魔/;
const COEF_PATTERN = /\d+\.\d{2}A/g;

/** 觸發器與效果中引用的技能 ID（用來檢查傳說與被動沒有指到不存在的技能）。 */
function referencedSkillIds(proc: ProcDef): string[] {
  const ids: string[] = [];
  const trigger = proc.trigger;
  if (trigger.kind === 'skillKill') ids.push(trigger.skillId);
  if (trigger.kind === 'skillCast') ids.push(...trigger.skillIds);
  if (trigger.kind === 'skillEnded' && trigger.skillId) ids.push(trigger.skillId);
  if (trigger.kind === 'skillCastConsumed' || trigger.kind === 'skillCastRetained') ids.push(...trigger.skillIds);
  const payload = proc.payload;
  if (payload.kind === 'extraHit' && payload.skillId) ids.push(payload.skillId);
  if (payload.kind === 'nextSkillUnitPartBonus') ids.push(payload.skillId);
  return ids;
}

export function validateContent(data: DesignData, catalog: ContentCatalog): ValidationReport {
  const issues: string[] = [];
  const check = (condition: boolean, message: string): void => {
    if (!condition) issues.push(message);
  };

  // 數量
  const actualCounts = {
    classes: data.classes.length,
    active_skills: data.skills.length,
    passives: data.passives.length,
    equipment_bases: data.equipment.length,
    maps: data.maps.length,
    stages: data.stages.length,
  };
  for (const [key, expected] of Object.entries(EXPECTED_COUNTS)) {
    const actual = actualCounts[key as keyof typeof actualCounts];
    check(actual === expected, `${key} 數量 ${actual}，預期 ${expected}`);
    check(data.meta.count[key as keyof typeof data.meta.count] === actual, `meta.count.${key} 與實際數量不一致`);
  }

  // ID 唯一
  for (const [label, ids] of [
    ['職業', data.classes.map((c) => c.id)],
    ['技能', data.skills.map((s) => s.id)],
    ['被動', data.passives.map((p) => p.id)],
    ['裝備', data.equipment.map((e) => e.id)],
    ['地圖', data.maps.map((m) => m.id)],
    ['關卡', data.stages.map((s) => s.id)],
  ] as const) {
    check(new Set(ids).size === ids.length, `${label} ID 有重複`);
  }

  // 職業與技能引用
  for (const job of catalog.jobs.values()) {
    if (job.tier === 0) continue;
    const parent = job.parentId ? catalog.jobs.get(job.parentId) : undefined;
    check(Boolean(parent), `${job.id} 前置不存在`);
    if (parent) check(parent.tier === job.tier - 1, `${job.id} 階級與前置不連續`);
    for (const skillId of job.ownSkillIds) {
      const skill = catalog.skills.get(skillId);
      check(Boolean(skill), `${job.id} 引用不存在的技能 ${skillId}`);
      if (skill) check(skill.jobId === job.id, `${skillId} 的 class_id 與 ${job.id} 不一致`);
    }
    const ultimates = job.ownSkillIds.filter((id) => catalog.skills.get(id)?.kind === 'ultimate');
    check(ultimates.length === (job.tier === 3 ? 1 : 0), `${job.id} 絕招數量不符（三轉 1 招，其餘 0 招）`);
    const passive = job.passiveId ? catalog.passives.get(job.passiveId) : undefined;
    check(Boolean(passive) && passive!.jobId === job.id, `${job.id} 被動引用不一致`);
  }
  for (const skill of catalog.skills.values()) {
    check(catalog.jobs.has(skill.jobId), `${skill.id} 屬於不存在的職業 ${skill.jobId}`);
  }

  // 裝備不含 HP／MP
  for (const eq of data.equipment) {
    check(!FORBIDDEN_STAT_PATTERN.test(eq.base_stat_rule), `${eq.id} 主屬性含禁止屬性：${eq.base_stat_rule}`);
  }
  for (const stat of STAT_KEYS) check(!/HP|MP|DEF|HEAL/.test(stat), `屬性鍵含禁止屬性：${stat}`);

  // 品質與鑑定台
  check(catalog.bench.length === 10, `鑑定台等級數 ${catalog.bench.length}，預期 10`);
  catalog.bench.forEach((row, index) => {
    check(row.level === index + 1, `鑑定台等級不連續：${row.level}`);
    const sum = row.weights.reduce((acc, weight) => acc + weight, 0);
    check(sum === 10000, `鑑定台 Lv${row.level} 品質機率總和 ${sum / 100}%`);
    const isLast = index === catalog.bench.length - 1;
    check(isLast ? row.nextCost === null : typeof row.nextCost === 'number', `鑑定台 Lv${row.level} 升級費用設定錯誤`);
  });
  const multipliers = catalog.qualityOrder.map((id) => catalog.qualities.get(id)?.multiplier ?? 0);
  check(multipliers.every((value, index) => index === 0 || value > multipliers[index - 1]!), '品質倍率需遞增');

  // 地圖與關卡
  const sortedStages = [...data.stages].sort((a, b) => a.number - b.number);
  sortedStages.forEach((stage, index) => check(stage.number === index + 1, `關卡編號缺號：預期 ${index + 1}，實際 ${stage.number}`));
  for (const map of catalog.maps.values()) {
    const stages = map.stageIds.map((id) => catalog.stages.get(id));
    const counts = { normal: 0, elite: 0, boss: 0 };
    stages.forEach((stage, index) => {
      if (!stage) return;
      counts[stage.type] += 1;
      check(stage.localNumber === index + 1, `${stage.id} 本地關卡編號不連續`);
      check(stage.mapNumber === map.number, `${stage.id} 地圖歸屬錯誤`);
      const expectedType = index + 1 === 30 ? 'boss' : (index + 1) % 5 === 0 ? 'elite' : 'normal';
      check(stage.type === expectedType, `${stage.id} 類型 ${stage.type}，預期 ${expectedType}`);
    });
    check(counts.normal === 24 && counts.elite === 5 && counts.boss === 1, `${map.id} 關卡組成 ${JSON.stringify(counts)}`);
    check(map.zones.length === 6, `${map.id} 小區數 ${map.zones.length}，預期 6`);
    check(map.bossMechanics.length > 0, `${map.id} 缺少 BOSS 機制`);
  }

  // 效果參數與設計文字一致（只檢查已實作的條目）
  for (const skill of catalog.skills.values()) {
    if (!skill.effect) continue;
    const generated = describeSteps(skill.effect.steps);
    for (const token of skill.designEffectText.match(COEF_PATTERN) ?? []) {
      if (generated.includes(token)) continue;
      const adjustment = BALANCE_ADJUSTMENTS.find((entry) => entry.skillId === skill.id && entry.designToken === token);
      check(
        adjustment !== undefined && generated.includes(adjustment.tunedToken),
        `${skill.id} 設計倍率 ${token} 未出現在實作效果「${generated}」，且不在平衡調整清單`,
      );
    }
  }
  for (const passive of catalog.passives.values()) {
    if (!passive.effect) continue;
    const generated = describePassive(passive.effect);
    const tokens = passive.designRuleText.match(COEF_PATTERN) ?? [];
    for (const token of tokens) {
      check(generated.includes(token), `${passive.id} 設計倍率 ${token} 未出現在實作效果「${generated}」`);
    }
  }
  for (const base of catalog.equipment.values()) {
    if (!base.legend) continue;
    const generated = describeLegend(base.legend);
    for (const token of base.legendText.match(COEF_PATTERN) ?? []) {
      check(generated.includes(token), `${base.id} 傳說倍率 ${token} 未出現在實作效果「${generated}」`);
    }
    for (const proc of base.legend.procs) {
      for (const skillId of referencedSkillIds(proc)) check(catalog.skills.has(skillId), `${base.id} 引用的技能不存在：${skillId}`);
    }
  }
  // 「依那張牌的基礎倍率」只有在牌打出時才算得出來，所以只能接 nextCard。
  const procOwners: { id: string; procs: readonly ProcDef[] }[] = [
    ...[...catalog.passives.values()].flatMap((passive) => (passive.effect ? [{ id: passive.id, procs: passive.effect.procs }] : [])),
    ...[...catalog.equipment.values()].flatMap((base) => (base.legend ? [{ id: base.id, procs: base.legend.procs }] : [])),
  ];
  for (const owner of procOwners) {
    for (const proc of owner.procs) {
      if (proc.payload.kind !== 'extraHit' || proc.payload.coefBasis !== 'cardBase') continue;
      check(proc.payload.timing === 'nextCard', `${owner.id} ${proc.procId} 使用 cardBase 倍率，但時機不是 nextCard`);
    }
  }

  // 平衡調整清單不能有失效條目：設計倍率必須真的存在、調整後的倍率必須真的被實作。
  for (const adjustment of BALANCE_ADJUSTMENTS) {
    const skill = catalog.skills.get(adjustment.skillId);
    check(skill !== undefined, `平衡調整引用不存在的技能 ${adjustment.skillId}`);
    if (!skill?.effect) continue;
    check(skill.designEffectText.includes(adjustment.designToken), `${skill.id} 平衡調整的設計倍率 ${adjustment.designToken} 不在設計文字中`);
    check(describeSteps(skill.effect.steps).includes(adjustment.tunedToken), `${skill.id} 平衡調整後的倍率 ${adjustment.tunedToken} 未被實作`);
  }

  // 三轉預設配置引用
  for (const [jobId, table] of Object.entries(TIER3_DEFAULT_SKILLS)) {
    const job = catalog.jobs.get(jobId);
    check(job?.tier === 3, `預設配置 ${jobId} 不是三轉職業`);
    if (!job) continue;
    const pool = new Set(skillSelectionRule(catalog, jobId).regularPool.map((skill) => skill.id));
    for (const skillId of [...table.farm, ...table.boss]) {
      check(pool.has(skillId), `${jobId} 預設配置引用非本路線常規技能 ${skillId}`);
    }
  }

  const implementedSkills = [...catalog.skills.values()].filter((skill) => skill.effect).length;
  const implementedPassives = [...catalog.passives.values()].filter((passive) => passive.effect).length;
  const implementedLegends = [...catalog.equipment.values()].filter((base) => base.legend).length;
  const playableJobs = [...catalog.jobs.values()].filter((job) => job.tier > 0 && job.playable).length;

  return {
    ok: issues.length === 0,
    issues,
    summary: {
      ...actualCounts,
      implementedSkills,
      implementedPassives,
      implementedLegends,
      playableJobs,
    },
  };
}
