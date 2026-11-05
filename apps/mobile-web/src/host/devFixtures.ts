import { SLOT_IDS, identifyBasePool, slotsAvailableForJob, type ContentCatalog, type QualityId } from '@qiwu/content';
import { createDefaultLoadout, createInitialState, loadoutKey, mainStatValue, serializeSave, type GameState, type ItemInstance } from '@qiwu/game-core';

export { createInitialState, serializeSave, type GameState };

/**
 * 開發夾具：為指定職業建立一套已穿戴的裝備（不經鑑定，只用於測試前置狀態）。
 * extraBagItems > 0 時另外塞滿背包，用來驗證「背包已滿」狀態。
 */
export function defaultEquipFixture(
  catalog: ContentCatalog,
  state: GameState,
  jobId: string,
  level: number,
  qualityId: QualityId,
  extraBagItems = 0,
): void {
  const farm = createDefaultLoadout(catalog, jobId, 'farm');
  const boss = createDefaultLoadout(catalog, jobId, 'boss');
  const slots = slotsAvailableForJob(catalog, jobId);
  for (const slot of SLOT_IDS) {
    if (!slots.includes(slot)) continue;
    const base = identifyBasePool(catalog, jobId === 'NOVICE' ? 'NOVICE' : jobId, slot, level).at(-1);
    if (!base) continue;
    const item = makeItem(catalog, state, base.id, slot, level, qualityId);
    state.items[item.id] = item;
    if (extraBagItems === 0) {
      farm.items[slot] = item.id;
      boss.items[slot] = item.id;
    }
  }
  const head = identifyBasePool(catalog, 'NOVICE', 'head', level)[0];
  while (head && Object.keys(state.items).length < extraBagItems) {
    const item = makeItem(catalog, state, head.id, 'head', level, 'Q1');
    state.items[item.id] = item;
  }
  if (extraBagItems === 0) {
    state.loadouts[loadoutKey(jobId, 'farm')] = farm;
    state.loadouts[loadoutKey(jobId, 'boss')] = boss;
  }
}

function makeItem(
  catalog: ContentCatalog,
  state: GameState,
  baseId: string,
  slot: ItemInstance['slot'],
  level: number,
  qualityId: QualityId,
): ItemInstance {
  const base = catalog.equipment.get(baseId)!;
  state.counters.itemSerial += 1;
  return {
    id: `fx${state.counters.itemSerial}`,
    baseId,
    slot,
    level,
    qualityId,
    mainStat: { stat: base.mainStat, value: mainStatValue(catalog, base, level, qualityId) },
    affixes: [],
    hasLegendEffect: qualityId === 'Q5',
    locked: false,
    status: 'owned',
    createdByOperation: 'dev-fixture',
    contentVersion: catalog.contentVersion,
    serial: state.counters.itemSerial,
    targetJobId: 'NOVICE',
  };
}
