import type { SlotId } from '@qiwu/content';
import { Svg } from '../Svg.tsx';
import { useSvgId } from '../heroes/svgId.ts';
import type { ArtProps } from '../types.ts';
import { OUTLINE, createPaint } from './equipment/kit.tsx';
import { equipDesignFor } from './equipment/registry.ts';

export { KNOWN_EQUIP_TYPES, SHARED_EQUIP_TYPE, isKnownEquipType } from './equipment/registry.ts';

/**
 * 裝備基底圖示（viewBox 0 0 48 48）：依設計資料 equipment.type 與部位挑圖，透明底、物件置中；
 * 卡框與品質色由 UI 負責，這裡只畫物件本身。
 */
export function EquipIcon({ typeName, slot, ...rest }: ArtProps & { readonly typeName: string; readonly slot: SlotId }) {
  const { paint, defs } = createPaint(useSvgId('eq'));
  // 先畫出物件、讓用到的漸層完成登記，再輸出 defs。
  const art = equipDesignFor(typeName, slot)(paint);
  return (
    <Svg viewBox="0 0 48 48" {...rest}>
      <defs>{defs()}</defs>
      <g {...OUTLINE}>{art}</g>
    </Svg>
  );
}
