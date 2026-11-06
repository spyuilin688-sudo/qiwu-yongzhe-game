import { circle, dots, ellipse, polar, polygon, rays, sparkle, star, strokes } from './geometry.ts';
import { Beam, Fist, Glint, Place, Sword, TEMPLATE, at, type SkillGlyph } from './kit.tsx';
import { FX } from './palette.ts';

/** 正面拳（指節朝前、約 20×19，原點在中央）：五脈崩拳的正拳。 */
const FRONT_FIST =
  'M-10 4.7L-10 -5.3Q-10 -8.7 -7.4 -8.7Q-5 -8.7 -4.8 -6.7Q-4.4 -9.3 -2 -9.3Q0.4 -9.3 0.6 -6.9Q1 -9.3 3.4 -9.3Q5.8 -9.3 6 -6.7Q6.4 -8.7 8 -8.5Q10 -8.1 10 -5.3L10 4.7Q10 9.3 5 9.3L-5 9.3Q-10 9.3 -10 4.7Z';
/** 張開的手掌（指尖朝上、拇指朝左下）：破山掌。 */
const PALM =
  'M-6 8L-6 -2L-9 -6Q-10.4 -8 -8.4 -9Q-7 -9.6 -5.6 -8L-4.8 -6.8L-4.8 -13Q-4.8 -15 -3 -15Q-1.2 -15 -1.2 -13L-1.2 -8L-0.8 -8L-0.8 -15Q-0.8 -17 1 -17Q2.8 -17 2.8 -15L2.8 -8L3.2 -8L3.2 -14Q3.2 -16 5 -16Q6.8 -16 6.8 -14L6.8 -7L7.2 -7L7.2 -11Q7.2 -12.8 8.8 -12.8Q10.4 -12.8 10.4 -11L10.4 2Q10.4 8 4 8Z';
const CROSS = 'M21 13.6H27L25.4 22.6L34.4 21V27L25.4 25.4L27 34.4H21L22.6 25.4L13.6 27V21L22.6 22.6Z';
const NOTES = 'M17.4 32V13.4L33.4 9.6V28.6H31V15.6L19.8 18.2V32Z';

/** 祭司系（青綠底）：聖詠／審判一線用金色聖光與聖印，武僧一線用拳掌與氣勁。 */
export const PRIEST_GLYPHS: Readonly<Record<string, SkillGlyph>> = {
  /** 聖光彈：帶十字星芒的光球拖著光尾飛出。 */
  SK041: () => (
    <>
      <Beam d={strokes([[8, 36.6, 17.4, 28.4], [12.4, 41, 20.4, 33.4], [6, 29.4, 13, 24]])} color={FX.holy.base} width={1.6} />
      <circle cx="28" cy="20" r="10.4" fill={FX.holy.base} opacity={0.35} stroke="none" />
      <circle cx="28" cy="20" r="7" fill={FX.holy.base} />
      <path d={sparkle(28, 20, 6.4)} fill={FX.white} strokeWidth={1.1} />
    </>
  ),

  /** 淨罪之環：金色光環懸在空中，向下灑落淨化光束。 */
  SK042: () => (
    <>
      <path d="M13.6 22L9.6 39H15.4ZM20 24.4L18.6 41H23.4ZM28 24.4L29.4 41H24.6ZM34.4 22L38.4 39H32.6Z" fill={FX.holy.base} opacity={0.75} stroke="none" />
      <Beam d={ellipse(24, 19, 14, 5.2)} color={FX.gold.base} width={2.6} />
      <Glint d="M13 17.4Q18 14.6 24 14.6" color={FX.gold.light} width={1} />
      <path d={[sparkle(24, 8, 3.4), sparkle(9, 11, 2), sparkle(39, 10.6, 2.4)].join('')} fill={FX.white} stroke="none" />
    </>
  ),

  /** 祝禱之歌：一對聯音符與上升箭頭，只強化本體、不治療。 */
  SK043: () => (
    <>
      <path d={NOTES} fill={FX.holy.base} />
      <ellipse cx="15" cy="32.6" rx="4.4" ry="3.2" transform="rotate(-20 15 32.6)" fill={FX.holy.base} />
      <ellipse cx="28.6" cy="29.2" rx="4.4" ry="3.2" transform="rotate(-20 28.6 29.2)" fill={FX.holy.base} />
      <path d={at(TEMPLATE.chevron, 39.4, 20, 3.6)} fill={FX.gold.base} strokeWidth={1.2} />
      <path d={[sparkle(38.4, 35.6, 3), sparkle(9.4, 15, 2.4)].join('')} fill={FX.white} stroke="none" />
    </>
  ),

  /** 裁決烙印：金色聖環中央刻下一枚擴口十字聖印。 */
  SK044: () => (
    <>
      <Beam d={circle(24, 24, 14)} color={FX.gold.base} width={2.2} />
      <path d={[at(TEMPLATE.diamond, 24, 10, 2.6), at(TEMPLATE.diamond, 38, 24, 2.6), at(TEMPLATE.diamond, 24, 38, 2.6), at(TEMPLATE.diamond, 10, 24, 2.6)].join('')} fill={FX.gold.light} strokeWidth={1.2} />
      <path d={CROSS} fill={FX.gold.base} strokeWidth={1.6} />
      <circle cx="24" cy="24" r="2" fill={FX.white} strokeWidth={1.1} />
    </>
  ),

  /** 聖光連禱：三道光柱同時落下，中間主目標的光柱最粗並帶聖印。 */
  SK045: () => (
    <>
      <path d="M9.4 7H15.4L14.4 35H10.4ZM20.4 6H27.6L26.6 37H21.4ZM32.6 7H38.6L37.6 35H33.6Z" fill={FX.holy.base} strokeWidth={1.4} />
      <Glint d="M12.4 10V31M24 9.4V33M35.6 10V31" width={1.2} />
      <path d={[sparkle(12.4, 37, 3.4), sparkle(24, 39.4, 4.2), sparkle(35.6, 37, 3.4)].join('')} fill={FX.white} strokeWidth={1} />
      <path d={at(TEMPLATE.diamond, 24, 22, 2.8)} fill={FX.gold.base} strokeWidth={1.2} />
    </>
  ),

  /** 黎明審判：地平線升起朝陽，一把光之劍從天而降刺入陽光中。 */
  SK046: () => (
    <>
      <path d={rays(24, 38, 15, 22, [-165, -138, -111, -69, -42, -15], 7)} fill={FX.holy.base} strokeWidth={1.2} />
      <path d="M10.6 38A13.4 13.4 0 0 1 37.4 38Z" fill={FX.gold.base} />
      <Beam d="M6 38.6H42" color={FX.gold.light} width={1.6} />
      <Place x={24} y={18} angle={180} scale={0.76}>
        <Sword blade={FX.holy} />
      </Place>
    </>
  ),

  /** 連環拳：一記直拳向右，身後兩道淡色拳影代表連打。 */
  SK047: () => (
    <>
      <Beam d={strokes([[4, 15.4, 9.6, 15.4], [4, 32.6, 9.6, 32.6]])} color={FX.cream} width={1.2} />
      <Place x={13.4} y={24} scale={0.9} opacity={0.35}>
        <Fist ghost={FX.white} />
      </Place>
      <Place x={20.6} y={24} scale={0.96} opacity={0.55}>
        <Fist ghost={FX.white} />
      </Place>
      <Place x={29} y={24} scale={1.05}>
        <Fist />
      </Place>
      <path d={star(40.6, 24, 6, 3.8, 1.6)} fill={FX.bolt.light} strokeWidth={1.1} />
    </>
  ),

  /** 破山掌：張掌推出，三層掌風向前擴散、震飛碎石。 */
  SK048: () => (
    <>
      <path d={at(PALM, 16, 27, 1.05)} fill={FX.skin.base} />
      <path d="M15 19.4V23.4M19.2 19.4V23.4M23.4 20V23.6" fill="none" stroke={FX.skin.shade} strokeWidth={1} />
      <path d={'M28.4 8.6Q36.4 24 28.4 39.4Q31.2 24 28.4 8.6ZM33.4 12Q39.8 24 33.4 36Q35.4 24 33.4 12Z'} fill={FX.cream} strokeWidth={1.4} />
      <path d="M38.6 14L41.6 15.6L39.4 18.2ZM39.4 30L42.4 32L39 33.6Z" fill={FX.stone.base} strokeWidth={1.1} />
    </>
  ),

  /** 震岳連拳：拳頭擊中山峰，山體裂開。 */
  SK049: () => (
    <>
      <path d="M20 40L31 12.6L35.6 21L38.4 17L42 40Z" fill={FX.stone.base} />
      <path d="M27.4 21.6L31 12.6L34.4 19.4L32 18.4L30 22.4Z" fill={FX.white} strokeWidth={1.2} />
      <path d="M31 25L28.6 30.6L32 33.4L29.6 40" fill="none" strokeWidth={1.4} />
      <path d={star(23.4, 28, 7, 6, 2.6)} fill={FX.bolt.light} strokeWidth={1.2} />
      <Place x={13} y={28.4} scale={0.92}>
        <Fist />
      </Place>
    </>
  ),

  /** 五脈崩拳：正拳居中，五個氣脈光點連成五角陣環繞。 */
  SK050: () => {
    const nodes = [0, 1, 2, 3, 4].map((i) => polar(24, 24, 15, -90 + i * 72));
    return (
      <>
        <path d={star(24, 24, 10, 16, 10.6)} fill={FX.holy.base} opacity={0.45} stroke="none" />
        <Beam d={polygon(24, 24, 15, 5)} color={FX.gold.light} width={1.2} />
        <path d={dots(nodes.map(([x, y]) => [x, y, 2.8] as const))} fill={FX.gold.base} strokeWidth={1.4} />
        <path d={at(FRONT_FIST, 24, 25, 0.82)} fill={FX.skin.base} />
        <path d="M20.2 19.6V23M24 19.4V23M27.8 19.6V23" fill="none" strokeWidth={1.1} />
        <path d="M15.8 26.2Q21 24.8 23.6 27.6Q22 30.8 16.4 30.4Z" fill={FX.skin.light} strokeWidth={1.3} />
      </>
    );
  },
};
