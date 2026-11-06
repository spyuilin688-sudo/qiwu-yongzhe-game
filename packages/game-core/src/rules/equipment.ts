import {
  SLOT_IDS,
  defaultSkillIds,
  getJob,
  isBaseLegalForJob,
  skillSelectionRule,
  slotsAvailableForJob,
  type ContentCatalog,
  type EquipmentBaseDef,
  type SlotId,
} from '@qiwu/content';
import { loadoutKey, type GameState, type ItemInstance, type Loadout, type LoadoutPurpose } from '../model/types.ts';
import { reject } from '../services/errors.ts';
import type { DeepReadonly } from '../util/clone.ts';

type ReadState = DeepReadonly<GameState> | GameState;

export function getBase(catalog: ContentCatalog, baseId: string): EquipmentBaseDef {
  const base = catalog.equipment.get(baseId);
  if (!base) throw new Error(`未知裝備基底 ${baseId}`);
  return base;
}

export function createDefaultLoadout(catalog: ContentCatalog, jobId: string, purpose: LoadoutPurpose): Loadout {
  const rule = skillSelectionRule(catalog, jobId);
  return {
    jobId,
    purpose,
    items: {},
    skillIds: [...defaultSkillIds(catalog, jobId, purpose)],
    ultimateId: rule.ultimate?.id ?? null,
    conditions: {},
    targetPolicy: 'default',
    revision: 0,
  };
}

/** 讀取配置；尚未儲存過時回傳預設配置（不寫入狀態）。 */
export function readLoadout(state: ReadState, catalog: ContentCatalog, jobId: string, purpose: LoadoutPurpose): DeepReadonly<Loadout> {
  return state.loadouts[loadoutKey(jobId, purpose)] ?? createDefaultLoadout(catalog, jobId, purpose);
}

/** 任一職業、任一套配置引用的物品都視為「已穿戴」，不可出售（規格 09 InventoryService）。 */
export function loadoutsReferencingItem(state: ReadState, itemId: string): string[] {
  return Object.entries(state.loadouts)
    .filter(([, loadout]) => Object.values(loadout.items).includes(itemId))
    .map(([key]) => key);
}

export function ownedItemCount(state: ReadState): number {
  return Object.keys(state.items).length;
}

export function equippedItems(
  state: ReadState,
  catalog: ContentCatalog,
  jobId: string,
  purpose: LoadoutPurpose,
): DeepReadonly<ItemInstance>[] {
  const loadout = readLoadout(state, catalog, jobId, purpose);
  return SLOT_IDS.map((slot) => loadout.items[slot])
    .filter((id): id is string => typeof id === 'string')
    .map((id) => state.items[id])
    .filter((item): item is DeepReadonly<ItemInstance> => Boolean(item));
}

/**
 * 穿戴條件（規格 04）：屬於本人、未售出、角色等級 ≥ 裝備等級、基底階級已解鎖、職業路線合法。
 * BOSS 挑戰中的限制由服務層另外檢查。
 */
export function assertEquipLegal(
  state: ReadState,
  catalog: ContentCatalog,
  item: DeepReadonly<ItemInstance>,
  jobId: string,
): void {
  const base = getBase(catalog, item.baseId);
  if (item.status !== 'owned') reject('ITEM_ALREADY_SOLD', '這件裝備已經出售。');
  if (state.player.level < item.level) {
    reject('LEVEL_TOO_LOW', `需要角色 Lv${item.level}，目前 Lv${state.player.level}。`);
  }
  if (!slotsAvailableForJob(catalog, jobId).includes(item.slot)) {
    reject('SLOT_UNAVAILABLE', '主武器與副手在完成一轉後開放。');
  }
  if (!isBaseLegalForJob(catalog, base, jobId)) {
    reject('ROUTE_INVALID', `「${base.name}」限 ${base.ownerName} 路線，目前職業 ${getJob(catalog, jobId).name} 不能穿戴。`);
  }
  if (base.ownerJobId !== 'SHARED' && !state.player.unlockedJobIds.includes(base.ownerJobId)) {
    reject('JOB_LOCKED', `需先解鎖 ${base.ownerName}。`);
  }
}

export function isEquipLegal(state: ReadState, catalog: ContentCatalog, item: DeepReadonly<ItemInstance>, jobId: string): boolean {
  try {
    assertEquipLegal(state, catalog, item, jobId);
    return true;
  } catch {
    return false;
  }
}

export interface JobSwitchPlan {
  readonly targetJobId: string;
  readonly loadouts: Record<LoadoutPurpose, Loadout>;
  /** 目前配置中因路線不合法將卸下（留在背包）的物品。 */
  readonly unequippedItemIds: string[];
  /** 目前配置中目標職業不能使用、將被移除的技能。 */
  readonly droppedSkillIds: string[];
}

/**
 * 轉職計畫（規格 03「轉職與換路線」）：從目前配置出發，卸下不合法主武／副手但留在背包，
 * 共用裝備保留；若目標職業曾儲存配置，優先恢復仍合法的項目。介面預覽與服務交易共用此函式。
 */
export function planJobSwitch(state: ReadState, catalog: ContentCatalog, targetJobId: string): JobSwitchPlan {
  const currentJobId = state.player.currentJobId;
  const rule = skillSelectionRule(catalog, targetJobId);
  const legalSkills = new Set(rule.regularPool.map((skill) => skill.id));
  const unequipped = new Set<string>();
  const dropped = new Set<string>();
  const loadouts = {} as Record<LoadoutPurpose, Loadout>;

  for (const purpose of ['farm', 'boss'] as const) {
    const current = readLoadout(state, catalog, currentJobId, purpose);
    const saved = state.loadouts[loadoutKey(targetJobId, purpose)];
    const items: Partial<Record<SlotId, string>> = {};
    for (const slot of SLOT_IDS) {
      const candidates = [saved?.items[slot], current.items[slot]];
      for (const candidate of candidates) {
        const item = candidate ? state.items[candidate] : undefined;
        if (item && item.slot === slot && isEquipLegal(state, catalog, item, targetJobId)) {
          items[slot] = item.id;
          break;
        }
      }
      const currentId = current.items[slot];
      if (currentId && items[slot] !== currentId) {
        const currentItem = state.items[currentId];
        if (currentItem && !isEquipLegal(state, catalog, currentItem, targetJobId)) unequipped.add(currentId);
      }
    }
    for (const skillId of current.skillIds) if (!legalSkills.has(skillId)) dropped.add(skillId);
    const savedSkills = saved ? saved.skillIds.filter((id) => legalSkills.has(id)) : [];
    const skillIds = savedSkills.length > 0 ? savedSkills.slice(0, rule.regularSlots) : [...defaultSkillIds(catalog, targetJobId, purpose)];
    const conditions: Loadout['conditions'] = {};
    for (const skillId of skillIds) {
      const mode = saved?.conditions[skillId];
      if (mode) conditions[skillId] = mode;
    }
    loadouts[purpose] = {
      jobId: targetJobId,
      purpose,
      items,
      skillIds,
      ultimateId: rule.ultimate?.id ?? null,
      conditions,
      targetPolicy: saved?.targetPolicy ?? 'default',
      revision: (saved?.revision ?? 0) + 1,
    };
  }

  return {
    targetJobId,
    loadouts,
    unequippedItemIds: [...unequipped].sort(),
    droppedSkillIds: [...dropped].sort(),
  };
}
