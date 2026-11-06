import { circle, dots, gear, sparkle, star, strokes } from './geometry.ts';
import { Beam, Glint, Hammer, Place, TEMPLATE, at, type SkillGlyph } from './kit.tsx';
import { FX } from './palette.ts';

const ANVIL = 'M11 13.4H31.6Q36 13.4 38.6 10.4Q38.6 17.2 33 18.8H30V23.8H33V28.2H15V23.8H18V18.8Q12.4 18.8 11 13.4Z';
const SMALL_ANVIL = 'M12.4 32H33Q37 32 39 29.6Q39 35 34.6 36H31.6V40H16.4V36Q12.8 36 12.4 32Z';
const PLUS = 'M9.4 6.6H12.6V9.4H15.4V12.6H12.6V15.4H9.4V12.6H6.6V9.4H9.4Z';

/** 工匠系（紅銅底）：戰鎚鐵匠一線用鎚、砧與熔火，機械師一線用砲台、齒輪與機甲。 */
export const ARTISAN_GLYPHS: Readonly<Record<string, SkillGlyph>> = {
  /** 重鎚敲擊：鐵鎚往左下砸出火花，甲片碎裂飛開。 */
  SK061: () => (
    <>
      <path d={star(14.6, 33.6, 8, 9, 4.2)} fill={FX.bolt.light} strokeWidth={1.4} />
      <path d="M6 41L9 37.6L10.6 41.4ZM21.6 41.6L22.6 37.4L25.6 40.2Z" fill={FX.iron.base} strokeWidth={1.1} />
      <Place x={25} y={23} angle={225} scale={1.05}>
        <Hammer />
      </Place>
      <Beam d="M30 7Q40 9.6 41 20" color={FX.cream} width={1.2} dash="2.4 2" />
    </>
  ),

  /** 火花彈：紅銅罐狀彈，引信噴著火花，周圍濺出火星。 */
  SK062: () => (
    <>
      <g transform="rotate(-14 22 28)">
        <rect x="14" y="19" width="16" height="21" rx="3.6" fill={FX.copper.base} />
        <rect x="13" y="23" width="18" height="3" rx="1" fill={FX.darkIron.base} strokeWidth={1.4} />
        <rect x="13" y="33" width="18" height="3" rx="1" fill={FX.darkIron.base} strokeWidth={1.4} />
        <rect x="18" y="15.4" width="8" height="4.4" rx="1" fill={FX.darkIron.base} />
        <Glint d="M17 27V31" color={FX.copper.light} width={1.6} />
      </g>
      <Beam d="M22.6 15Q22.6 9.6 28.4 8.8" color={FX.wood.light} width={1.4} />
      <path d={star(30.6, 8.4, 8, 5.6, 2)} fill={FX.bolt.base} strokeWidth={1.1} />
      <path d={dots([[37, 14, 1.3], [38, 5.6, 1], [34, 18.6, 1], [25, 4.6, 1]])} fill={FX.fire.light} stroke="none" />
    </>
  ),

  /**
   * 熔火重擊：燒紅的鐵鎚斜揮向右下，火焰沿揮擊方向拖在鎚頭後方，消耗熱度換一記重擊。
   * 鎚子直立、火焰往上竄時會被讀成火把或斧頭，斜放加拖尾火焰才看得出「揮鎚」。
   */
  SK063: () => (
    <>
      <path d={at(TEMPLATE.flame, 19.4, 14.4, 11.6, -52, 1.15)} fill={FX.fire.base} />
      <path d={at(TEMPLATE.flame, 22.2, 17, 6.2, -52, 1.1)} fill={FX.bolt.base} strokeWidth={1.3} />
      <Place x={26.4} y={26.6} angle={42} scale={1.18}>
        <Hammer hot />
      </Place>
      <path d={star(36.4, 36.4, 6, 4.6, 2)} fill={FX.bolt.light} strokeWidth={1.2} />
      <path d={dots([[10.6, 30.6, 1.4], [40.6, 13, 1.2], [30, 6.4, 1.1], [8.6, 22, 1]])} fill={FX.fire.light} stroke="none" />
    </>
  ),

  /** 鍛地震波：鐵砧重重落地，地面泛起兩圈震波。 */
  SK064: () => (
    <>
      <Beam d="M5 31.4H43" color={FX.stone.light} width={1.6} />
      <Beam d="M12 34.6Q24 40.6 36 34.6M6.6 35.6Q24 46 41.4 35.6" color={FX.cream} width={1.6} />
      <path d={ANVIL} fill={FX.iron.base} />
      <Glint d="M13.4 14.6H31" width={1.2} />
      <path d={sparkle(33, 6.6, 3)} fill={FX.white} stroke="none" />
    </>
  ),

  /** 熔痕烙印：燒紅的烙鐵在目標身上留下發光的十字熔痕，熔液往下滴。 */
  SK065: () => (
    <>
      <circle cx="21" cy="25" r="12" fill={FX.fire.light} opacity={0.3} stroke="none" />
      <Beam d={circle(21, 25, 8.6)} color={FX.fire.base} width={3} />
      <Beam d="M21 18.4V31.6M14.4 25H27.6" color={FX.fire.light} width={2.4} />
      <path d={[at(TEMPLATE.drop, 16.4, 37.6, 2.4), at(TEMPLATE.drop, 25.6, 38.4, 2)].join('')} fill={FX.fire.base} strokeWidth={1.2} />
      <Beam d="M30.6 16.4L38 9" color={FX.iron.base} width={2.4} />
      <Beam d="M37.6 9.4L41.6 5.4" color={FX.wood.base} width={3.4} />
    </>
  ),

  /** 天地鍛打：巨鎚砸向鐵砧，兩者之間炸開大片火花。 */
  SK066: () => (
    <>
      <path d={star(25, 27, 12, 15, 7.4)} fill={FX.bolt.light} strokeWidth={1.4} />
      <path d={SMALL_ANVIL} fill={FX.iron.base} />
      <Place x={21} y={15.4} angle={150} scale={1.1}>
        <Hammer />
      </Place>
      <path d={dots([[8, 22, 1.4], [41, 20, 1.3], [38, 12, 1], [9.6, 31, 1]])} fill={FX.fire.light} stroke="none" />
    </>
  ),

  /** 架設砲台：三腳架上的圓頂砲台，左上角的加號代表部署。 */
  SK067: () => (
    <>
      <Beam d="M24 30L14 41M24 30L34 41M24 30V41" color={FX.darkIron.light} width={2} />
      <rect x="29" y="18" width="11.6" height="5" rx="1.4" fill={FX.iron.base} />
      <rect x="39" y="16.6" width="3.2" height="7.8" rx="1" fill={FX.iron.shade} strokeWidth={1.4} />
      <path d="M14 28Q14 15 24 15Q34 15 34 28Z" fill={FX.copper.base} />
      <rect x="16.4" y="27" width="15.2" height="4.6" rx="1.6" fill={FX.darkIron.base} />
      <circle cx="21" cy="21.6" r="2.6" fill={FX.mech.base} strokeWidth={1.4} />
      <path d={PLUS} fill={FX.gold.base} strokeWidth={1.3} />
    </>
  ),

  /** 超頻指令：齒輪上劈下一道閃電，旁邊兩層上升箭頭代表砲台強化。 */
  SK068: () => (
    <>
      <path d={gear(21, 26, 12.6, 9.8, 9)} fill={FX.iron.base} />
      <circle cx="21" cy="26" r="4.4" fill={FX.darkIron.base} strokeWidth={1.4} />
      <path d={at(TEMPLATE.bolt, 22, 25, 11.4)} fill={FX.bolt.base} strokeWidth={1.6} />
      <path d={[at(TEMPLATE.chevron, 38.4, 13, 4.2), at(TEMPLATE.chevron, 38.4, 20, 4.2)].join('')} fill={FX.mech.base} strokeWidth={1.3} />
    </>
  ),

  /** 集火信標：信標塔頂紅燈閃爍、發出訊號，右下準星鎖定主目標。 */
  SK069: () => (
    <>
      <Beam d="M10.6 40L17.6 15L24.6 40M13 31H22.2M15 23.6H20.2" color={FX.iron.light} width={1.6} />
      <circle cx="17.6" cy="12.6" r="3.6" fill={FX.mark} strokeWidth={1.6} />
      <circle cx="16.6" cy="11.6" r="1.1" fill={FX.white} stroke="none" />
      <Beam d="M23.4 7.6Q26.4 12.6 23.4 17.6M27.6 4.6Q32.6 12.6 27.6 20.6" color={FX.mech.base} width={1.6} />
      <Beam d={`${circle(34.4, 31.4, 5.4)}${strokes([[34.4, 23.6, 34.4, 26.4], [34.4, 36.4, 34.4, 39.2], [26.6, 31.4, 29.4, 31.4], [39.4, 31.4, 42.2, 31.4]])}`} color={FX.mark} width={1.5} />
    </>
  ),

  /** 機甲總動員：方頭步行機甲的正面，藍色雙眼護目鏡與胸口動力核心。 */
  SK070: () => (
    <>
      <Beam d="M24 9V4.6" color={FX.iron.base} width={1.6} />
      <circle cx="24" cy="4.2" r="2" fill={FX.mark} strokeWidth={1.3} />
      <path d="M7 28.6Q7 25.6 10.4 25.6H15.4L14 36.6H9.4Q7 36.6 7 34ZM41 28.6Q41 25.6 37.6 25.6H32.6L34 36.6H38.6Q41 36.6 41 34Z" fill={FX.iron.shade} />
      <path d="M15 26.6H33L35 40H13Z" fill={FX.copper.base} />
      <circle cx="24" cy="33" r="3.2" fill={FX.mech.base} strokeWidth={1.4} />
      <rect x="10.6" y="13.6" width="3" height="7.6" rx="1" fill={FX.darkIron.base} strokeWidth={1.4} />
      <rect x="34.4" y="13.6" width="3" height="7.6" rx="1" fill={FX.darkIron.base} strokeWidth={1.4} />
      <rect x="13" y="9" width="22" height="17.6" rx="4.4" fill={FX.iron.base} />
      <rect x="16" y="13.4" width="16" height="6.4" rx="3" fill={FX.bomb.shade} strokeWidth={1.4} />
      <path d={dots([[20.6, 16.6, 1.8], [27.4, 16.6, 1.8]])} fill={FX.mech.base} stroke="none" />
      <path d={strokes([[19.4, 22.6, 19.4, 24.4], [22.4, 22.6, 22.4, 24.4], [25.6, 22.6, 25.6, 24.4], [28.6, 22.6, 28.6, 24.4]])} fill="none" stroke={FX.darkIron.base} strokeWidth={1.2} />
    </>
  ),
};
