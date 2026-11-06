import type { SlotId } from '@qiwu/content';
import { Svg } from '../Svg.tsx';
import { useSvgId } from '../heroes/svgId.ts';
import type { ArtProps } from '../types.ts';
import { OUTLINE, createPaint } from './equipment/kit.tsx';
import { equipDesignFor } from './equipment/registry.ts';

export { KNOWN_EQUIP_TYPES, SHARED_EQUIP_TYPE, isKnownEquipType } from './equipment/registry.ts';

/**
 * 裝備基底圖示（viewBox 0 0 48 48）：先依基底 ID 挑專屬圖，沒有時依設計資料 equipment.type 與部位挑種類代表圖；
 * 透明底、物件置中，卡框與品質色由 UI 負責，這裡只畫物件本身。
 */
export function EquipIcon({
  baseId,
  typeName,
  slot,
  ...rest
}: ArtProps & { readonly baseId?: string; readonly typeName: string; readonly slot: SlotId }) {
  const { paint, defs } = createPaint(useSvgId('eq'));
  // 先畫出物件、讓用到的漸層完成登記，再輸出 defs。
  const art = equipDesignFor(typeName, slot, baseId)(paint);
  return (
    <Svg viewBox="0 0 48 48" {...rest}>
      <defs>{defs()}</defs>
      <g {...OUTLINE}>{art}</g>
    </Svg>
  );
}
