import type { SlotId } from '@qiwu/content';
import { Svg } from '../Svg.tsx';
import type { ArtProps } from '../types.ts';
import { ICON_STROKE } from './ui/lineStyle.ts';
import { SLOT_GLYPHS } from './ui/slotGlyphs.tsx';

/** 八個裝備部位圖示（viewBox 0 0 24 24，currentColor）。 */
export function SlotIcon({ slot, ...rest }: ArtProps & { readonly slot: SlotId }) {
  return (
    <Svg viewBox="0 0 24 24" {...rest}>
      <g {...ICON_STROKE}>{SLOT_GLYPHS[slot]}</g>
    </Svg>
  );
}
