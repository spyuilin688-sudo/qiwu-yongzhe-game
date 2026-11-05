import type { CreatureDesign } from '../kit.tsx';
import { COMMON, INK, MAP09 as P } from '../palette.ts';
import { AngryEye, Blush, Detail, Eye, Leg, Limbs, Shadow, Shine, Smile, WindKey } from '../parts.tsx';
import { circles, gear, leaf, leaves, ring, star } from '../shapes.ts';

/** 第 9 圖 發條王城：黃銅、青銅、琺瑯青與皇家紅，整座城都在滴答作響。 */
export const MAP09_DESIGNS: Readonly<Record<string, CreatureDesign>> = {
  /** 發條鼠（王城）：全黃銅打造的機械鼠，耳朵是兩枚齒輪、腳是小輪子。 */
  'MON-09-1': (k) => (
    <>
      <Shadow x={30} w={34} />
      <Detail d="M47 51l2.6 -2.6l2.4 2.8l2.6 -2.6l2.4 2.8" color={P.steel} w={1.8} />
      <WindKey x={45} y={40} fill={P.copper} />
      <path d={gear(25, 29.5, 4.6, 8, 2)} fill={k.paint(P.copper)} strokeWidth={1.6} />
      <path d={gear(35, 28.5, 4.2, 8, 1.8, 10)} fill={k.paint(P.copper)} strokeWidth={1.6} />
      <path d="M10 48.5C12 39 22 33.5 32 33.5C43 33.5 49 40.5 49 48.5V52.5H12.5Q10 52.5 10 48.5Z" fill={k.paint(P.brass)} />
      <Detail d="M32 34V52M40.5 36V52" color="#9a7426" w={1.2} />
      <path d={circles([[25, 29.5, 1.4], [35, 28.5, 1.3], [35.5, 38, 0.9], [44.5, 42, 0.9], [36, 48, 0.9], [44.5, 48.5, 0.9]])} fill="#7a5a20" stroke="none" />
      <circle cx={23} cy={56.5} r={3.6} fill={k.paint(P.steel)} />
      <circle cx={39} cy={56.5} r={3.6} fill={k.paint(P.steel)} />
      <circle cx={10.6} cy={47.6} r={2} fill={P.royal} strokeWidth={1.2} />
      <Detail d="M13 50.5l-5 1.6M13.5 52l-4 2.8" color={P.steel} w={1.1} />
      <Shine x={27} y={37.5} rx={3.4} ry={1.4} rotate={-15} />
      <Eye x={18.5} y={43} r={2.4} />
      <Eye x={24.5} y={42.5} r={2.4} />
      <Blush x={22} y={48} rx={1.8} />
    </>
  ),

  /** 小銅兵：上了發條就會踢正步的玩具兵，臉頰塗著兩團紅漆。 */
  'MON-09-2': (k) => (
    <>
      <Shadow w={28} />
      <Limbs d="M19.5 53L17.5 21" color={COMMON.wood} w={1.8} />
      <path d="M17.2 15L19 21.5L15.8 21.6Z" fill={P.steel} strokeWidth={1.4} />
      <Leg x={28} top={50} w={5} fill={k.paint(P.navy)} />
      <Leg x={36} top={50} w={5} fill={k.paint(P.navy)} />
      <path d={circles([[27.6, 58.8, 2.4], [36.4, 58.8, 2.4]])} fill="#2a2a34" strokeWidth={1.4} />
      <Limbs d="M24 38L19.5 45M40 38L44 44" color={P.royal} w={3} />
      <rect x={23} y={34} width={18} height={18} rx={4} fill={k.paint(P.royal)} />
      <Detail d="M24.5 35.5L39.5 50.5" color={COMMON.white} w={2} />
      <path d={circles([[32, 39, 0.9], [32, 44, 0.9]])} fill={P.brass} stroke="none" />
      <path d={circles([[19.5, 45.5, 2.2], [44.2, 44.5, 2.2]])} fill={k.paint(P.bronze)} strokeWidth={1.4} />
      <circle cx={32} cy={27} r={7.5} fill={k.paint(P.bronze)} />
      <rect x={25} y={11.5} width={14} height={12} rx={2} fill={k.paint(P.navy)} />
      <rect x={24} y={22} width={16} height={2.6} rx={1.2} fill={INK} stroke="none" />
      <path d={leaf(32, 12, 7, 4, -90)} fill={P.plume} strokeWidth={1.3} />
      <circle cx={32} cy={17} r={1.8} fill={P.brass} strokeWidth={1} />
      <Eye x={29.2} y={27.6} r={2.2} />
      <Eye x={34.6} y={27.6} r={2.2} />
      <path d={circles([[27, 31, 1.4], [37, 31, 1.4]])} fill={P.royal} opacity={0.7} stroke="none" />
      <Smile x={31.6} y={31} w={2.6} depth={1} />
    </>
  ),

  /** 齒輪蟲：背殼是一枚還在轉的大齒輪，靠三對細腳慢慢爬。 */
  'MON-09-3': (k) => (
    <>
      <Shadow x={34} w={38} />
      <Limbs d="M28 50l-3 9M36 52v7.5M44 50l3 9" color={P.steel} w={1.8} />
      <path d={gear(37, 40, 12, 10, 3)} fill={k.paint(P.brass)} />
      <circle cx={37} cy={40} r={6} fill="none" stroke="#9a7426" strokeWidth={1.4} />
      <circle cx={37} cy={40} r={3.4} fill={P.teal} strokeWidth={1.4} />
      <Shine x={31} y={33} rx={3} ry={1.4} rotate={-40} />
      <Detail d="M16.5 39l-2.4 -3.4l2.4 -1.6l-2.4 -3.4M21.5 38.6l0.4 -3.4l2.2 0.2l0.4 -3.6" color={P.steel} w={1.3} />
      <circle cx={19} cy={45} r={7} fill={k.paint(P.steel)} />
      <Eye x={16} y={44.5} r={2.3} />
      <Eye x={21.4} y={44.5} r={2.3} />
      <Smile x={18.5} y={48.6} w={2.8} depth={1.1} />
    </>
  ),

  /** 銅門衛兵：舉著城門造型的塔盾、扛長戟守在宮門前的青銅兵。 */
  'ELT-09-1': (k) => {
    const bronze = k.paint(P.bronze);
    return (
      <>
        <Shadow w={52} />
        <Limbs d="M52.5 58.5L50.5 7" color={COMMON.wood} w={2.6} />
        <path d="M50.6 11Q58.5 12.5 58.5 21Q54.5 17.6 51 18.6Z" fill={k.paint(P.steel)} strokeWidth={1.6} />
        <path d="M50.2 2L52.4 8.4H48.6Z" fill={P.steel} strokeWidth={1.4} />
        <Leg x={27} top={48} w={8} fill={bronze} />
        <Leg x={38} top={48} w={8} fill={bronze} />
        <path d="M18 30Q17 50 22 51H43Q48 50 47 30Q45 24 32.5 24Q20 24 18 30Z" fill={bronze} />
        <Detail d="M32.5 25V50M21 38H44" color="#7a4a20" w={1.3} />
        <circle cx={49} cy={36} r={3.6} fill={bronze} />
        <path d={leaves([[32, 8, 10, 5, -150], [32, 8, 10, 5, -110]])} fill={P.royal} strokeWidth={1.4} />
        <circle cx={32} cy={17} r={9} fill={bronze} />
        <rect x={23.6} y={14.6} width={16} height={5.6} rx={2.8} fill="#2a1c12" />
        <AngryEye x={28} y={17.6} r={2.2} inner="right" />
        <AngryEye x={35} y={17.6} r={2.2} inner="left" />
        <path d="M5 55V36Q5 26 15.5 26Q26 26 26 36V55Z" fill={k.paint('#8a5a2a')} />
        <Detail d="M10.5 30V54M15.5 26.6V54M20.5 30V54" color={P.brass} w={1.6} />
        <circle cx={15.5} cy={41} r={2.4} fill={P.brass} strokeWidth={1.3} />
      </>
    );
  },

  /** 齒輪蜘蛛：齒輪腹、八隻關節腳，紅色複眼一排亮起。 */
  'ELT-09-2': (k) => (
    <>
      <Shadow w={58} />
      <Limbs d="M26 36L15 27L6 41M27 40L15 38L8 51M38 36L49 27L58 41M37 40L49 38L56 51M29 44L23 49L18 59M35 44L41 49L46 59" color={P.steel} w={2.2} />
      <path d={circles([[15, 27, 1.8], [15, 38, 1.8], [49, 27, 1.8], [49, 38, 1.8], [23, 49, 1.6], [41, 49, 1.6]])} fill={P.brass} strokeWidth={1.2} />
      <path d={gear(33, 36, 11, 12, 2.8)} fill={k.paint(P.brass)} />
      <circle cx={33} cy={36} r={5} fill={k.paint(P.teal)} strokeWidth={1.6} />
      <Shine x={28} y={30} rx={3} ry={1.3} rotate={-40} />
      <circle cx={21.5} cy={42} r={6.5} fill={k.paint(P.steel)} />
      <AngryEye x={19} y={42} r={2.1} iris={COMMON.eliteRed} inner="right" />
      <AngryEye x={24.2} y={42} r={2.1} iris={COMMON.eliteRed} inner="left" />
      <path d={circles([[20.2, 38.4, 0.9], [23.6, 38.4, 0.9]])} fill={COMMON.eliteRed} stroke="none" />
    </>
  ),

  /** 蒸汽清道夫：煙囪噴著蒸汽、前方滾刷轉個不停的清掃機器。 */
  'ELT-09-3': (k) => (
    <>
      <Shadow w={54} />
      <path d={circles([[42, 8, 3.6], [47.5, 5, 2.6], [37.6, 4, 2.2]])} fill={P.steam} opacity={0.9} strokeWidth={1.3} />
      <rect x={38} y={10} width={6.5} height={12} rx={1} fill={k.paint(P.steel)} />
      <rect x={14} y={20} width={36} height={28} rx={6} fill={k.paint(P.teal)} />
      <rect x={18} y={25.5} width={19} height={11.5} rx={3} fill="#1f2f40" />
      <AngryEye x={23} y={31.4} r={2.6} iris={COMMON.eliteIce} inner="right" />
      <AngryEye x={31.4} y={31.4} r={2.6} iris={COMMON.eliteIce} inner="left" />
      <path d={circles([[42.5, 28, 1], [42.5, 33, 1], [42.5, 38, 1], [20, 43, 1], [40, 43, 1]])} fill={P.brass} stroke="none" />
      <Limbs d="M17 40L10 49" color={P.steel} w={2.6} />
      <rect x={12} y={46} width={40} height={10.5} rx={5.25} fill={k.paint('#5a6470')} />
      <path d={circles([[19, 51.2, 2.6], [28.5, 51.2, 2.6], [38, 51.2, 2.6], [47, 51.2, 2.6]])} fill={P.brass} strokeWidth={1.3} />
      <path d={ring(9, 53, 4, 7, 10, 0, 'point')} fill={k.paint('#c9a04a')} strokeWidth={1.4} />
      <circle cx={9} cy={53} r={2} fill={P.steel} strokeWidth={1.2} />
      <Shine x={19} y={22.5} rx={3} ry={1.2} opacity={0.5} />
    </>
  ),

  /** 發條將軍：背插大發條、肩掛金穗的機械將軍，舉軍刀下令衝鋒。 */
  'ELT-09-4': (k) => (
    <>
      <Shadow w={50} />
      <WindKey x={44} y={36} scale={1.3} fill={P.brass} />
      <Leg x={27} top={48} w={7} fill={k.paint(P.navy)} />
      <Leg x={38} top={48} w={7} fill={k.paint(P.navy)} />
      <path d={circles([[26.5, 58.6, 3], [38.5, 58.6, 3]])} fill="#2a2a34" strokeWidth={1.4} />
      <path d="M19 30Q17 52 22 52H43Q48 52 46 30Q44 25 32.5 25Q21 25 19 30Z" fill={k.paint(P.royal)} />
      <Detail d="M22 28L42 47" color={P.teal} w={3} />
      <path d={star(37, 34, 2.6, 1.1)} fill={P.brass} strokeWidth={1} />
      <circle cx={40.5} cy={38.5} r={1.6} fill={P.brass} strokeWidth={1} />
      <ellipse cx={19.5} cy={28} rx={5.6} ry={3} fill={k.paint(P.brass)} />
      <ellipse cx={45} cy={28} rx={5.6} ry={3} fill={k.paint(P.brass)} />
      <Detail d="M15.5 31v2.4M18.5 31.4v2.4M21.5 31.4v2.4" color={P.brass} w={1.2} />
      <path d="M16 36L3.5 18L5.6 16.8L18 34Z" fill={k.paint(P.steel)} strokeWidth={1.6} />
      <circle cx={17} cy={36} r={3} fill={COMMON.white} strokeWidth={1.6} />
      <path d={leaves([[32, 6, 12, 5.6, -120], [32, 6, 11, 5, -80]])} fill={P.plume} strokeWidth={1.4} />
      <circle cx={32} cy={17} r={8.5} fill={k.paint(P.brass)} />
      <path d="M23 13Q23 5 32 5Q41 5 41 13Z" fill={k.paint(P.navy)} />
      <AngryEye x={28.2} y={16.6} r={2.4} inner="right" />
      <AngryEye x={35.8} y={16.6} r={2.4} inner="left" />
      <path d="M24.5 21.5Q28.5 19.5 32 21.4Q35.5 19.5 39.5 21.5Q36 24.2 32 22.6Q28 24.2 24.5 21.5Z" fill="#3a2a22" strokeWidth={1.1} />
    </>
  ),

  /** 失控星盤：皇家天文台的星盤失控浮起，中央的星眼到處亂瞪。 */
  'ELT-09-5': (k) => (
    <>
      <Shadow w={36} float />
      <Detail d="M6 12l3 3M58 10l-3 3.4M4 44l3.6 -1M60 46l-3.6 -1.4" color={COMMON.eliteGold} w={1.8} />
      <circle cx={32} cy={29} r={22} fill="none" stroke={INK} strokeWidth={6} />
      <circle cx={32} cy={29} r={22} fill="none" stroke={P.brass} strokeWidth={3.4} />
      <ellipse cx={32} cy={29} rx={21} ry={8} transform="rotate(-25 32 29)" fill="none" stroke={INK} strokeWidth={5.4} />
      <ellipse cx={32} cy={29} rx={21} ry={8} transform="rotate(-25 32 29)" fill="none" stroke={P.copper} strokeWidth={3} />
      <path d={star(32, 7, 3, 1.3) + star(52, 40, 2.6, 1.1) + star(12, 18, 2.4, 1)} fill={COMMON.eliteGold} strokeWidth={1.1} />
      <circle cx={32} cy={29} r={10} fill={k.paint(P.navy)} />
      <circle cx={32} cy={29} r={6.4} fill={P.enamel} strokeWidth={1.4} />
      <circle cx={30.6} cy={29.6} r={3.4} fill={P.royal} stroke="none" />
      <circle cx={30.2} cy={30} r={1.6} fill={INK} stroke="none" />
      <path d="M24.5 23L32 26.4L39.5 23" fill="none" strokeWidth={2.4} />
      <Detail d="M26 50L28.5 52.5L26.5 55.5L29 58" color={COMMON.eliteGold} w={1.6} />
    </>
  ),
};
