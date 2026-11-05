import type { ContentCatalog, EquipmentBaseDef, JobDef, MapDef, SkillDef, StageDef } from './catalog.ts';
import { TIER3_DEFAULT_SKILLS } from './defaultLoadouts.ts';
import { NOVICE_JOB_ID, SHARED_OWNER_ID, type SlotId, type StatKey } from './ids.ts';

/**
 * 內容查詢：介面與核心共用同一份規則（規格：EquipService 與 LoadoutService 共用路線驗證器，
 * 不在 UI 與 API 各抄一份）。
 */

export function getJob(catalog: ContentCatalog, jobId: string): JobDef {
  const job = catalog.jobs.get(jobId);
  if (!job) throw new Error(`未知職業 ${jobId}`);
  return job;
}

/** 自身在前、祖先在後；不含見習者（見習者沒有技能與專用裝備）。 */
export function jobLineage(catalog: ContentCatalog, jobId: string): readonly JobDef[] {
  const lineage: JobDef[] = [];
  let cursor: JobDef | undefined = catalog.jobs.get(jobId);
  while (cursor && cursor.id !== NOVICE_JOB_ID) {
    lineage.push(cursor);
    cursor = cursor.parentId ? catalog.jobs.get(cursor.parentId) : undefined;
  }
  return lineage;
}

export function lineageIds(catalog: ContentCatalog, jobId: string): ReadonlySet<string> {
  return new Set(jobLineage(catalog, jobId).map((job) => job.id));
}

export interface SkillSelectionRule {
  /** 可同時裝入的常規技能數。 */
  readonly regularSlots: number;
  readonly regularPool: readonly SkillDef[];
  readonly ultimate: SkillDef | null;
}

/** 一轉兩招皆可帶；二轉四招選三；三轉五個常規選三，加固定該路線絕招。 */
export function skillSelectionRule(catalog: ContentCatalog, jobId: string): SkillSelectionRule {
  const lineage = jobLineage(catalog, jobId);
  const ordered = [...lineage].reverse();
  const regularPool: SkillDef[] = [];
  let ultimate: SkillDef | null = null;
  for (const job of ordered) {
    for (const skillId of job.ownSkillIds) {
      const skill = catalog.skills.get(skillId);
      if (!skill) continue;
      if (skill.kind === 'ultimate') {
        if (job.id === jobId) ultimate = skill;
      } else {
        regularPool.push(skill);
      }
    }
  }
  return {
    regularSlots: Math.min(catalog.globals.maxRegularSkills, regularPool.length),
    regularPool,
    ultimate,
  };
}

export function defaultSkillIds(catalog: ContentCatalog, jobId: string, purpose: 'farm' | 'boss'): readonly string[] {
  const table = TIER3_DEFAULT_SKILLS[jobId];
  if (table) return table[purpose];
  const rule = skillSelectionRule(catalog, jobId);
  const job = catalog.jobs.get(jobId);
  if (!job || job.tier === 0) return [];
  if (job.tier === 1) return rule.regularPool.map((skill) => skill.id);
  // 二轉 N：新節點兩招優先，再補一轉第一招。
  const own = job.ownSkillIds.filter((id) => catalog.skills.get(id)?.kind === 'regular');
  const inherited = rule.regularPool.map((skill) => skill.id).filter((id) => !own.includes(id));
  return [...own, ...inherited].slice(0, rule.regularSlots);
}

export function passiveIdsForJob(catalog: ContentCatalog, jobId: string): readonly string[] {
  return jobLineage(catalog, jobId)
    .map((job) => job.passiveId)
    .filter((id): id is string => id !== null)
    .reverse();
}

/** 穿戴路線合法性：共用部位任何職業可穿；主武／副手只限當前路線及祖先。 */
export function isBaseLegalForJob(catalog: ContentCatalog, base: EquipmentBaseDef, jobId: string): boolean {
  if (base.ownerJobId === SHARED_OWNER_ID) return true;
  return lineageIds(catalog, jobId).has(base.ownerJobId);
}

export function slotsAvailableForJob(catalog: ContentCatalog, jobId: string): readonly SlotId[] {
  const job = catalog.jobs.get(jobId);
  if (!job || job.tier === 0) return ['head', 'body', 'hands', 'feet', 'necklace', 'ring'];
  return ['weapon', 'offhand', 'head', 'body', 'hands', 'feet', 'necklace', 'ring'];
}

/**
 * 鑑定產出的基底池。主武／副手只從目標路線及祖先、且最低等級 ≤ 物品等級的基底抽取；
 * 某池為空時回退同部位最近祖先池（祖先順序即 lineage 順序），不跨職業。
 */
export function identifyBasePool(
  catalog: ContentCatalog,
  targetJobId: string,
  slot: SlotId,
  itemLevel: number,
): readonly EquipmentBaseDef[] {
  const bases = catalog.equipmentOrder
    .map((id) => catalog.equipment.get(id))
    .filter((base): base is EquipmentBaseDef => Boolean(base) && base!.slot === slot);
  if (slot !== 'weapon' && slot !== 'offhand') {
    return bases.filter((base) => base.ownerJobId === SHARED_OWNER_ID && base.minLevel <= itemLevel);
  }
  const lineage = jobLineage(catalog, targetJobId);
  const eligible = bases.filter(
    (base) => lineage.some((job) => job.id === base.ownerJobId) && base.minLevel <= itemLevel,
  );
  if (eligible.length > 0) return eligible;
  for (const ancestor of lineage) {
    const fallback = bases.filter((base) => base.ownerJobId === ancestor.id);
    if (fallback.length > 0) return fallback;
  }
  return [];
}

export function affixPoolForJob(catalog: ContentCatalog, targetJobId: string): readonly StatKey[] {
  const pool = new Set<StatKey>(catalog.generalAffixStats);
  for (const job of jobLineage(catalog, targetJobId)) {
    for (const stat of catalog.routeAffixTags[job.id] ?? []) pool.add(stat);
  }
  return [...pool];
}

export function getMap(catalog: ContentCatalog, mapNumber: number): MapDef {
  const map = catalog.maps.get(mapNumber);
  if (!map) throw new Error(`未知地圖 ${mapNumber}`);
  return map;
}

export function getStageAt(catalog: ContentCatalog, mapNumber: number, localNumber: number): StageDef {
  const stageId = getMap(catalog, mapNumber).stageIds[localNumber - 1];
  const stage = stageId ? catalog.stages.get(stageId) : undefined;
  if (!stage) throw new Error(`未知關卡 ${mapNumber}-${localNumber}`);
  return stage;
}

export function bossStageLocalNumber(catalog: ContentCatalog, mapNumber: number): number {
  return getMap(catalog, mapNumber).stageIds.length;
}

/** 文案用：技能 ID 轉顯示名稱（找不到時保留 ID，方便發現資料錯誤）。 */
export function skillNameLookup(catalog: ContentCatalog): (skillId: string) => string {
  return (skillId) => catalog.skills.get(skillId)?.name ?? skillId;
}
