import type { CreatureDesign } from '../kit.tsx';
import { COMMON, INK, MAP11 as P } from '../palette.ts';
import { AngryEye, Blush, Detail, Eye, Leg, Limbs, Shadow, Shine, Smile } from '../parts.tsx';
import { circles, leaf, leaves, ring } from '../shapes.ts';

/** 第 11 圖 空島聖域：雲白、天青、聖金與白曜石；石像類一律以金色紋飾標示神聖。 */
export const MAP11_DESIGNS: Readonly<Record<string, CreatureDesign>> = {
  /** 雲翼羊：羊毛是一朵雲、背上長著小翅膀的羊。 */
  'MON-11-1': (k) => {
    const leg = k.paint(P.face);
    return (
      <>
        <Shadow x={34} w={32} />
        <Leg x={26} top={50} w={5} fill={leg} />
        <Leg x={32} top={51} w={5} fill={leg} />
        <Leg x={41} top={51} w={5} fill={leg} />
        <Leg x={47} top={50} w={5} fill={leg} />
        <path d={leaves([[41, 33, 15, 8, -62], [44, 35, 12, 7, -28]])} fill={k.paint(P.sky)} strokeWidth={1.6} />
        <path d={ring(36, 41, 12, 15.5, 10, 0, 'round')} fill={k.paint(P.cloud)} />
        <path d={leaf(24.5, 35, 7, 4.6, 200)} fill={k.paint(P.face)} strokeWidth={1.4} />
        <ellipse cx={19.5} cy={40} rx={7} ry={8} fill={k.paint(P.face)} />
        <path d={ring(22, 32, 3.4, 5, 6, 0, 'round')} fill={k.paint(P.cloud)} strokeWidth={1.5} />
        <Eye x={17} y={39.4} r={2.4} />
        <Eye x={22.4} y={39.4} r={2.4} />
        <Blush x={20} y={44.6} rx={1.7} />
        <Shine x={36} y={31} rx={3.6} ry={1.6} rotate={-10} />
      </>
    );
  },

  /** 風羽鳥：尾羽捲成一道旋風的雨燕，飛過的地方都會起風。 */
  'MON-11-2': (k) => {
    const body = k.paint(P.feather);
    return (
      <>
        <Shadow x={34} w={28} />
        <Detail d="M50 22Q58 24 56 30Q54 34 50 31M6 40Q2 36 6 33" color={COMMON.white} w={1.4} opacity={0.75} />
        <Limbs d="M31 49V57.5M36 49V57.5" color={P.gold} w={1.6} />
        <path d={leaves([[42, 42, 15, 5, 0], [42, 44, 13, 4.5, 25], [42, 40, 12, 4.5, -25]])} fill={k.paint(P.sky)} strokeWidth={1.5} />
        <ellipse cx={34} cy={41} rx={11} ry={9} transform="rotate(-15 34 41)" fill={body} />
        <ellipse cx={30} cy={45} rx={6} ry={4.6} fill={P.cloud} stroke="none" />
        <path d={leaf(35, 38, 13, 8, -28)} fill={k.paint(P.blue)} strokeWidth={1.6} />
        <path d={leaves([[27, 27, 8, 3.4, -40], [28.5, 28, 7, 3, -10]])} fill={P.sky} strokeWidth={1.3} />
        <circle cx={24} cy={33} r={7.5} fill={body} />
        <path d="M17.4 32L12 34.4L17.6 36Z" fill={P.gold} strokeWidth={1.4} />
        <Eye x={21.4} y={32.4} r={2.2} />
        <Eye x={26.4} y={33} r={2.1} />
        <Blush x={25.5} y={37} rx={1.6} />
      </>
    );
  },

  /** 白曜小像：聖域台座上的小石像，頭頂浮著一圈金環。 */
  'MON-11-3': (k) => {
    const marble = k.paint(P.marble);
    return (
      <>
        <Shadow w={28} />
        <rect x={21.5} y={53} width={21} height={7} rx={1.6} fill={k.paint(P.stone)} />
        <path d={leaves([[37, 40, 10, 6, -40], [27, 40, 10, 6, 220]])} fill={marble} strokeWidth={1.5} />
        <path d="M24 53Q24 38 32 36Q40 38 40 53Z" fill={marble} />
        <Detail d="M24.5 49H39.5M32 37V53" color={P.gold} w={1.3} />
        <ellipse cx={32} cy={18} rx={7} ry={2} fill="none" stroke={INK} strokeWidth={3.8} />
        <ellipse cx={32} cy={18} rx={7} ry={2} fill="none" stroke={P.gold} strokeWidth={1.8} />
        <circle cx={32} cy={28} r={8} fill={marble} />
        <circle cx={32} cy={23.6} r={1.3} fill={P.gold} strokeWidth={0.9} />
        <Eye x={29.2} y={28.6} r={2.1} />
        <Eye x={34.6} y={28.6} r={2.1} />
        <Blush x={27} y={32} rx={1.5} />
        <Blush x={37} y={32} rx={1.5} />
        <Smile x={31.8} y={32} w={2.4} depth={1} />
        <Detail d="M38 26l1.4 2.6" color="#9a948a" w={1} />
      </>
    );
  },

  /** 雲翼山羊：展開雲翼、頂著兩根巨角的山羊，蹄下踩著雲。 */
  'ELT-11-1': (k) => {
    const leg = k.paint(P.face);
    const fur = k.paint('#eae6f0');
    return (
      <>
        <Shadow x={36} w={56} />
        <path d={leaves([[38, 30, 23, 11, -72], [40, 32, 21, 10, -42], [42, 34, 16, 8, -14]])} fill={k.paint(P.cloud)} />
        <Detail d="M44 12l1.4 4M53 20l-1 4" color={P.gold} w={1.4} />
        <Leg x={26} top={46} w={5.5} fill={leg} />
        <Leg x={32} top={48} w={5.5} fill={leg} />
        <Leg x={44} top={48} w={5.5} fill={leg} />
        <Leg x={50} top={46} w={5.5} fill={leg} />
        <ellipse cx={38} cy={42} rx={16} ry={9} fill={fur} />
        <path d="M21 25Q24 9 37 11Q29 14 26 26Z" fill={k.paint(P.horn)} />
        <path d="M17 25Q16 14 24 12Q19 17 21 26Z" fill={k.paint(P.horn)} />
        <Detail d="M25 17.5l2.6 1M28 14l2.4 1.6" color="#a8906a" w={1.1} />
        <path d={leaf(17, 39, 9, 5, 100)} fill={fur} strokeWidth={1.5} />
        <ellipse cx={18.5} cy={32} rx={7.5} ry={9} fill={k.paint('#d8d2e2')} />
        <AngryEye x={15.4} y={31} r={2.4} iris={COMMON.eliteGold} inner="right" />
        <AngryEye x={21.4} y={31} r={2.4} iris={COMMON.eliteGold} inner="left" />
        <path d={circles([[20, 59.5, 3], [26, 60, 2.4], [52, 59.5, 3], [46, 60, 2.4]])} fill={P.cloud} strokeWidth={1.3} />
      </>
    );
  },

  /** 浮橋石衛：一座會走路的拱橋，橋墩是腿、橋頭方石是頭。 */
  'ELT-11-2': (k) => {
    const stone = k.paint(P.stone);
    return (
      <>
        <Shadow w={54} />
        <rect x={9} y={15} width={4.4} height={8} rx={1} fill={k.paint(P.marble)} />
        <rect x={50.6} y={15} width={4.4} height={8} rx={1} fill={k.paint(P.marble)} />
        <path d="M7 60V34Q7 22 19 22H45Q57 22 57 34V60H45V45Q45 37 32 37Q19 37 19 45V60Z" fill={stone} />
        <Detail d="M7.5 30H56.5M13 22.4V30M26 22.4V30M38 22.4V30M51 22.4V30M7.5 46H19M45 46H56.5" color="#8a867c" w={1.2} />
        <path d="M29 37.4L35 37.4L36 31H28Z" fill={P.gold} strokeWidth={1.3} />
        <rect x={22} y={5} width={20} height={17} rx={3} fill={stone} />
        <AngryEye x={28} y={13.6} r={2.6} inner="right" />
        <AngryEye x={36} y={13.6} r={2.6} inner="left" />
        <Detail d="M27.5 18.6H36.5" w={1.6} />
        <path d={circles([[19, 59, 2.6], [45, 59, 2.6], [23, 60, 1.8], [41, 60, 1.8]])} fill={P.cloud} strokeWidth={1.2} />
        <Shine x={26} y={8.6} rx={2.6} ry={1.1} opacity={0.4} />
      </>
    );
  },

  /** 聖羽獅鷲：鷹首、獅身、白金雙翼的聖獸，頭頂一圈細金冠。 */
  'ELT-11-3': (k) => {
    const lion = k.paint(P.griffin);
    const head = k.paint(P.cloud);
    return (
      <>
        <Shadow x={36} w={56} />
        <Limbs d="M53 42Q60 40 59 31" color={P.griffin} w={2} />
        <path d={leaf(59, 32, 6, 4, -100)} fill={k.paint('#a8743a')} strokeWidth={1.3} />
        <path d={leaves([[36, 32, 25, 11, -76], [38, 34, 22, 10, -48], [40, 36, 17, 8, -20]])} fill={head} />
        <Detail d="M33 10l1.6 3M45 13.4l-0.6 3.4M53 22l-2.4 2" color={P.gold} w={1.4} />
        <Leg x={44} top={47} w={6} fill={lion} />
        <Leg x={51} top={45} w={6} fill={lion} />
        <ellipse cx={40} cy={42} rx={15} ry={9} fill={lion} />
        <Limbs d="M25 46L23 58M31 47L31 58" color={P.gold} w={2.6} />
        <Detail d="M19.6 59.6l3.4 -1.6l3 1.6M28 59.6l3 -1.6l3 1.6" w={1.6} />
        <path d={ring(25, 38, 6, 10, 8, 0, 'point')} fill={head} strokeWidth={1.6} />
        <path d={leaves([[24, 22, 7, 3.2, -50], [26, 23, 6, 3, -20]])} fill={P.cloud} strokeWidth={1.3} />
        <circle cx={19} cy={28} r={8} fill={head} />
        <ellipse cx={20} cy={20.4} rx={6} ry={1.6} fill="none" stroke={P.gold} strokeWidth={1.6} />
        <path d="M12 26Q5.6 26 5.6 31.6Q7.6 30 11 31.6Z" fill={P.gold} strokeWidth={1.6} />
        <AngryEye x={16.6} y={27} r={2.6} inner="left" />
      </>
    );
  },

  /** 風紋巨像：全身刻滿風紋的寬肩石巨像，紋路裡吹出天青色的風。 */
  'ELT-11-4': (k) => {
    const stone = k.paint('#c8c2b4');
    return (
      <>
        <Shadow w={56} />
        <Leg x={23} top={46} w={10} fill={stone} />
        <Leg x={41} top={46} w={10} fill={stone} />
        <rect x={1.6} y={22} width={10} height={22} rx={4} fill={stone} />
        <rect x={52.4} y={22} width={10} height={22} rx={4} fill={stone} />
        <path d="M10 20H54L50 48H14Z" fill={stone} />
        <Detail d="M18 32a5 5 0 0 1 10 0a3.6 3.6 0 0 1 -7.2 0a2.2 2.2 0 0 1 4.4 0M46 32a5 5 0 0 0 -10 0a3.6 3.6 0 0 0 7.2 0a2.2 2.2 0 0 0 -4.4 0M16.6 42Q20.5 39 24.3 42T32 42T39.7 42T47.4 42" color={P.sky} w={1.8} />
        <Detail d="M4.4 28a2.4 2.4 0 0 1 4.8 0a1.4 1.4 0 0 1 -2.8 0M59.6 28a2.4 2.4 0 0 0 -4.8 0a1.4 1.4 0 0 0 2.8 0" color={P.sky} w={1.5} />
        <rect x={24} y={6} width={16} height={15} rx={3} fill={stone} />
        <AngryEye x={28.4} y={13.6} r={2.4} iris={P.sky} inner="right" />
        <AngryEye x={35.6} y={13.6} r={2.4} iris={P.sky} inner="left" />
        <Detail d="M2 10Q10 6 16 10M48 8Q55 4 62 8" color={COMMON.white} w={1.4} opacity={0.7} />
        <Shine x={18} y={24} rx={3.4} ry={1.2} opacity={0.45} />
      </>
    );
  },

  /** 白曜裁決者：白曜石鑄成的審判騎士，一手按劍、一手提金天秤。 */
  'ELT-11-5': (k) => {
    const marble = k.paint(P.marble);
    return (
      <>
        <Shadow w={52} />
        <path d={leaves([[40, 34, 14, 7, -40], [24, 34, 14, 7, 220]])} fill={marble} strokeWidth={1.6} />
        <path d="M16 58.5Q16 34 32 30Q48 34 48 58.5Z" fill={marble} />
        <Detail d="M32 31V58M17 52H47" color={P.gold} w={1.6} />
        <Limbs d="M10 60V25" color="#f2ecd8" w={2.8} />
        <Detail d="M5.5 27H14.5" color={P.gold} w={2.4} />
        <circle cx={10} cy={22} r={2} fill={P.gold} strokeWidth={1.2} />
        <circle cx={12.4} cy={32} r={3} fill={marble} />
        <Detail d="M44 28H59M46.5 28L44.5 35M46.5 28L48.5 35M56.5 28L54.5 35M56.5 28L58.5 35" color={P.gold} w={1.3} />
        <path d="M43.6 35H49.4Q48.8 37.6 46.5 37.6Q44.2 37.6 43.6 35ZM53.6 35H59.4Q58.8 37.6 56.5 37.6Q54.2 37.6 53.6 35Z" fill={P.gold} strokeWidth={1.2} />
        <circle cx={45} cy={31} r={2.8} fill={marble} />
        <ellipse cx={32} cy={4.6} rx={8.5} ry={2.4} fill="none" stroke={INK} strokeWidth={4} />
        <ellipse cx={32} cy={4.6} rx={8.5} ry={2.4} fill="none" stroke={P.gold} strokeWidth={2} />
        <path d="M24 22Q24 7.6 32 6Q40 7.6 40 22Z" fill={marble} />
        <path d="M32 8.6L34 11.2L32 13.4L30 11.2Z" fill={P.gold} strokeWidth={1.1} />
        <rect x={25.6} y={14} width={12.8} height={5} rx={2.5} fill="#2a2420" />
        <AngryEye x={29} y={16.6} r={1.9} inner="right" />
        <AngryEye x={35} y={16.6} r={1.9} inner="left" />
      </>
    );
  },
};
