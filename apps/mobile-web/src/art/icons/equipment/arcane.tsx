import { circle, dots, leaf, polar, sparkle, star, strokes } from '../skills/geometry.ts';
import { Diagonal, Grow, Ink, Shine, Tube, type EquipDesign } from './kit.tsx';
import { DETAIL, INK, MAT } from './palette.ts';

const WHITE = DETAIL.white;

/** 念珠：11 顆珠子沿圓排列、底部留給主珠與流蘇；深淺兩色交錯分成兩條路徑以省元素。 */
const BEAD_ANGLES = [120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420] as const;
const BEADS = BEAD_ANGLES.map((deg) => polar(24, 18.6, 12.4, deg));

/**
 * 法杖、法珠、聖物與書：法師系以寶石與水晶為焦點，祭司系以金色光環與白色羽翼為焦點，
 * 小丑系戲杖用紅白條紋與月牙，避免三系杖類剪影混淆。
 */
export const ARCANE_DESIGNS: Readonly<Record<string, EquipDesign>> = {
  /** 短杖：橡木短杖，杖頭是一顆木瘤，冒出兩片葉子與綠色小寶石。 */
  短杖: (p) => (
    <Diagonal mid={21.6}>
      <Tube d="M24 16V46" width={6.2} color={MAT.wood.base} />
      <Shine d="M22.8 21V42" color={MAT.wood.light} width={1.2} />
      <circle cx="24" cy="47.4" r="2.4" fill={MAT.darkWood.base} />
      <Grow by={1.12} cy={12}>
        <path d={[leaf(16.4, 7, 9, 4.2, -140), leaf(31.6, 7, 9, 4.2, -40)].join('')} fill={MAT.emerald.base} strokeWidth={1.5} />
        <circle cx="24" cy="12" r="6.4" fill={p.ball(MAT.darkWood)} />
        <Ink d="M20.2 10.4Q24 8.2 27.8 10.4" width={1.1} color={MAT.darkWood.light} />
        <circle cx="24" cy="13.4" r="2.4" fill={MAT.venom.base} strokeWidth={1.3} />
      </Grow>
    </Diagonal>
  ),

  /** 法珠：黃銅爪座托著紫水晶球，球內有一道魔力漩渦。 */
  法珠: (p) => (
    <Grow by={1.24} cy={27.3} dy={-2.6}>
      <path d="M13.6 43H34.4L31.6 37H16.4Z" fill={p.split(MAT.brass)} />
      <circle cx="24" cy="23" r="11.4" fill={p.ball(MAT.amethyst)} />
      <Ink d="M18.4 25.6Q20.6 20 25.8 21.2Q30.2 22.6 29.4 27" width={1.6} color={MAT.amethyst.light} />
      <ellipse cx="19.4" cy="17.8" rx="3.2" ry="1.9" transform="rotate(-35 19.4 17.8)" fill={WHITE} stroke="none" opacity={0.9} />
      <path d={sparkle(29.6, 28, 2.6)} fill={WHITE} stroke="none" />
      <Tube d="M18 37.4Q11.8 30 15.4 20.6M30 37.4Q36.2 30 32.6 20.6" width={3} color={MAT.brass.base} />
    </Grow>
  ),

  /** 法杖：深色長杖，黃銅月形托座夾著一顆赤紅寶石，旁邊飄著火星。 */
  法杖: (p) => (
    <Diagonal mid={20.6}>
      <Tube d="M24 16V46" width={6.2} color={MAT.darkWood.base} />
      <rect x="20.8" y="43.6" width="6.4" height="4.4" rx="1.6" fill={MAT.brass.base} />
      <rect x="20.4" y="18.4" width="7.2" height="4.4" rx="1.6" fill={p.split(MAT.brass)} />
      <Grow by={1.16} cy={12}>
        <path d="M15 5Q14 18 24 19Q34 18 33 5Q30 13 24 13.6Q18 13 15 5Z" fill={p.split(MAT.brass)} />
        <circle cx="24" cy="9.4" r="6" fill={p.ball(MAT.ruby)} />
        <ellipse cx="21.8" cy="7.2" rx="1.8" ry="1.1" fill={WHITE} stroke="none" />
        <path d={dots([[33.6, 3.4, 1.2], [14, 3.2, 0.9]])} fill={MAT.amber.base} stroke="none" />
      </Grow>
    </Diagonal>
  ),

  /** 冰杖：銀白杖身，杖頭三根冰晶柱，四周冒出霜花閃光。 */
  冰杖: (p) => (
    <Diagonal mid={26}>
      <Tube d="M24 18V48" width={5.8} color={MAT.silver.base} />
      <path d="M24 47L26.6 50.4L24 54L21.4 50.4Z" fill={p.split(MAT.ice)} />
      <path d="M15 8L19 11L21 19L18 20L14.4 13ZM33 8L29 11L27 19L30 20L33.6 13Z" fill={p.split(MAT.ice)} />
      <path d="M24 0L28 7L26.6 19H21.4L20 7Z" fill={p.split(MAT.ice)} />
      <Ink d="M24 2V17.6" width={1} color={MAT.ice.shade} />
      <rect x="19.6" y="18" width="8.8" height="4" rx="1.8" fill={p.split(MAT.silver)} />
      <path d={[sparkle(35, 17.6, 2.8), sparkle(12.6, 19.6, 2.2)].join('')} fill={WHITE} stroke="none" />
    </Diagonal>
  ),

  /** 法珠／星核：深藍星核內有一顆金色星芒，外繞一圈傾斜的金環與小衛星。 */
  '法珠／星核': (p) => (
    <>
      <g transform="rotate(-22 24 24)">
        <Tube d="M5 24A19 6.4 0 0 1 43 24" width={3} color={MAT.gold.base} />
      </g>
      <circle cx="24" cy="24" r="11" fill={p.ball(MAT.cosmos)} />
      <path d={sparkle(24, 24, 6.6)} fill={MAT.gold.light} strokeWidth={1.2} />
      <path d={dots([[18.6, 19.4, 0.9], [29.4, 29, 0.8], [28.6, 18.4, 0.7]])} fill={WHITE} stroke="none" />
      <g transform="rotate(-22 24 24)">
        <Tube d="M5 24A19 6.4 0 0 0 43 24" width={3} color={MAT.gold.base} />
        <circle cx="38.6" cy="28.1" r="2.4" fill={p.ball(MAT.amber)} strokeWidth={1.5} />
      </g>
      <path d={[sparkle(8.6, 9.6, 3), sparkle(40.4, 39.4, 2.4)].join('')} fill={MAT.gold.base} strokeWidth={1} />
    </>
  ),

  /** 法典：冰藍封面的厚書，銀色護角與書扣，封面中央一枚雪花紋。 */
  法典: (p) => (
    <>
      <rect x="13.4" y="8.6" width="24.6" height="34.4" rx="2.6" fill={MAT.frost.shade} />
      <rect x="12.4" y="7.4" width="23.6" height="33.6" rx="1.6" fill={MAT.paper.base} />
      <Ink d={strokes([[36.6, 12, 36.6, 38], [16, 41.6, 34, 41.6]])} width={0.9} color={MAT.paper.shade} />
      <rect x="9.6" y="5" width="24.4" height="34.4" rx="2.6" fill={p.split(MAT.frost)} />
      <rect x="9.6" y="5" width="4.6" height="34.4" rx="2" fill={MAT.frost.shade} />
      <path d="M27.6 5H31.4Q34 5 34 7.6V11.4ZM34 33V36.8Q34 39.4 31.4 39.4H27.6Z" fill={MAT.silver.base} strokeWidth={1.4} />
      <path d={strokes([[23.6, 15.6, 23.6, 28.8], [17.9, 18.9, 29.3, 25.5], [17.9, 25.5, 29.3, 18.9]])} stroke={INK} strokeWidth={3.2} />
      <path d={strokes([[23.6, 15.6, 23.6, 28.8], [17.9, 18.9, 29.3, 25.5], [17.9, 25.5, 29.3, 18.9]])} stroke={MAT.ice.light} strokeWidth={1.4} />
      <path d="M23.6 19.6L26.2 22.2L23.6 24.8L21 22.2Z" fill={MAT.ice.base} strokeWidth={1.2} />
      <rect x="31.6" y="19" width="5" height="6.4" rx="1.2" fill={p.split(MAT.silver)} />
    </>
  ),

  /** 權杖：銅鈴權杖，杖頭銅環裡吊著一只金鈴。 */
  權杖: (p) => (
    <Diagonal mid={25.2} angle={36}>
      <Tube d="M24 22V46" width={5.8} color={MAT.darkWood.base} />
      <circle cx="24" cy="47.4" r="2.6" fill={p.ball(MAT.copper)} />
      <Tube d={circle(24, 12, 8.6)} width={3.2} color={MAT.copper.base} />
      <Ink d="M24 3.6V7.6" width={1.6} />
      <path d="M19.6 15.6Q19.6 7.6 24 7.6Q28.4 7.6 28.4 15.6L30 17.6H18Z" fill={p.ball(MAT.gold)} />
      <circle cx="24" cy="18.8" r="1.5" fill={MAT.brass.shade} strokeWidth={1.2} />
      <rect x="20.4" y="20" width="7.2" height="4.2" rx="1.6" fill={p.split(MAT.copper)} />
    </Diagonal>
  ),

  /** 聖徽：八道光芒的金色太陽徽，白琺瑯盤面，下方垂兩條藍綬帶。 */
  聖徽: (p) => (
    <>
      <path d="M17.4 30L12.4 44L16.6 42.2L18.8 46.2L22.6 33ZM30.6 30L35.6 44L31.4 42.2L29.2 46.2L25.4 33Z" fill={p.split(MAT.blueCloth)} strokeWidth={1.6} />
      <Tube d={circle(24, 6.6, 2.6)} width={2.4} color={MAT.gold.base} />
      <path d={star(24, 23.4, 8, 15.4, 10.6)} fill={p.split(MAT.gold)} />
      <circle cx="24" cy="23.4" r="8.6" fill={p.ball(MAT.cloth)} />
      <path d={sparkle(24, 23.4, 6.2)} fill={MAT.gold.base} strokeWidth={1.2} />
      <circle cx="24" cy="23.4" r="1.6" fill={DETAIL.holyGlow} strokeWidth={1} />
    </>
  ),

  /** 聖杖：銀杖頂端一圈金色光環圍住星芒，兩側展開白色小翼。 */
  聖杖: (p) => (
    <Diagonal mid={20.8}>
      <Tube d="M24 20V46" width={5.6} color={MAT.silver.base} />
      <circle cx="24" cy="46.6" r="2.6" fill={p.ball(MAT.gold)} />
      <path d="M21 15.4Q11 17 7.6 7.4Q14 11 21.4 9.6ZM27 15.4Q37 17 40.4 7.4Q34 11 26.6 9.6Z" fill={p.split(MAT.cloth)} strokeWidth={1.7} />
      <Ink d={strokes([[19.6, 12.6, 13.4, 12.4], [28.4, 12.6, 34.6, 12.4]])} width={1} color={MAT.cloth.shade} />
      <Tube d={circle(24, 10.6, 7)} width={3} color={MAT.gold.base} />
      <path d={sparkle(24, 10.6, 5.2)} fill={MAT.gold.light} strokeWidth={1.2} />
      <rect x="20.6" y="18.4" width="6.8" height="4" rx="1.6" fill={p.split(MAT.gold)} />
      <circle cx="24" cy="25.4" r="1.8" fill={MAT.sapphire.base} strokeWidth={1.2} />
    </Diagonal>
  ),

  /** 聖徽／聖典：攤開的聖典放出光束，右頁印著太陽紋，垂一條藍色書籤。 */
  '聖徽／聖典': (p) => (
    <>
      <path d="M24 20L13.6 4.4L18.8 2.6ZM24 20L21.6 1H26.4ZM24 20L29.2 2.6L34.4 4.4Z" fill={DETAIL.holyGlow} stroke="none" opacity={0.9} />
      <path d="M26 38.6L26.6 46L28.6 43.8L31 45.6L29.8 37.8Z" fill={MAT.blueCloth.base} strokeWidth={1.5} />
      <path d="M5 15.6V38.4Q15 36 24 40.6Q33 36 43 38.4V15.6Q33 13.4 24 17.6Q15 13.4 5 15.6Z" fill={p.split(MAT.redLeather)} />
      <path d="M24 17.4Q16 12.4 7.4 13.6V35.6Q16 34.4 24 38.4Z" fill={MAT.paper.light} strokeWidth={1.7} />
      <path d="M24 17.4Q32 12.4 40.6 13.6V35.6Q32 34.4 24 38.4Z" fill={MAT.paper.base} strokeWidth={1.7} />
      <Ink d={strokes([[10.6, 19, 20.6, 20.6], [10.6, 23, 20.6, 24.6], [10.6, 27, 20.6, 28.6], [10.6, 31, 17.4, 32]])} width={1.4} color={MAT.paper.shade} />
      <path d={star(32.2, 25.6, 8, 6.4, 3.8)} fill={MAT.gold.base} strokeWidth={1.2} />
      <circle cx="32.2" cy="25.6" r="2.2" fill={MAT.gold.light} strokeWidth={1} />
    </>
  ),

  /** 念珠：木珠串成一圈，底端一顆翠玉主珠與紅色流蘇。 */
  念珠: (p) => (
    <g transform="translate(0 -1.6)">
      <Ink d={circle(24, 18.6, 12.4)} width={1.2} color={DETAIL.rope} />
      <path d={dots(BEADS.filter((_, i) => i % 2 === 0).map(([x, y]) => [x, y, 2.8] as const))} fill={MAT.wood.base} strokeWidth={1.4} />
      <path d={dots(BEADS.filter((_, i) => i % 2 === 1).map(([x, y]) => [x, y, 2.8] as const))} fill={MAT.darkWood.base} strokeWidth={1.4} />
      <path d={dots(BEADS.filter((_, i) => i % 2 === 0).map(([x, y]) => [x - 0.9, y - 0.9, 0.8] as const))} fill={MAT.wood.light} stroke="none" />
      <circle cx="24" cy="33.2" r="3.8" fill={p.ball(MAT.emerald)} />
      <rect x="21.6" y="36.6" width="4.8" height="3" rx="1" fill={MAT.gold.base} strokeWidth={1.4} />
      <path d="M21.8 39.4L19.6 46.4H28.4L26.2 39.4Z" fill={p.split(MAT.feather)} strokeWidth={1.6} />
      <Ink d={strokes([[22.8, 41, 22.2, 45.4], [25.2, 41, 25.8, 45.4]])} width={1} color={MAT.feather.shade} />
    </g>
  ),

  /** 戲杖：紅白條紋短杖，頂端金色月牙抱著一顆星，綁著紅紫緞帶與小鈴。 */
  戲杖: (p) => (
    <Diagonal mid={26} angle={38}>
      <Tube d="M22.4 20Q15.6 24.6 18.4 31.4" width={2.6} color={MAT.jester.base} />
      <Tube d="M25.6 20Q32 25.4 28.6 32" width={2.6} color={MAT.purple.base} />
      <path d={dots([[18.6, 32.8, 1.8], [28.4, 33.4, 1.8]])} fill={MAT.gold.base} strokeWidth={1.3} />
      <Tube d="M24 19V46" width={5.8} color={MAT.cloth.base} />
      <path d="M24 20.4V44.6" fill="none" stroke={MAT.jester.base} strokeWidth={3.8} strokeDasharray="2.6 2.6" />
      <circle cx="24" cy="47.4" r="2.4" fill={p.ball(MAT.gold)} />
      <rect x="20.6" y="16.6" width="6.8" height="3.8" rx="1.5" fill={p.split(MAT.gold)} />
      <Grow by={1.18} cy={11}>
        <path d="M28.6 2.6Q17.6 4 17.6 11Q17.8 18 28 18.6Q21.8 15.6 22 10.6Q22.2 5.6 28.6 2.6Z" fill={p.split(MAT.gold)} />
        <path d={star(27.6, 10.6, 5, 3.8, 1.7)} fill={MAT.gold.light} strokeWidth={1.2} />
      </Grow>
    </Diagonal>
  ),
};
