import type { ReactNode } from 'react';
import { circle, crescent, dots, gear, star, strokes } from '../skills/geometry.ts';
import { suitPath } from '../skills/suits.ts';
import { Diagonal, Grow, Ink, Shine, Tube, type EquipDesign, type Paint } from './kit.tsx';
import { DETAIL, MAT, type Tone } from './palette.ts';

const BOTTLE = 'M20 7H28V14.4Q37 17.6 37 28.4Q37 41 24 41Q11 41 11 28.4Q11 17.6 20 14.4Z';
const MASK = 'M10 17Q10 8 24 8Q38 8 38 17Q38 31 24 38.4Q10 31 10 17Z';
/** 拳頭正面：上緣四個指節起伏，比方塊更像握緊的拳。 */
const KNUCKLES =
  'M14 30V20Q14 16.6 16.6 16.6Q19 16.6 19.2 18.6Q19.6 16 22 16Q24.4 16 24.6 18.4Q25 16 27.4 16Q29.8 16 30 18.6Q30.4 16.6 32 16.8Q34 17.2 34 20V30Q34 34.6 29 34.6H19Q14 34.6 14 30Z';

/**
 * 正面拳套：指節鉚釘、四指分線、拇指橫過掌前，袖口纏布。dx／dy 用來排出前後一對。
 * 以函式直接呼叫（而非 JSX 元件），漸層才會在 defs 輸出前登記完成。
 */
function fist(paint: Paint, dx: number, dy: number, glove: Tone, cuff: Tone): ReactNode {
  return (
    <g transform={`translate(${dx} ${dy})`}>
      <rect x="15.4" y="33.6" width="17.2" height="7.6" rx="2" fill={paint.split(cuff)} />
      <Ink d={strokes([[16, 36.2, 32, 36.2], [16, 38.8, 32, 38.8]])} width={1} color={cuff.shade} />
      <path d={KNUCKLES} fill={paint.split(glove)} />
      <Ink d={strokes([[19.3, 18.4, 19.3, 24.4], [24.6, 18.2, 24.6, 24.4], [30, 18.4, 30, 24.4]])} />
      <path d={dots([[16.6, 19.4, 1.2], [21.9, 18.8, 1.2], [27.3, 18.8, 1.2], [32, 19.6, 1.1]])} fill={MAT.brass.light} strokeWidth={0.9} />
      <path d="M14.2 26.4Q20.6 24.8 23.6 28.4Q21.8 32.2 15 31.6Z" fill={glove.base} strokeWidth={1.6} />
    </g>
  );
}

/** 盾、瓶、拳套、牌、面具、線軸與工匠道具：多為正面擺放，不旋轉，讓輪廓最飽滿。 */
export const TOOL_DESIGNS: Readonly<Record<string, EquipDesign>> = {
  /** 戰盾：黃銅包邊的鳶形盾，盾心是一張圓臉銅獅浮雕。 */
  戰盾: (p) => (
    <>
      <path d="M24 4Q32 7.5 40.5 7.5Q42 27 33.5 36.5Q29 41.5 24 44.5Q19 41.5 14.5 36.5Q6 27 7.5 7.5Q16 7.5 24 4Z" fill={p.split(MAT.brass)} />
      <path d="M24 8Q31 10.8 37 11Q37.6 26 31 33.8Q27.5 37.8 24 40Q20.5 37.8 17 33.8Q10.4 26 11 11Q17 10.8 24 8Z" fill={p.split(MAT.blueCloth)} strokeWidth={1.6} />
      <Shine d="M13.4 14Q13.4 23.6 17 30" color={MAT.blueCloth.light} />
      <path d={star(24, 22.4, 10, 9.6, 6.6)} fill={p.split(MAT.copper)} strokeWidth={1.4} />
      <circle cx="24" cy="22.4" r="5.4" fill={p.ball(MAT.brass)} strokeWidth={1.5} />
      <path d={dots([[22, 21.4, 0.8], [26, 21.4, 0.8]])} fill={DETAIL.hollow} stroke="none" />
      <Ink d="M22.4 24.4Q24 25.6 25.6 24.4" width={1} />
      <path d={dots([[24, 6.4, 1], [9.8, 10, 1], [38.2, 10, 1], [24, 42.2, 1]])} fill={MAT.brass.light} strokeWidth={0.8} />
    </>
  ),

  /** 毒瓶／毒囊：圓底玻璃瓶裝著冒泡的毒綠藥液，軟木塞、麻繩綁口。 */
  '毒瓶／毒囊': (p) => (
    <>
      <path d={BOTTLE} fill={MAT.glass.base} stroke="none" />
      <path d="M11.3 27.6Q17.6 24.6 24 27.6Q30.4 30.6 36.7 27.6Q36.6 40.6 24 40.6Q11.4 40.6 11.3 27.6Z" fill={p.ball(MAT.venom)} stroke="none" />
      <Ink d="M11.6 27.6Q17.6 24.6 24 27.6Q30.4 30.6 36.4 27.6" color={MAT.venom.shade} />
      <path d={dots([[19, 32, 1.8], [27.6, 35, 1.2], [22.4, 37.2, 1], [29.6, 30.6, 0.9]])} fill={MAT.venom.light} stroke="none" />
      <path d={BOTTLE} fill="none" />
      <Shine d="M15.4 21.4Q13.6 25 14.4 29" color={DETAIL.white} width={1.8} />
      <rect x="18.6" y="12" width="10.8" height="3" rx="1.2" fill={DETAIL.rope} strokeWidth={1.4} />
      <rect x="19.2" y="3" width="9.6" height="5.6" rx="1.6" fill={p.split(MAT.wood)} />
    </>
  ),

  /** 成對拳套：一前一後兩隻拳套，指節嵌黃銅鉚釘，後方那隻用暗色表現景深。 */
  成對拳套: (p) => (
    <>
      {fist(p, -5, -10, MAT.leather, MAT.rag)}
      {fist(p, 5, 4, MAT.redLeather, MAT.cloth)}
    </>
  ),

  /** 牌組：三張牌扇形展開，兩張紅色牌背、最前面一張大紅心。 */
  牌組: (p) => (
    <>
      <g transform="rotate(-20 17 23)">
        <rect x="8.4" y="11" width="17" height="24" rx="2.6" fill={p.split(MAT.cardBack)} />
        <rect x="10.6" y="13.2" width="12.6" height="19.6" rx="1.4" fill="none" stroke={MAT.gold.light} strokeWidth={1} />
      </g>
      <g transform="rotate(-4 23 21)">
        <rect x="14.8" y="9" width="17" height="24" rx="2.6" fill={p.split(MAT.cardBack)} />
        <rect x="17" y="11.2" width="12.6" height="19.6" rx="1.4" fill="none" stroke={MAT.gold.light} strokeWidth={1} />
        <path d={suitPath('diamond', 23.3, 21, 3.6)} fill={MAT.gold.light} strokeWidth={1} />
      </g>
      <g transform="rotate(14 30 25)">
        <rect x="21" y="12.4" width="17.4" height="24.6" rx="2.6" fill={MAT.paper.base} />
        <path d={suitPath('heart', 29.7, 24.8, 5)} fill={DETAIL.cardRed} strokeWidth={1.4} />
        <path d={[suitPath('heart', 24.4, 16.4, 1.6), suitPath('heart', 35, 33, 1.6, 180)].join('')} fill={DETAIL.cardRed} stroke="none" />
      </g>
    </>
  ),

  /** 面具：左白右紅的笑臉面具，彎月眼、大笑嘴，臉頰點綴金色菱形。 */
  面具: (p) => (
    <>
      <Tube d="M10.4 18.6Q4.4 22 6.6 30.4" width={2.6} color={MAT.jester.base} />
      <Tube d="M37.6 18.6Q43.6 22 41.4 30.4" width={2.6} color={MAT.purple.base} />
      <path d={MASK} fill={p.ball(MAT.cloth)} />
      <path d="M24 8Q38 8 38 17Q38 31 24 38.4Z" fill={MAT.jester.base} stroke="none" />
      <path d={MASK} fill="none" />
      <path d={[crescent(14.4, 21, 21, 21, 3, 1.8), crescent(27, 21, 33.6, 21, 3, 1.8), crescent(16.4, 27, 31.6, 27, -4.6, 2.8)].join('')} fill={DETAIL.cardInk} strokeWidth={1} />
      <path d={suitPath('diamond', 15.2, 30, 2.2)} fill={MAT.gold.base} strokeWidth={1} />
      <path d={star(32.8, 30.4, 5, 2.4, 1.1)} fill={MAT.gold.base} strokeWidth={1} />
    </>
  ),

  /** 牌盒：紫色立體牌盒，盒口露出兩張牌，正面金框裡嵌著黑桃。 */
  牌盒: (p) => (
    <>
      <path d="M10 17L15 12.6H39L34 17Z" fill={DETAIL.hollow} />
      <rect x="14.6" y="5.6" width="11.6" height="13" rx="1.8" transform="rotate(-10 20.4 12)" fill={MAT.paper.base} />
      <path d={suitPath('heart', 19.6, 9.6, 2)} fill={DETAIL.cardRed} stroke="none" />
      <rect x="21.6" y="4.4" width="11.6" height="13" rx="1.8" transform="rotate(9 27.4 11)" fill={p.split(MAT.cardBack)} />
      <path d="M34.4 17.4L39.4 13V38.6L34.4 42.6Z" fill={MAT.purple.shade} />
      <rect x="9" y="16.6" width="25.4" height="26" rx="2.4" fill={p.split(MAT.purple)} />
      <path d="M21.7 21.4L28.6 29.6L21.7 37.8L14.8 29.6Z" fill={p.split(MAT.gold)} strokeWidth={1.6} />
      <path d={suitPath('spade', 21.7, 29.6, 3.4)} fill={DETAIL.cardInk} stroke="none" />
    </>
  ),

  /** 線軸／線輪：木製線軸纏滿紫線，鬆脫的線頭連到一支木偶十字操縱桿。 */
  '線軸／線輪': (p) => (
    <g transform="translate(-1.2 -2.2)">
      <ellipse cx="24" cy="36.4" rx="12" ry="4.6" fill={MAT.wood.shade} />
      <ellipse cx="24" cy="34.4" rx="12" ry="4.6" fill={MAT.wood.base} />
      <path d="M15.4 10V34.4Q24 37.6 32.6 34.4V10Z" fill={p.split(MAT.purple)} />
      <Ink d="M15.6 16Q24 19 32.4 16M15.6 22Q24 25 32.4 22M15.6 28Q24 31 32.4 28" width={1.1} color={MAT.purple.shade} />
      <ellipse cx="24" cy="11.4" rx="12" ry="4.6" fill={MAT.wood.shade} />
      <ellipse cx="24" cy="9.4" rx="12" ry="4.6" fill={p.split(MAT.wood)} />
      <ellipse cx="24" cy="9.4" rx="3" ry="1.2" fill={DETAIL.hollow} strokeWidth={1} />
      <Tube d="M32.6 21Q42 23.6 39.4 31.6Q37.4 37 40 41" width={1.8} core={1.4} color={MAT.purple.light} />
      <Tube d="M35.2 42.6H44.4M39.8 38.8V46.4" width={3} color={MAT.wood.base} />
    </g>
  ),

  /** 工鎚：木柄銅頭的羊角鎚，一面平頭、一面彎爪。 */
  工鎚: (p) => (
    <Diagonal mid={23.2}>
      <Tube d="M24 15V49" width={5} color={MAT.wood.base} />
      <rect x="21" y="39" width="6" height="9" rx="1.8" fill={MAT.leather.base} />
      <Ink d={strokes([[21.3, 42, 26.7, 42], [21.3, 45, 26.7, 45]])} width={1} />
      <path d="M17.4 7.4Q11.6 5.6 7.6 9Q8.2 13 10.8 16.2Q12 12 17.4 12.6Z" fill={p.split(MAT.copper)} />
      <rect x="16.6" y="7" width="13.4" height="9" fill={p.split(MAT.copper)} />
      <rect x="29" y="4.6" width="8" height="13.8" rx="2" fill={p.split(MAT.copper)} />
      <Shine d="M31.2 7.4V15.6" color={MAT.copper.light} />
      <Ink d="M10.4 11.4L14 11.2" width={1.1} />
    </Diagonal>
  ),

  /**
   * 工具匣：無蓋的黃銅提籃式工具箱，木製提桿橫跨兩端山形側板，扳手、螺絲起子與鎚柄從箱口冒出。
   * 刻意不畫箱蓋與正面鎖扣：有蓋有鎖的箱子會被讀成寶箱，與「不使用寶箱外型」的規則衝突。
   */
  工具匣: (p) => (
    <>
      <path d="M7.6 20.4H40.4V24H7.6Z" fill={DETAIL.hollow} />
      <Tube d="M18.6 22L13.4 9.4" width={3.4} color={MAT.iron.base} />
      <path d="M9.4 5.4Q8.6 10.4 13.2 11.2Q17.6 10.6 16.8 5.6L14.6 7.6H11.6Z" fill={p.split(MAT.iron)} strokeWidth={1.6} />
      <Tube d="M25.4 22V12" width={4.2} color={MAT.wood.base} />
      <rect x="21" y="7.2" width="9.2" height="5.6" rx="1.4" fill={p.split(MAT.darkIron)} />
      <Tube d="M33 22L35.6 15" width={1.8} color={MAT.iron.base} />
      <Tube d="M35.4 15.6L38.2 8.2" width={4.6} color={MAT.redLeather.base} />
      <path d="M5 42.6V22L9.6 15.4L14.2 22V42.6Z" fill={p.split(MAT.wood)} />
      <path d="M33.8 42.6V22L38.4 15.4L43 22V42.6Z" fill={p.split(MAT.wood)} />
      <Tube d="M9.6 19.4H38.4" width={3.6} color={MAT.darkWood.base} />
      <path d="M6.6 24.6H41.4L39.6 42.6H8.4Z" fill={p.split(MAT.brass)} />
      <Shine d="M10.4 28V39" color={MAT.brass.light} width={1.6} />
      <path d={dots([[11.4, 28.4, 1.1], [36.6, 28.4, 1.1], [11.8, 38.6, 1.1], [36.2, 38.6, 1.1]])} fill={MAT.brass.light} strokeWidth={0.8} />
    </>
  ),

  /** 戰鎚：黑鐵雙面巨鎚，黃銅箍、頂端尖刺，鎚心嵌著一顆熔火核心。 */
  戰鎚: (p) => (
    <Diagonal mid={21} angle={42}>
      <Tube d="M24 18V43" width={5.4} color={MAT.darkWood.base} />
      <rect x="20.8" y="33" width="6.4" height="10" rx="2" fill={MAT.redLeather.base} />
      <Ink d={strokes([[21.1, 36.4, 26.9, 36.4], [21.1, 39.6, 26.9, 39.6]])} width={1} />
      <path d="M21.6 43.6H26.4L24 48.4Z" fill={p.split(MAT.iron)} />
      <path d="M21 6.4L24 0.6L27 6.4Z" fill={p.split(MAT.iron)} />
      <rect x="12.6" y="6" width="22.8" height="13.4" rx="3" fill={p.split(MAT.darkIron)} />
      <rect x="9.6" y="4.8" width="4.6" height="15.8" rx="1.6" fill={p.split(MAT.iron)} />
      <rect x="33.8" y="4.8" width="4.6" height="15.8" rx="1.6" fill={p.split(MAT.iron)} />
      <rect x="17.6" y="5.4" width="2.8" height="14.6" rx="1" fill={MAT.brass.base} strokeWidth={1.4} />
      <rect x="27.6" y="5.4" width="2.8" height="14.6" rx="1" fill={MAT.brass.base} strokeWidth={1.4} />
      <path d="M24 8.6L27 12.7L24 16.8L21 12.7Z" fill={p.ball(MAT.ember)} strokeWidth={1.4} />
    </Diagonal>
  ),

  /**
   * 工具匣／風箱：鍛爐手風箱的側面：上下兩片木板張開成 V 字，中間是摺紋從噴嘴放射出去的皮革，
   * 黃銅噴嘴朝右（與角色朝向一致），寬端伸出兩支握把，上板刻日輪。
   * 只畫正面水滴形木板時縮小後像甲蟲或魯特琴，張開的 V 字與摺紋才是風箱的辨識點。
   */
  '工具匣／風箱': (p) => (
    <Grow by={0.94} cy={25}>
      <Tube d="M8 9L3.4 5.2M8 39.6L3.4 43.4" width={3.6} color={MAT.wood.base} />
      <path d={dots([[3, 4.8, 2.4], [3, 43.8, 2.4]])} fill={MAT.darkWood.base} strokeWidth={1.5} />
      <path d="M35 22.6L44.6 24Q46 25.4 44.6 26.8L35 28.2Z" fill={p.fall(MAT.brass)} />
      <path d="M36 25L10.8 18L8.2 21L10.8 24L8.2 27L10.8 30L8.2 33L10.8 35.4L36 26.6Z" fill={p.fall(MAT.redLeather)} />
      <Ink d="M34 25.8L10.8 24M34 25.8L10.8 30" width={1.2} color={MAT.redLeather.shade} />
      <path d="M36 27.4L11 33.6Q6 35.2 6.6 38.8Q7.8 42 12.6 40.8L36 30.4Z" fill={p.fall(MAT.darkWood)} />
      <path d="M36 23L14.4 7.2Q8.4 4.4 6.6 9.8Q5.4 15.6 10.8 18.6L36 26.2Z" fill={p.split(MAT.wood)} />
      <path d={star(13.6, 12.4, 8, 5.6, 3.6)} fill={MAT.amber.base} strokeWidth={1.2} />
      <circle cx="13.6" cy="12.4" r="2.3" fill={MAT.gold.light} strokeWidth={1.1} />
      <rect x="33.2" y="22" width="3.8" height="9" rx="1.2" fill={MAT.copper.base} strokeWidth={1.4} />
    </Grow>
  ),

  /** 機芯：黃銅大齒輪咬著一枚紅銅小齒輪，中央是發著藍光的動力核心。 */
  機芯: (p) => (
    <>
      <path d={gear(35.4, 35.4, 8.6, 6.4, 8, 10)} fill={p.split(MAT.copper)} />
      <circle cx="35.4" cy="35.4" r="2.4" fill={MAT.darkIron.base} strokeWidth={1.4} />
      <path d={gear(21.6, 21.6, 16, 12.8, 11)} fill={p.split(MAT.brass)} />
      <circle cx="21.6" cy="21.6" r="9.4" fill={MAT.brass.shade} strokeWidth={1.6} />
      <path d={dots([[29.4, 13.8, 1.1], [13.8, 13.8, 1.1], [13.8, 29.4, 1.1], [29.4, 29.4, 1.1]])} fill={MAT.brass.light} strokeWidth={0.8} />
      <Tube d={circle(21.6, 21.6, 7.4)} width={2.4} color={MAT.darkIron.base} />
      <circle cx="21.6" cy="21.6" r="5.4" fill={p.ball(MAT.mech)} strokeWidth={1.4} />
      <ellipse cx="19.8" cy="19.6" rx="1.8" ry="1.2" fill={DETAIL.white} stroke="none" />
    </>
  ),
};
