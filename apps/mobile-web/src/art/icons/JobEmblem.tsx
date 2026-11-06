import { Svg } from '../Svg.tsx';
import { INK, METAL } from '../heroes/palette.ts';
import { useSvgId } from '../heroes/svgId.ts';
import type { ArtProps, FamilyKey } from '../types.ts';
import { EMBLEM_FIELD, EMBLEM_GLYPHS } from './ui/emblemGlyphs.tsx';

/** 職業系徽章（viewBox 0 0 32 32）：黃銅外環呼應 UI 的黃銅框。 */
export function JobEmblem({ family, ...rest }: ArtProps & { readonly family: FamilyKey }) {
  const fieldId = useSvgId('emblem');
  const field = EMBLEM_FIELD[family];
  return (
    <Svg viewBox="0 0 32 32" {...rest}>
      <defs>
        <radialGradient id={fieldId} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor={field.light} />
          <stop offset="0.6" stopColor={field.base} />
          <stop offset="1" stopColor={field.shade} />
        </radialGradient>
      </defs>
      <g stroke={INK} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        <circle cx="16" cy="16" r="14.8" fill={METAL.brass.base} />
        <path d="M5.4 11.6A11.6 11.6 0 0 1 12.4 4.8" fill="none" stroke={METAL.brass.light} strokeWidth="1.3" />
        <circle cx="16" cy="16" r="11.6" fill={`url(#${fieldId})`} strokeWidth="1.3" />
        {EMBLEM_GLYPHS[family]}
      </g>
    </Svg>
  );
}
