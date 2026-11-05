import {
  SLOT_IDS,
  SLOT_LABELS,
  STAT_KEYS,
  type ContentCatalog,
  type EquipmentBaseDef,
  type QualityId,
  type SlotId,
  type StatKey,
} from '@qiwu/content';
import {
  readLoadout,
  type DeepReadonly,
  type GameState,
  type ItemInstance,
  type LoadoutPurpose,
} from '@qiwu/game-core';

/** 介面顯示用的純函式；只讀狀態、不做任何寫入或結算。 */

export type ReadonlyItem = DeepReadonly<ItemInstance>;

export function baseOf(catalog: ContentCatalog, item: ReadonlyItem): EquipmentBaseDef {
  const base = catalog.equipment.get(item.baseId);
  if (!base) throw new Error(`未知裝備基底 ${item.baseId}`);
  return base;
}

export function qualityName(catalog: ContentCatalog, qualityId: QualityId): string {
  return catalog.qualities.get(qualityId)?.name ?? qualityId;
}

/** 品質短字（單字）用於窄格；仍是文字，不只靠顏色。 */
export function qualityShort(catalog: ContentCatalog, qualityId: QualityId): string {
  return qualityName(catalog, qualityId).slice(0, 1);
}

export function slotLabel(slot: SlotId, short = false): string {
  return short ? SLOT_LABELS[slot].short : SLOT_LABELS[slot].full;
}

export function itemStatMap(item: ReadonlyItem | null | undefined): Map<StatKey, number> {
  const map = new Map<StatKey, number>();
  if (!item) return map;
  map.set(item.mainStat.stat, (map.get(item.mainStat.stat) ?? 0) + item.mainStat.value);
  for (const affix of item.affixes) map.set(affix.stat, (map.get(affix.stat) ?? 0) + affix.value);
  return map;
}

export interface CompareLine {
  readonly stat: StatKey;
  readonly current: number;
  readonly next: number;
  readonly diff: number;
}

/** 只列變動項；同一屬性在主屬性與詞條的值先合併。 */
export function compareItems(current: ReadonlyItem | null | undefined, next: ReadonlyItem): CompareLine[] {
  const a = itemStatMap(current);
  const b = itemStatMap(next);
  return STAT_KEYS.filter((stat) => a.has(stat) || b.has(stat))
    .map((stat) => {
      const before = a.get(stat) ?? 0;
      const after = b.get(stat) ?? 0;
      return { stat, current: before, next: after, diff: after - before };
    })
    .filter((line) => line.diff !== 0);
}

export function equippedInSlot(
  state: DeepReadonly<GameState>,
  catalog: ContentCatalog,
  purpose: LoadoutPurpose,
  slot: SlotId,
): ReadonlyItem | null {
  const loadout = readLoadout(state, catalog, state.player.currentJobId, purpose);
  const id = loadout.items[slot];
  return id ? (state.items[id] ?? null) : null;
}

export function referencingLoadoutLabels(state: DeepReadonly<GameState>, catalog: ContentCatalog, itemId: string): string[] {
  const labels: string[] = [];
  for (const [key, loadout] of Object.entries(state.loadouts)) {
    if (!Object.values(loadout.items).includes(itemId)) continue;
    const [jobId, purpose] = key.split(':');
    const jobName = catalog.jobs.get(jobId ?? '')?.name ?? jobId;
    labels.push(`${jobName}・${purpose === 'boss' ? '打王' : '清怪'}`);
  }
  return labels;
}

export function ownedItemsSorted(state: DeepReadonly<GameState>, catalog: ContentCatalog): ReadonlyItem[] {
  return Object.values(state.items).sort((a, b) => {
    const qa = catalog.qualities.get(a.qualityId)?.rank ?? 0;
    const qb = catalog.qualities.get(b.qualityId)?.rank ?? 0;
    return qb - qa || b.level - a.level || SLOT_IDS.indexOf(a.slot) - SLOT_IDS.indexOf(b.slot) || b.serial - a.serial;
  });
}

/** 一轉解鎖等級（P）：取自職業資料，不在介面寫死。 */
export function firstJobUnlockLevel(catalog: ContentCatalog): number {
  return Math.min(...[...catalog.jobs.values()].filter((job) => job.tier === 1).map((job) => job.unlockLevel));
}

/** 指定地圖小首領所在的本地關卡編號（依關卡資料，不假設每 5 關）。 */
export function eliteStageNumbers(catalog: ContentCatalog, mapNumber: number): number[] {
  const map = catalog.maps.get(mapNumber);
  if (!map) return [];
  return map.stageIds.map((id) => catalog.stages.get(id)).filter((stage) => stage?.type === 'elite').map((stage) => stage!.localNumber);
}

/** 需要二次確認才出售的品質門檻：與預設保留品質（史詩）一致。 */
export function needsSellConfirm(catalog: ContentCatalog, qualityId: QualityId): boolean {
  const rank = catalog.qualities.get(qualityId)?.rank ?? 0;
  const threshold = catalog.qualities.get(catalog.tuning.identify.defaultKeepMinQuality)?.rank ?? Number.POSITIVE_INFINITY;
  return rank >= threshold;
}
