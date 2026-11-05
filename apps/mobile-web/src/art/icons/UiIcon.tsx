import { Svg } from '../Svg.tsx';
import type { ArtProps, UiIconName } from '../types.ts';
import { ICON_STROKE } from './ui/lineStyle.ts';
import { UI_GLYPHS } from './ui/uiGlyphs.tsx';

/** 介面圖示（viewBox 0 0 24 24，以 currentColor 著色，可由 CSS 改色）。 */
export function UiIcon({ name, ...rest }: ArtProps & { readonly name: UiIconName }) {
  return (
    <Svg viewBox="0 0 24 24" {...rest}>
      <g {...ICON_STROKE}>{UI_GLYPHS[name]}</g>
    </Svg>
  );
}
