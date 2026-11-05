import { Svg } from '../Svg.tsx';
import { useSvgId } from '../heroes/svgId.ts';
import type { ArtProps } from '../types.ts';
import { RegularFrame, ULTIMATE_GLYPH_SCALE, UltimateFrame } from './skills/frame.tsx';
import { sparkle } from './skills/geometry.ts';
import { GLYPH_STROKE } from './skills/kit.tsx';
import { FIELD, FX, INK, type Tone } from './skills/palette.ts';
import { skillIconSpec } from './skills/registry.ts';

export { ULTIMATE_SKILL_IDS, hasSkillDesign } from './skills/registry.ts';

/** 未登記技能的中性底色（見習者棕），只在設計資料新增技能、尚未繪製時出現。 */
const UNKNOWN_FIELD: Tone = { base: '#a08356', shade: '#6e5434', light: '#d0b483' };

/**
 * 技能圖示（viewBox 0 0 48 48）：底板顏色代表職業系、黃銅框代表絕招，
 * 中央符號表達技能內容（斬擊、箭矢、元素、印記、牌、鎚與機械）。
 */
export function SkillIcon({ skillId, ...rest }: ArtProps & { readonly skillId: string }) {
  const prefix = useSvgId('sk');
  const spec = skillIconSpec(skillId);
  const tone = spec ? FIELD[spec.family] : UNKNOWN_FIELD;
  const ultimate = spec?.ultimate ?? false;
  const glyphScale = ultimate ? ULTIMATE_GLYPH_SCALE : 1;
  return (
    <Svg viewBox="0 0 48 48" {...rest}>
      {ultimate ? <UltimateFrame id={`${prefix}-f`} rimId={`${prefix}-r`} tone={tone} /> : <RegularFrame id={`${prefix}-f`} tone={tone} />}
      <g
        stroke={INK}
        strokeWidth={GLYPH_STROKE / glyphScale}
        strokeLinejoin="round"
        strokeLinecap="round"
        transform={ultimate ? `translate(24 24) scale(${ULTIMATE_GLYPH_SCALE}) translate(-24 -24)` : undefined}
      >
        {spec ? spec.glyph() : <path d={sparkle(24, 24, 10)} fill={FX.cream} />}
      </g>
    </Svg>
  );
}
