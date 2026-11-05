import { circle, crescent, dots, shape, sparkle, star, strokes } from './geometry.ts';
import { Arrow, Beam, Glint, TEMPLATE, at, type SkillGlyph } from './kit.tsx';
import { FX } from './palette.ts';

/** 狼頭側影（朝右、約 22×22，原點在臉中央）：尖耳、長吻、張開的下顎與頸部鬃毛，縮小後才不會像狗或胡狼。 */
const WOLF = 'M-9 8L-9.4 -1L-7.4 -5L-6 -12L-1.6 -5.6Q2.4 -6.4 5.6 -3.6L12 -0.8Q13 0.6 12 1.8L5.4 3L8.6 5.2L1.6 7.4L-1 10.4L-3.6 8L-6 10.6Z';
const HORN = 'M8 25C9.6 33.6 17 37 27 33.6L31 21.6C23 25.4 15 24 12 20Z';
const PAW_PAD = 'M24 37Q15.6 37 16.4 30.6Q17.2 25.4 24 25.4Q30.8 25.4 31.6 30.6Q32.4 37 24 37Z';

/** 弓手系（綠底）：神射手走箭與準星，馴獸師走爪痕、獸影與號角。 */
export const BOW_GLYPHS: Readonly<Record<string, SkillGlyph>> = {
  /** 散射：三支箭呈扇形同時射出。 */
  SK011: () => (
    <>
      <Arrow x1={8} y1={33} x2={20} y2={8.6} />
      <Arrow x1={10} y1={37.4} x2={36} y2={15} />
      <Arrow x1={13} y1={40.6} x2={40.6} y2={31} />
    </>
  ),

  /** 瞄準射擊：一支箭正中紅白靶心。 */
  SK012: () => (
    <>
      <circle cx="30" cy="20.6" r="11" fill={FX.cream} />
      <circle cx="30" cy="20.6" r="7.4" fill={FX.mark} strokeWidth={1.4} />
      <circle cx="30" cy="20.6" r="3.8" fill={FX.cream} strokeWidth={1.2} />
      <Arrow x1={6.6} y1={41} x2={29.4} y2={21.4} fletch={FX.gold.base} />
      <Beam d={strokes([[6, 30, 10, 26.6], [13.4, 40.4, 17, 37.4]])} color={FX.white} width={1.2} />
    </>
  ),

  /** 弱點標記：準星正中一枚紅色弱點菱形。 */
  SK013: () => (
    <>
      <Beam d={circle(24, 24, 11.6)} color={FX.cream} width={2} />
      <Beam d={strokes([[24, 6.6, 24, 12.6], [24, 35.4, 24, 41.4], [6.6, 24, 12.6, 24], [35.4, 24, 41.4, 24]])} color={FX.cream} width={2} />
      <path d={at(TEMPLATE.diamond, 24, 24, 6.6)} fill={FX.mark} strokeWidth={1.6} />
      <path d={at(TEMPLATE.diamond, 23.2, 22, 2.4)} fill={FX.white} stroke="none" />
    </>
  ),

  /** 穿甲箭：箭矢貫穿一片鐵甲，甲片龜裂、碎屑飛出。 */
  SK014: () => (
    <>
      <Arrow x1={5} y1={30.6} x2={43} y2={18} />
      <path d="M28.4 12L31.2 13.4V34.6L28.4 36Z" fill={FX.iron.shade} />
      <path d="M20.4 8.6L28.4 12V36L20.4 39.4Z" fill={FX.iron.base} />
      <path d={strokes([[24.4, 24.6, 21.8, 18.4], [24.4, 24.6, 22.4, 31.4], [24.4, 24.6, 27.4, 17.6]])} fill="none" strokeWidth={1.2} />
      <path d="M34 26.6L36.8 28L34.4 30ZM35.6 20.4L38.4 19.6L37.4 22.6Z" fill={FX.iron.light} strokeWidth={1.1} />
    </>
  ),

  /** 追星箭：箭矢拖著虛線軌跡轉彎追擊，沿途灑下星星。 */
  SK015: () => (
    <>
      <Beam d="M6.6 40Q7.6 25 18.6 26Q28 27 31 19" color={FX.gold.light} width={1.6} dash="3 2.4" />
      <Arrow x1={28.6} y1={23.4} x2={40} y2={7.6} fletch={FX.gold.base} />
      <Arrow x1={10.6} y1={17} x2={22} y2={7.4} fletch={FX.cream} />
      <path d={[star(12.4, 30.4, 5, 3.6, 1.6), star(23.4, 32.4, 5, 2.8, 1.2)].join('')} fill={FX.gold.base} strokeWidth={1.2} />
    </>
  ),

  /** 天穹狙擊：夜空月牙與星光下，一支長箭直取準星。 */
  SK016: () => (
    <>
      <path d="M17.4 6.6Q8 9.6 8.4 18Q9 25.4 17 26.6Q11.6 22.6 12 17.4Q12.4 11.4 17.4 6.6Z" fill={FX.holy.base} />
      <path d={[sparkle(30, 9, 3), sparkle(41, 26, 2.4), sparkle(22.4, 15, 2)].join('')} fill={FX.white} stroke="none" />
      <Arrow x1={8} y1={42} x2={37} y2={13} fletch={FX.rune.base} />
      <Beam d={`${circle(37, 13, 6)}${strokes([[37, 4.6, 37, 7.6], [45, 13, 42.4, 13]])}`} color={FX.mark} width={1.5} />
    </>
  ),

  /** 掠食標記：紅色虛線獵圈套住一枚獸爪印。 */
  SK017: () => (
    <>
      <Beam d={circle(24, 25, 14.6)} color={FX.mark} width={2.2} dash="4.4 3" />
      <path d={PAW_PAD} fill={FX.fur.light} />
      <path d={dots([[16.4, 21.4, 2.9], [21.4, 16.8, 3], [27, 16.8, 3], [31.8, 21.6, 2.9]])} fill={FX.fur.light} />
    </>
  ),

  /** 協同撲擊：獸爪三道抓痕與獵人的箭交叉，同一目標兩段攻擊。 */
  SK018: () => (
    <>
      <path d={[crescent(25, 6, 8, 33, 4, 4.4), crescent(31.6, 8.4, 14.6, 37, 4, 4.4), crescent(38, 11, 21.4, 40.6, 4, 4.4)].join('')} fill={FX.fur.light} />
      <Arrow x1={8.6} y1={11.6} x2={41} y2={34} fletch={FX.mark} />
    </>
  ),

  /** 獵群奔襲：兩道狼影並肩向右疾奔。 */
  SK019: () => (
    <>
      <Beam d={strokes([[5, 31.4, 12.4, 31.4], [6.4, 37.4, 14, 37.4]])} color={FX.white} width={1.4} />
      <path d={shape(WOLF, 17, 19.6, 0.84)} fill={FX.fur.shade} />
      <path d={shape(WOLF, 27.4, 28.6, 1.08)} fill={FX.fur.base} />
      <path d={dots([[29.6, 25.2, 1.2], [18.6, 17.2, 1], [40.4, 28.4, 1.1], [27.4, 19.4, 0.9]])} fill={FX.cardInk} stroke="none" />
    </>
  ),

  /** 獸王號令：吹響號角、聲波擴散，上方一頂獸王金冠。 */
  SK020: () => (
    <>
      <path d={HORN} fill={FX.bone.base} />
      <ellipse cx="29" cy="27.6" rx="2.6" ry="6.4" transform="rotate(18 29 27.6)" fill={FX.wood.shade} strokeWidth={1.4} />
      <Beam d="M15.8 23.6L14 30.8" color={FX.gold.base} width={2} />
      <Beam d="M34.6 17.4Q38.6 26 34.6 34.6M39.4 13.4Q45 26 39.4 38.6" color={FX.cream} width={1.8} />
      <path d={at(TEMPLATE.crown, 17.6, 11.6, 7.4)} fill={FX.gold.base} />
      <Glint d="M10.6 27.4Q13 32 18 33" color={FX.bone.light} width={1.3} />
    </>
  ),
};
