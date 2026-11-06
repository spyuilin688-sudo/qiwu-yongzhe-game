import type { CreatureDesign } from '../kit.tsx';
import { COMMON, INK, MAP04 as P } from '../palette.ts';
import { AngryEye, Blush, Detail, Eye, Leg, Limbs, Mouth, Shadow, Shine, WindKey } from '../parts.tsx';
import { circles, flame, leaf, leaves } from '../shapes.ts';

/** 第 4 圖 霧鐘古鎮：霧藍、薰衣草紫、提燈橘與黃銅，潮濕老街的夜晚居民。 */
export const MAP04_DESIGNS: Readonly<Record<string, CreatureDesign>> = {
  /** 雨傘精：會吐舌頭的舊雨傘，傘柄下踩著一隻雨靴。 */
  'MON-04-1': (k) => (
    <>
      <Shadow w={24} />
      <path d="M12 17.5Q10 20.5 12 22Q14 20.5 12 17.5ZM53 24Q51 27 53 28.5Q55 27 53 24ZM49 11.5Q47.5 14 49 15.2Q50.5 14 49 11.5Z" fill="#a8d8f2" strokeWidth={1.2} />
      <Limbs d="M32 38V55" color={COMMON.wood} w={2.6} />
      <path d="M27 54.5H35.5Q38.5 54.5 38.5 57.5V60H27Z" fill={k.paint(P.cloth)} />
      <path d="M31 15.5L32 10L33 15.5Z" fill={P.brass} strokeWidth={1.4} />
      <path d="M10 38Q11 18 32 15Q53 18 54 38Q48.5 34.5 43 38Q37.5 34.5 32 38Q26.5 34.5 21 38Q15.5 34.5 10 38Z" fill={k.paint(P.umbrella)} />
      <Detail d="M32 15.8Q26.5 25 21 37.5M32 15.8Q37.5 25 43 37.5" color="#4f6a9a" w={1.3} />
      <path d={circles([[41, 24, 1.4], [46.5, 30, 1.2], [38.5, 32, 1.1], [16.5, 32, 1]])} fill={COMMON.white} opacity={0.6} stroke="none" />
      <Shine x={19} y={24} rx={3.2} ry={1.5} rotate={-40} />
      <Eye x={24} y={26.5} r={2.6} />
      <Eye x={31} y={26.5} r={2.6} />
      <Blush x={20.5} y={30.8} rx={2} />
      <Blush x={34.5} y={30.8} rx={2} />
      <Mouth x={27.5} y={30} w={4} h={1.9} />
    </>
  ),

  /** 布偶幽靈：被遺忘的布娃娃化成的幽靈，一隻鈕扣眼、補丁和縫線嘴。 */
  'MON-04-2': (k) => (
    <>
      <Shadow w={24} float />
      <ellipse cx={15} cy={38} rx={3.2} ry={2.2} transform="rotate(-25 15 38)" fill={k.paint(P.ghost)} />
      <path d="M17 40C17 24 23 16 32 16C41 16 47 24 47 40V50L43 47L39.5 51L36 47.5L32 51.5L28 47.5L24.5 51L21 47L17 50Z" fill={k.paint(P.ghost)} />
      <rect x={36} y={30} width={7} height={7} rx={1} transform="rotate(10 39.5 33.5)" fill={P.patch} strokeWidth={1.4} />
      <Detail d="M35 31.5l2 0.8M35.2 36l2 -0.8M43.5 30l-1.6 1.2" w={1.1} />
      <Shine x={24} y={21.5} rx={3} ry={1.5} />
      <circle cx={23} cy={30} r={3.1} fill={P.cloth} strokeWidth={1.4} />
      <path d={circles([[22.2, 29.3, 0.65], [23.8, 30.7, 0.65]])} fill={INK} stroke="none" />
      <Eye x={30.5} y={30} r={2.6} />
      <Detail d="M21 37.5H30M22.5 36.2v2.6M25.5 36.2v2.6M28.5 36.2v2.6" w={1.2} />
      <Blush x={34} y={35.5} rx={1.8} />
      <Detail d="M32 16.5Q30 20.5 31.5 23.5" w={1} opacity={0.5} />
    </>
  ),

  /** 發條鼠（古鎮）：布做的玩具老鼠，背上的黃銅鑰匙轉一圈就跑一段。 */
  'MON-04-3': (k) => (
    <>
      <Shadow x={30} w={34} />
      <Limbs d="M47 50Q56 52 56 45.5Q56 40.5 51.5 42" color={COMMON.blush} w={1.6} />
      <WindKey x={45} y={39} fill={P.brass} />
      <path d={circles([[23, 56.5, 3.2], [38, 56.5, 3.2]])} fill={k.paint(P.coat)} />
      <path d="M10 47C14 40 22 33 33 33C43 33 49 40 49 47C49 52 45 55 38 55H20C14 55 11 51 10 47Z" fill={k.paint(P.mouse)} />
      <Detail d="M20 52.5H42" w={1} opacity={0.45} />
      <circle cx={25} cy={30.5} r={6} fill={k.paint(P.mouse)} />
      <circle cx={34.5} cy={29} r={5.5} fill={k.paint(P.mouse)} />
      <path d={circles([[25, 30.5, 3.1], [34.5, 29, 2.8]])} fill={COMMON.blush} opacity={0.8} stroke="none" />
      <Shine x={34} y={37} rx={3.4} ry={1.5} rotate={-15} />
      <circle cx={10.2} cy={46.5} r={1.9} fill={COMMON.blush} strokeWidth={1.2} />
      <Detail d="M12.5 49l-5 1.6M13 50.5l-4 3" w={1.1} />
      <Eye x={19} y={42} r={2.4} />
      <Eye x={25} y={41.5} r={2.4} />
      <Blush x={22} y={47} rx={1.9} />
    </>
  ),

  /** 提燈遊魂：提著燈籠在霧裡徘徊的魂，燈光是它唯一的溫度。 */
  'ELT-04-1': (k) => (
    <>
      <Shadow x={30} w={34} float />
      <path d="M24 20C24 10 31 5.5 37.5 5.5C46.5 5.5 51 14 50 26C49 38 46 46 50.5 54C44 54.5 38 51 35 45.5C30 50.5 24 50.5 20 47.5C24 42 24 34 24 20Z" fill={k.paint('#c9c4ec')} />
      <circle cx={9} cy={33} r={11} fill={k.glow(P.lantern)} stroke="none" />
      <Limbs d="M25 31L11 23" color={COMMON.wood} w={2} />
      <path d={leaf(27, 31, 9, 5.5, 195)} fill={k.paint('#c9c4ec')} strokeWidth={1.6} />
      <Detail d="M11 23V26" w={1.4} />
      <rect x={5.5} y={25.5} width={7} height={2.6} rx={1} fill={P.brass} strokeWidth={1.4} />
      <rect x={4.8} y={28} width={8.4} height={9.5} rx={2.4} fill={k.paint(P.lantern)} strokeWidth={1.6} />
      <path d={flame(9, 35.8, 1.8, 6)} fill={COMMON.white} stroke="none" />
      <rect x={5.5} y={37.3} width={7} height={2.2} rx={1} fill={P.brass} strokeWidth={1.4} />
      <Shine x={31} y={12} rx={3.4} ry={1.6} />
      <AngryEye x={31.5} y={19} r={3} inner="right" />
      <AngryEye x={40} y={19} r={3} inner="left" />
      <ellipse cx={35.5} cy={26.5} rx={2} ry={2.6} fill="#3a2a4a" stroke="none" />
      <Detail d="M44 40Q47 45 45 50M30 41Q31 45 29 47" color="#8f86c8" w={1.3} />
    </>
  ),

  /** 長巷稻偶：老巷口的稻草人，夜裡會轉頭盯著路過的人。 */
  'ELT-04-2': (k) => {
    const coat = k.paint(P.coat);
    const straw = k.paint(P.straw);
    return (
      <>
        <Shadow w={22} />
        <rect x={30.3} y={30} width={3.6} height={30} rx={1.2} fill={k.paint(COMMON.wood)} />
        <path d={leaves([[11, 33, 7, 2.8, 170], [11, 33, 7, 2.8, 205], [11, 33, 7, 2.8, 140], [53, 33, 7, 2.8, 10], [53, 33, 7, 2.8, -25], [53, 33, 7, 2.8, 40]])} fill={straw} strokeWidth={1.4} />
        <rect x={10} y={29.5} width={44} height={6.5} rx={3} fill={coat} />
        <path d={leaves([[26, 45.5, 7, 2.6, 110], [32, 46, 8, 2.6, 90], [38, 45.5, 7, 2.6, 70]])} fill={straw} strokeWidth={1.4} />
        <path d="M21.5 30H42.5L45 48L40 46L36 49.5L32 46L28 49.5L24 46L19 48Z" fill={coat} />
        <rect x={36} y={36.5} width={5.5} height={5.5} rx={0.8} transform="rotate(-8 38.75 39.25)" fill={P.patch} strokeWidth={1.3} />
        <Detail d="M21 41H43.5" color={COMMON.rope} w={2} />
        <circle cx={32} cy={20} r={9} fill={k.paint('#d8c08a')} />
        <Detail d="M27 28.5L32 27L37 28.5" w={1.3} />
        <ellipse cx={32} cy={12.5} rx={14.5} ry={3} fill={straw} />
        <path d="M25 12.5Q25 3 32 3Q39 3 39 12.5Z" fill={k.paint('#c4a04a')} />
        {/* 帽帶用霧鎮薰衣草紫，避免和第 1 圖草帽雞長撞色，也避開「草帽紅帶」的既有作品招牌。 */}
        <Detail d="M25.4 10H38.6" color={P.lavender} w={1.8} />
        <AngryEye x={28} y={20} r={2.6} iris={P.lantern} inner="right" />
        <AngryEye x={35.5} y={20} r={2.6} iris={P.lantern} inner="left" />
        <Detail d="M26 25L28 26.5L30 25L32 26.5L34 25L36 26.5" w={1.2} />
      </>
    );
  },

  /** 破傘商人：撐著破傘、背滿雜貨的兜帽怪客，只看得見帽子裡兩點光。 */
  'ELT-04-3': (k) => {
    const coat = k.paint(P.coat);
    return (
      <>
        <Shadow x={32} w={46} />
        <rect x={36} y={27} width={18} height={24} rx={3} fill={k.paint(COMMON.wood)} />
        <Detail d="M36.5 35H53.5M36.5 43H53.5" color="#6a4526" w={1.3} />
        <ellipse cx={46} cy={26} rx={6} ry={3.4} fill={k.paint(P.bell)} />
        <rect x={51} y={16} width={4} height={12} rx={2} transform="rotate(20 53 22)" fill={k.paint(P.patch)} />
        <path d="M14 58.5C13 43 18 31 28 29C38 29 44 39 46 58.5Z" fill={coat} />
        <circle cx={26.5} cy={31} r={9} fill={coat} />
        <ellipse cx={23} cy={32.5} rx={5.6} ry={5} fill="#2a2430" />
        <AngryEye x={21} y={32.5} r={2} iris={P.lantern} inner="right" />
        <AngryEye x={26} y={32.5} r={2} iris={P.lantern} inner="left" />
        <path d="M19 35L12 37L19.5 37.8Z" fill={k.paint('#c8a8d8')} strokeWidth={1.4} />
        <Limbs d="M19.5 43L22.5 8" color={COMMON.wood} w={1.8} />
        <path d="M2 18Q8 4 24 3Q40 4 46 18L42 15.5L39 19.5L35 15.5L31 19L27 15L22.5 19L17.5 15L13 19L9 15.5L5 19.5Z" fill={k.paint(P.lavender)} />
        <path d={circles([[13, 10, 1.6], [33, 9, 1.3]])} fill="#2a2430" stroke="none" />
        <Detail d="M45 17.5L49.5 21M22.5 3.5L25.5 0.8" w={1.4} />
        <circle cx={19.5} cy={44} r={2.8} fill={k.paint('#c8a8d8')} />
        <Detail d="M16 53Q20 51 24 53" color="#3f4a63" w={1.2} />
      </>
    );
  },

  /** 發條鐘僕：臉是鐘面的管家人偶，指針剛好拉成一撇冷笑。 */
  'ELT-04-4': (k) => {
    const coat = k.paint('#4a5a7a');
    return (
      <>
        <Shadow w={40} />
        <Limbs d="M27 50V57.5M37 50V57.5" color={COMMON.iron} w={2.6} />
        <path d={circles([[25.5, 58.8, 2.4], [38.5, 58.8, 2.4]])} fill={k.paint(P.coat)} />
        <WindKey x={44} y={38} fill={P.brass} />
        <Limbs d="M21 37L14 45M43 37L49 43" color="#4a5a7a" w={3} />
        <path d="M19 52Q19 32 32 30Q45 32 45 52Z" fill={coat} />
        <path d="M28 31H36L32 44Z" fill={COMMON.white} strokeWidth={1.4} />
        <path d="M28.5 32L32 34L35.5 32V36L32 34L28.5 36Z" fill={COMMON.ruby} strokeWidth={1.3} />
        <path d={circles([[32, 46, 1], [32, 50, 1]])} fill={P.brass} strokeWidth={0.8} />
        <path d="M9 47Q9 51 7.5 53H16.5Q15 51 15 47Q15 44.5 12 44.5Q9 44.5 9 47Z" fill={k.paint(P.brass)} strokeWidth={1.6} />
        <path d={circles([[13.6, 45.4, 2.5], [49.5, 43.5, 2.5]])} fill={COMMON.white} strokeWidth={1.4} />
        <Limbs d="M28.5 8Q32 3 35.5 8" color={P.brass} w={1.8} />
        <circle cx={32} cy={18} r={11} fill={k.paint(P.brass)} />
        <circle cx={32} cy={18} r={8.4} fill={k.paint('#f2ead8')} strokeWidth={1.6} />
        <Detail d="M32 10.8V12.6M32 23.4V25.2M24.8 18H26.6M37.4 18H39.2" w={1.3} />
        <Detail d="M32 21L27 23.4M32 21L37 23" w={1.6} />
        <circle cx={32} cy={21} r={1} fill={INK} stroke="none" />
        <AngryEye x={28.2} y={16.5} r={2.3} iris={COMMON.eliteRed} inner="right" />
        <AngryEye x={35.8} y={16.5} r={2.3} iris={COMMON.eliteRed} inner="left" />
      </>
    );
  },

  /** 銹鐘守衛：整座生鏽大鐘就是它的鎧甲，從縫隙裡瞪人。 */
  'ELT-04-5': (k) => {
    const bell = k.paint(P.bell);
    return (
      <>
        <Shadow w={52} />
        <Leg x={24} top={50} w={8} fill={k.paint(COMMON.iron)} />
        <Leg x={40} top={50} w={8} fill={k.paint(COMMON.iron)} />
        <Limbs d="M27 12.5Q27 5 32 5Q37 5 37 12.5" color={P.bell} w={2.4} />
        <path d="M14 52C14 44 16 40 18 30C19 18 25 12 32 12C39 12 45 18 46 30C48 40 50 44 50 52Z" fill={bell} />
        <path d={circles([[40, 38, 2.6], [44, 45, 1.8], [24, 46, 2], [37, 18, 1.6]])} fill="#6f9a86" opacity={0.85} stroke="none" />
        <path d={circles([[29, 40, 1.5], [46.5, 33, 1.2]])} fill={P.rust} stroke="none" />
        <Detail d="M16.5 39.5Q32 44 47.5 39.5" color="#7a4f26" w={1.6} />
        <rect x={11} y={49} width={42} height={5} rx={2.5} fill={bell} />
        <rect x={18} y={23} width={26} height={9} rx={4.5} fill="#2a1c14" />
        <AngryEye x={24.6} y={27.8} r={3} inner="right" />
        <AngryEye x={35.4} y={27.8} r={3} inner="left" />
        <Detail d="M42.5 15L39.5 20.5L42 24" w={1.4} />
        <Shine x={23} y={18} rx={3} ry={1.4} rotate={-50} opacity={0.5} />
        <circle cx={12} cy={40} r={9} fill={k.paint(COMMON.iron)} />
        <circle cx={12} cy={40} r={5.8} fill="none" stroke={COMMON.steel} strokeWidth={1.3} />
        <circle cx={12} cy={40} r={2.4} fill={P.brass} strokeWidth={1.3} />
      </>
    );
  },
};
