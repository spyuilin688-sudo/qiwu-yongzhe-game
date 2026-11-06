import { circle, star, strokes } from '../skills/geometry.ts';
import { Diagonal, Ink, Shine, Tube, type EquipDesign } from './kit.tsx';
import { DETAIL, MAT, type Tone } from './palette.ts';

/**
 * 刀劍類基底。全部先直立繪製（尖端朝上、中心線 x=24），再由 Diagonal 轉成斜放道具角度；
 * 同類武器靠刀身寬度、護手造型與握柄顏色區分，縮到 48px 仍一眼看出是哪一種。
 */
export const BLADE_DESIGNS: Readonly<Record<string, EquipDesign>> = {
  /** 見習鐵劍：最樸素的寬刃短直劍，平直黃銅護手、皮革握柄；刃寬拉到 11，22px 格子裡仍是一把劍而非一條線。 */
  鐵劍: (p) => (
    <Diagonal mid={26.6}>
      <path d="M24 1L29.6 7V32H18.4V7Z" fill={p.split(MAT.iron)} />
      <Ink d="M24 8.4V29.4" width={1.3} color={MAT.iron.shade} />
      <Shine d="M20.8 8.6V29.6" color={MAT.iron.light} width={1.6} />
      <rect x="13" y="31.4" width="22" height="5.4" rx="2.4" fill={p.split(MAT.brass)} />
      <rect x="21" y="36.8" width="6" height="9.6" rx="1.8" fill={MAT.leather.base} />
      <Ink d={strokes([[21.3, 40, 26.7, 40], [21.3, 43.2, 26.7, 43.2]])} />
      <circle cx="24" cy="48.8" r="3.4" fill={p.ball(MAT.brass)} />
    </Diagonal>
  ),

  /**
   * 劍鞘：收著劍的紅皮鞘，劍柄（護手、握柄、柄頭）露在鞘口外。
   * 只畫空鞘時縮小後像鞭炮或口紅，露出劍柄才一眼讀成「劍鞘」。
   */
  劍鞘: (p) => (
    <Diagonal mid={25.2}>
      <path d="M18.4 31L19.4 6.4Q24 -1 28.6 6.4L29.6 31Z" fill={p.split(MAT.redLeather)} />
      <Shine d="M21.4 9.4V27.4" color={MAT.redLeather.light} width={1.6} />
      <path d="M19.4 7.4Q24 -1 28.6 7.4L24 10.8Z" fill={p.split(MAT.brass)} />
      <path d="M29.6 14.4Q35.4 16 32.4 21.4" fill="none" stroke={MAT.leather.shade} strokeWidth={2.4} />
      <rect x="17.6" y="26.6" width="12.8" height="4.8" rx="1.6" fill={p.split(MAT.brass)} />
      <rect x="13.6" y="31.4" width="20.8" height="4.6" rx="2.2" fill={p.split(MAT.iron)} />
      <rect x="21.2" y="36" width="5.6" height="9.2" rx="1.6" fill={MAT.darkWood.base} />
      <Ink d={strokes([[21.5, 39, 26.5, 39], [21.5, 42, 26.5, 42]])} width={1.1} />
      <circle cx="24" cy="47.8" r="3.1" fill={p.ball(MAT.brass)} />
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

  /** 單手劍：較長的騎士劍，刃心一道鐵脊、上翹的金色翼形護手嵌藍寶石，藍布握柄配紅寶石柄頭；比鐵劍華麗。 */
  單手劍: (p) => (
    <Diagonal mid={25.6}>
      <path d="M24 0L28.8 5.6V31H19.2V5.6Z" fill={p.split(MAT.steel)} />
      <path d="M24 4.6L25.5 7.2V28.6H22.5V7.2Z" fill={MAT.steel.shade} strokeWidth={1.1} />
      <Shine d="M20.9 8V28.4" color={MAT.steel.light} />
      <path d="M11.4 28.4Q13.4 32.2 18 31.8H30Q34.6 32.2 36.6 28.4Q38.4 36.6 31 36.6H17Q9.6 36.6 11.4 28.4Z" fill={p.split(MAT.gold)} />
      <circle cx="24" cy="34.2" r="2.3" fill={p.ball(MAT.sapphire)} strokeWidth={1.3} />
      <rect x="21.4" y="36.6" width="5.2" height="9.4" rx="1.6" fill={MAT.blueCloth.base} />
      <Ink d={strokes([[21.7, 39.6, 26.3, 39.6], [21.7, 42.8, 26.3, 42.8]])} width={1.1} />
      <circle cx="24" cy="48.6" r="3.2" fill={p.ball(MAT.ruby)} />
      <Shine d="M22.2 47.4L23 46.8" color={MAT.ruby.light} width={1.2} />
    </Diagonal>
  ),

  /** 匕首：蛇牙般彎曲的寬單刃，刃心一道毒綠溝槽，S 形護手。 */
  匕首: (p) => (
    <Diagonal mid={25.4}>
      <path d="M28.4 1.4Q33.4 15 29.4 31H19Q19.8 15.6 28.4 1.4Z" fill={p.split(MAT.steel)} />
      <Ink d="M26.4 9.4Q27.6 19 26 28.4" width={2.2} color={MAT.venom.base} />
      <Shine d="M22 25Q22.4 19 24.6 13.6" color={MAT.steel.light} />
      <path d="M14.4 31.4Q19.6 28.6 24 31Q28.4 33.4 33.6 30.6L32.4 35.6Q28.4 37.2 24 35Q19.6 32.8 15.6 35.8Z" fill={p.split(MAT.emerald)} />
      <rect x="21.2" y="35.4" width="5.6" height="8.6" rx="1.6" fill={MAT.darkWood.base} />
      <Ink d={strokes([[21.5, 38.4, 26.5, 38.4], [21.5, 41.2, 26.5, 41.2]])} width={1.1} />
      <circle cx="24" cy="46.6" r="3" fill={p.ball(MAT.emerald)} />
    </Diagonal>
  ),

  /** 刀鞘：寬口短木鞘插著一把短刀，一道深色皮帶與黃銅扣；短而寬的木色剪影，與劍鞘的長紅皮鞘一眼可分。 */
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

  /** 短刃：單面開刃的寬背小刀，刃口有兩道豁口，握柄纏著舊布條。 */
  短刃: (p) => (
    <Diagonal mid={25}>
      <path d="M19.6 3.4L29 10.6V16.6L27 18.6L29 20.6V24.6L27.4 26L29 27.4V31H19.6Z" fill={p.split(MAT.iron)} />
      <Shine d="M21.6 8V28.6" color={MAT.iron.light} width={1.6} />
      <rect x="18" y="31" width="12.4" height="3.8" rx="1.4" fill={MAT.darkIron.base} />
      <rect x="20.6" y="34.6" width="7" height="11.4" rx="2" fill={p.split(MAT.rag)} />
      <Ink d={strokes([[20.8, 37.2, 27.4, 39.2], [20.8, 40.6, 27.4, 42.6], [20.8, 44, 26.4, 45.6]])} width={1.2} />
      <path d="M26.8 44Q31.6 47.2 34.4 44Q32 44.4 30 42.4Z" fill={MAT.rag.base} strokeWidth={1.4} />
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
