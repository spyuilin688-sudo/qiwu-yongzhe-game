import type { SharedSlotId } from '@qiwu/content';
import { circle, dots, fmt, leaf, sparkle, strokes } from '../skills/geometry.ts';
import { Ink, Shine, Tube, type EquipDesign } from './kit.tsx';
import { DETAIL, MAT } from './palette.ts';

/** 橢圓環（戒指本體）：外、內兩個橢圓配 evenodd，中間鏤空透出卡框底色。 */
function ellipseRing(cx: number, cy: number, rx: number, ry: number, innerRx: number, innerRy: number, innerDy: number): string {
  const ellipse = (x: number, y: number, a: number, b: number): string =>
    `M${fmt(x - a)} ${fmt(y)}A${fmt(a)} ${fmt(b)} 0 1 0 ${fmt(x + a)} ${fmt(y)}A${fmt(a)} ${fmt(b)} 0 1 0 ${fmt(x - a)} ${fmt(y)}Z`;
  return ellipse(cx, cy, rx, ry) + ellipse(cx, cy + innerDy, innerRx, innerRy);
}

/**
 * 共用部位（任何職業可穿）：只拿得到部位、拿不到基底名稱，因此每個部位一張代表圖。
 * 造型取「旅人」路線的布、皮、黃銅，與職業專屬武器的華麗度拉開層次。
 */
export const WEARABLE_DESIGNS: Readonly<Record<SharedSlotId, EquipDesign>> = {
  /** 頭部：寬簷旅人軟帽，皮帶黃銅扣，斜插一根紅羽毛。 */
  head: (p) => (
    <>
      <path d={leaf(33.6, 11, 17, 5.6, -50)} fill={p.split(MAT.feather)} />
      <Ink d="M28.6 17L38.4 5.4" width={1} color={MAT.feather.light} />
      <path d="M12.6 28Q11.6 13.6 24 12.4Q36.4 13 35.4 28Z" fill={p.split(MAT.tealCloth)} />
      <Shine d="M16 22Q16.4 17 20.4 15" color={MAT.tealCloth.light} />
      <path d="M12.8 23.4Q24 26.8 35.2 23.4L35.4 28Q24 31.4 12.6 28Z" fill={MAT.leather.base} strokeWidth={1.6} />
      <rect x="27.4" y="24.2" width="4.4" height="4.4" rx="0.8" fill={MAT.brass.base} strokeWidth={1.3} />
      <path d="M4.6 30.6Q7.4 25.4 12.8 26.4Q24 30.2 35.2 26.4Q40.8 25.4 43.4 30.6Q36 36 24 36Q12 36 4.6 30.6Z" fill={p.fall(MAT.tealCloth)} />
    </>
  ),

  /** 身體：藍布旅衣，白色 V 領、黃銅鈕扣與皮帶扣。 */
  body: (p) => (
    <>
      <path d="M17 7.4L11.6 9.4L5 17.4L10 23.2L13.8 20.4V41.6H34.2V20.4L38 23.2L43 17.4L36.4 9.4L31 7.4Q24 12.6 17 7.4Z" fill={p.split(MAT.blueCloth)} />
      <Ink d={strokes([[7.4, 15, 12, 20.4], [40.6, 15, 36, 20.4], [14.2, 38.6, 33.8, 38.6]])} width={1.1} color={MAT.blueCloth.light} />
      <Shine d="M16.8 22V29" color={MAT.blueCloth.light} />
      <path d="M18.6 7.8L24 15.2L29.4 7.8Q24 10.6 18.6 7.8Z" fill={MAT.cloth.base} strokeWidth={1.6} />
      <path d={dots([[24, 19.6, 1.3], [24, 25, 1.3]])} fill={MAT.brass.base} strokeWidth={1} />
      <rect x="13.6" y="30.6" width="20.8" height="4.4" fill={MAT.leather.base} strokeWidth={1.6} />
      <rect x="21.6" y="30" width="4.8" height="5.6" rx="1" fill={MAT.brass.base} strokeWidth={1.4} />
    </>
  ),

  /** 手部：縫皮手套，指節縫線、紅皮袖口。 */
  hands: (p) => (
    <g transform="rotate(-8 24 26)">
      <path
        d="M16 25V13.4Q16 11 18.4 11Q20.8 11 20.8 13.4V22H21V9.6Q21 7.2 23.4 7.2Q25.8 7.2 25.8 9.6V22H26V10.6Q26 8.2 28.4 8.2Q30.8 8.2 30.8 10.6V22.6H31V14.4Q31 12 33.2 12Q35.4 12 35.4 14.4V29.6Q35.4 37.6 27.6 37.6H22.6Q18.6 37.6 15.6 33.6L10 26.6Q8.8 24.4 10.8 23.2Q12.8 22.2 14.4 24.2L16 26Z"
        fill={p.split(MAT.leather)}
      />
      <Shine d="M18.4 14.6V21" color={MAT.leather.light} />
      <path d="M17.2 29Q25.6 26.6 34.6 29" fill="none" stroke={DETAIL.stitch} strokeWidth={1.1} strokeDasharray="1.6 1.4" />
      <rect x="17.4" y="35.4" width="18.4" height="8.2" rx="2" fill={p.split(MAT.redLeather)} />
      <rect x="24.4" y="37.4" width="4.4" height="4.2" rx="0.8" fill={MAT.silver.base} strokeWidth={1.2} />
    </g>
  ),

  /** 腳部：朝右的軟底旅靴，翻折靴口、紅皮綁帶與黃銅扣。 */
  feet: (p) => (
    <>
      <path d="M13.4 8.4H27.6V27.4L36.8 30.4Q42.4 32.4 41.6 37.6V40.4H12.6Q11.4 30 13.4 8.4Z" fill={p.split(MAT.leather)} />
      <Shine d="M31.6 31.8Q36 32.6 38.6 35M16 13V30" color={MAT.leather.light} />
      <rect x="12" y="5.4" width="17" height="6.4" rx="2.2" fill={p.split(MAT.wood)} />
      <rect x="12.8" y="21" width="15.6" height="3.6" rx="1" fill={MAT.redLeather.base} strokeWidth={1.6} />
      <rect x="22.6" y="20.4" width="4" height="4.8" rx="0.8" fill={MAT.brass.base} strokeWidth={1.3} />
      <rect x="11.6" y="39" width="31" height="4.4" rx="1.8" fill={MAT.darkWood.base} />
    </>
  ),

  /** 項鍊：金色細鍊掛一顆水滴形琥珀墜，鍊上兩顆小珠。 */
  necklace: (p) => (
    <>
      <Tube d="M9.6 5Q10.6 25 24 27.6Q37.4 25 38.4 5" width={2.6} color={MAT.gold.base} dash="2.2 1.4" />
      <path d={dots([[12.4, 18.6, 1.7], [35.6, 18.6, 1.7]])} fill={MAT.amber.base} strokeWidth={1.1} />
      <Tube d={circle(24, 29.4, 1.8)} width={2} color={MAT.gold.base} />
      <path d="M24 31.6Q32.4 36.4 31.6 41.2Q30.8 46.4 24 46.4Q17.2 46.4 16.4 41.2Q15.6 36.4 24 31.6Z" fill={p.ball(MAT.amber)} />
      <path d="M20.4 32.6Q24 29.6 27.6 32.6L26.2 34.8H21.8Z" fill={p.split(MAT.gold)} strokeWidth={1.5} />
      <ellipse cx="20.8" cy="38.6" rx="1.4" ry="2.4" transform="rotate(20 20.8 38.6)" fill={DETAIL.white} stroke="none" opacity={0.85} />
    </>
  ),

  /** 戒指：厚金指環（中間鏤空），頂端鑲著切面紅寶石。 */
  ring: (p) => (
    <>
      <path d={ellipseRing(24, 31, 13, 9.6, 9, 6.2, 1)} fill={p.ball(MAT.gold)} fillRule="evenodd" />
      <Shine d="M12.8 28.4Q14.6 24 19.4 22.6" color={MAT.gold.light} />
      <rect x="19.4" y="17.4" width="9.2" height="5" rx="1.6" fill={p.split(MAT.gold)} />
      <path d="M17.6 13.4L20.6 9H27.4L30.4 13.4L24 21.4Z" fill={p.split(MAT.ruby)} />
      <Ink d="M17.8 13.4H30.2M21.4 9.2L22.6 13.4L24 21M26.6 9.2L25.4 13.4" width={1} />
      <path d={sparkle(32.4, 8, 2.8)} fill={DETAIL.white} stroke="none" />
    </>
  ),
};

/** 未知基底的佔位：綁口布包。只會在設計資料新增了尚未繪製的種類時出現。 */
export const FALLBACK_DESIGN: EquipDesign = (p) => (
  <>
    <path d="M12.6 20Q9.6 42 24 42Q38.4 42 35.4 20Q30 23 24 23Q18 23 12.6 20Z" fill={p.split(MAT.rag)} />
    <path d="M13.4 20.4Q10 14 15 12.4Q19 15 24 14Q29 15 33 12.4Q38 14 34.6 20.4Q24 23.6 13.4 20.4Z" fill={MAT.rag.light} />
    <Tube d="M13.6 21Q24 25 34.4 21" width={2.6} color={DETAIL.rope} />
    <circle cx="24" cy="23" r="2" fill={DETAIL.rope} strokeWidth={1.4} />
  </>
);
