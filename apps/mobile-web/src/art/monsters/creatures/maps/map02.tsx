import type { CreatureDesign } from '../kit.tsx';
import { COMMON, INK, MAP02 as P } from '../palette.ts';
import { AngryEye, Blush, Detail, Eye, Leg, Limbs, Mouth, Shadow, Shine, Smile } from '../parts.tsx';
import { circles, gumdrop, hexagons, leaf, leaves, ring, strokes } from '../shapes.ts';

/** 第 2 圖 蜜糖林地：蜂蜜黃、琥珀、莓果紅紫，甜膩又帶點黏手的森林。 */
export const MAP02_DESIGNS: Readonly<Record<string, CreatureDesign>> = {
  /** 蜜糖蜂：圓滾滾的條紋蜂，翅膀拍個不停所以不落地。 */
  'MON-02-1': (k) => (
    <>
      <Shadow x={34} w={22} float />
      <path d={leaves([[33, 32, 14, 10, -115], [37, 32, 13, 9, -70]])} fill={k.paint(P.wing)} opacity={0.92} strokeWidth={1.6} />
      <path d="M48.5 38.5L56.5 42L48.5 45.5Z" fill={P.stripe} strokeWidth={1.6} />
      <Detail d="M31 52l-1 4M37 53v4M43 52l1 3.5" w={1.6} />
      <ellipse cx={37} cy={42} rx={13} ry={11} fill={k.paint(P.honey)} />
      <path d="M36 31.2Q39 42 36 52.8L40.2 52.6Q43.2 42 40.2 31.4ZM44 32.9Q46.8 42 44 51.1L47.4 48.3Q49.4 42 47.4 35.7Z" fill={P.stripe} stroke="none" />
      <ellipse cx={37} cy={42} rx={13} ry={11} fill="none" />
      <Detail d="M20 29.5Q18 24 14.5 22.5M26 29Q27 23 24.5 20.5" w={1.6} />
      <path d={circles([[14.5, 22.5, 1.8], [24.5, 20.5, 1.8]])} fill={P.stripe} strokeWidth={1.2} />
      <circle cx={23} cy={38} r={9.5} fill={k.paint(P.honey)} />
      <Shine x={19} y={32.5} rx={2.8} ry={1.5} />
      <Eye x={19.5} y={38} r={2.7} />
      <Eye x={26} y={38.5} r={2.5} />
      <Blush x={17} y={43} rx={2} />
      <Blush x={28.5} y={43.5} rx={2} />
      <Smile x={22.5} y={42.5} w={3.5} />
    </>
  ),

  /** 莓果精：草莓形的小精靈，頂著葉冠一蹦一跳。 */
  'MON-02-2': (k) => {
    const feet = k.paint(P.leaf);
    return (
      <>
        <Shadow w={30} />
        <Leg x={27} top={54} w={5} fill={feet} />
        <Leg x={37} top={54} w={5} fill={feet} />
        <path d="M32 23.5C45 22.5 51 31 48.5 41C46 51 38 57.5 32 57.5C26 57.5 18 51 15.5 41C13 31 19 22.5 32 23.5Z" fill={k.paint(P.berry)} />
        <path
          d={circles([[22, 31, 0.85], [30, 29.5, 0.85], [38, 29.5, 0.85], [44, 34, 0.85], [45, 42, 0.85], [41, 49.5, 0.85], [25, 52, 0.85], [33, 53.5, 0.85], [18.5, 42, 0.85]])}
          fill={P.cream}
          stroke="none"
        />
        <path d="M32 21Q32.5 16.5 35.5 14.5" fill="none" strokeWidth={2.2} />
        <path d={ring(32, 24, 3.2, 9, 6, -90, 'point')} fill={k.paint(P.leaf)} strokeWidth={1.6} />
        <Shine x={21} y={33} rx={3.2} ry={1.6} rotate={-50} />
        <Eye x={24.5} y={39} r={2.8} />
        <Eye x={33.5} y={39} r={2.8} />
        <Blush x={20.5} y={44.5} />
        <Blush x={37.5} y={44.5} />
        <Smile x={29} y={44} w={3.6} />
      </>
    );
  },

  /** 黏糖怪：融化的糖漿團，頂端捲起一撮糖漿尖，身上黏滿彩色糖粒。 */
  'MON-02-3': (k) => (
    <>
      <Shadow w={40} />
      <ellipse cx={32} cy={58.4} rx={19} ry={3} fill={k.paint(P.amber)} />
      {/* 頂端是往後捲的糖漿尖，不用水滴形：水滴尖會讓整體讀成一口鐘。 */}
      <path d="M24 31C25 25 31 21.5 37.5 22.5C34 24 33 27 35.5 30Z" fill={k.paint(P.syrup)} strokeWidth={1.8} />
      <path d={gumdrop(32, 58, 17, 31)} fill={k.paint(P.syrup)} />
      <path d="M15.6 47Q14.5 52.5 16.6 54.5Q18.6 52.5 17.6 47ZM46.6 45Q45.6 49.5 47.4 51Q49 49.5 48.2 45Z" fill={P.syrup} strokeWidth={1.4} />
      {/* 黏在身上的糖粒：換掉原本的包裝糖，那個剪影小尺寸會被看成一條魚。 */}
      <Detail d={strokes([[39, 34, 41.5, 35.5], [44, 41, 45, 43.5], [38.5, 51.5, 41, 50.5]])} color={P.berry} w={2} />
      <Detail d={strokes([[43, 35.5, 44.5, 37.5], [40.5, 44.5, 43, 45.5], [44.5, 49, 45.5, 51]])} color={P.cream} w={2} />
      <Shine x={22} y={34} rx={4} ry={2} rotate={-40} />
      <circle cx={18.5} cy={40.5} r={1.3} fill={COMMON.white} opacity={0.7} stroke="none" />
      <Eye x={24.5} y={41} r={2.8} />
      <Eye x={33} y={41} r={2.8} />
      <ellipse cx={29} cy={47} rx={1.9} ry={1.6} fill={COMMON.mouth} strokeWidth={1.2} />
      <Blush x={20.5} y={46} />
      <Blush x={37} y={46} />
    </>
  ),

  /** 莓果熊：毛色被莓汁染成紫紅，手裡抱著一大串覆盆子。 */
  'ELT-02-1': (k) => {
    const fur = k.paint(P.bear);
    const muzzle = k.paint('#f0c7c9');
    return (
      <>
        <Shadow x={33} w={46} />
        <ellipse cx={24} cy={57.5} rx={6.5} ry={3.6} fill={fur} />
        <ellipse cx={43} cy={57.5} rx={6.5} ry={3.6} fill={fur} />
        <ellipse cx={49} cy={40} rx={4.6} ry={6.5} fill={fur} />
        <path d={gumdrop(33, 58, 18, 32)} fill={fur} />
        <ellipse cx={30} cy={46} rx={10} ry={9} fill={muzzle} />
        <path d={circles([[45, 34, 1.3], [47.5, 47, 1.1], [41, 53, 1]])} fill={P.berryPurple} stroke="none" />
        <circle cx={17.5} cy={13} r={5} fill={fur} />
        <circle cx={34} cy={12} r={5} fill={fur} />
        <path d={circles([[17.5, 13, 2.4], [34, 12, 2.4]])} fill={P.berry} stroke="none" />
        <circle cx={26} cy={24} r={12.5} fill={fur} />
        <path d={leaves([[26.5, 11.8, 8, 4.5, -55], [26.5, 11.8, 7, 4, -125]])} fill={k.paint(P.leaf)} strokeWidth={1.5} />
        <Shine x={22} y={16} rx={3} ry={1.5} />
        <ellipse cx={18.5} cy={29} rx={6.5} ry={5} fill={muzzle} />
        <ellipse cx={14.8} cy={27} rx={2.5} ry={1.9} fill={INK} stroke="none" />
        <Detail d="M15.5 31.5Q18 33.6 21 31.5" w={1.5} />
        <AngryEye x={19.5} y={21} r={2.8} iris={COMMON.eliteRed} inner="right" />
        <AngryEye x={28.5} y={21} r={2.8} iris={COMMON.eliteRed} inner="left" />
        <ellipse cx={18} cy={42} rx={5} ry={6} transform="rotate(-25 18 42)" fill={fur} />
        <path d={circles([[9, 38, 3], [13.2, 38, 3], [11, 42.6, 3], [6.6, 42.6, 3], [15, 43, 2.8], [9.4, 47, 2.8]])} fill={k.paint(P.berryPurple)} strokeWidth={1.6} />
        <path d={circles([[8.2, 37, 0.8], [12.4, 37, 0.8], [10.2, 41.6, 0.8], [5.8, 41.6, 0.8]])} fill={COMMON.white} opacity={0.7} stroke="none" />
        <path d={leaf(11, 35.5, 6, 4, -100)} fill={P.leaf} strokeWidth={1.4} />
      </>
    );
  },

  /** 蜂巢守衛：會走路的草編蜂巢，正面嵌著蜂巢甲，拿蜂針長槍站崗。 */
  'ELT-02-2': (k) => {
    const hive = k.paint(P.hive);
    return (
      <>
        <Shadow w={46} />
        <rect x={7.6} y={15} width={2.8} height={45} rx={1.4} fill={k.paint(P.wood)} />
        <path d="M9 3.5L12.8 16H5.2Z" fill={k.paint(P.stripe)} strokeWidth={1.6} />
        <path d={leaves([[44, 21, 13, 8, -40], [46, 25, 12, 7, -8]])} fill={k.paint(P.wing)} opacity={0.92} strokeWidth={1.6} />
        <Leg x={24} top={52} w={7} fill={k.paint(P.stripe)} />
        <Leg x={40} top={52} w={7} fill={k.paint(P.stripe)} />
        <path d={gumdrop(32, 55, 21, 44)} fill={hive} />
        <Detail d="M12.5 45Q32 50 51.5 45M12 36Q32 41 52 36M14.5 27.5Q32 32 49.5 27.5M20 19Q32 23 44 19" color="#a8621f" w={1.6} />
        <path d={hexagons([[41, 41, 3.6], [47.2, 41, 3.6], [44.1, 46.4, 3.6], [44.1, 35.6, 3.6]])} fill={k.paint(P.honey)} strokeWidth={1.4} />
        <ellipse cx={24} cy={33} rx={9.5} ry={6.8} fill="#3a2416" />
        <AngryEye x={20.3} y={33.2} r={2.8} inner="right" />
        <AngryEye x={27.7} y={33.2} r={2.8} inner="left" />
        <path d="M28 11.5Q31 9 34 11.5Q35 15 33 16.5Q32.5 14 31 14Q29.5 15 28 11.5Z" fill={P.honey} strokeWidth={1.4} />
        <circle cx={9} cy={39} r={3.8} fill={hive} />
        <Shine x={20} y={18} rx={3.4} ry={1.6} />
      </>
    );
  },

  /** 黏糖巨怪：一整鍋焦糖成了精，頭上還插著一支棒棒糖。 */
  'ELT-02-3': (k) => (
    <>
      <Shadow w={56} />
      <Limbs d="M42 22L50 9" color={COMMON.white} w={2} />
      <circle cx={51} cy={7.5} r={6} fill={k.paint('#f29ac8')} />
      <Detail d="M51 7.5m-3.4 0a3.4 3.4 0 1 1 3.4 3.4a1.9 1.9 0 1 1 1.9 -1.9" color={COMMON.white} w={1.6} />
      <ellipse cx={32} cy={58.6} rx={27} ry={3.4} fill={k.paint(P.amber)} />
      <path d={gumdrop(32, 58, 25, 44)} fill={k.paint('#e08a2c')} />
      <path d="M9.4 46Q8.2 53.5 10.7 56Q13.4 53.5 12.2 46ZM53.5 42Q52.5 48 54.4 50Q56.4 48 55.6 42Z" fill="#e08a2c" strokeWidth={1.6} />
      <path d={circles([[45, 44, 2.2], [49, 35.5, 1.4], [40, 52, 1.6], [16, 50, 1.3]])} fill={COMMON.white} opacity={0.35} stroke="none" />
      <AngryEye x={21.5} y={33} r={3.8} iris={COMMON.eliteRed} inner="right" />
      <AngryEye x={35} y={33} r={3.8} iris={COMMON.eliteRed} inner="left" />
      <Mouth x={28} y={42.5} w={13} h={4.2} teeth />
      <path d="M31 47.5Q30.4 51.5 32 52.5Q33.6 51.5 33 47.5Z" fill="#e08a2c" strokeWidth={1.2} />
      <Shine x={17} y={24} rx={5} ry={2.4} rotate={-40} />
      <circle cx={13.5} cy={31.5} r={1.3} fill={COMMON.white} opacity={0.7} stroke="none" />
    </>
  ),

  /** 刺針隊長：戴雙角船長帽的胡蜂，拿蜂針細劍指向前方。 */
  'ELT-02-4': (k) => (
    <>
      <Shadow x={36} w={36} float />
      <path d={leaves([[33, 27, 18, 11, -105], [37, 28, 17, 10, -58]])} fill={k.paint(P.wing)} opacity={0.92} strokeWidth={1.6} />
      <path d={leaf(33, 38, 27, 20, 30)} fill={k.paint(P.wasp)} />
      {/* 橫紋要貫穿整個腹部（垂直於腹軸）才讀得出「胡蜂」；短紋只會像一片紅葉。 */}
      <Detail d={strokes([[38.9, 50.4, 46.7, 36.9], [43.2, 52.8, 50.9, 39.4], [48.5, 53.3, 54, 43.8]])} color={P.stripe} w={3.2} />
      <path d="M54.5 50.5L61 55L56 51.2Z" fill={P.stripe} strokeWidth={1.4} />
      <Detail d="M28 41l-2 6M33 42l1 6" w={1.6} />
      <circle cx={30} cy={35} r={6.6} fill={k.paint(P.stripe)} />
      <Limbs d="M14 41L2 44" color={COMMON.steel} w={1.6} />
      <circle cx={15.5} cy={40.2} r={2.4} fill={COMMON.gold} strokeWidth={1.4} />
      <circle cx={19} cy={39} r={2.6} fill={P.honey} strokeWidth={1.6} />
      <Detail d="M16 24Q12 19.5 8.5 19.5" w={1.6} />
      <circle cx={8.5} cy={19.5} r={1.7} fill={P.stripe} strokeWidth={1.2} />
      <circle cx={22} cy={28} r={8.5} fill={k.paint(P.honey)} />
      <path d={leaf(25, 15.5, 9, 4.5, -45)} fill={P.wasp} strokeWidth={1.4} />
      <path d="M11.5 22Q22 8.5 32.5 22Q22 18 11.5 22Z" fill={k.paint('#2f3a5a')} />
      <Detail d="M14 20.8Q22 17.4 30 20.8" color={COMMON.gold} w={1.3} />
      <AngryEye x={18.5} y={28.5} r={2.6} inner="right" />
      <AngryEye x={25.2} y={29} r={2.6} inner="left" />
      <Detail d="M19.5 33.2l1.4 1.4l1.4 -1.4" w={1.3} />
      <Shine x={40} y={36} rx={3.6} ry={1.6} rotate={30} opacity={0.5} />
    </>
  ),

  /** 空心木偶：林中枯木雕成的提線木偶，胸口和眼窩都是空的。 */
  'ELT-02-5': (k) => {
    const wood = P.puppet;
    return (
      <>
        <Shadow w={34} />
        <Detail d={strokes([[13, 4.5, 12.5, 36], [30, 4.5, 30, 10], [47, 4.5, 48, 34]])} color="#efe3c6" w={0.9} />
        <path d="M11 3.2H49V6H11ZM28.6 1H31.4V9H28.6Z" fill={k.paint(P.wood)} strokeWidth={1.4} />
        <Limbs d="M26 46L25 56M35 46L36 56M22 33L13 37M38 33L48 35" color={wood} w={3.2} />
        <rect x={20.5} y={55} width={8} height={4.8} rx={1.6} fill={k.paint(P.wood)} />
        <rect x={32} y={55} width={8} height={4.8} rx={1.6} fill={k.paint(P.wood)} />
        <rect x={20.5} y={29.5} width={19} height={18} rx={4.5} fill={k.paint(wood)} />
        <ellipse cx={30.5} cy={38.5} rx={3.6} ry={4.6} fill="#2a1a10" />
        <path d={circles([[13, 37, 2.6], [48, 35, 2.6], [25.5, 51, 2], [35.5, 51, 2]])} fill={k.paint(P.wood)} strokeWidth={1.4} />
        <circle cx={30} cy={19} r={9.5} fill={k.paint(wood)} />
        <path d={leaves([[31, 9.6, 8, 4.5, -55], [31, 9.6, 6, 3.6, -130]])} fill={P.leaf} strokeWidth={1.4} />
        <path d={circles([[26, 18, 2.9], [33.6, 18, 2.9]])} fill="#2a1a10" strokeWidth={1.4} />
        <circle cx={25.6} cy={18.4} r={3.6} fill={k.glow(COMMON.eliteGold)} stroke="none" />
        <circle cx={33.2} cy={18.4} r={3.6} fill={k.glow(COMMON.eliteGold)} stroke="none" />
        <path d={circles([[25.6, 18.4, 1.1], [33.2, 18.4, 1.1]])} fill={COMMON.eliteGold} stroke="none" />
        <Detail d="M25 23.5v4M35 23.5v4M25 27.5h10" w={1.4} />
        <Detail d="M36.5 13.5Q38.5 16 38 19.5M23 34Q25 36 24.5 40" color="#8a5a32" w={1.1} />
      </>
    );
  },
};
