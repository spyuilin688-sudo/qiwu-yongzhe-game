import { circle, star, strokes } from '../skills/geometry.ts';
import { Diagonal, Ink, Shine, Tube, type EquipDesign } from './kit.tsx';
import { DETAIL, MAT, type Tone } from './palette.ts';

/**
 * 刀劍類基底。全部先直立繪製（尖端朝上、中心線 x=24），再由 Diagonal 轉成斜放道具角度；
 * 同類武器靠刀身寬度、護手造型與握柄顏色區分，縮到 48px 仍一眼看出是哪一種。
 */
export const BLADE_DESIGNS: Readonly<Record<string, EquipDesign>> = {
  /** 見習鐵劍：最樸素的直劍，黃銅護手、皮革握柄。 */
  鐵劍: (p) => (
    <Diagonal mid={26.5}>
      <path d="M24 1L28 6.5V33H20V6.5Z" fill={p.split(MAT.iron)} />
      <Ink d="M24 8V30" width={1.1} color={MAT.iron.shade} />
      <Shine d="M21.9 8.5V30" color={MAT.iron.light} />
      <rect x="14.5" y="32.5" width="19" height="4.5" rx="2.2" fill={p.split(MAT.brass)} />
      <rect x="21.5" y="37" width="5" height="10" rx="1.6" fill={MAT.leather.base} />
      <Ink d={strokes([[21.8, 40.4, 26.2, 40.4], [21.8, 43.7, 26.2, 43.7]])} />
      <circle cx="24" cy="49.5" r="3" fill={p.ball(MAT.brass)} />
    </Diagonal>
  ),

  /** 劍鞘：空鞘，鞘口露出暗色開口，黃銅口環、腰箍與鞘尾。 */
  劍鞘: (p) => (
    <Diagonal mid={26}>
      <path d="M19.4 9H28.6L27.6 42Q24 47 20.4 42Z" fill={p.split(MAT.redLeather)} />
      <Shine d="M21.4 12V36" color={MAT.redLeather.light} />
      <rect x="18" y="3" width="12" height="7" rx="2" fill={p.split(MAT.brass)} />
      <rect x="20.4" y="4.8" width="7.2" height="2.4" rx="1.2" fill={DETAIL.hollow} strokeWidth={1.2} />
      <rect x="18.8" y="22" width="10.4" height="4.2" rx="1.6" fill={p.split(MAT.brass)} />
      <circle cx="24" cy="24.1" r="1.4" fill={MAT.ruby.base} strokeWidth={1.1} />
      <path d="M20 37.6H28L27.6 42.4Q24 48.6 20.4 42.4Z" fill={p.split(MAT.brass)} />
      <path d="M28.8 23Q34 24.5 31.4 29" fill="none" stroke={MAT.leather.shade} strokeWidth={2.2} />
    </Diagonal>
  ),

  /** 雙手劍：加寬刀身、側刃一道豁口，鐵灰翼形護手，紅皮長握柄。 */
  雙手劍: (p) => (
    <Diagonal mid={27}>
      <path d="M24 0L29.5 6V17L27.4 19.4L29.5 21.8V33H18.5V6Z" fill={p.split(MAT.steel)} />
      <rect x="22.7" y="7" width="2.6" height="23" rx="1.3" fill={MAT.steel.shade} strokeWidth={1.1} />
      <Shine d="M20.6 8V30.5" color={MAT.steel.light} />
      <path d="M11 33.5Q24 30.5 37 33.5L35.5 38.5Q24 36.5 12.5 38.5Z" fill={p.split(MAT.darkIron)} />
      <circle cx="24" cy="35.4" r="2.2" fill={p.ball(MAT.ruby)} strokeWidth={1.4} />
      <rect x="21.4" y="38" width="5.2" height="11" rx="1.6" fill={MAT.redLeather.base} />
      <Ink d={strokes([[21.8, 41.6, 26.2, 41.6], [21.8, 45.2, 26.2, 45.2]])} />
      <path d="M24 48.4L27.2 51L24 53.8L20.8 51Z" fill={p.split(MAT.brass)} />
    </Diagonal>
  ),

  /** 單手劍：細長刀身配金色捲邊護手、藍布握柄與紅寶石柄頭，比鐵劍華麗。 */
  單手劍: (p) => (
    <Diagonal mid={26.5}>
      <path d="M24 2L27 6V33H21V6Z" fill={p.split(MAT.steel)} />
      <Ink d="M24 7.5V30.5" width={1} color={MAT.steel.shade} />
      <path d="M13.5 31.8Q15.5 34 18.5 33H29.5Q32.5 34 34.5 31.8Q35.4 37 30 37H18Q12.6 37 13.5 31.8Z" fill={p.split(MAT.gold)} />
      <circle cx="24" cy="35" r="1.9" fill={MAT.sapphire.base} strokeWidth={1.2} />
      <rect x="22" y="37" width="4" height="9" rx="1.4" fill={MAT.blueCloth.base} />
      <Ink d={strokes([[22.3, 40, 25.7, 40], [22.3, 43, 25.7, 43]])} width={1} />
      <circle cx="24" cy="48.6" r="2.8" fill={p.ball(MAT.ruby)} />
      <Shine d="M22.2 47.4L23 46.8" color={MAT.ruby.light} width={1.2} />
    </Diagonal>
  ),

  /** 匕首：蛇牙般彎曲的單刃，刃心一道毒綠溝槽，S 形護手。 */
  匕首: (p) => (
    <Diagonal mid={25}>
      <path d="M27.4 2Q31 15 28 31H20.4Q21 16 27.4 2Z" fill={p.split(MAT.steel)} />
      <Ink d="M25.8 10Q26.6 19 25.2 28" width={1.6} color={MAT.venom.base} />
      <path d="M15.6 31.4Q20 29 24 31Q28 33 32.4 30.6L31.4 35Q28 36.6 24 35Q20 33.4 16.6 35.4Z" fill={p.split(MAT.emerald)} />
      <rect x="21.8" y="35" width="4.4" height="8" rx="1.4" fill={MAT.darkWood.base} />
      <Ink d={strokes([[22.1, 38, 25.9, 38], [22.1, 40.6, 25.9, 40.6]])} width={1} />
      <circle cx="24" cy="45.4" r="2.6" fill={p.ball(MAT.emerald)} />
    </Diagonal>
  ),

  /** 刀鞘：寬口短木鞘插著一把短刀，一道深色皮帶與黃銅扣；與劍鞘的長空鞘一眼可分。 */
  刀鞘: (p) => (
    <Diagonal mid={24} angle={32}>
      <circle cx="24" cy="5.4" r="2.6" fill={p.ball(MAT.brass)} />
      <rect x="21.6" y="6.6" width="4.8" height="8.4" rx="1.5" fill={MAT.darkWood.base} />
      <Ink d={strokes([[21.9, 9.4, 26.1, 9.4], [21.9, 12.2, 26.1, 12.2]])} width={1} />
      <rect x="16.4" y="14.2" width="15.2" height="3.8" rx="1.7" fill={p.split(MAT.darkIron)} />
      <path d="M17.4 18H30.6L29.2 36Q24 46 18.8 36Z" fill={p.split(MAT.wood)} />
      <path d="M24 19.6V39" fill="none" stroke={DETAIL.stitch} strokeWidth={1} strokeDasharray="1.6 1.6" />
      <rect x="15.8" y="21.6" width="16.4" height="3.6" rx="1" fill={MAT.darkWood.base} />
      <rect x="22.2" y="20.8" width="3.6" height="5.2" rx="0.8" fill={MAT.brass.base} strokeWidth={1.2} />
      <path d="M20.6 37.4H27.4L26.6 39.6Q24 44.4 21.4 39.6Z" fill={MAT.brass.base} />
    </Diagonal>
  ),

  /** 短刃：單面開刃的小刀，刃口有兩道豁口，握柄纏著舊布條。 */
  短刃: (p) => (
    <Diagonal mid={25}>
      <path d="M21 4L28 11V17L26.3 18.6L28 20.2V24.4L26.7 25.6L28 26.8V31H21Z" fill={p.split(MAT.iron)} />
      <Shine d="M22.6 9V28.5" color={MAT.iron.light} />
      <rect x="19.4" y="31" width="10" height="3.2" rx="1.2" fill={MAT.darkIron.base} />
      <rect x="21" y="34" width="6.2" height="11.4" rx="2" fill={p.split(MAT.rag)} />
      <Ink d={strokes([[21.2, 36.6, 27, 38.6], [21.2, 40, 27, 42], [21.2, 43.4, 26, 45]])} width={1.1} />
      <path d="M26.4 43.6Q31 46.6 33.6 43.6Q31.4 44 29.6 42.2Z" fill={MAT.rag.base} strokeWidth={1.4} />
    </Diagonal>
  ),

  /** 成對雙刃：兩把月牙彎刃交叉成 X，一把鋼色、一把帶暗紫，表示「成對」。 */
  成對雙刃: (p) => {
    const blade = (tone: Tone, grip: string) => (
      <>
        <path d="M24.6 3Q35 14 27.6 31H21.6Q28 16 24.6 3Z" fill={p.split(tone)} />
        <rect x="19" y="30.6" width="10.4" height="3.2" rx="1.4" fill={MAT.darkIron.base} />
        <rect x="22" y="33.6" width="4.4" height="8.4" rx="1.4" fill={grip} />
        <circle cx="24.2" cy="43.8" r="2" fill={MAT.brass.base} strokeWidth={1.4} />
      </>
    );
    return (
      <>
        <g transform="translate(48 0) scale(-1 1) rotate(32 24 24)">{blade(MAT.iron, MAT.night.base)}</g>
        <g transform="rotate(32 24 24)">{blade(MAT.steel, MAT.purple.base)}</g>
      </>
    );
  },

  /** 忍具：斜放苦無（柄尾圓環）壓著一枚大手裏劍，夜行的深紫纏布。 */
  忍具: (p) => (
    <>
      <Diagonal mid={21} angle={-40}>
        <path d="M24 1L29.4 15L24 21.6L18.6 15Z" fill={p.split(MAT.iron)} />
        <Ink d="M24 4V19" width={1} color={MAT.iron.shade} />
        <rect x="21.9" y="21" width="4.2" height="12.4" rx="1.2" fill={MAT.night.base} />
        <Ink d={strokes([[22.1, 24, 25.9, 26], [22.1, 27.8, 25.9, 29.8]])} width={1} color={MAT.night.light} />
        <Tube d={circle(24, 36.6, 3.2)} width={2.6} color={MAT.iron.base} />
      </Diagonal>
      <path d={star(31, 31, 4, 13, 4.4, -45)} fill={p.split(MAT.steel)} />
      <Ink d="M31 31L22.4 22.4M31 31L39.6 22.4" width={1} color={MAT.steel.shade} />
      <circle cx="31" cy="31" r="2.6" fill={DETAIL.hollow} strokeWidth={1.5} />
    </>
  ),
};
