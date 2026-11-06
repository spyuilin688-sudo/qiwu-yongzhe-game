import { dots } from './geometry.ts';
import { BRASS, INK, ULT_GEM, type Tone } from './palette.ts';

/** 職業系底色漸層：左上受光、右下沉，讓平塗符號浮在底板上。 */
function FieldGradient({ id, tone }: { readonly id: string; readonly tone: Tone }) {
  return (
    <radialGradient id={id} cx="0.34" cy="0.28" r="0.92">
      <stop offset="0" stopColor={tone.light} />
      <stop offset="0.5" stopColor={tone.base} />
      <stop offset="1" stopColor={tone.shade} />
    </radialGradient>
  );
}

/** 一般技能：職業系色的圓角方塊，細亮邊與暗邊做出淺浮雕。 */
export function RegularFrame({ id, tone }: { readonly id: string; readonly tone: Tone }) {
  return (
    <>
      <defs>
        <FieldGradient id={id} tone={tone} />
      </defs>
      <rect x="3" y="3" width="42" height="42" rx="9.5" fill={`url(#${id})`} stroke={INK} strokeWidth={2} data-frame="regular" />
      <path d="M6.6 30V13Q6.6 6.6 13 6.6H31" fill="none" stroke={tone.light} strokeWidth={1.4} strokeLinecap="round" opacity={0.6} />
      <path d="M41.4 18V35Q41.4 41.4 35 41.4H17" fill="none" stroke={tone.shade} strokeWidth={1.4} strokeLinecap="round" opacity={0.8} />
      <circle cx="24" cy="24" r="13" fill={tone.light} opacity={0.2} />
    </>
  );
}

/**
 * 絕招：外加一圈黃銅框、四角鉚釘與頂端紅寶石，與一般技能的單層方塊明顯不同；
 * 內框較小，因此符號會整體縮小置中（見 ULTIMATE_GLYPH_SCALE）。
 */
export function UltimateFrame({ id, rimId, tone }: { readonly id: string; readonly rimId: string; readonly tone: Tone }) {
  return (
    <>
      <defs>
        <FieldGradient id={id} tone={tone} />
        <linearGradient id={rimId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={BRASS.light} />
          <stop offset="0.45" stopColor={BRASS.base} />
          <stop offset="1" stopColor={BRASS.shade} />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="45" height="45" rx="11" fill={`url(#${rimId})`} stroke={INK} strokeWidth={2} data-frame="ultimate" />
      <path d="M3.6 30V12.6Q3.6 3.6 12.6 3.6H31" fill="none" stroke={BRASS.light} strokeWidth={1.2} strokeLinecap="round" />
      <rect x="6" y="6" width="36" height="36" rx="7" fill={`url(#${id})`} stroke={INK} strokeWidth={1.6} />
      <circle cx="24" cy="24" r="11.5" fill={tone.light} opacity={0.2} />
      <path d={dots([[6.4, 6.4, 1.5], [41.6, 6.4, 1.5], [6.4, 41.6, 1.5], [41.6, 41.6, 1.5]])} fill={BRASS.light} stroke={INK} strokeWidth={1} />
      <path d="M24 0.8L27.4 4.2L24 7.6L20.6 4.2Z" fill={ULT_GEM.base} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
    </>
  );
}

/** 絕招內框邊長 36 ／ 一般 42：符號等比縮小，留出黃銅框的呼吸空間。 */
export const ULTIMATE_GLYPH_SCALE = 0.84;
