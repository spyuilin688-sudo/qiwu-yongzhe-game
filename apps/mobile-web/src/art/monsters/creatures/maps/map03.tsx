import type { CreatureDesign } from '../kit.tsx';
import { COMMON, INK, MAP03 as P } from '../palette.ts';
import { AngryEye, Blush, Detail, Eye, Leg, Limbs, Mouth, RoundEye, Shadow, Shine, Smile } from '../parts.tsx';
import { circles, gumdrop, leaf, strokes } from '../shapes.ts';

/** 第 3 圖 銅鈴礦山：銅橙、板岩灰、煤黑與礦燈黃，坑道裡的工作夥伴。 */
export const MAP03_DESIGNS: Readonly<Record<string, CreatureDesign>> = {
  /** 礦帽鼴鼠：戴著黃色礦工帽、帽燈照路的小鼴鼠。 */
  'MON-03-1': (k) => {
    const pink = k.paint(P.nose);
    const hat = k.paint(P.helmet);
    return (
      <>
        <Shadow w={34} />
        <ellipse cx={25} cy={58} rx={5} ry={2.7} fill={pink} />
        <ellipse cx={39} cy={58} rx={5} ry={2.7} fill={pink} />
        <path d={gumdrop(33, 59, 15, 29)} fill={k.paint(P.mole)} />
        <ellipse cx={31} cy={49} rx={8} ry={7} fill="#b8957e" stroke="none" />
        <ellipse cx={11} cy={25.5} rx={9} ry={5} fill={k.glow(P.lamp)} stroke="none" />
        <path d="M20 30Q20 18 33 18Q46 18 46 30Z" fill={hat} />
        <rect x={17} y={28.5} width={32} height={3.6} rx={1.8} fill={hat} />
        <circle cx={24.5} cy={24} r={3.4} fill={P.lamp} strokeWidth={1.6} />
        <Shine x={37} y={21.5} rx={3} ry={1.4} rotate={-15} />
        <ellipse cx={19.5} cy={47} rx={4.8} ry={3.8} fill={pink} />
        <Detail d="M15.6 45.4l-2.4 -1M15.2 48l-2.6 0.6" w={1.3} />
        <circle cx={17} cy={38.5} r={3} fill={pink} />
        <Detail d="M14 41l-4.5 1.2M14.5 43l-3.8 2.6" w={1.1} />
        <Eye x={23.5} y={36.2} r={2.3} />
        <Eye x={29.5} y={36.2} r={2.3} />
        <Blush x={27} y={41.5} rx={2} />
        <Smile x={21.5} y={42} w={3} />
      </>
    );
  },

  /** 銅殼蟲：背著亮晶晶銅殼的小甲蟲，殼上還有鉚釘。 */
  'MON-03-2': (k) => (
    <>
      <Shadow x={35} w={38} />
      <Limbs d="M25 50l-3 9M34 51v9M43 50l3 9" color={P.slate} w={2} />
      <path d="M17 52C17 34 26 27 36 27C47 27 54 36 54 52Z" fill={k.paint(P.copper)} />
      <Detail d="M36 27.5Q34 40 36 52" color="#8a4a22" w={1.8} />
      <path d={circles([[26, 40, 1.2], [45, 38, 1.2], [29.5, 47, 1.1], [46, 46.5, 1.1], [31, 33.5, 1]])} fill="#f6cf92" strokeWidth={0.9} />
      <rect x={16} y={50} width={39} height={4} rx={2} fill={k.paint(P.iron)} />
      <Shine x={27} y={32.5} rx={4} ry={1.7} rotate={-30} opacity={0.8} />
      <Shine x={44} y={31.5} rx={2} ry={1.1} rotate={30} opacity={0.6} />
      <Detail d="M14 40Q11 34 7 33M18 39.5Q17 33 14.5 31" w={1.5} />
      <path d={circles([[7, 33, 1.6], [14.5, 31, 1.6]])} fill={P.copper} strokeWidth={1.2} />
      <circle cx={17} cy={46} r={7.2} fill={k.paint('#9aa3b0')} />
      <Eye x={14} y={45.5} r={2.4} />
      <Eye x={19.8} y={45.5} r={2.4} />
      <Smile x={16.5} y={49.6} w={2.8} depth={1.2} />
    </>
  ),

  /** 煤球精：一塊會走路的煤，裂縫裡透著火光，頭頂冒小煙。 */
  'MON-03-3': (k) => (
    <>
      <Shadow w={30} />
      <path d={circles([[37, 20.5, 3], [41, 16.5, 2.2], [38.5, 12.5, 1.5]])} fill="#a59ea0" opacity={0.6} stroke="none" />
      <Leg x={27} top={53} w={5} fill={k.paint(P.coal)} />
      <Leg x={37} top={53} w={5} fill={k.paint(P.coal)} />
      <path d="M20 30L31 25.5L43 28L48.5 39L45.5 51L34 56L22 54L15.5 43Z" fill={k.paint('#57505a')} />
      <Detail d="M31 25.5L33 33L43 28M33 33L48.5 39" color="#7a7178" w={1.2} />
      <circle cx={42} cy={48} r={6} fill={k.glow(P.ember)} stroke="none" />
      <Detail d="M39.5 45L43 48L41 51.5M19 47L23 49.5" color={P.ember} w={1.7} />
      <Shine x={24} y={31} rx={3} ry={1.3} opacity={0.35} />
      <RoundEye x={25} y={38} r={3.6} />
      <RoundEye x={34} y={38} r={3.6} />
      <path d={circles([[21.5, 44, 1.6], [37.5, 44, 1.6]])} fill={P.ember} opacity={0.75} stroke="none" />
      <Detail d="M27.5 44.5Q29.5 46.5 31.5 44.5" color={P.ember} w={1.7} />
    </>
  ),

  /** 盔帽鼴鼠：鐵盔加礦燈、扛著十字鎬的鼴鼠工頭。 */
  'ELT-03-1': (k) => {
    const pink = k.paint(P.nose);
    const iron = k.paint(P.iron);
    return (
      <>
        <Shadow x={32} w={50} />
        <Limbs d="M40 52L55 10" color={P.wood} w={3} />
        <path d="M44 7.5Q54 2 62.5 12L60.5 13.5Q53 7.5 45.5 10.5Z" fill={k.paint(COMMON.steel)} strokeWidth={1.6} />
        <ellipse cx={22} cy={58} rx={6.5} ry={3} fill={pink} />
        <ellipse cx={41} cy={58} rx={6.5} ry={3} fill={pink} />
        <path d={gumdrop(32, 59, 20, 36)} fill={k.paint('#7a5a4a')} />
        <ellipse cx={29} cy={47} rx={10} ry={9} fill="#a8856e" stroke="none" />
        <path d="M37 33Q44 28 51 34Q52 39 47 41Q42 38 37 33Z" fill={iron} />
        <path d={circles([[42, 33.5, 0.9], [47.5, 36, 0.9]])} fill={COMMON.steel} stroke="none" />
        <circle cx={45} cy={45} r={4.5} fill={pink} />
        <ellipse cx={13.5} cy={33} rx={10} ry={5} fill={k.glow(P.lamp)} stroke="none" />
        <path d="M12 25Q12 9 30 9Q46 9 46 25Z" fill={iron} />
        <rect x={9} y={23} width={40} height={4} rx={2} fill={iron} />
        <Detail d="M30 9.5V23" color={COMMON.steel} w={1.4} />
        <circle cx={20.5} cy={17} r={4} fill={P.lamp} strokeWidth={1.6} />
        <path d={circles([[36, 15, 1], [41, 19, 1]])} fill={COMMON.steel} stroke="none" />
        <ellipse cx={14} cy={46} rx={5.6} ry={4.6} fill={pink} />
        <path d="M10 43.5l-3.4 -1.4l2.2 3ZM9.4 47l-3.6 0.6l3 2Z" fill={COMMON.tooth} strokeWidth={1} />
        <circle cx={11} cy={34} r={3.6} fill={pink} />
        <AngryEye x={17.5} y={31} r={2.8} inner="right" />
        <AngryEye x={25.5} y={31} r={2.8} inner="left" />
        <Mouth x={18.5} y={38.5} w={6} h={1.8} teeth />
      </>
    );
  },

  /** 失控礦車：滿載礦石衝下坡的礦車，車輪擦出火花。 */
  'ELT-03-2': (k) => {
    const iron = k.paint(P.iron);
    return (
      <>
        <Shadow w={52} />
        <Detail d={strokes([[57, 26, 63, 26], [58, 33, 63, 33], [57, 40, 62, 40]])} color={COMMON.white} w={2} opacity={0.6} />
        <path d="M12 29L17.5 19L25 22L31 14.5L38 20L45 16L52 22L54 29Z" fill={k.paint('#4f4850')} />
        <path d="M23.5 22.5l4 -3.2l3.4 4l-4 3ZM39.5 21.5l3.2 -2.8l3.4 3.6l-3.6 2.2Z" fill={P.ore} strokeWidth={1.3} />
        <path d="M33 25l2.4 -2.4l2.6 2.6l-2.4 2Z" fill={P.copper} strokeWidth={1.2} />
        <path d="M8 28H56L51 51H13Z" fill={k.paint(P.wood)} />
        <rect x={5.5} y={26} width={53} height={5} rx={2} fill={iron} />
        <Detail d="M15 31V50M49 31V50" color="#5a3a22" w={1.4} />
        <path d={circles([[12, 35, 1], [52, 35, 1], [14.5, 47, 1], [49.5, 47, 1]])} fill={P.lamp} stroke="none" />
        <AngryEye x={22} y={38} r={3.6} inner="right" />
        <AngryEye x={35} y={38} r={3.6} inner="left" />
        <Mouth x={28.5} y={44.5} w={12} h={2.4} teeth />
        <circle cx={18} cy={54} r={6} fill={iron} />
        <circle cx={45} cy={54} r={6} fill={iron} />
        <path d={circles([[18, 54, 2], [45, 54, 2]])} fill={P.lamp} strokeWidth={1.2} />
        <Detail d="M10 50l-5 -2.5M10 54l-6 0.5M11 46.5l-3.6 -4" color={P.lamp} w={1.7} />
      </>
    );
  },

  /** 赤銅甲蟲：赤銅色的獨角仙，一根大角能把礦車掀翻。 */
  'ELT-03-3': (k) => (
    <>
      <Shadow x={35} w={52} />
      <Limbs d="M24 48l-5 11M35 50l-1 10M47 48l5 11" color="#3f2a26" w={2.4} />
      <path d="M18 50C17 30 28 19.5 40 19.5C52 19.5 60 32 59 50Z" fill={k.paint(P.copperRed)} />
      <Detail d="M40 20.5Q37 36 39 50" color="#7a2a1f" w={1.8} />
      <rect x={17} y={48} width={43} height={4.5} rx={2} fill={k.paint('#7a3a2a')} />
      <Shine x={29} y={26.5} rx={5} ry={1.9} rotate={-35} opacity={0.75} />
      <Shine x={50} y={27} rx={2.6} ry={1.2} rotate={35} opacity={0.6} />
      <path d={leaf(19, 35.5, 9, 5, -105)} fill={k.paint(P.copper)} strokeWidth={1.6} />
      <circle cx={16} cy={42.5} r={9} fill={k.paint('#5a2e24')} />
      <path d="M10.5 40C4 33 4.5 21 11.5 13.5C11.5 22 14.5 29 20 35Z" fill={k.paint(P.copper)} />
      <AngryEye x={13} y={44} r={2.8} inner="left" />
      <Detail d="M8 49l-3 1.5M10 50.5l-2 3" w={1.6} />
    </>
  ),

  /** 鐵鏈監工：板岩色皮膚的壯漢，胸前纏鐵鏈、手拖鐵球。 */
  'ELT-03-4': (k) => {
    const skin = k.paint('#8a96a8');
    return (
      <>
        <Shadow w={48} />
        <Limbs d="M11 42Q7 48 8 52" color={COMMON.steel} w={2} />
        <circle cx={8} cy={54} r={5} fill={k.paint('#4a4f5a')} />
        <Leg x={25} top={49} w={8} fill={k.paint('#4a4f5a')} />
        <Leg x={39} top={49} w={8} fill={k.paint('#4a4f5a')} />
        <rect x={19.5} y={55.5} width={11} height={4.5} rx={2} fill={k.paint(P.coal)} />
        <rect x={34} y={55.5} width={11} height={4.5} rx={2} fill={k.paint(P.coal)} />
        <ellipse cx={51} cy={39} rx={5} ry={7} fill={skin} />
        <path d="M15 33Q14 52 24 53H40Q50 52 49 33Q48 25 32 25Q16 25 15 33Z" fill={k.paint('#6a4a34')} />
        <path d="M18 29L46 50" fill="none" stroke={INK} strokeWidth={5.6} />
        <path d="M18 29L46 50" fill="none" stroke={COMMON.steel} strokeWidth={3.4} strokeDasharray="3 1.6" strokeLinecap="butt" />
        <ellipse cx={13} cy={38} rx={5} ry={7} fill={skin} />
        <circle cx={22.5} cy={19} r={2.6} fill={skin} />
        <circle cx={31} cy={18} r={10} fill={skin} />
        <path d="M20.5 14.5Q21.5 4.5 32 4.5Q42 4.5 42 13.5Q35 11.5 20.5 14.5Z" fill={k.paint(P.wood)} />
        <path d="M18 15Q28 11.5 40 13.4L40.8 16.2Q29.5 14.5 18.6 17.6Z" fill={k.paint('#6f4a30')} strokeWidth={1.6} />
        <AngryEye x={26} y={19.5} r={2.7} iris={COMMON.eliteRed} inner="right" />
        <AngryEye x={34} y={19.5} r={2.7} iris={COMMON.eliteRed} inner="left" />
        <path d="M22.5 25Q27 22.5 30 25Q33 22.5 37.5 25Q34 28.5 30 26.6Q26 28.5 22.5 25Z" fill="#3a3036" strokeWidth={1.2} />
      </>
    );
  },

  /** 熔渣石怪：爐渣堆成的石怪，裂縫裡流著還沒冷卻的熔渣。 */
  'ELT-03-5': (k) => {
    const slag = k.paint(P.slag);
    return (
      <>
        <Shadow w={54} />
        <Leg x={22} top={47} w={10} fill={slag} />
        <Leg x={42} top={47} w={10} fill={slag} />
        <circle cx={56} cy={38} r={6.5} fill={slag} />
        <path d="M14 22L26 12L42 13L54 24L56 42L48 52H16L9 40Z" fill={slag} />
        <circle cx={34} cy={42} r={10} fill={k.glow(P.ember)} stroke="none" />
        <Detail d="M30 36L34 41L31 46M44 27L48 31.5L46 36M17 44L22 47" color={P.ember} w={2} />
        <Detail d="M26 12L28 19M42 13L44 21L54 24" color="#8f7a76" w={1.2} />
        <Shine x={22} y={18} rx={3.6} ry={1.4} opacity={0.3} />
        <AngryEye x={22} y={27} r={3.2} iris="#ffb84a" inner="right" />
        <AngryEye x={32.5} y={27} r={3.2} iris="#ffb84a" inner="left" />
        <path d="M21 34Q27 37.5 33 34" fill="none" stroke={P.ember} strokeWidth={2.4} />
        <circle cx={9} cy={40} r={6.5} fill={slag} />
        <path d="M40 52Q39 56 41 57.5Q43 56 42 52Z" fill={P.ember} strokeWidth={1.2} />
      </>
    );
  },
};
