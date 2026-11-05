import { getJob, skillSelectionRule, NOVICE_JOB_ID } from '@qiwu/content';
import { loadoutKey, type GameState, type Loadout, type LoadoutPurpose } from '../model/types.ts';
import { assertEquipLegal, createDefaultLoadout, planJobSwitch, readLoadout, type JobSwitchPlan } from '../rules/equipment.ts';
import { cloneJson } from '../util/clone.ts';
import type { CommandPayload } from './commands.ts';
import { assertNotInBossFight, type ReadState, type ServiceContext } from './context.ts';
import { reject } from './errors.ts';

function ensureLoadout(draft: GameState, ctx: ServiceContext, jobId: string, purpose: LoadoutPurpose): Loadout {
  const key = loadoutKey(jobId, purpose);
  draft.loadouts[key] ??= createDefaultLoadout(ctx.catalog, jobId, purpose);
  return draft.loadouts[key];
}

// ───────────── 穿戴 ─────────────

export interface EquipResult {
  purpose: LoadoutPurpose;
  slot: string;
  equippedItemId: string;
  replacedItemId: string | null;
}

export function assertCanEquip(state: ReadState, ctx: Pick<ServiceContext, 'catalog'>, itemId: string): void {
  assertNotInBossFight(state);
  const item = state.items[itemId];
  if (!item) {
    const sold = state.soldArchive.some((archived) => archived.id === itemId);
    reject(sold ? 'ITEM_ALREADY_SOLD' : 'ITEM_NOT_FOUND', sold ? '這件裝備已經出售。' : '找不到這件裝備。');
  }
  assertEquipLegal(state, ctx.catalog, item, state.player.currentJobId);
}

/** 穿戴新裝只替換指定配置的欄位，舊裝回背包；不出售舊裝、不更改另一套配置（規格 07）。 */
export function equipItem(draft: GameState, payload: CommandPayload<'equipItem'>, ctx: ServiceContext): EquipResult {
  assertCanEquip(draft, ctx, payload.itemId);
  const item = draft.items[payload.itemId]!;
  const loadout = ensureLoadout(draft, ctx, draft.player.currentJobId, payload.purpose);
  const replaced = loadout.items[item.slot] ?? null;
  loadout.items[item.slot] = item.id;
  loadout.revision += 1;
  return { purpose: payload.purpose, slot: item.slot, equippedItemId: item.id, replacedItemId: replaced === item.id ? null : replaced };
}

export interface UnequipResult {
  purpose: LoadoutPurpose;
  slot: string;
  unequippedItemId: string | null;
}

export function unequipSlot(draft: GameState, payload: CommandPayload<'unequipSlot'>, ctx: ServiceContext): UnequipResult {
  assertNotInBossFight(draft);
  const loadout = ensureLoadout(draft, ctx, draft.player.currentJobId, payload.purpose);
  const previous = loadout.items[payload.slot] ?? null;
  delete loadout.items[payload.slot];
  loadout.revision += 1;
  return { purpose: payload.purpose, slot: payload.slot, unequippedItemId: previous };
}

// ───────────── 技能配置 ─────────────

export interface SaveSkillsResult {
  purpose: LoadoutPurpose;
  skillIds: string[];
  ultimateId: string | null;
}

/** LoadoutService.save：驗證祖先關係、數量、重複與條件白名單；絕招只能是當前三轉路線的絕招。 */
export function saveLoadoutSkills(
  draft: GameState,
  payload: CommandPayload<'saveLoadoutSkills'>,
  ctx: ServiceContext,
): SaveSkillsResult {
  assertNotInBossFight(draft);
  const jobId = draft.player.currentJobId;
  if (jobId === NOVICE_JOB_ID && payload.skillIds.length > 0) {
    const firstJobLevel = Math.min(...[...ctx.catalog.jobs.values()].filter((job) => job.tier === 1).map((job) => job.unlockLevel));
    reject('SKILL_INVALID', `見習者沒有技能；Lv${firstJobLevel} 轉職後開放。`);
  }
  const rule = skillSelectionRule(ctx.catalog, jobId);
  const legal = new Set(rule.regularPool.map((skill) => skill.id));
  const fieldErrors: Record<string, string> = {};
  if (new Set(payload.skillIds).size !== payload.skillIds.length) fieldErrors.skillIds = '常規技能不可重複。';
  if (payload.skillIds.length > rule.regularSlots) fieldErrors.skillIds = `最多裝入 ${rule.regularSlots} 個常規技能。`;
  for (const skillId of payload.skillIds) {
    if (!legal.has(skillId)) fieldErrors[skillId] = `${ctx.catalog.skills.get(skillId)?.name ?? skillId} 不屬於目前路線。`;
  }
  for (const skillId of Object.keys(payload.conditions)) {
    if (!payload.skillIds.includes(skillId)) fieldErrors[`conditions.${skillId}`] = '只能設定已裝入技能的施放條件。';
  }
  if (Object.keys(fieldErrors).length > 0) reject('SKILL_INVALID', '技能配置不合法，未儲存。', { fieldErrors });

  const loadout = ensureLoadout(draft, ctx, jobId, payload.purpose);
  loadout.skillIds = [...payload.skillIds];
  loadout.conditions = { ...payload.conditions };
  loadout.targetPolicy = payload.targetPolicy;
  loadout.ultimateId = rule.ultimate?.id ?? null;
  loadout.revision += 1;
  return { purpose: payload.purpose, skillIds: loadout.skillIds, ultimateId: loadout.ultimateId };
}

export interface CopyLoadoutResult {
  from: LoadoutPurpose;
  to: LoadoutPurpose;
}

/** 玩家主動把一套配置複製到另一套（例如清怪 → 打王）；只在玩家明確操作時執行。 */
export function copyLoadout(draft: GameState, payload: CommandPayload<'copyLoadout'>, ctx: ServiceContext): CopyLoadoutResult {
  assertNotInBossFight(draft);
  if (payload.from === payload.to) reject('INVALID_PAYLOAD', '來源與目標配置相同。');
  const jobId = draft.player.currentJobId;
  const source = cloneJson(readLoadout(draft, ctx.catalog, jobId, payload.from)) as Loadout;
  const target = ensureLoadout(draft, ctx, jobId, payload.to);
  draft.loadouts[loadoutKey(jobId, payload.to)] = {
    ...source,
    purpose: payload.to,
    revision: target.revision + 1,
  };
  return { from: payload.from, to: payload.to };
}

// ───────────── 職業 ─────────────

export interface UnlockJobResult {
  jobId: string;
}

export function assertCanUnlockJob(state: ReadState, ctx: Pick<ServiceContext, 'catalog'>, jobId: string): void {
  assertNotInBossFight(state);
  const job = ctx.catalog.jobs.get(jobId);
  if (!job || job.tier === 0) reject('JOB_NOT_FOUND', '找不到這個職業。');
  if (state.player.unlockedJobIds.includes(jobId)) reject('JOB_ALREADY_UNLOCKED', `${job.name} 已解鎖。`);
  if (job.parentId && job.parentId !== NOVICE_JOB_ID && !state.player.unlockedJobIds.includes(job.parentId)) {
    reject('JOB_PREREQUISITE', `需先解鎖前置職業 ${getJob(ctx.catalog, job.parentId).name}。`);
  }
  if (state.player.level < job.unlockLevel) {
    reject('LEVEL_TOO_LOW', `需要 Lv${job.unlockLevel}，目前 Lv${state.player.level}。`);
  }
  if (!job.playable) reject('JOB_NOT_IMPLEMENTED', `${job.name} 的技能或被動尚未在原型實作，下一階段開放。`);
}

/** 解鎖只寫紀錄；不給經驗、金幣，不重置等級，不要求先過 BOSS（規格 03 N）。 */
export function unlockJob(draft: GameState, payload: CommandPayload<'unlockJob'>, ctx: ServiceContext): UnlockJobResult {
  assertCanUnlockJob(draft, ctx, payload.jobId);
  draft.player.unlockedJobIds.push(payload.jobId);
  // 見習者不是可選的產出路線：第一次解鎖職業後，產出路線改為該職業，避免鑑定因路線無效而停擺。
  if (draft.identifySettings.targetJobId === NOVICE_JOB_ID) {
    draft.identifySettings.targetJobId = payload.jobId;
    draft.identifySettings.version += 1;
  }
  return { jobId: payload.jobId };
}

export interface SwitchJobResult {
  jobIdBefore: string;
  jobIdAfter: string;
  unequippedItemIds: string[];
  droppedSkillIds: string[];
}

export function assertCanSwitchJob(state: ReadState, ctx: Pick<ServiceContext, 'catalog'>, jobId: string): void {
  assertNotInBossFight(state);
  const job = ctx.catalog.jobs.get(jobId);
  if (!job || job.tier === 0) reject('JOB_NOT_FOUND', '找不到這個職業。');
  if (!state.player.unlockedJobIds.includes(jobId)) reject('JOB_LOCKED', `${job.name} 尚未解鎖。`);
  if (!job.playable) reject('JOB_NOT_IMPLEMENTED', `${job.name} 尚未在原型實作。`);
  if (state.player.currentJobId === jobId) reject('INVALID_PAYLOAD', `目前已是 ${job.name}。`);
}

/** 原子更新職業、重驗配置、卸下不合法裝備但留在背包；共用裝備保留。不產生經驗或金幣（T-12）。 */
export function switchJob(draft: GameState, payload: CommandPayload<'switchJob'>, ctx: ServiceContext): SwitchJobResult {
  assertCanSwitchJob(draft, ctx, payload.jobId);
  const plan: JobSwitchPlan = planJobSwitch(draft, ctx.catalog, payload.jobId);
  const acknowledged = [...payload.ackUnequipItemIds].sort();
  if (acknowledged.join(',') !== plan.unequippedItemIds.join(',')) {
    reject('SWITCH_CONFIRMATION_OUTDATED', '將卸下的裝備清單已變更，請重新確認後再轉職。', {
      details: { expected: plan.unequippedItemIds.join(',') },
    });
  }
  const jobIdBefore = draft.player.currentJobId;
  draft.player.currentJobId = payload.jobId;
  for (const purpose of ['farm', 'boss'] as const) {
    draft.loadouts[loadoutKey(payload.jobId, purpose)] = plan.loadouts[purpose];
  }
  return {
    jobIdBefore,
    jobIdAfter: payload.jobId,
    unequippedItemIds: plan.unequippedItemIds,
    droppedSkillIds: plan.droppedSkillIds,
  };
}
