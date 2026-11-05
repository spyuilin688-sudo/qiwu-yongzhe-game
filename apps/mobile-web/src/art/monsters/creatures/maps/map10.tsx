import type { CreatureDesign } from '../kit.tsx';
import { COMMON, INK, MAP10 as P } from '../palette.ts';
import { AngryEye, Blush, Detail, Eye, Leg, Limbs, Mouth, Shadow, Shine, Smile } from '../parts.tsx';
import { circles, leaf, leaves, ring, star } from '../shapes.ts';

/** 第 10 圖 星墜花園：夜靛、星金、夜光青與花粉紅；這裡的生物都會發一點光。 */
export const MAP10_DESIGNS: Readonly<Record<string, CreatureDesign>> = {
  /** 星砂刺蝟仔：背刺沾滿星砂，刺尖上掛著小星星。 */
  'MON-10-1': (k) => {
    const skin = k.paint('#f0c8b0');
    return (
      <>
        <Shadow x={34} w={36} />
        <ellipse cx={26} cy={58.3} rx={4} ry={2.2} fill={skin} />
        <ellipse cx={39} cy={58.3} rx={4} ry={2.2} fill={skin} />
        <path d={ring(37, 45, 11, 17, 8, -160, 'point', 210)} fill={k.paint(P.hedgehog)} />
        <path d={star(28.3, 30.4, 2.6, 1.1) + star(43.3, 29.2, 2.6, 1.1) + star(53.4, 40.4, 2.4, 1)} fill={P.star} strokeWidth={1} />
        <ellipse cx={36} cy={50} rx={12.5} ry={8} fill={k.paint('#c8a8d8')} />
        <path d={circles([[41, 47, 0.8], [46, 51, 0.8], [36, 53.5, 0.8]])} fill={P.star} stroke="none" />
        <ellipse cx={22.5} cy={46} rx={8.5} ry={7.8} fill={skin} />
        <circle cx={14.4} cy={47.4} r={1.4} fill={INK} stroke="none" />
        <Eye x={20} y={44.5} r={2.3} />
        <Eye x={25.6} y={44.5} r={2.3} />
        <Blush x={23.5} y={49.6} rx={1.8} />
        <Smile x={17.6} y={50} w={2.6} depth={1} />
      </>
    );
  },

  /** 夜光花精：花瓣在夜裡發出青光的小花精，莖就是它唯一的腳。 */
  'MON-10-2': (k) => (
    <>
      <Shadow w={24} />
      <circle cx={32} cy={26} r={17} fill={k.glow(P.cyan)} stroke="none" />
      <Limbs d="M32 38V58" color={P.leaf} w={2.4} />
      <path d={leaves([[32, 53, 10, 5.5, 200], [32, 49, 10, 5.5, -20]])} fill={k.paint(P.leaf)} strokeWidth={1.6} />
      <Detail d="M28 60Q32 57 36 60" w={1.6} />
      <path d={ring(32, 26, 7, 15, 6, -90, 'round')} fill={k.paint('#9ff0f0')} />
      <circle cx={32} cy={26} r={7.5} fill={k.paint(P.star)} />
      <Eye x={29.4} y={25.6} r={2} />
      <Eye x={34.6} y={25.6} r={2} />
      <Blush x={27.5} y={29} rx={1.5} />
      <Blush x={36.5} y={29} rx={1.5} />
      <Smile x={31.8} y={28.8} w={2.6} depth={1} />
      <path d={star(12, 14, 2.2, 0.9) + star(52, 38, 2, 0.8)} fill={COMMON.white} stroke="none" />
    </>
  ),

  /** 浮石蟲：背著一塊多孔浮石、拍著小翅膀飄在半空的蟲。 */
  'MON-10-3': (k) => (
    <>
      <Shadow x={32} w={26} float />
      <path d={leaves([[30, 26, 10, 6, -120], [34, 25, 10, 6, -70]])} fill={k.paint('#e9f0ff')} opacity={0.9} strokeWidth={1.5} />
      <Detail d="M24 46l-1 4M30 47v4M36 46.5l1 4" w={1.5} />
      <path d="M18 40Q16 28 28 24Q40 21 46 30Q50 38 44 44Q34 48 22 46Q18 45 18 40Z" fill={k.paint(P.pumice)} />
      <path d={circles([[30, 30, 1.5], [38, 28.5, 1.2], [42, 36.5, 1.6], [34, 38.5, 1.1], [25, 34, 1.2], [38, 43, 1]])} fill="#7a7090" stroke="none" />
      <Shine x={27} y={27.5} rx={3} ry={1.3} rotate={-20} />
      <Detail d="M13 37Q10 32 7 31.5M17 36Q16 31 13.6 29" w={1.4} />
      <path d={circles([[7, 31.5, 1.4], [13.6, 29, 1.4]])} fill={P.cyan} strokeWidth={1.1} />
      <circle cx={16} cy={42} r={6.6} fill={k.paint(P.violet)} />
      <Eye x={13.6} y={41.6} r={2.1} />
      <Eye x={18.4} y={41.6} r={2.1} />
      <Blush x={16.4} y={45.6} rx={1.5} />
      <path d={circles([[28, 53, 0.9], [36, 55, 0.7], [22, 56, 0.6]])} fill={P.cyan} stroke="none" />
    </>
  ),

  /** 星砂刺蝟：長大的星砂刺蝟，兩層背刺都在發光，刺尖的星星更大顆。 */
  'ELT-10-1': (k) => {
    const skin = k.paint('#f0c8b0');
    return (
      <>
        <Shadow x={34} w={56} />
        <circle cx={36} cy={36} r={24} fill={k.glow(P.violet)} stroke="none" />
        <ellipse cx={24} cy={58.2} rx={5} ry={2.6} fill={skin} />
        <ellipse cx={44} cy={58.2} rx={5} ry={2.6} fill={skin} />
        <path d={ring(38, 40, 15, 24, 12, -165, 'point', 215)} fill={k.paint('#6a4a9a')} />
        <path d={ring(38, 42, 11, 18, 10, -160, 'point', 205)} fill={k.paint(P.hedgehog)} strokeWidth={1.6} />
        <path d={star(20.2, 23.9, 3.2, 1.3) + star(33, 16.5, 3.4, 1.4) + star(47.4, 17.9, 3.4, 1.4) + star(58.6, 27.6, 3.2, 1.3) + star(59.5, 49, 2.6, 1.1)} fill={P.star} strokeWidth={1.1} />
        <ellipse cx={38} cy={48} rx={16} ry={10} fill={k.paint('#b898d0')} />
        <ellipse cx={18} cy={43} rx={9.5} ry={9} fill={skin} />
        <circle cx={9} cy={44.6} r={1.6} fill={INK} stroke="none" />
        <AngryEye x={15} y={40.6} r={2.6} iris={P.star} inner="right" />
        <AngryEye x={21.6} y={40.6} r={2.6} iris={P.star} inner="left" />
        <Mouth x={14} y={48} w={5} h={1.6} teeth />
      </>
    );
  },

  /** 食光花妖：專吞星光的大嘴花，花瓣裡藏著一圈尖牙。 */
  'ELT-10-2': (k) => (
    <>
      <Shadow x={34} w={50} />
      <path d={leaves([[34, 58, 16, 8, 200], [34, 58, 16, 8, -20], [34, 58, 11, 6, -60]])} fill={k.paint(P.leaf)} />
      <Limbs d="M34 57Q41 46 30 36" color={P.leaf} w={4} />
      <circle cx={10} cy={31} r={6} fill={k.glow(P.star)} stroke="none" />
      <path d={star(10, 31, 3.4, 1.4)} fill={P.star} strokeWidth={1.1} />
      <path d={ring(27, 26, 13, 22, 8, -90, 'round')} fill={k.paint(P.violet)} />
      <circle cx={27} cy={26} r={13} fill={k.paint(P.pink)} />
      <ellipse cx={25} cy={29} rx={9.5} ry={6.4} fill="#3a1f3a" strokeWidth={1.6} />
      <path d="M16 26.5L18.5 30L21 26.2L23.5 30L26 26L28.5 30L31 26.2L33.5 30L34.5 27.4Q25 24.4 16 26.5ZM18 33.6L20.4 30.8L23 34.2L25.5 31L28 34.4L30.5 31L33 33.4Q25 36.4 18 33.6Z" fill={COMMON.tooth} strokeWidth={1} />
      <AngryEye x={21.5} y={19} r={2.6} iris={P.cyan} inner="right" />
      <AngryEye x={29.5} y={19} r={2.6} iris={P.cyan} inner="left" />
    </>
  ),

  /** 浮岩守衛：頭、身、雙拳四塊浮岩各自漂著，靠青色符紋連在一起。 */
  'ELT-10-3': (k) => {
    const rock = k.paint('#7a78a8');
    return (
      <>
        <Shadow w={42} float />
        <circle cx={32} cy={33} r={14} fill={k.glow(P.cyan)} stroke="none" />
        <Detail d="M32 22V26M18 33H21.5M42.5 33H46M32 43V47" color={P.cyan} w={1.8} />
        <path d="M22 48L32 46L42 48L40 55H24Z" fill={rock} />
        <path d="M18 27L30 23H38L46 29L44 40L32 44L20 40Z" fill={rock} />
        <path d={star(32, 33, 4.6, 1.9)} fill={P.cyan} strokeWidth={1.2} />
        <path d="M6 30L13 27L18 32L16 39L9 40L5 35Z" fill={rock} />
        <path d="M58 30L51 27L46 32L48 39L55 40L59 35Z" fill={rock} />
        <path d="M23 8L32 3.6L41 8L43 18L32 22L21 18Z" fill={rock} />
        <AngryEye x={28.4} y={13.4} r={2.5} iris={P.cyan} inner="right" />
        <AngryEye x={35.6} y={13.4} r={2.5} iris={P.cyan} inner="left" />
        <Shine x={26} y={27.5} rx={3} ry={1.2} opacity={0.4} />
      </>
    );
  },

  /** 隕晶甲獸：背上嵌著一排隕石水晶的甲獸，尾巴末端也是晶錘。 */
  'ELT-10-4': (k) => {
    const hide = k.paint(P.night);
    return (
      <>
        <Shadow x={35} w={58} />
        <path d="M26 26L29 11L34.5 24ZM34 23L40 7L45 22ZM44 25L52 13L51.5 29Z" fill={k.paint(P.crystal)} />
        <Detail d="M29.4 14L30.6 22M40.2 10.6L40.8 20" color={COMMON.white} w={1.2} />
        <Limbs d="M56 44L59 45" color={P.indigo} w={3} />
        <path d="M58 41L62 44L59 48.5L55.5 45.5Z" fill={k.paint(P.crystal)} strokeWidth={1.5} />
        <Leg x={22} top={46} w={7} fill={hide} />
        <Leg x={29} top={48} w={7} fill={hide} />
        <Leg x={44} top={48} w={7} fill={hide} />
        <Leg x={51} top={46} w={7} fill={hide} />
        <path d="M14 48C14 32 24 24 36 24C48 24 58 32 58 48Z" fill={k.paint(P.indigo)} />
        <Detail d="M26 26.6Q24 37 25 48M36 24.5V48M46.5 26.6Q48 37 47 48" color={P.night} w={1.4} />
        <circle cx={14} cy={42} r={8.5} fill={hide} />
        <path d="M7.6 38L4 33.5L9.8 35.4Z" fill={P.crystal} strokeWidth={1.3} />
        <AngryEye x={12.4} y={40.6} r={2.6} iris={P.cyan} inner="left" />
        <Detail d="M6 46Q9 47.6 12.6 46.4" w={1.4} />
        <path d={star(8, 18, 2.2, 0.9) + star(58, 18, 1.8, 0.8)} fill={P.star} stroke="none" />
        <Shine x={30} y={29} rx={3.6} ry={1.4} rotate={-25} opacity={0.4} />
      </>
    );
  },

  /** 月影鹿靈：半透明的月光鹿魂，鹿角是兩彎新月。 */
  'ELT-10-5': (k) => {
    const body = k.paint(P.moon);
    return (
      <>
        <Shadow x={36} w={44} />
        <path d={leaves([[51, 35, 11, 5, -15], [51, 37, 9, 4, 15]])} fill={P.moon} opacity={0.6} strokeWidth={1.3} />
        <Limbs d="M30 44V58.5M35.5 45V58.5M44 45V58.5M48.5 44V58.5" color="#b8c0f0" w={2.4} />
        <ellipse cx={39} cy={38.5} rx={14} ry={8.5} fill={body} />
        <path d="M29 39Q20.5 35 20.5 24L26.5 22Q26.5 30 33 33Z" fill={body} />
        <path d="M14.5 15A7 7 0 1 1 24.5 7.5A5.4 5.4 0 1 0 14.5 15Z" fill={k.paint('#f6e7a8')} strokeWidth={1.5} />
        <path d="M26 15A5.4 5.4 0 1 0 31.5 5.5A4.2 4.2 0 1 1 26 15Z" fill={k.paint('#f6e7a8')} strokeWidth={1.5} />
        <path d={leaf(24.5, 18.5, 6, 4, -30)} fill={body} strokeWidth={1.4} />
        <ellipse cx={19} cy={22} rx={6.8} ry={5} fill={body} />
        <AngryEye x={17.6} y={21.4} r={2.3} iris={P.cyan} inner="left" />
        <circle cx={12.8} cy={23.4} r={1.1} fill={P.night} stroke="none" />
        <path d={circles([[40, 36, 1], [45, 40, 0.9], [34, 41, 0.8]])} fill={P.violet} opacity={0.7} stroke="none" />
        <path d={star(56, 22, 2.4, 1) + star(8, 36, 2, 0.8)} fill={P.star} stroke="none" />
      </>
    );
  },
};
