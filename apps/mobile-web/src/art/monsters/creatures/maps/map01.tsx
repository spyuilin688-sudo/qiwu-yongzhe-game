import type { CreatureDesign } from '../kit.tsx';
import { COMMON, INK, MAP01 as P } from '../palette.ts';
import { AngryEye, Blush, Detail, Eye, Leg, Scar, Shadow, Shine, Smile } from '../parts.tsx';
import { circles, leaf, leaves, ring, strokes } from '../shapes.ts';

/** 第 1 圖 蘆風原野：嫩綠、稻草黃、泥土褐、果實紅，最親切的入門生態。 */
export const MAP01_DESIGNS: Readonly<Record<string, CreatureDesign>> = {
  /** 糰葉怪：葉片捲成的球，頭頂一株嫩芽。 */
  'MON-01-1': (k) => (
    <>
      <Shadow w={32} />
      <Leg x={25} top={51} w={6} fill={k.paint(P.soil)} />
      <Leg x={37} top={51} w={6} fill={k.paint(P.soil)} />
      <path d="M33 25Q33 19 36.5 16" fill="none" strokeWidth={2.2} />
      <path d={leaves([[36, 17, 10, 6, -25], [33.5, 19.5, 7, 4.5, -150]])} fill={k.paint(P.leaf)} strokeWidth={1.6} />
      <path d={ring(31, 40, 14.5, 18, 9, -80, 'point')} fill={k.paint(P.leaf)} />
      <Detail d="M41 27Q42 33 47.5 35.5M43.5 45Q46 48.5 45.5 53M33 54Q28 52 23 54.5" color={P.leafDeep} w={1.8} />
      <Shine x={23} y={30} rx={3.6} ry={1.8} />
      <Eye x={23.5} y={40} r={3} />
      <Eye x={33} y={40} r={3} />
      <Blush x={19.5} y={45.5} />
      <Blush x={37} y={45.5} />
      <Smile x={28.3} y={44.5} w={4} />
    </>
  ),

  /** 撞果豬：蘋果圓身的小豬，低頭往前衝，背上還帶著果蒂。 */
  'MON-01-2': (k) => {
    const legs = k.paint(P.pink);
    return (
      <>
        <Shadow x={34} w={34} />
        <path d={circles([[56, 55.5, 2.6], [60.5, 52.5, 1.8]])} fill={P.cream} opacity={0.75} stroke="none" />
        <Detail d={strokes([[54, 35, 61, 35], [55, 41, 60, 41]])} color={P.cream} w={1.8} opacity={0.8} />
        <Leg x={42} top={49} w={5.5} fill={legs} />
        <Leg x={48} top={48} w={5.5} fill={legs} />
        <Leg x={24} top={49} w={5.5} fill={legs} />
        <Leg x={30} top={50} w={5.5} fill={legs} />
        <path d="M37 25.5Q38 21 37 18" fill="none" strokeWidth={2.4} stroke={COMMON.wood} />
        <path d={leaf(37.5, 20, 10, 5.5, -25)} fill={k.paint(P.leaf)} strokeWidth={1.6} />
        <path d={leaves([[25, 30, 8, 6, -120], [31, 27.5, 8, 6, -95]])} fill={k.paint(P.pink)} strokeWidth={1.6} />
        <path
          d="M37 26.5C43 21.5 53 24.5 53 36.5C53 48 45 54.5 36.5 53.5C27 54.5 19.5 48 19.5 37C19.5 25 30.5 21.5 37 26.5Z"
          fill={k.paint(P.fruit)}
        />
        <path d={circles([[45, 40, 0.9], [48, 34, 0.9], [44, 46, 0.9], [40, 33, 0.8]])} fill={COMMON.white} opacity={0.55} stroke="none" />
        <Shine x={28} y={30.5} rx={4} ry={2} />
        <ellipse cx={17.5} cy={42.5} rx={5} ry={4.2} fill={k.paint(P.pink)} />
        <path d={circles([[16, 42.3, 0.95], [19.2, 42.3, 0.95]])} fill={INK} stroke="none" />
        <path d="M22.5 47.5Q21.5 44.6 19.5 43.8Q22.6 43.8 24.2 46.8Z" fill={COMMON.tooth} strokeWidth={1} />
        <Eye x={24.5} y={36} r={2.7} />
        <Eye x={31} y={36.5} r={2.6} />
      </>
    );
  },

  /** 紙帽雞：圓滾滾的小雞，頭戴一頂報紙摺成的帽子。 */
  'MON-01-3': (k) => {
    const foot = k.paint(COMMON.gold);
    return (
      <>
        <Shadow x={34} w={28} />
        <Leg x={30} top={53} w={3} fill={foot} />
        <Leg x={37.5} top={53} w={3} fill={foot} />
        <rect x={26.5} y={58} width={6} height={2.6} rx={1.3} fill={foot} strokeWidth={1.6} />
        <rect x={34} y={58} width={6} height={2.6} rx={1.3} fill={foot} strokeWidth={1.6} />
        <path d={leaves([[45, 39, 9, 6, -40], [46, 42, 8, 5, -10]])} fill={k.paint(P.cream)} strokeWidth={1.6} />
        <ellipse cx={34} cy={43} rx={13.5} ry={13} fill={k.paint(P.cream)} />
        <path d={leaf(35, 43.5, 11, 8, 18)} fill={k.paint('#eddcb8')} strokeWidth={1.6} />
        <circle cx={22.5} cy={31.5} r={2.4} fill={COMMON.ruby} strokeWidth={1.6} />
        <polygon points="20.5,31.5 33.5,12.5 46.5,30" fill={k.paint('#f4efe4')} />
        <polygon points="19.5,29.5 47,27.5 47.5,32 20,34" fill={k.paint('#e3dccb')} />
        <Detail d={strokes([[29, 21.5, 35, 21], [27.5, 25, 37.5, 24.5]])} color="#8f97a3" w={1.2} />
        <path d="M21.5 38.5L14.5 41.5L21.5 44.5Z" fill={COMMON.gold} strokeWidth={1.6} />
        <ellipse cx={21.5} cy={46.5} rx={1.6} ry={2.2} fill={COMMON.ruby} strokeWidth={1.2} />
        <Shine x={29} y={35} rx={3} ry={1.6} />
        <Eye x={25.5} y={38.5} r={2.6} />
        <Eye x={31.5} y={39} r={2.4} />
        <Blush x={31} y={44} />
      </>
    );
  },

  /** 草帽雞長：雞群的頭頭，戴寬邊草帽、翹著三根大尾羽。 */
  'ELT-01-1': (k) => {
    const foot = k.paint(COMMON.gold);
    return (
      <>
        <Shadow x={33} w={42} />
        <path d={leaves([[43, 36, 19, 9, -62], [46, 38, 18, 9, -32], [46, 42, 15, 8, -4]])} fill={k.paint(P.tailGreen)} />
        <Leg x={28} top={52} w={4} fill={foot} />
        <Leg x={38} top={52} w={4} fill={foot} />
        <path d={strokes([[23, 60, 32, 60], [33, 60, 42, 60]])} fill="none" stroke={COMMON.gold} strokeWidth={2.6} />
        <ellipse cx={34} cy={40} rx={18} ry={15.5} fill={k.paint(P.chestnut)} />
        <ellipse cx={26} cy={45} rx={8.5} ry={8.5} fill={P.cream} stroke="none" />
        <path d={leaf(36, 39, 16, 11, 16)} fill={k.paint('#a4532e')} strokeWidth={1.8} />
        <Detail d="M41 38Q45 41 48 41M40 42Q44 45 47 45" color={INK} w={1.2} opacity={0.6} />
        <circle cx={20} cy={28} r={9.5} fill={k.paint(P.chestnut)} />
        <path d="M12.5 25L4.5 28.5L12.5 32Z" fill={COMMON.gold} strokeWidth={1.8} />
        <path d="M12 33Q13.5 39 16.5 35.5Z" fill={COMMON.ruby} strokeWidth={1.4} />
        <ellipse cx={21} cy={19.5} rx={15} ry={3.8} fill={k.paint(P.straw)} />
        <path d="M13.5 19.5Q13.5 9.5 21 9.5Q28.5 9.5 28.5 19.5Z" fill={k.paint(P.straw)} />
        <path d="M13.7 16.5Q21 18.5 28.3 16.5L28.4 19.4Q21 21 13.6 19.4Z" fill={COMMON.ruby} strokeWidth={1.4} />
        <Detail d="M9 20Q11 21 13 20.8M29 20.8Q31 21 33 20" color="#a8823a" w={1.1} />
        <AngryEye x={16.5} y={26} r={3} inner="left" />
        <Shine x={23} y={25} rx={2.2} ry={1.3} />
      </>
    );
  },

  /** 尖牙野豬：鬃毛倒豎、一對彎獠牙，臉上帶著舊傷。 */
  'ELT-01-2': (k) => {
    const dark = k.paint('#5a3a28');
    return (
      <>
        <Shadow x={34} w={50} />
        <polygon points="22,32 25,22 29,27 33,18 37,25 41,17 44,25 48,20 49,28 54,25 54,36 22,36" fill={k.paint('#4a2f20')} />
        <Leg x={44} top={47} w={6.5} fill={dark} />
        <Leg x={51} top={46} w={6.5} fill={dark} />
        <ellipse cx={39} cy={39} rx={19} ry={13.5} fill={k.paint(P.boar)} />
        <Leg x={25} top={47} w={6.5} fill={dark} />
        <Leg x={33} top={49} w={6.5} fill={dark} />
        <path d={leaf(22, 31, 10, 7, -70)} fill={k.paint(P.boar)} strokeWidth={1.8} />
        <circle cx={19} cy={40} r={11} fill={k.paint(P.boar)} />
        <ellipse cx={9.5} cy={44} rx={4.6} ry={4.4} fill={k.paint('#c88a6a')} />
        <path d={circles([[8, 43.5, 0.9], [11, 43.5, 0.9]])} fill={INK} stroke="none" />
        <path d="M14.5 48C10 47.5 7.5 42.5 9 36.5C10.5 41 13 43.5 17.5 44.5Z" fill={COMMON.tooth} strokeWidth={1.6} />
        <AngryEye x={16.5} y={36.5} r={3.1} iris={COMMON.eliteRed} inner="left" />
        <Scar x1={21} y1={31} x2={26} y2={40} />
        <Shine x={42} y={30} rx={5} ry={2} rotate={-10} opacity={0.4} />
      </>
    );
  },

  /** 暴走磨輪：掙脫磨坊的石磨，咬牙往前滾。 */
  'ELT-01-3': (k) => (
    <>
      <Shadow x={34} w={44} />
      <path d={circles([[53, 56, 3], [58.5, 52.5, 2.3], [61, 57, 1.6]])} fill={P.cream} opacity={0.7} stroke="none" />
      <Detail d={strokes([[56, 22, 62, 22], [57.5, 31, 62.5, 31], [57, 40, 62, 40]])} color={P.cream} w={2} opacity={0.85} />
      <polygon points="35,33 55,11 59,14.5 56.5,15 58.5,17.5 39,38" fill={k.paint(COMMON.wood)} />
      <circle cx={32} cy={36} r={22.5} fill={k.paint(P.stone)} />
      <circle cx={32} cy={36} r={16} fill="none" stroke="#7d796e" strokeWidth={1.6} />
      <Detail d={strokes([[32, 13.5, 32, 20], [48.5, 27, 53.5, 24], [50, 45, 54, 47.5], [12, 46, 16.2, 43.5], [12.5, 25.5, 17, 28]])} color="#7d796e" w={1.6} />
      <rect x={30} y={34} width={4.4} height={4.4} rx={0.8} fill={INK} stroke="none" />
      <AngryEye x={23} y={30.5} r={3.3} inner="right" />
      <AngryEye x={37.5} y={30.5} r={3.3} inner="left" />
      <rect x={22} y={42} width={15} height={5.5} rx={1.6} fill={COMMON.tooth} strokeWidth={1.6} />
      <Detail d={strokes([[25.8, 42, 25.8, 47.5], [29.5, 42, 29.5, 47.5], [33.2, 42, 33.2, 47.5], [22, 44.75, 37, 44.75]])} w={1} />
      <Detail d="M46 18L43 23L46 26M15 49L19 52" w={1.4} />
      <Shine x={19} y={21} rx={4.2} ry={2} rotate={-40} opacity={0.5} />
    </>
  ),

  /** 石背河龜：殼上長著河石與青苔，脾氣跟石頭一樣硬。 */
  'ELT-01-4': (k) => {
    const skin = k.paint(P.turtle);
    return (
      <>
        <Shadow x={36} w={52} />
        <Leg x={50} top={47} w={8} fill={skin} />
        <rect x={10} y={35} width={12} height={9} rx={4} fill={skin} />
        <path d="M17 50C17 28 28 15 39.5 15C51.5 15 61 29 60.5 50Z" fill={k.paint('#7c7464')} />
        <path
          d="M22 40Q22 31 29 30Q34 31 33.5 38Q32 43 26 43Q22 43 22 40ZM35 26Q37 19 44 19.5Q49 21 48 27Q46 31 40 31Q35 30 35 26ZM37 41Q38 34 45 34Q52 35 52.5 41Q51 46 44 46Q37 46 37 41Z"
          fill={k.paint(P.stone)}
          strokeWidth={1.6}
        />
        <path d={circles([[33, 19.5, 2.6], [37.5, 17.5, 2.2], [52, 26, 2.4], [24.5, 29, 2]])} fill={k.paint(P.moss)} strokeWidth={1.4} />
        <rect x={14} y={46} width={49} height={6} rx={3} fill={k.paint('#c9b48a')} />
        <Leg x={24} top={49} w={8} fill={skin} />
        <circle cx={12} cy={36} r={8} fill={skin} />
        <AngryEye x={9.5} y={34} r={2.8} inner="left" />
        <path d="M4.5 39.5Q8 41.5 11.5 40" fill="none" strokeWidth={1.5} />
        <Shine x={30} y={22} rx={4} ry={1.8} rotate={-35} opacity={0.35} />
      </>
    );
  },

  /** 牧草巨羊：羊毛蓬成一朵雲，身上插滿乾草，一對捲角。 */
  'ELT-01-5': (k) => {
    const leg = k.paint(P.faceBrown);
    return (
      <>
        <Shadow x={36} w={50} />
        <Leg x={23} top={50} w={5.5} fill={leg} />
        <Leg x={30} top={51} w={5.5} fill={leg} />
        <Leg x={43} top={51} w={5.5} fill={leg} />
        <Leg x={50} top={50} w={5.5} fill={leg} />
        <path d={ring(37, 33, 18, 22, 11, 10, 'round')} fill={k.paint(P.wool)} />
        <Detail d={strokes([[44, 17, 46, 11.5], [47, 18, 51, 14], [53, 33, 58.5, 31], [52, 37, 57.5, 38], [41, 50, 43, 55]])} color={P.leafDeep} w={1.8} />
        <Detail d={strokes([[49, 23, 55, 21.5], [36, 16, 38, 11], [46, 45, 51, 49]])} color="#c9a13f" w={1.8} />
        <path d={leaf(12, 30, 8, 5, 200)} fill={k.paint(P.faceBrown)} strokeWidth={1.6} />
        <ellipse cx={17} cy={37} rx={8} ry={10} fill={k.paint(P.faceBrown)} />
        <circle cx={23.5} cy={30} r={5.5} fill={k.paint(P.horn)} />
        <Detail d="M23.5 27.5A2.6 2.6 0 1 1 21 31" w={1.4} />
        <path d={ring(18, 27.5, 4, 5.5, 6, 0, 'round')} fill={k.paint(P.wool)} strokeWidth={1.6} />
        <AngryEye x={13.5} y={36} r={2.6} inner="right" />
        <AngryEye x={20} y={36.5} r={2.4} inner="left" />
        <path d="M15 43.5Q16.7 45 18.4 43.5" fill="none" stroke={P.pink} strokeWidth={1.6} />
        <Shine x={36} y={18} rx={5} ry={2} rotate={-15} opacity={0.6} />
      </>
    );
  },
};
