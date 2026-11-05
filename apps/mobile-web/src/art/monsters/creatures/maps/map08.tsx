import type { CreatureDesign } from '../kit.tsx';
import { COMMON, MAP08 as P } from '../palette.ts';
import { AngryEye, Blush, Detail, Eye, Leg, Limbs, Mouth, RoundEye, Shadow, Shine, Smile } from '../parts.tsx';
import { circles, flame, gumdrop, leaf, leaves } from '../shapes.ts';

/** 第 8 圖 赤爐火山：熔岩橘、玄武岩、餘燼黃與灰燼灰；小首領瞳色偏火光。 */
export const MAP08_DESIGNS: Readonly<Record<string, CreatureDesign>> = {
  /** 火帽蟲：頭頂一簇小火苗當帽子的毛毛蟲。 */
  'MON-08-1': (k) => (
    <>
      <Shadow x={34} w={42} />
      <Detail d="M44 56v3M38 56v3.5M31 55v3.5" w={1.8} />
      <path d={circles([[46.5, 50, 6], [38.5, 48.6, 7], [30, 47, 7.6]])} fill={k.paint('#e8703a')} />
      <path d={circles([[46.5, 47, 1.3], [38.5, 45, 1.4], [30.5, 43, 1.4]])} fill={P.ember} stroke="none" />
      <path d={flame(20.5, 35, 5.2, 14)} fill={k.paint(P.lava)} />
      <path d={flame(20.5, 34.5, 2.4, 7.5)} fill={P.ember} stroke="none" />
      <circle cx={19} cy={42} r={9} fill={k.paint('#f08a4a')} />
      <Shine x={15.5} y={37.5} rx={2.4} ry={1.2} />
      <Eye x={15.5} y={42} r={2.5} />
      <Eye x={21.5} y={42} r={2.5} />
      <Blush x={13.5} y={46.6} rx={1.8} />
      <Blush x={24} y={46.6} rx={1.8} />
      <Smile x={18.5} y={46.4} w={3} />
    </>
  ),

  /** 熔泥怪：一攤冒泡的熔岩泥，表面結了深色硬殼。 */
  'MON-08-2': (k) => (
    <>
      <Shadow w={42} />
      <ellipse cx={32} cy={58.4} rx={20} ry={3} fill={k.paint(P.basalt)} />
      <ellipse cx={32} cy={56} rx={14} ry={4} fill={k.glow(P.lava)} stroke="none" />
      <path d={gumdrop(32, 58, 17, 28)} fill={k.paint('#9a3f2c')} />
      <path d="M17 44Q15.6 50 17.6 52Q19.6 50 18.8 44ZM45.6 41Q44.6 46 46.4 47.6Q48.2 46 47.4 41Z" fill={P.lava} strokeWidth={1.3} />
      <path d={circles([[40, 49, 2.2], [24, 52, 1.6], [43, 36, 1.4]])} fill="#6a2a20" stroke="none" />
      <path d={circles([[30, 30.6, 2.4], [36.5, 30.8, 1.6]])} fill={P.lava} strokeWidth={1.3} />
      <Shine x={22} y={36} rx={3} ry={1.4} rotate={-40} opacity={0.5} />
      <RoundEye x={25} y={41} r={3.2} />
      <RoundEye x={33.4} y={41} r={3.2} />
      <Mouth x={29} y={47} w={4.4} h={1.8} />
    </>
  ),

  /** 煤球蜥：背上長著幾顆煤塊的小蜥蜴，會把煤塊烤得暖呼呼。 */
  'MON-08-3': (k) => {
    const skin = k.paint(P.lizard);
    return (
      <>
        <Shadow x={34} w={46} />
        <path d="M44 50Q56 52 60.5 43.5Q59 50.5 46 55Z" fill={skin} />
        <Leg x={23} top={50} w={4.6} fill={skin} />
        <Leg x={29} top={51} w={4.6} fill={skin} />
        <Leg x={39} top={51} w={4.6} fill={skin} />
        <Leg x={45} top={50} w={4.6} fill={skin} />
        <ellipse cx={34} cy={47} rx={12} ry={6.6} fill={skin} />
        <path d={circles([[30, 40.5, 3.2], [36.5, 39.5, 3.4], [42.5, 41.5, 2.8]])} fill={k.paint(P.coal)} strokeWidth={1.6} />
        <Detail d="M35.5 38l1.6 2.4M29.4 39.6l1.4 1.8" color={P.ember} w={1.3} />
        <ellipse cx={34} cy={50.5} rx={8} ry={2} fill="#f2a070" stroke="none" />
        <ellipse cx={17} cy={44} rx={8} ry={6} fill={skin} />
        <Detail d="M10 47.2Q14 49.2 18.5 47.2" w={1.5} />
        <Eye x={14} y={42} r={2.3} />
        <Eye x={19.6} y={41.6} r={2.3} />
        <Blush x={20.5} y={46.4} rx={1.7} />
      </>
    );
  },

  /** 灰燼甲蟲：燒剩的灰色甲殼裂開，縫裡還有火在悶燒。 */
  'ELT-08-1': (k) => (
    <>
      <Shadow x={35} w={54} />
      <path d={circles([[44, 15.5, 2.8], [48.5, 11.5, 2], [46, 7.5, 1.4]])} fill="#b0aaa6" opacity={0.6} stroke="none" />
      <Limbs d="M24 48l-5 11M35 50l-1 10M47 48l5 11" color={P.basalt} w={2.4} />
      <path d="M18 50C17 30 28 19.5 40 19.5C52 19.5 60 32 59 50Z" fill={k.paint(P.ash)} />
      <circle cx={46} cy={36} r={9} fill={k.glow(P.lava)} stroke="none" />
      <Detail d="M40 20.5Q37 36 39 50M44 28L48 33L46 38L50 43M28 30L31 36L28 41" color={P.lava} w={1.8} />
      <rect x={17} y={48} width={43} height={4.5} rx={2} fill={k.paint(P.basalt)} />
      <Shine x={29} y={26.5} rx={4} ry={1.6} rotate={-35} opacity={0.35} />
      <path d={leaves([[10, 42, 9, 5, 205], [10, 45, 9, 5, 150]])} fill={k.paint(P.coal)} strokeWidth={1.6} />
      <circle cx={16} cy={42.5} r={8.5} fill={k.paint(P.coal)} />
      <AngryEye x={12.6} y={41.5} r={2.6} iris={P.ember} inner="right" />
      <AngryEye x={18.6} y={41.5} r={2.6} iris={P.ember} inner="left" />
    </>
  ),

  /** 赤岩犀角：岩板當鎧甲的犀牛，一根象牙色大角頂天。 */
  'ELT-08-2': (k) => {
    const hide = k.paint(P.rock);
    const leg = k.paint('#7a3a2a');
    return (
      <>
        <Shadow x={35} w={58} />
        <Leg x={25} top={46} w={8} fill={leg} />
        <Leg x={33} top={48} w={8} fill={leg} />
        <Leg x={45} top={48} w={8} fill={leg} />
        <Leg x={53} top={46} w={8} fill={leg} />
        <ellipse cx={39} cy={38} rx={19} ry={13} fill={hide} />
        <path d="M26 29L32 23L40 25L43.5 31ZM42.5 25L50 23L55.5 30.5L46 31.5Z" fill={k.paint(P.basalt)} strokeWidth={1.6} />
        <Detail d="M38 40L42 44L40 48M50 38L53 42" color={P.lava} w={1.6} />
        <path d={leaf(22, 31.5, 7, 4.6, -80)} fill={hide} strokeWidth={1.5} />
        <ellipse cx={17} cy={40} rx={11} ry={9} fill={hide} />
        <path d="M8 36.5Q3.5 26 9 17.5Q11 28 16.5 33Z" fill={k.paint(P.horn)} />
        <path d={leaf(15, 32, 6, 4, -80)} fill={P.horn} strokeWidth={1.4} />
        <circle cx={8.6} cy={42.5} r={1.1} fill="#3a1a14" stroke="none" />
        <AngryEye x={16.5} y={38.5} r={2.6} iris={P.ember} inner="left" />
        <Detail d="M9 46.5Q13 48 16 46" w={1.4} />
        <Shine x={42} y={30} rx={4} ry={1.6} rotate={-10} opacity={0.35} />
      </>
    );
  },

  /** 熔流巨蜥：背上豎著一排火焰鰭的巨蜥，身上的紋路是流動的熔岩。 */
  'ELT-08-3': (k) => {
    const skin = k.paint('#b8402a');
    return (
      <>
        <Shadow x={34} w={58} />
        <path d={flame(29, 37, 2.8, 8) + flame(36.5, 35.5, 3, 9.5) + flame(44, 37, 2.8, 8)} fill={k.paint(P.lava)} />
        <path d="M46 44Q60 44 62 29Q63 40 58.5 46.5Q52.5 52 46 51Z" fill={skin} />
        <Leg x={23} top={48} w={6} fill={skin} />
        <Leg x={30} top={49} w={6} fill={skin} />
        <Leg x={42} top={49} w={6} fill={skin} />
        <Leg x={49} top={48} w={6} fill={skin} />
        <ellipse cx={36} cy={44} rx={17} ry={9} fill={skin} />
        <ellipse cx={36} cy={44} rx={12} ry={6} fill={k.glow(P.lava)} stroke="none" />
        <Detail d="M30 37Q28 44 30 51M38 36Q36 44 38 52M45.5 38Q44 44 45.5 50" color={P.lava} w={2.2} />
        <ellipse cx={16} cy={40} rx={10} ry={7.5} fill={skin} />
        <Detail d="M6.5 43Q12 45.5 19 43" w={1.5} />
        <path d="M9 43.6L10 46.4L11.2 43.8ZM14 44.2L15 46.8L16.2 44.2Z" fill={COMMON.tooth} strokeWidth={0.9} />
        <AngryEye x={13.6} y={37.4} r={2.6} iris={P.ember} inner="right" />
        <AngryEye x={19.8} y={37.4} r={2.6} iris={P.ember} inner="left" />
      </>
    );
  },

  /** 硫火石像：火山口供奉的石像，頭頂燒著不熄的硫磺黃火。 */
  'ELT-08-4': (k) => (
    <>
      <Shadow w={44} />
      <circle cx={32} cy={14} r={13} fill={k.glow(P.sulfur)} stroke="none" />
      <path d={flame(32, 26, 7.5, 22)} fill={k.paint(P.sulfur)} />
      <path d={flame(32, 25, 3.6, 11)} fill={COMMON.white} stroke="none" />
      <rect x={14.5} y={52} width={35} height={8} rx={2} fill={k.paint(P.basalt)} />
      <rect x={18} y={23} width={28} height={30.5} rx={5} fill={k.paint('#a8a090')} />
      <Detail d="M18.5 41.5H45.5M24 41.5Q32 46.5 40 41.5M26 47.5H38" color="#6f685c" w={1.4} />
      <path d="M41 25L39 30.5L42 33" fill="none" strokeWidth={1.3} />
      <AngryEye x={25.6} y={31} r={3.4} iris={P.sulfur} inner="right" />
      <AngryEye x={37.6} y={31} r={3.4} iris={P.sulfur} inner="left" />
      <rect x={26} y={36} width={11} height={3.4} rx={1} fill="#3a2a22" strokeWidth={1.4} />
      <path d="M13 60L15.5 54L18.5 60ZM45 60L48.5 53L51.5 60Z" fill={k.paint(P.sulfur)} strokeWidth={1.4} />
      <Shine x={22} y={27} rx={2.6} ry={1.2} opacity={0.35} />
    </>
  ),

  /** 黑鐵監工：從頭到腳包在黑鐵甲裡的監工，胸口嵌著一顆爐心。 */
  'ELT-08-5': (k) => {
    const iron = k.paint(P.iron);
    return (
      <>
        <Shadow w={52} />
        <Limbs d="M50.5 55L46.5 17" color={COMMON.wood} w={3} />
        <rect x={38} y={7} width={16} height={10} rx={2} transform="rotate(-6 46 12)" fill={k.paint('#5f6470')} />
        <Leg x={25} top={47} w={9} fill={iron} />
        <Leg x={38.5} top={47} w={9} fill={iron} />
        <path d="M16 30Q15 50 22 52H42Q49 50 48 30Q46 24 32 24Q18 24 16 30Z" fill={iron} />
        <circle cx={31} cy={38} r={8} fill={k.glow(P.lava)} stroke="none" />
        <circle cx={31} cy={38} r={4.4} fill={k.paint(P.lava)} strokeWidth={1.6} />
        <path d={circles([[21, 32, 1], [41, 32, 1], [21.5, 46, 1], [40.5, 46, 1]])} fill={COMMON.steel} stroke="none" />
        <ellipse cx={15} cy={29} rx={7} ry={5} fill={iron} />
        <ellipse cx={49} cy={29} rx={6} ry={5} fill={iron} />
        <circle cx={47} cy={36} r={4} fill={iron} />
        <path d={leaves([[22, 10, 6, 3.6, -150], [42, 10, 6, 3.6, -30]])} fill={k.paint(P.horn)} strokeWidth={1.4} />
        <rect x={21} y={5.6} width={22} height={18.4} rx={5} fill={iron} />
        <path d="M24 12.6H40V16.4H34V21.4H30V16.4H24Z" fill="#1a1210" strokeWidth={1.4} />
        <path d="M25.6 14.5H29.6M34.4 14.5H38.4" fill="none" stroke={P.lava} strokeWidth={1.9} />
        <Shine x={26} y={9} rx={2.6} ry={1.1} opacity={0.4} />
      </>
    );
  },
};
