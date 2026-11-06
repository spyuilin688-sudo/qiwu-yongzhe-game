import type { ReactNode } from 'react';
import { circle, dots, gear, leaf, polar, polygon, rays, sparkle, star, strokes } from '../skills/geometry.ts';
import { suitPath, type Suit } from '../skills/suits.ts';
import { Diagonal, Grow, Ink, Shine, Tube, type EquipDesign, type Paint } from './kit.tsx';
import { DETAIL, INK, MAT } from './palette.ts';

const WHITE = DETAIL.white;

/** 拳頭正面（與 tools.tsx 成對拳套同一款輪廓）：上緣四個指節起伏。 */
const KNUCKLES =
  'M14 30V20Q14 16.6 16.6 16.6Q19 16.6 19.2 18.6Q19.6 16 22 16Q24.4 16 24.6 18.4Q25 16 27.4 16Q29.8 16 30 18.6Q30.4 16.6 32 16.8Q34 17.2 34 20V30Q34 34.6 29 34.6H19Q14 34.6 14 30Z';

/** 王冠牌組：四張牌以底部 (24, 38) 為軸展開，牌頂各露出一種花色（四象）。 */
const FAN_PIVOT = { x: 24, y: 38 } as const;
const FAN_CARDS: readonly { readonly angle: number; readonly suit: Suit }[] = [
  { angle: -30, suit: 'club' },
  { angle: -11, suit: 'diamond' },
  { angle: 11, suit: 'heart' },
  { angle: 30, suit: 'spade' },
];

/** 五脈念珠：五顆氣脈主珠落在正五邊形頂點（第一顆在正下方、掛流蘇，略大），每段之間串兩顆深色小珠。 */
const PULSE_RING = { cx: 24, cy: 19.6, r: 12.6 } as const;
const PULSE_BEAD_R = { main: 3.8, node: 3.4, small: 2.1 } as const;
const PULSE_ANGLES = [90, 162, 234, 306, 378] as const;
const PULSE_NODES = PULSE_ANGLES.map((deg) => polar(PULSE_RING.cx, PULSE_RING.cy, PULSE_RING.r, deg));
const PULSE_SMALL = PULSE_ANGLES.flatMap((deg) => [deg + 24, deg + 48]).map((deg) => polar(PULSE_RING.cx, PULSE_RING.cy, PULSE_RING.r, deg));

/**
 * 重甲拳套（崩岳拳甲的單隻）：黑鐵指節上豎起三根金刺、中間最高排成「山」字形，外翻金袖口嵌熔火寶石。
 * 以函式直接呼叫（而非 JSX 元件），漸層才會在 defs 輸出前登記完成。
 */
function armoredFist(paint: Paint, transform: string): ReactNode {
  return (
    <g transform={transform}>
      <path d="M15 33.6H33L35.2 41.6H12.8Z" fill={paint.split(MAT.gold)} />
      <circle cx="24" cy="37.6" r="2" fill={paint.ball(MAT.ember)} strokeWidth={1.3} />
      <path d="M14.8 18.4L17.2 11.8L19.8 17.8ZM20.8 17.4L24.6 7.8L28.4 17.4ZM29.4 17.8L32 11.8L34.2 18.4Z" fill={paint.split(MAT.gold)} strokeWidth={1.5} />
      <path d={KNUCKLES} fill={paint.split(MAT.darkIron)} />
      <Ink d={strokes([[19.3, 18.4, 19.3, 24.4], [24.6, 18.2, 24.6, 24.4], [30, 18.4, 30, 24.4]])} />
      <Ink d="M15 26.2H33.2" width={1.2} color={MAT.darkIron.light} />
      <path d="M14.2 26.4Q20.6 24.8 23.6 28.4Q21.8 32.2 15 31.6Z" fill={MAT.iron.base} strokeWidth={1.6} />
    </g>
  );
}

/**
 * 依「裝備基底 ID」的專屬圖（同種類的基底各自一張，避免同種裝備長得一樣）。
 * 未列在這裡的基底退回種類代表圖（registry.ts 的 equipDesignFor）。
 * 祭司系、小丑系、工匠系二、三階武器與副手：與種類代表圖換掉主色與剪影；三階一律加金飾、寶石或光芒。
 */
export const FAITH_TRICK_CRAFT_BASE_DESIGNS: Readonly<Record<string, EquipDesign>> = {
  /** 銀邊牌組：正面直放、整齊疊好的一落藍背牌，右下露出厚厚一層銀色牌緣，牌背銀框銀星；一張無花色白牌帶速度線從牌頂飛出右上；紙月牌組是三張紅牌背扇形展開。 */
  EQ055: (p) => (
    <>
      <g transform="translate(0.4 -1.6) rotate(-10 21 29)">
        <rect x="11.8" y="18.6" width="21" height="27" rx="2.6" fill={p.split(MAT.silver)} />
        <Ink d="M31 20.6V42.2Q31 43.8 29.4 43.8H13.8" width={1} color={MAT.iron.shade} />
        <rect x="8" y="14.6" width="21" height="27" rx="2.6" fill={p.split(MAT.blueCloth)} />
        <rect x="10.6" y="17.2" width="15.8" height="21.8" rx="1.4" fill="none" stroke={MAT.silver.light} strokeWidth={1.3} />
        <path d={sparkle(18.5, 28.1, 5.4)} fill={MAT.silver.base} strokeWidth={1.2} />
      </g>
      <Shine d="M26.4 5.2L20 8.2M24.4 10.6L19.6 12.8" color={MAT.silver.light} width={1.6} />
      <g transform="rotate(22 35.6 12.4)">
        <rect x="29.6" y="4" width="12" height="16.6" rx="1.8" fill={MAT.paper.base} />
        <rect x="31.6" y="6" width="8" height="12.6" rx="1" fill="none" stroke={MAT.silver.shade} strokeWidth={1.2} />
      </g>
    </>
  ),

  /** 王冠牌組：四張白牌左右對稱展開、牌頂各露一種花色，正中直立一張紫底金框的王牌印著紅寶王冠；紙月牌組是偏一側的三張紅牌背。 */
  EQ057: (p) => (
    <>
      {FAN_CARDS.map(({ angle, suit }) => (
        <g key={suit} transform={`rotate(${angle} ${FAN_PIVOT.x} ${FAN_PIVOT.y})`}>
          <rect x="17.6" y="8" width="12.8" height="24" rx="2" fill={p.split(MAT.paper)} />
          <path d={suitPath(suit, 24, 12.2, 2.4)} fill={suit === 'heart' || suit === 'diamond' ? DETAIL.cardRed : DETAIL.cardInk} stroke="none" />
        </g>
      ))}
      <rect x="16.4" y="16" width="15.2" height="24.4" rx="2.4" fill={p.split(MAT.purple)} />
      <rect x="18.4" y="18" width="11.2" height="20.4" rx="1.2" fill="none" stroke={MAT.gold.base} strokeWidth={1.1} />
      <path d="M20.2 33.2L19.8 25.6L22.4 28.4L24 23.4L25.6 28.4L28.2 25.6L27.8 33.2Z" fill={p.split(MAT.gold)} strokeWidth={1.5} />
      <Ink d="M20.4 30.6H27.6" width={1} color={MAT.gold.shade} />
      <circle cx="24" cy="31.9" r="1.2" fill={MAT.ruby.base} strokeWidth={0.9} />
      <path d={dots([[19.8, 25.2, 1], [24, 23, 1.1], [28.2, 25.2, 1]])} fill={MAT.gold.light} strokeWidth={0.8} />
      <path d={[sparkle(40.6, 8.6, 3), sparkle(7.6, 9.8, 2.4)].join('')} fill={MAT.gold.light} strokeWidth={1} />
    </>
  ),

  /** 黎明權杖：象牙杖身頂著金色地平橫桿，半輪琥珀朝陽與六道金芒從桿上升起，桿面嵌三枚聖印；銀鐘聖杖是金光環配白翼。 */
  EQ049: (p) => (
    <Diagonal mid={23}>
      <Tube d="M24 22V45" width={5.4} color={MAT.cloth.base} />
      <Shine d="M22.9 26V42" color={WHITE} width={1.1} />
      <rect x="20.8" y="33" width="6.4" height="3.2" rx="1.2" fill={MAT.gold.base} strokeWidth={1.5} />
      <path d="M21.2 45H26.8L24 50.6Z" fill={p.split(MAT.gold)} />
      <path d={rays(24, 17.6, 9.4, 17.4, [-158, -124, -90, -56, -22], 9)} fill={DETAIL.holyGlow} stroke="none" opacity={0.95} />
      <path d="M15.2 17.6A8.8 8.8 0 0 1 32.8 17.6Z" fill={p.ball(MAT.amber)} />
      <path d={sparkle(24, 12.6, 3.6)} fill={MAT.gold.light} stroke="none" />
      <rect x="13.4" y="17" width="21.2" height="4.6" rx="2.2" fill={p.split(MAT.gold)} />
      <path d={[suitPath('diamond', 18.4, 19.3, 1.6), suitPath('diamond', 24, 19.3, 1.6), suitPath('diamond', 29.6, 19.3, 1.6)].join('')} fill={DETAIL.holyGlow} strokeWidth={0.9} />
      <rect x="21" y="21.4" width="6" height="3.4" rx="1.2" fill={p.split(MAT.gold)} />
      <circle cx="24" cy="27.6" r="1.8" fill={MAT.ruby.base} strokeWidth={1.2} />
    </Diagonal>
  ),

  /** 審判聖典：闔上的白金厚典，金書脊、金護角與書扣，封面浮雕金色天秤，下垂紅書籤；晨禱聖徽是攤開放光的紅皮書。 */
  EQ050: (p) => (
    <g transform="rotate(-6 24 25)">
      <rect x="13.6" y="9" width="24.6" height="34" rx="2.2" fill={MAT.paper.base} />
      <Ink d={strokes([[36.8, 12.4, 36.8, 39.6], [16.4, 41.6, 34.6, 41.6]])} width={0.9} color={MAT.paper.shade} />
      <path d="M28 39.6L28.4 46.4L30.4 44.4L32.6 46L32.2 39.6Z" fill={MAT.ruby.base} strokeWidth={1.5} />
      <rect x="9.4" y="5.2" width="25.2" height="34.8" rx="2.6" fill={p.split(MAT.cloth)} />
      <rect x="9.4" y="5.2" width="5.2" height="34.8" rx="2" fill={p.split(MAT.gold)} />
      <path d="M28.4 5.2H32Q34.6 5.2 34.6 7.8V11.4ZM34.6 33.8V37.4Q34.6 40 32 40H28.4Z" fill={MAT.gold.base} strokeWidth={1.4} />
      <Tube d="M24.6 15.4V30M18 18.4H31.2" width={2.2} color={MAT.gold.base} />
      <Ink d="M18 18.4L16 24.4M18 18.4L20 24.4M31.2 18.4L29.2 24.4M31.2 18.4L33.2 24.4" width={0.9} color={MAT.gold.shade} />
      <path d="M15.2 24.2A2.8 2.8 0 0 0 20.8 24.2ZM28.4 24.2A2.8 2.8 0 0 0 34 24.2Z" fill={p.split(MAT.gold)} strokeWidth={1.3} />
      <path d="M20.8 32.2H28.4L27 29.6H22.2Z" fill={p.split(MAT.gold)} strokeWidth={1.4} />
      <circle cx="24.6" cy="14.2" r="1.8" fill={DETAIL.holyGlow} strokeWidth={1.1} />
      <rect x="32.6" y="19.6" width="5" height="6.4" rx="1.2" fill={p.split(MAT.gold)} />
      <circle cx="35.1" cy="22.8" r="1.2" fill={MAT.sapphire.base} strokeWidth={0.9} />
      <path d={sparkle(41.6, 7.6, 3)} fill={DETAIL.holyGlow} strokeWidth={1} />
    </g>
  ),

  /** 崩岳拳甲：一對黑鐵重甲拳套左右張開，每隻指節豎起三根中高側低的金刺（合起來像兩座山）、外翻金袖口嵌熔火寶石，上方迸出碎岩；修行拳套是前後一對皮拳套。 */
  EQ053: (p) => (
    <>
      <path d="M20.4 7.6L22.4 3.6L25.8 4.4L26.6 8L23.2 9.6ZM15.4 5.2L17.4 3.2L19 5.6L17 7.2ZM29.6 4.2L31.8 2.8L33.2 5.4L31 6.8Z" fill={p.split(MAT.rag)} strokeWidth={1.4} />
      {armoredFist(p, 'translate(-9.4 1) rotate(-9 24 28)')}
      {armoredFist(p, 'translate(9.4 2) rotate(9 24 28)')}
    </>
  ),

  /**
   * 五脈念珠：夜色小珠串成一圈，五顆熔火氣脈主珠以五邊形光脈相連，底端垂紫流蘇；木珠念串是深淺木珠配翠玉主珠。
   * 主珠刻意用五邊形相連而非五芒星：圓圈內接五芒星會被看成五芒星陣，與念珠的意象衝突。
   */
  EQ054: (p) => (
    <>
      <Ink d={circle(PULSE_RING.cx, PULSE_RING.cy, PULSE_RING.r)} width={1.2} color={DETAIL.rope} />
      <Tube d={polygon(PULSE_RING.cx, PULSE_RING.cy, PULSE_RING.r, PULSE_ANGLES.length, PULSE_ANGLES[0])} width={1.6} core={1.2} color={MAT.amber.light} />
      <path d={dots(PULSE_SMALL.map(([x, y]) => [x, y, PULSE_BEAD_R.small] as const))} fill={MAT.night.base} strokeWidth={1.3} />
      {PULSE_NODES.map(([x, y], index) => (
        <circle key={PULSE_ANGLES[index]} cx={x} cy={y} r={index === 0 ? PULSE_BEAD_R.main : PULSE_BEAD_R.node} fill={p.ball(MAT.ember)} strokeWidth={1.5} />
      ))}
      <path d={dots(PULSE_NODES.map(([x, y]) => [x - 1, y - 1, 0.8] as const))} fill={MAT.ember.light} stroke="none" />
      <rect x="21.6" y="35.6" width="4.8" height="3" rx="1" fill={MAT.gold.base} strokeWidth={1.4} />
      <path d="M21.8 38.4L19.6 45.6H28.4L26.2 38.4Z" fill={p.split(MAT.purple)} strokeWidth={1.6} />
      <Ink d={strokes([[22.8, 40, 22.2, 44.6], [25.2, 40, 25.8, 44.6]])} width={1} color={MAT.purple.shade} />
    </>
  ),

  /** 命運牌匣：瘦長直立的夜藍牌匣，金護角，正面金色命運之輪嵌四種花色，匣口升起一張金星命運牌；四色牌盒是紫色立體盒露出兩張牌。 */
  EQ058: (p) => (
    <>
      <rect x="15" y="12.8" width="18" height="3" rx="1" fill={DETAIL.hollow} />
      <g transform="rotate(12 24 13)">
        <rect x="18" y="3.6" width="12" height="15.6" rx="1.8" fill={MAT.paper.base} />
        <path d={star(24, 9.2, 5, 3.6, 1.6)} fill={MAT.gold.base} strokeWidth={1} />
      </g>
      <rect x="13" y="14.4" width="22" height="29.6" rx="2.4" fill={p.split(MAT.night)} />
      <Shine d="M15.8 18V39" color={MAT.night.light} />
      <path d="M13 19.4V16.8Q13 14.4 15.4 14.4H18ZM30 14.4H32.6Q35 14.4 35 16.8V19.4ZM35 39V41.6Q35 44 32.6 44H30ZM18 44H15.4Q13 44 13 41.6V39Z" fill={MAT.gold.base} strokeWidth={1.3} />
      <Tube d={circle(24, 28.6, 7.4)} width={2.6} color={MAT.gold.base} />
      <path d={[suitPath('heart', 24, 24.4, 1.9), suitPath('diamond', 24, 32.8, 1.9)].join('')} fill={DETAIL.cardRed} strokeWidth={0.8} />
      <path d={[suitPath('spade', 28.2, 28.6, 1.9), suitPath('club', 19.8, 28.6, 1.9)].join('')} fill={MAT.cloth.base} strokeWidth={0.8} />
      <circle cx="24" cy="28.6" r="1.5" fill={MAT.amethyst.base} strokeWidth={1} />
      <path d={[sparkle(37.4, 7.6, 2.8), sparkle(10.4, 9.2, 2.2)].join('')} fill={MAT.gold.light} strokeWidth={1} />
    </>
  ),

  /** 千面戲杖：紫金螺紋杖身，杖頭是正面朝前的小丑頭：紅紫雙尖帽掛金鈴、臉一半白一半夜色、下圍白色尖領，四周灑禮炮彩紙；月紋短杖是紅白條紋頂金月牙。 */
  EQ061: (p) => (
    <>
      <Diagonal mid={22.2} angle={40}>
        <Tube d="M24 22V45" width={5.4} color={MAT.purple.base} />
        <path d="M24 24.4V43.4" fill="none" stroke={MAT.gold.base} strokeWidth={3.4} strokeDasharray="1.8 3.2" />
        <circle cx="24" cy="46.4" r="2.4" fill={p.ball(MAT.gold)} />
        <g transform="rotate(-40 24 16)">
          <Grow by={1.14} cy={16}>
          <path d="M15.6 19.4L17.4 24.4L20.4 21.8L22.4 26L24 22.6L25.6 26L27.6 21.8L30.6 24.4L32.4 19.4Z" fill={p.split(MAT.cloth)} strokeWidth={1.6} />
          <path d={dots([[17.4, 24.4, 1.1], [24, 23.4, 1.1], [30.6, 24.4, 1.1]])} fill={MAT.gold.base} strokeWidth={0.9} />
          <path d="M19.4 11.6Q14 11.4 11.6 5.6Q17.8 5 22.6 9Z" fill={p.split(MAT.jester)} strokeWidth={1.7} />
          <path d="M28.6 11.6Q34 11.4 36.4 5.6Q30.2 5 25.4 9Z" fill={p.split(MAT.purple)} strokeWidth={1.7} />
          <path d={dots([[11.6, 5.8, 2.1], [36.4, 5.8, 2.1]])} fill={MAT.gold.base} strokeWidth={1.3} />
          <circle cx="24" cy="16" r="6.6" fill={p.ball(MAT.cloth)} />
          <path d="M24 9.4A6.6 6.6 0 0 1 24 22.6Z" fill={MAT.night.base} stroke="none" />
          <circle cx="24" cy="16" r="6.6" fill="none" />
          <Tube d="M17.8 12.6Q24 9.2 30.2 12.6" width={2.2} color={MAT.gold.base} />
          <path d="M19.8 16Q21 14.6 22.4 16" fill="none" stroke={INK} strokeWidth={1.3} />
          <path d="M25.6 16Q27 14.6 28.2 16" fill="none" stroke={MAT.gold.light} strokeWidth={1.3} />
          <path d="M19.8 18Q24 22 28.2 18Q24 19.4 19.8 18Z" fill={DETAIL.cardRed} strokeWidth={1.1} />
          </Grow>
        </g>
      </Diagonal>
      <path d={dots([[9.4, 21.4, 1.4], [41.6, 33.4, 1.3]])} fill={MAT.sapphire.base} strokeWidth={0.9} />
      <path d={[sparkle(41.8, 26.4, 2.4), sparkle(19.4, 34.6, 2)].join('')} fill={MAT.gold.light} strokeWidth={1} />
    </>
  ),

  /** 鏡界線輪：正面朝前的銀色線輪，鏤空輪盤透出纏滿的紫線、金輪緣、鏡面輪心，金搖柄伸出輪緣外接紅寶握球（一眼看出是可轉的線輪），右上方疊一個虛線幻影輪，線頭連著一片菱形鏡片；木偶線軸是直立木線軸。 */
  EQ062: (p) => (
    <g transform="translate(0.4 2.6)">
      <path d={circle(29.4, 16.4, 12.6)} fill="none" stroke={MAT.amethyst.light} strokeWidth={2.4} strokeDasharray="3.4 2.6" opacity={0.8} />
      <Tube d="M10.6 18.4Q4.4 15.6 6.2 9.4" width={1.8} core={1.4} color={MAT.amethyst.light} />
      <path d={suitPath('diamond', 6.4, 6.2, 3.6)} fill={p.split(MAT.glass)} strokeWidth={1.4} />
      <circle cx="22" cy="23.4" r="12" fill={p.ball(MAT.amethyst)} />
      <path
        d={[circle(22, 23.4, 12.6), ...[30, 90, 150, 210, 270, 330].map((deg) => circle(...polar(22, 23.4, 7.6, deg), 2.4))].join('')}
        fill={p.split(MAT.silver)}
        fillRule="evenodd"
        strokeWidth={1.4}
      />
      <Tube d={circle(22, 23.4, 12.6)} width={2.6} color={MAT.gold.base} />
      <Tube d="M22 23.4L33 34.4" width={3} color={MAT.gold.base} />
      <circle cx="34.4" cy="35.8" r="3" fill={p.ball(MAT.ruby)} strokeWidth={1.6} />
      <circle cx="22" cy="23.4" r="3.8" fill={p.ball(MAT.glass)} strokeWidth={1.6} />
      <Shine d="M20.4 23.8L22.6 21.6" color={WHITE} width={1.2} />
      <path d={sparkle(41.4, 29.6, 2.8)} fill={WHITE} stroke="none" />
    </g>
  ),

  /** 熔心巨鎚：八角黑鐵鎚頭中央開窗露出熔紅的鎚心，熔岩裂紋爬滿鎚面、兩端紅銅鎚面，鐵柄配皮握把；黑鐵戰鎚是方頭帶尖刺與金箍。 */
  EQ065: (p) => (
    <>
      <Grow by={0.94}>
      <Diagonal mid={20.4}>
        <Tube d="M24 18V43" width={5.2} color={MAT.darkIron.base} />
        <rect x="20.9" y="32.4" width="6.2" height="10" rx="2" fill={MAT.leather.base} />
        <Ink d={strokes([[21.2, 35.6, 26.8, 35.6], [21.2, 38.8, 26.8, 38.8]])} width={1} />
        <circle cx="24" cy="45.4" r="2.8" fill={p.ball(MAT.gold)} />
        <rect x="20.4" y="18.4" width="7.2" height="4" rx="1.4" fill={p.split(MAT.gold)} />
        <path d="M15 3H33L36.4 6.4V15.2L33 18.6H15L11.6 15.2V6.4Z" fill={p.split(MAT.darkIron)} />
        <rect x="8" y="3.8" width="4.8" height="14" rx="1.6" fill={p.split(MAT.copper)} />
        <rect x="35.2" y="3.8" width="4.8" height="14" rx="1.6" fill={p.split(MAT.copper)} />
        <Ink d="M18.6 7.2L15.4 4.6M18.4 14.6L14.6 17M29.4 7.2L32.8 4.6M29.6 14.6L33.4 17M15.6 10.8H13.4M32.6 10.8H34.6" width={1.3} color={MAT.ember.base} />
        <rect x="18" y="5.4" width="12" height="10.8" rx="3" fill={p.ball(MAT.ember)} />
        <path d="M24 7.6Q27.4 10.2 26.2 13Q24 14.8 21.8 13Q20.6 10.2 24 7.6Z" fill={MAT.ember.light} strokeWidth={1.1} />
      </Diagonal>
      </Grow>
      <path d={dots([[42, 20.4, 1.2], [8.4, 31.6, 1], [33.4, 4.6, 0.9]])} fill={MAT.ember.base} stroke="none" />
    </>
  ),

  /** 日輪風箱：微微斜向右上吹的金板風箱，上板鑲一大輪火色光芒的紅寶日輪（小尺寸下仍是醒目的紅日），金握球、噴嘴噴出火舌，下板深色木、紅皮摺囊；火鉗工具匣（種類代表圖）是平放的木板風箱、上板只刻小日輪。 */
  EQ066: (p) => (
    <Grow by={0.88} cy={25} dx={0.6} dy={-1.6}>
      <g transform="rotate(-16 24 25)">
        <Tube d="M8.4 9.4L5.4 7M8.4 39.4L5.4 41.8" width={4} color={MAT.darkWood.base} />
        <path d={dots([[5, 6.6, 2.5], [5, 42.2, 2.5]])} fill={p.ball(MAT.gold)} strokeWidth={1.5} />
        <path d={leaf(45.4, 25.4, 6.6, 4.2, 0)} fill={p.fall(MAT.ember)} />
        <path d={leaf(45, 25.4, 3.2, 1.8, 0)} fill={MAT.ember.light} stroke="none" />
        <path d="M35 22.6L44.6 24Q46 25.4 44.6 26.8L35 28.2Z" fill={p.fall(MAT.gold)} />
        <path d="M36 25L10.8 18L8.2 21L10.8 24L8.2 27L10.8 30L8.2 33L10.8 35.4L36 26.6Z" fill={p.fall(MAT.ruby)} />
        <Ink d="M34 25.8L10.8 24M34 25.8L10.8 30" width={1.2} color={MAT.ruby.shade} />
        <path d="M36 27.4L11 33.6Q6 35.2 6.6 38.8Q7.8 42 12.6 40.8L36 30.4Z" fill={p.fall(MAT.darkWood)} />
        <path d="M36 23L14.4 7.2Q8.4 4.4 6.6 9.8Q5.4 15.6 10.8 18.6L36 26.2Z" fill={p.split(MAT.gold)} />
        <path d={star(16, 12.8, 12, 9.4, 6.4)} fill={p.split(MAT.ember)} strokeWidth={1.4} />
        <circle cx="16" cy="12.8" r="4.6" fill={p.ball(MAT.ruby)} strokeWidth={1.5} />
        <circle cx="14.6" cy="11.4" r="1.1" fill={MAT.ruby.light} stroke="none" />
        <rect x="33.2" y="22" width="3.8" height="9" rx="1.2" fill={MAT.gold.shade} strokeWidth={1.4} />
      </g>
    </Grow>
  ),

  /** 雷鳴機砲：三管並排的鋼製機砲，後膛黑鐵機匣嵌藍光線圈與金色閃電徽，砲管上方竄著一道電弧；銅管手砲是單管黃銅喇叭口。 */
  EQ069: (p) => (
    <g transform="translate(-1.6 0.2) rotate(-14 24 26)">
      <path d="M10 31.4Q8.4 38.4 11.6 42.6H17.6Q16 37 18.6 31.4Z" fill={p.split(MAT.darkWood)} />
      <rect x="18" y="16.4" width="22" height="4.4" rx="1.4" fill={p.fall(MAT.steel)} />
      <rect x="18" y="21.8" width="22" height="4.4" rx="1.4" fill={p.fall(MAT.steel)} />
      <rect x="18" y="27.2" width="22" height="4.4" rx="1.4" fill={p.fall(MAT.steel)} />
      <rect x="27.4" y="14.6" width="3.6" height="18.8" rx="1.2" fill={p.fall(MAT.gold)} />
      <rect x="38.4" y="14.8" width="4.4" height="18.4" rx="1.6" fill={p.fall(MAT.darkIron)} />
      <path d={dots([[40.6, 18.6, 1], [40.6, 24, 1], [40.6, 29.4, 1]])} fill={DETAIL.hollow} strokeWidth={0.9} />
      <rect x="7.6" y="14" width="12.4" height="20" rx="3" fill={p.fall(MAT.darkIron)} />
      <circle cx="13.8" cy="24" r="4.4" fill={p.ball(MAT.mech)} strokeWidth={1.6} />
      <path d="M14.8 19.8L11.8 24.6H14L12.6 28.6L16 23.2H13.8Z" fill={MAT.gold.light} strokeWidth={0.9} />
      <Tube d="M21.4 12.6L24.4 9.6L27 12.4L30.4 9.4L33 12.2L36.4 9.6L38.6 12" width={1.6} core={1.2} color={MAT.mech.light} />
      <path d={sparkle(43.6, 11.4, 3)} fill={MAT.mech.light} strokeWidth={1} />
    </g>
  ),

  /** 零式動力核：直立的玻璃動力膠囊貫穿一枚銀鋼齒輪，膠囊內藍光能量柱浮出「零」字光環，上下金色端蓋；發條機芯是黃銅、紅銅兩枚齒輪咬合圍著圓形核心。 */
  EQ070: (p) => (
    <>
      <path d={gear(24, 24.6, 17.4, 14, 10, 18)} fill={p.split(MAT.silver)} />
      <circle cx="24" cy="24.6" r="10.4" fill={MAT.silver.shade} strokeWidth={1.6} />
      <path d={dots([[15.4, 24.6, 1.2], [32.6, 24.6, 1.2]])} fill={MAT.gold.light} strokeWidth={0.8} />
      <rect x="18.4" y="8.4" width="11.2" height="32.4" rx="3" fill={p.split(MAT.glass)} />
      <rect x="20.4" y="10.6" width="7.2" height="28" rx="2.4" fill={p.split(MAT.mech)} stroke="none" />
      <ellipse cx="24" cy="24.6" rx="2.4" ry="4.4" fill="none" stroke={WHITE} strokeWidth={1.6} />
      <Shine d="M21.8 12.6V18.4" color={WHITE} width={1.2} />
      <rect x="16.8" y="4.4" width="14.4" height="5.6" rx="2" fill={p.split(MAT.gold)} />
      <rect x="16.8" y="39.2" width="14.4" height="5.6" rx="2" fill={p.split(MAT.gold)} />
      <path d={[sparkle(40.6, 8.4, 3), sparkle(7.6, 40.4, 2.4)].join('')} fill={MAT.mech.light} strokeWidth={1} />
    </>
  ),
};
