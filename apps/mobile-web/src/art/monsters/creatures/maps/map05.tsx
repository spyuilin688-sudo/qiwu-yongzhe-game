import type { CreatureDesign } from '../kit.tsx';
import { COMMON, INK, MAP05 as P } from '../palette.ts';
import { AngryEye, Blush, Crown, Detail, Eye, Leg, Limbs, Mouth, Shadow, Shine } from '../parts.tsx';
import { circles, leaf, leaves, strokes } from '../shapes.ts';

/** 第 5 圖 砂海商路：沙金、赤陶、綠松石與商旅紅布，駱駝商隊走過的路。 */
export const MAP05_DESIGNS: Readonly<Record<string, CreatureDesign>> = {
  /** 背包沙鼠：大耳朵、長尾巴，背著小背包趕路的沙鼠。 */
  'MON-05-1': (k) => {
    const fur = k.paint(P.sand);
    return (
      <>
        <Shadow x={33} w={34} />
        <Limbs d="M42 53Q54 55 56.5 45Q57.5 39.5 55 36.5" color={P.tan} w={2} />
        <path d={leaf(55, 37.5, 6.5, 4.5, -100)} fill={k.paint(P.pack)} strokeWidth={1.4} />
        <ellipse cx={25} cy={58.2} rx={4.6} ry={2.4} fill={k.paint(P.tan)} />
        <ellipse cx={36} cy={58.2} rx={4.6} ry={2.4} fill={k.paint(P.tan)} />
        <rect x={36} y={32} width={12.5} height={15} rx={3.5} fill={k.paint(P.terracotta)} />
        <path d="M36 37Q42.2 31 48.5 37V39H36Z" fill={P.clothRed} strokeWidth={1.4} />
        <rect x={40.6} y={37.6} width={3.2} height={2.6} rx={0.6} fill={COMMON.gold} strokeWidth={1} />
        <ellipse cx={31} cy={46} rx={11} ry={11.5} fill={fur} />
        <ellipse cx={27} cy={49} rx={6} ry={6.5} fill={P.turban} stroke="none" />
        <Detail d="M37 36Q32.5 42 35 50" color={P.pack} w={2.2} />
        <ellipse cx={21} cy={21.5} rx={3.8} ry={5.6} transform="rotate(-20 21 21.5)" fill={fur} />
        <ellipse cx={30} cy={21} rx={3.8} ry={5.6} transform="rotate(18 30 21)" fill={fur} />
        <path d={circles([[21, 22, 1.8], [30, 21.5, 1.8]])} fill={COMMON.blush} opacity={0.8} stroke="none" />
        <circle cx={25} cy={31} r={9} fill={fur} />
        <Shine x={28} y={25.5} rx={2.6} ry={1.3} />
        <circle cx={16.4} cy={33} r={1.6} fill={COMMON.blush} strokeWidth={1.2} />
        <Detail d="M18 35.5l-5 1.4M18.5 37l-4 2.6" w={1.1} />
        <Eye x={20.5} y={30} r={2.5} />
        <Eye x={27} y={30} r={2.5} />
        <Blush x={24} y={35.5} rx={2} />
      </>
    );
  },

  /** 小砂蠍：沙色的小蠍子，兩隻鉗子比身體還努力。 */
  'MON-05-2': (k) => {
    const shell = k.paint(P.scorpion);
    return (
      <>
        <Shadow x={34} w={42} />
        <Limbs d="M25 50l-4 8M31 51l-2 8M38 51l2 8M44 50l4 8" color="#a87038" w={1.8} />
        <path d={circles([[46, 45.5, 4.4], [51, 39.5, 3.9], [52.5, 32.5, 3.4], [49.5, 26.5, 3]])} fill={shell} />
        <path d="M47 23.5Q42 22 40.5 26.5Q44 25 46.5 27.5Z" fill={P.terracotta} strokeWidth={1.4} />
        <ellipse cx={34} cy={47} rx={13} ry={7.5} fill={shell} />
        <Detail d="M33 40Q32 47 33 54M39.5 40.5Q38.5 47 39.5 53.5" color="#9a6a32" w={1.3} />
        <Limbs d="M23 45L15 41M23.5 49L15 52" color={P.scorpion} w={2.4} />
        <path d={leaves([[14, 41, 8, 5.5, 200], [14, 41, 7.5, 5, 155], [14, 52, 8, 5.5, 205], [14, 52, 7.5, 5, 160]])} fill={shell} strokeWidth={1.6} />
        <Shine x={30} y={42.5} rx={3} ry={1.3} rotate={-10} />
        <Eye x={23} y={44} r={2.3} />
        <Eye x={28.5} y={44} r={2.3} />
        <Blush x={26} y={48.5} rx={1.8} />
      </>
    );
  },

  /** 流砂精：會走動的小沙丘，丘脊不停被風吹散成沙粒。 */
  'MON-05-3': (k) => (
    <>
      <Shadow w={48} />
      {/*
        低而寬的新月沙丘＋短而尖的丘脊：圓頂配頂部橢圓會被讀成麵包，
        高聳的捲尖又像便便表情符號，所以高度壓在身寬一半以下。
      */}
      <path d={circles([[50.5, 26, 1.3], [54.5, 24, 1.1], [53, 20.5, 0.9], [58, 22, 0.9], [57, 27.5, 0.8], [61, 25, 0.6]])} fill={P.sand} stroke="none" />
      <path
        d="M9 57.5C9 48 17 40 28 37.5C36 35.5 42 33 46.5 28C47.5 30.5 49 33.5 50.5 36.5C54 42 56 50 55 55.5C54.5 58 52 58.5 48 58.5H14C10.5 58.5 9 58.2 9 57.5Z"
        fill={k.paint(P.dune)}
      />
      {/* 波浪風紋＋細沙點：只有直線紋路時，楔形身體會被看成一塊蛋糕。 */}
      <Detail d="M39 40Q41.5 37.6 44 39.4T49 39M39 48Q42 45.4 45.5 47.4T52 47M13 54.5Q16.5 51.8 20 53.6T27 53.4" color="#b8873a" w={1.5} />
      <path d={circles([[37, 44, 0.7], [44, 43.5, 0.6], [48.5, 52.5, 0.7], [33.5, 55, 0.6], [42, 55.5, 0.7], [50.5, 43, 0.5], [16, 49.5, 0.6]])} fill="#a8783a" stroke="none" />
      <Shine x={20} y={41} rx={3.4} ry={1.5} rotate={-35} />
      <Eye x={23.5} y={45} r={2.8} />
      <Eye x={32} y={45} r={2.8} />
      <Blush x={19.5} y={50} />
      <Blush x={36.5} y={50} />
      <Mouth x={28} y={49.5} w={3.6} h={1.7} />
    </>
  ),

  /** 背貨沙鼠：背上的貨比自己還高，捲毯、木箱、陶罐全綁在一起。 */
  'ELT-05-1': (k) => {
    const fur = k.paint('#d8a55e');
    return (
      <>
        <Shadow x={34} w={50} />
        <Limbs d="M42 55Q56 57 58.5 48" color={P.tan} w={2.2} />
        <rect x={34} y={27} width={22} height={17} rx={2} fill={k.paint(P.terracotta)} />
        <rect x={36} y={14} width={18} height={13} rx={1.5} fill={k.paint(COMMON.wood)} />
        <rect x={33} y={7} width={23} height={7.4} rx={3.7} fill={k.paint(P.clothRed)} />
        <Detail d="M38 7.4V14M44.5 7.4V14M51 7.4V14" color={P.turquoise} w={1.6} />
        <Detail d={strokes([[45, 14.5, 45, 44], [34.5, 35, 55.5, 35]])} color={COMMON.rope} w={2.2} />
        <ellipse cx={22} cy={58} rx={5.6} ry={2.8} fill={fur} />
        <ellipse cx={35} cy={58} rx={5.6} ry={2.8} fill={fur} />
        <ellipse cx={28} cy={45} rx={13} ry={13} fill={fur} />
        <ellipse cx={24} cy={49} rx={7} ry={7.5} fill={P.turban} stroke="none" />
        <Detail d="M34 30Q28 38 33 50" color={P.pack} w={2.4} />
        <ellipse cx={16.5} cy={19.5} rx={4.2} ry={6.2} transform="rotate(-22 16.5 19.5)" fill={fur} />
        <ellipse cx={27} cy={18.5} rx={4.2} ry={6.2} transform="rotate(16 27 18.5)" fill={fur} />
        <circle cx={21} cy={30} r={10} fill={fur} />
        <path d="M11.5 25.5Q21 20 30.5 24.5L30.6 27.6Q21 23.5 11.8 28.6Z" fill={P.turquoise} strokeWidth={1.4} />
        <path d={leaves([[30.5, 26, 6, 3.4, 20], [30.5, 26.4, 5, 3, 55]])} fill={P.turquoise} strokeWidth={1.2} />
        <circle cx={11.4} cy={33} r={1.8} fill={COMMON.blush} strokeWidth={1.2} />
        <Detail d="M13 35.5l-5 1.4M13.5 37l-4 2.6" w={1.1} />
        <AngryEye x={16.5} y={30.5} r={2.6} inner="right" />
        <AngryEye x={23.5} y={30.5} r={2.6} inner="left" />
        <rect x={14} y={35.5} width={3.4} height={3} rx={0.6} fill={COMMON.tooth} strokeWidth={1.1} />
        <circle cx={31} cy={40} r={3} fill={fur} />
      </>
    );
  },

  /**
   * 風砂盜首：大耳沙狐當上了沙盜頭子，蒙眼布被風吹得獵獵作響，彎刀指向商隊。
   * 刻意畫成動物而非纏頭巾的人類：人形沙漠盜匪容易落入族裔刻板印象（港灣的人形怪也改成海藻膚色）。
   */
  'ELT-05-2': (k) => {
    const fur = k.paint(P.fox);
    const cream = P.turban;
    return (
      <>
        <Shadow w={48} />
        <Detail d="M8 58Q18 54 28 58Q40 62 54 56" color={P.sand} w={1.8} opacity={0.8} />
        <path d="M36 27Q53 31 59 51Q51 48 47 53Q43 47 38 51Z" fill={k.paint(P.clothRed)} />
        <path d={leaf(40, 47, 21, 8, -38)} fill={fur} />
        <path d={leaf(50.5, 40.5, 8.6, 3.6, -38)} fill={cream} strokeWidth={1.4} />
        <Leg x={26} top={47} w={6.5} fill={k.paint('#5a4a6a')} />
        <Leg x={37} top={47} w={6.5} fill={k.paint('#5a4a6a')} />
        <path d="M20 30Q19 50 24 50H40Q44 50 43 30Q41 25 32 25Q22 25 20 30Z" fill={k.paint(cream)} />
        <rect x={19.5} y={39.5} width={24} height={4.6} rx={2} fill={P.clothRed} strokeWidth={1.6} />
        <path d="M16 40Q4 37 1.5 26Q8 32.5 17 36Z" fill={k.paint(COMMON.steel)} strokeWidth={1.6} />
        <rect x={15} y={36.4} width={4} height={4.4} rx={1} fill={COMMON.gold} strokeWidth={1.2} />
        <circle cx={19} cy={40} r={2.8} fill={fur} />
        <path d={leaves([[26, 13, 11, 5, -112], [35.5, 12, 11, 5, -68]])} fill={fur} />
        <path d={leaves([[26, 13, 7.5, 2.4, -112], [35.5, 12, 7.5, 2.4, -68]])} fill={COMMON.blush} stroke="none" />
        <circle cx={31} cy={19.5} r={9} fill={fur} />
        <ellipse cx={27} cy={24.5} rx={5.4} ry={3.2} fill={cream} stroke="none" />
        <path d={leaf(25.5, 22, 10.5, 3.8, 172)} fill={k.paint(cream)} strokeWidth={1.6} />
        <circle cx={15.4} cy={23.3} r={1.7} fill={INK} stroke="none" />
        {/* 蒙眼布是「盜」的辨識符號；布尾往後飄，同時交代「風砂」。 */}
        <path d={leaves([[39.5, 16.5, 10, 2.8, -12], [39.5, 17.5, 8.5, 2.4, 22]])} fill={k.paint(P.turquoise)} strokeWidth={1.4} />
        <path d="M21.6 15.6Q31 12.4 40.6 15.2L40.2 20.8Q31 18.4 22 21.2Z" fill={k.paint(P.turquoise)} />
        <AngryEye x={26.6} y={18.4} r={2.5} inner="right" />
        <AngryEye x={33.8} y={18} r={2.5} inner="left" />
      </>
    );
  },

  /** 琉砂甲蠍：甲殼燒成了綠松色琉璃，尾針是一根水晶。 */
  'ELT-05-3': (k) => {
    const glass = k.paint(P.turquoise);
    return (
      <>
        <Shadow x={33} w={58} />
        <Limbs d="M24 50l-5 9M31 52l-2 8M38 52l2 8M45 50l5 9" color="#2f6a6a" w={2.2} />
        <path d={circles([[48, 43.5, 5], [54, 35.5, 4.6], [55, 26.5, 4.2], [51, 19, 3.6]])} fill={glass} />
        <circle cx={43} cy={15} r={6} fill={k.glow(P.glass)} stroke="none" />
        <path d="M48 16.5L38.5 12L41.5 20.5Z" fill={k.paint('#bff4f6')} strokeWidth={1.4} />
        <ellipse cx={33} cy={46} rx={16} ry={9} fill={glass} />
        <path d="M33 37.5L38 40.5L33 43.5L28 40.5Z" fill="#bff4f6" strokeWidth={1.3} />
        <Detail d="M41 37.5Q40 46 41.5 54.5M25 38.5Q24 46 25 53.5" color="#22605e" w={1.4} />
        <Shine x={37} y={40.5} rx={3} ry={1.1} rotate={-15} opacity={0.85} />
        <Shine x={46} y={44} rx={1.8} ry={0.9} rotate={-25} opacity={0.85} />
        <Limbs d="M20 45L12 41M21 50L12 52" color={P.turquoise} w={2.6} />
        <path d={leaves([[12, 41, 10, 7, 200], [12, 41, 9, 6, 152], [12, 52, 10, 7, 208], [12, 52, 9, 6, 162]])} fill={glass} strokeWidth={1.6} />
        <AngryEye x={21} y={43} r={2.6} inner="right" />
        <AngryEye x={27.2} y={43} r={2.6} inner="left" />
      </>
    );
  },

  /** 迷路駝王：戴歪王冠的駱駝王，帶著商隊繞了三天還在原地。 */
  'ELT-05-4': (k) => {
    const hide = k.paint(P.camel);
    return (
      <>
        <Shadow x={35} w={50} />
        <Limbs d="M27 46V58.5M33 47V58.5M44 47V58.5M50 46V58.5" color={P.camel} w={3} />
        <circle cx={31.5} cy={33} r={7.5} fill={hide} />
        <circle cx={44} cy={32} r={7.5} fill={hide} />
        <ellipse cx={38} cy={42} rx={17} ry={8.5} fill={hide} />
        <path d="M34 35.5Q37.8 32.5 41.5 35.5L44 47H31.5Z" fill={k.paint(P.clothRed)} strokeWidth={1.6} />
        <Detail d="M32 46H43.5" color={P.turquoise} w={2} />
        <path d={circles([[32.5, 49, 1.2], [37.8, 49, 1.2], [43, 49, 1.2]])} fill={COMMON.gold} strokeWidth={0.9} />
        <path d="M25 45Q14.5 41 13 25.5L19.5 24Q20.5 36 28.5 38Z" fill={hide} />
        <path d={leaf(16.5, 18.5, 6, 4, -60)} fill={hide} strokeWidth={1.4} />
        <ellipse cx={13.5} cy={22.5} rx={7.5} ry={5.6} fill={hide} />
        <ellipse cx={8} cy={24.5} rx={4} ry={3.4} fill={k.paint('#e8c898')} />
        <Detail d="M5 26.5Q7 27.6 9 26.6" w={1.3} />
        <Crown x={14.5} y={18} w={9} h={6} rotate={-16} />
        <AngryEye x={13} y={21.5} r={2.3} inner="left" />
        <Detail d="M24.5 11.5a2.4 2.4 0 1 1 2.4 2.4a1.2 1.2 0 0 1 -1.2 -1.2" color={COMMON.white} w={1.3} />
        <Shine x={30} y={29} rx={2.4} ry={1.2} />
      </>
    );
  },

  /** 古井沙靈：從乾涸古井裡升起的沙之靈，眼裡還留著井水的綠光。 */
  'ELT-05-5': (k) => {
    const stone = k.paint(P.well);
    return (
      <>
        <Shadow w={46} />
        <ellipse cx={32} cy={42} rx={20} ry={4.6} fill={k.paint('#c8bca8')} />
        <ellipse cx={32} cy={42} rx={16} ry={2.8} fill="#3a2e24" strokeWidth={1.4} />
        <path d={leaves([[23, 33, 13, 6.5, 200], [41, 31, 12, 6.5, -28]])} fill={k.paint('#e8c88a')} strokeWidth={1.8} />
        <path d="M20.5 44C18.5 32 20 17.5 32 13C44 17.5 45.5 32 43.5 44Z" fill={k.paint('#e8c88a')} />
        <Detail d="M25 41Q30 37 36 40M27 34Q32 31 38 33" color="#b8873a" w={1.4} />
        <circle cx={27} cy={25} r={5} fill={k.glow('#7ff0e0')} stroke="none" />
        <circle cx={36} cy={25} r={5} fill={k.glow('#7ff0e0')} stroke="none" />
        <AngryEye x={27} y={25} r={3} iris="#9ff8ec" inner="right" />
        <AngryEye x={36} y={25} r={3} iris="#9ff8ec" inner="left" />
        <ellipse cx={31.5} cy={31.5} rx={2} ry={2.6} fill="#5a3a22" stroke="none" />
        <path d="M12 42Q12 46.6 32 46.6Q52 46.6 52 42V58Q52 60 50 60H14Q12 60 12 58Z" fill={stone} />
        <Detail d="M12.5 53H51.5M21 47V53M33 47.4V53M44 47V53M16 53V59.5M27 53V59.5M39 53V59.5M48 53V59.5" color="#6f6454" w={1.2} />
        <Shine x={18} y={50} rx={2.6} ry={1.1} rotate={0} opacity={0.4} />
        <path d={circles([[50, 34, 0.9], [53, 38, 0.8], [11, 36, 0.8]])} fill={P.sand} stroke="none" />
        <path d={leaf(46.5, 46, 6, 3, 75)} fill={P.dune} strokeWidth={1.2} />
      </>
    );
  },
};
