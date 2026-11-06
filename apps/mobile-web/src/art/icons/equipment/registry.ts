import { SHARED_SLOT_IDS, type SharedSlotId, type SlotId } from '@qiwu/content';
import { ARCANE_DESIGNS } from './arcane.tsx';
import { ARCANE_SHADOW_BASE_DESIGNS } from './bases-arcane-shadow.tsx';
import { FAITH_TRICK_CRAFT_BASE_DESIGNS } from './bases-faith-trick-craft.tsx';
import { MARTIAL_BASE_DESIGNS } from './bases-martial.tsx';
import { SHARED_BASE_DESIGNS } from './bases-shared.tsx';
import { BLADE_DESIGNS } from './blades.tsx';
import type { EquipDesign } from './kit.tsx';
import { RANGED_DESIGNS } from './ranged.tsx';
import { TOOL_DESIGNS } from './tools.tsx';
import { FALLBACK_DESIGN, WEARABLE_DESIGNS } from './wearables.tsx';

/** 設計資料中共用部位裝備的 type 值；這類基底依部位挑圖。 */
export const SHARED_EQUIP_TYPE = '共用';

/** 依設計資料 equipment.type 字串索引；新增種類只需在對應分類檔加一筆。 */
const TYPE_DESIGNS: Readonly<Record<string, EquipDesign>> = {
  ...BLADE_DESIGNS,
  ...RANGED_DESIGNS,
  ...ARCANE_DESIGNS,
  ...TOOL_DESIGNS,
};

/** 依基底 ID 的專屬圖：同種類的基底各自一張；優先於種類代表圖。 */
const BASE_DESIGNS: Readonly<Record<string, EquipDesign>> = {
  ...MARTIAL_BASE_DESIGNS,
  ...ARCANE_SHADOW_BASE_DESIGNS,
  ...FAITH_TRICK_CRAFT_BASE_DESIGNS,
  ...SHARED_BASE_DESIGNS,
};

const isSharedSlot = (slot: SlotId): slot is SharedSlotId => (SHARED_SLOT_IDS as readonly SlotId[]).includes(slot);

/** 是否有專屬設計（測試用來確認設計資料每一種基底都已繪製，而非落到佔位布包）。 */
export function isKnownEquipType(typeName: string): boolean {
  return typeName === SHARED_EQUIP_TYPE || Object.hasOwn(TYPE_DESIGNS, typeName);
}

export function equipDesignFor(typeName: string, slot: SlotId, baseId?: string): EquipDesign {
  const byBase = baseId && Object.hasOwn(BASE_DESIGNS, baseId) ? BASE_DESIGNS[baseId] : undefined;
  if (byBase) return byBase;
  const byType = Object.hasOwn(TYPE_DESIGNS, typeName) ? TYPE_DESIGNS[typeName] : undefined;
  if (byType) return byType;
  // 共用部位（或未知種類但部位是共用部位）都退回部位代表圖，至少看得出穿在哪裡。
  if (isSharedSlot(slot)) return WEARABLE_DESIGNS[slot];
  return FALLBACK_DESIGN;
}

/** 已繪製的種類名稱，供總覽與測試列舉。 */
export const KNOWN_EQUIP_TYPES: readonly string[] = Object.keys(TYPE_DESIGNS);
