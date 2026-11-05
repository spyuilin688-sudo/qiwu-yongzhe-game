import rawDesignData from '../../../docs/data_v0.2.json' with { type: 'json' };
import { GENERAL_AFFIX_STATS, ROUTE_AFFIX_TAGS } from './affixes.ts';
import { LEGEND_EFFECTS, PASSIVE_EFFECTS } from './effects/passiveEffects.ts';
import { SKILL_EFFECTS } from './effects/skillEffects.ts';
import type { LegendEffectDef, PassiveEffectDef, SkillEffectDef } from './effects/types.ts';
import { BOSS_MECHANICS_BY_MAP, ELITE_TEMPLATES, type BossMechanicDef, type EliteTemplateDef } from './encounters.ts';
import {
  NOVICE_JOB_ID,
  NOVICE_JOB_NAME,
  QUALITY_IDS,
  SHARED_OWNER_ID,
  SHARED_OWNER_NAME,
  SLOT_NAME_TO_ID,
  type QualityId,
  type SlotId,
  type StatKey,
} from './ids.ts';
import { DesignDataSchema, type DesignData } from './schema.ts';
import { PROTOTYPE_TUNING, type PrototypeTuning } from './tuning.ts';
import { fnv1a32Hex, stableStringify } from './checksum.ts';

export interface FamilyDef {
  readonly id: string;
  readonly name: string;
  readonly rootJobId: string;
}

export interface JobDef {
  readonly id: string;
  readonly name: string;
  readonly familyId: string | null;
  readonly familyName: string | null;
  /** 0 = 見習者。 */
  readonly tier: 0 | 1 | 2 | 3;
  readonly parentId: string | null;
  readonly unlockLevel: number;
  readonly ownSkillIds: readonly string[];
  readonly passiveId: string | null;
  /** 此節點自身與祖先的技能、被動皆已實作，才可作為戰鬥職業。 */
  readonly playable: boolean;
}

export type SkillKind = 'regular' | 'ultimate';

export interface SkillDef {
  readonly id: string;
  readonly jobId: string;
  readonly name: string;
  readonly description: string;
  readonly kind: SkillKind;
  readonly cooldownMs: number;
  readonly designEffectText: string;
  readonly designAutoConditionText: string;
  readonly tags: readonly string[];
  readonly effect: SkillEffectDef | null;
}

export interface PassiveDef {
  readonly id: string;
  readonly jobId: string;
  readonly name: string;
  readonly description: string;
  readonly designRuleText: string;
  readonly effect: PassiveEffectDef | null;
}

export type MainStatFormula = 'W' | 'O' | 'S' | 'C';

export interface EquipmentBaseDef {
  readonly id: string;
  readonly name: string;
  /** SHARED 或 JOBxx。 */
  readonly ownerJobId: string;
  readonly ownerName: string;
  readonly tier: number;
  readonly minLevel: number;
  readonly slot: SlotId;
  readonly typeName: string;
  readonly mainStat: StatKey;
  readonly mainStatFormula: MainStatFormula;
  readonly familyName: string;
  readonly legendText: string;
  readonly legend: LegendEffectDef | null;
}

export interface QualityDef {
  readonly id: QualityId;
  readonly rank: number;
  readonly name: string;
  readonly multiplier: number;
  readonly affixCount: number;
  readonly hasLegendEffect: boolean;
}

export interface BenchLevelDef {
  readonly level: number;
  /** 整數權重，總和 10000（百分比 × 100）。 */
  readonly weights: readonly number[];
  readonly nextCost: number | null;
}

export type MonsterKind = 'normal' | 'elite' | 'boss';

export interface MonsterDef {
  readonly id: string;
  readonly name: string;
  readonly kind: MonsterKind;
  readonly mapNumber: number;
}

export interface ZoneDef {
  readonly name: string;
  readonly stageIds: readonly string[];
}

export interface MapDef {
  readonly id: string;
  readonly number: number;
  readonly name: string;
  readonly normalMonsters: readonly MonsterDef[];
  readonly elites: readonly MonsterDef[];
  readonly boss: MonsterDef;
  readonly bossFeature: string;
  readonly bossMechanicTexts: readonly string[];
  readonly bossMechanics: readonly BossMechanicDef[];
  readonly stageIds: readonly string[];
  readonly zones: readonly ZoneDef[];
}

export type StageType = 'normal' | 'elite' | 'boss';

export interface StageDef {
  readonly id: string;
  readonly number: number;
  readonly mapId: string;
  readonly mapNumber: number;
  readonly localNumber: number;
  readonly displayCode: string;
  readonly name: string;
  readonly zoneName: string;
  readonly type: StageType;
  readonly typeName: string;
  readonly encounterText: string;
  readonly eliteMonsterId: string | null;
  readonly eliteTemplate: EliteTemplateDef | null;
}

/** 設計資料 prototype_globals 中由引擎直接使用的值（P／N）。 */
export interface DesignGlobals {
  readonly tickMs: number;
  readonly bossDurationMs: number;
  readonly backpackCapacity: number;
  readonly maxEnemies: number;
  readonly maxRegularSkills: number;
  readonly maxUltimateSkills: number;
}

export interface ContentCatalog {
  readonly designVersion: string;
  /** 內容版本 = 設計資料版本 + 原型實作批次；整場 BOSS 與物品實例記錄此值。 */
  readonly contentVersion: string;
  readonly checksum: string;
  readonly tuning: PrototypeTuning;
  readonly globals: DesignGlobals;
  readonly families: readonly FamilyDef[];
  readonly jobs: ReadonlyMap<string, JobDef>;
  readonly jobOrder: readonly string[];
  readonly skills: ReadonlyMap<string, SkillDef>;
  readonly passives: ReadonlyMap<string, PassiveDef>;
  readonly equipment: ReadonlyMap<string, EquipmentBaseDef>;
  readonly equipmentOrder: readonly string[];
  readonly qualities: ReadonlyMap<QualityId, QualityDef>;
  readonly qualityOrder: readonly QualityId[];
  readonly bench: readonly BenchLevelDef[];
  readonly maps: ReadonlyMap<number, MapDef>;
  readonly mapCount: number;
  readonly stages: ReadonlyMap<string, StageDef>;
  readonly monsters: ReadonlyMap<string, MonsterDef>;
  readonly eliteTemplates: readonly EliteTemplateDef[];
  readonly generalAffixStats: readonly StatKey[];
  readonly routeAffixTags: Readonly<Record<string, readonly StatKey[]>>;
}

/** 實作批次：只要效果定義或原型數值改變就遞增，讓存檔與挑戰能辨識版本。 */
const IMPLEMENTATION_BATCH = 'proto.1';

const MAIN_STAT_RULES: Readonly<Record<string, { stat: StatKey; formula: MainStatFormula }>> = {
  'W(L,Q)': { stat: 'FLAT_ATTACK', formula: 'W' },
  'O(L,Q)': { stat: 'FLAT_ATTACK', formula: 'O' },
  'S(L,Q)技能傷害': { stat: 'SKILL_DMG', formula: 'S' },
  'S(L,Q)攻擊加成': { stat: 'ATK_PCT', formula: 'S' },
  'S(L,Q)攻速': { stat: 'ATK_SPEED', formula: 'S' },
  'C(L,Q)冷卻縮減': { stat: 'CDR', formula: 'C' },
  'C(L,Q)暴擊率': { stat: 'CRIT_RATE', formula: 'C' },
};

export class ContentBuildError extends Error {
  readonly issues: readonly string[];
  constructor(issues: readonly string[]) {
    super(`內容資料無法建立：\n${issues.join('\n')}`);
    this.name = 'ContentBuildError';
    this.issues = issues;
  }
}

export function parseDesignData(raw: unknown): DesignData {
  const parsed = DesignDataSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ContentBuildError(parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`));
  }
  return parsed.data;
}

export function buildCatalog(data: DesignData): ContentCatalog {
  const issues: string[] = [];

  const families: FamilyDef[] = [];
  const familyIdByName = new Map<string, string>();
  const jobIdByName = new Map<string, string>([[NOVICE_JOB_NAME, NOVICE_JOB_ID]]);
  for (const cls of data.classes) {
    if (jobIdByName.has(cls.name)) issues.push(`職業名稱重複：${cls.name}`);
    jobIdByName.set(cls.name, cls.id);
    if (!familyIdByName.has(cls.family)) {
      const familyId = `FAM${String(families.length + 1).padStart(2, '0')}`;
      familyIdByName.set(cls.family, familyId);
      families.push({ id: familyId, name: cls.family, rootJobId: cls.id });
    }
  }

  const skills = new Map<string, SkillDef>();
  for (const skill of data.skills) {
    if (skills.has(skill.id)) issues.push(`技能 ID 重複：${skill.id}`);
    skills.set(skill.id, {
      id: skill.id,
      jobId: skill.class_id,
      name: skill.name,
      description: skill.description,
      kind: skill.type === 'ultimate' ? 'ultimate' : 'regular',
      cooldownMs: skill.cooldown_ms,
      designEffectText: skill.prototype_effect,
      designAutoConditionText: skill.auto_condition,
      tags: skill.tags,
      effect: SKILL_EFFECTS.get(skill.id) ?? null,
    });
  }

  const passives = new Map<string, PassiveDef>();
  for (const passive of data.passives) {
    if (passives.has(passive.id)) issues.push(`被動 ID 重複：${passive.id}`);
    passives.set(passive.id, {
      id: passive.id,
      jobId: passive.class_id,
      name: passive.name,
      description: passive.description,
      designRuleText: passive.prototype_rule,
      effect: PASSIVE_EFFECTS.get(passive.id) ?? null,
    });
  }

  const draftJobs = new Map<string, Omit<JobDef, 'playable'>>();
  draftJobs.set(NOVICE_JOB_ID, {
    id: NOVICE_JOB_ID,
    name: NOVICE_JOB_NAME,
    familyId: null,
    familyName: null,
    tier: 0,
    parentId: null,
    unlockLevel: 1,
    ownSkillIds: [],
    passiveId: null,
  });
  for (const cls of data.classes) {
    const parentId = jobIdByName.get(cls.parent);
    if (!parentId) issues.push(`${cls.id} 的前置「${cls.parent}」不存在`);
    if (draftJobs.has(cls.id)) issues.push(`職業 ID 重複：${cls.id}`);
    draftJobs.set(cls.id, {
      id: cls.id,
      name: cls.name,
      familyId: familyIdByName.get(cls.family) ?? null,
      familyName: cls.family,
      tier: cls.tier,
      parentId: parentId ?? NOVICE_JOB_ID,
      unlockLevel: cls.unlock_level,
      ownSkillIds: cls.skill_ids,
      passiveId: cls.passive_id,
    });
  }

  const jobs = new Map<string, JobDef>();
  const isNodeImplemented = (job: Omit<JobDef, 'playable'>): boolean =>
    job.ownSkillIds.every((id) => skills.get(id)?.effect) && (job.passiveId === null || Boolean(passives.get(job.passiveId)?.effect));
  for (const job of draftJobs.values()) {
    let playable = true;
    let cursor: Omit<JobDef, 'playable'> | undefined = job;
    const visited = new Set<string>();
    while (cursor) {
      if (visited.has(cursor.id)) {
        issues.push(`職業前置形成循環：${job.id}`);
        playable = false;
        break;
      }
      visited.add(cursor.id);
      if (!isNodeImplemented(cursor)) playable = false;
      cursor = cursor.parentId ? draftJobs.get(cursor.parentId) : undefined;
    }
    jobs.set(job.id, { ...job, playable });
  }

  const equipment = new Map<string, EquipmentBaseDef>();
  for (const eq of data.equipment) {
    const slot = SLOT_NAME_TO_ID[eq.slot];
    const rule = MAIN_STAT_RULES[eq.base_stat_rule];
    const ownerJobId = eq.owner_class === SHARED_OWNER_NAME ? SHARED_OWNER_ID : jobIdByName.get(eq.owner_class);
    if (!slot) issues.push(`${eq.id} 部位未知：${eq.slot}`);
    if (!rule) issues.push(`${eq.id} 主屬性規則未知：${eq.base_stat_rule}`);
    if (!ownerJobId) issues.push(`${eq.id} 擁有職業不存在：${eq.owner_class}`);
    if (!slot || !rule || !ownerJobId) continue;
    if (equipment.has(eq.id)) issues.push(`裝備 ID 重複：${eq.id}`);
    equipment.set(eq.id, {
      id: eq.id,
      name: eq.name,
      ownerJobId,
      ownerName: eq.owner_class,
      tier: eq.tier,
      minLevel: eq.min_level,
      slot,
      typeName: eq.type,
      mainStat: rule.stat,
      mainStatFormula: rule.formula,
      familyName: eq.family,
      legendText: eq.legend_effect,
      legend: LEGEND_EFFECTS.get(eq.id) ?? null,
    });
  }

  const qualities = new Map<QualityId, QualityDef>();
  data.qualities.forEach((quality, index) => {
    qualities.set(quality.id, {
      id: quality.id,
      rank: index + 1,
      name: quality.name,
      multiplier: quality.multiplier,
      affixCount: quality.affixes,
      hasLegendEffect: index === data.qualities.length - 1,
    });
  });

  const bench: BenchLevelDef[] = [...data.bench_levels]
    .sort((a, b) => a.level - b.level)
    .map((row) => ({
      level: row.level,
      weights: row.quality_weights_percent.map((percent) => Math.round(percent * 100)),
      nextCost: row.next_cost,
    }));

  const monsters = new Map<string, MonsterDef>();
  const maps = new Map<number, MapDef>();
  const stages = new Map<string, StageDef>();
  const stageById = new Map(data.stages.map((stage) => [stage.id, stage]));
  const eliteTemplateByLocal = new Map(ELITE_TEMPLATES.map((template) => [template.localStage, template]));

  for (const map of data.maps) {
    const mapCode = String(map.number).padStart(2, '0');
    const normalMonsters = map.normal_monsters.map((name, index): MonsterDef => ({
      id: `MON-${mapCode}-${index + 1}`,
      name,
      kind: 'normal',
      mapNumber: map.number,
    }));
    const elites = map.elites.map((name, index): MonsterDef => ({
      id: `ELT-${mapCode}-${index + 1}`,
      name,
      kind: 'elite',
      mapNumber: map.number,
    }));
    const boss: MonsterDef = { id: `BOSS-${mapCode}`, name: map.boss, kind: 'boss', mapNumber: map.number };
    for (const monster of [...normalMonsters, ...elites, boss]) monsters.set(monster.id, monster);

    const zones: { name: string; stageIds: string[] }[] = [];
    let eliteIndex = 0;
    for (const stageId of map.stage_ids) {
      const stage = stageById.get(stageId);
      if (!stage) {
        issues.push(`${map.id} 引用不存在的關卡 ${stageId}`);
        continue;
      }
      const zoneName = stage.name.split('・')[0] ?? stage.name;
      const lastZone = zones.at(-1);
      if (lastZone && lastZone.name === zoneName) lastZone.stageIds.push(stage.id);
      else zones.push({ name: zoneName, stageIds: [stage.id] });

      let eliteMonsterId: string | null = null;
      let eliteTemplate: EliteTemplateDef | null = null;
      if (stage.type === 'elite') {
        eliteMonsterId = elites[eliteIndex]?.id ?? null;
        eliteTemplate = eliteTemplateByLocal.get(stage.local_number as EliteTemplateDef['localStage']) ?? null;
        if (!eliteMonsterId) issues.push(`${stage.id} 找不到對應小首領`);
        if (!eliteTemplate) issues.push(`${stage.id} 第 ${stage.local_number} 關沒有小首領模板`);
        eliteIndex += 1;
      }
      stages.set(stage.id, {
        id: stage.id,
        number: stage.number,
        mapId: stage.map_id,
        mapNumber: map.number,
        localNumber: stage.local_number,
        displayCode: stage.display_code,
        name: stage.name,
        zoneName,
        type: stage.type,
        typeName: stage.type_name,
        encounterText: stage.encounter,
        eliteMonsterId,
        eliteTemplate,
      });
    }

    const bossMechanics = BOSS_MECHANICS_BY_MAP.get(map.number);
    if (!bossMechanics) issues.push(`${map.id} 沒有 BOSS 機制定義`);
    maps.set(map.number, {
      id: map.id,
      number: map.number,
      name: map.name,
      normalMonsters,
      elites,
      boss,
      bossFeature: map.boss_feature,
      bossMechanicTexts: map.boss_mechanic_prototype,
      bossMechanics: bossMechanics ?? [],
      stageIds: map.stage_ids,
      zones,
    });
  }

  if (issues.length > 0) throw new ContentBuildError(issues);

  const checksum = fnv1a32Hex(
    stableStringify({
      design: data,
      tuning: PROTOTYPE_TUNING,
      skills: [...SKILL_EFFECTS.values()],
      passives: [...PASSIVE_EFFECTS.values()],
      legends: [...LEGEND_EFFECTS.values()],
      elites: ELITE_TEMPLATES,
      bosses: [...BOSS_MECHANICS_BY_MAP.entries()],
      affixes: { general: GENERAL_AFFIX_STATS, route: ROUTE_AFFIX_TAGS },
    }),
  );

  return {
    designVersion: data.meta.version,
    contentVersion: `${data.meta.version}-${IMPLEMENTATION_BATCH}`,
    checksum,
    tuning: PROTOTYPE_TUNING,
    globals: {
      tickMs: data.prototype_globals.tick_ms,
      bossDurationMs: data.prototype_globals.boss_duration_ms,
      backpackCapacity: data.prototype_globals.backpack_capacity,
      maxEnemies: data.prototype_globals.max_enemies,
      maxRegularSkills: data.prototype_globals.max_normal_skills,
      maxUltimateSkills: data.prototype_globals.max_ultimate_skills,
    },
    families,
    jobs,
    jobOrder: [...jobs.keys()],
    skills,
    passives,
    equipment,
    equipmentOrder: [...equipment.keys()],
    qualities,
    qualityOrder: [...QUALITY_IDS],
    bench,
    maps,
    mapCount: maps.size,
    stages,
    monsters,
    eliteTemplates: ELITE_TEMPLATES,
    generalAffixStats: GENERAL_AFFIX_STATS,
    routeAffixTags: ROUTE_AFFIX_TAGS,
  };
}

let cachedCatalog: ContentCatalog | null = null;

/** 預設內容：直接讀取設計規格 docs/data_v0.2.json，避免同一份資料維護兩份。 */
export function loadDefaultCatalog(): ContentCatalog {
  cachedCatalog ??= buildCatalog(parseDesignData(rawDesignData));
  return cachedCatalog;
}

export function getDefaultDesignData(): unknown {
  return rawDesignData;
}
