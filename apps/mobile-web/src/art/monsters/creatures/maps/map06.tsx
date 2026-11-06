import type { CreatureDesign } from '../kit.tsx';
import { COMMON, INK, MAP06 as P } from '../palette.ts';
import { AngryEye, Blush, Detail, Eye, Leg, Limbs, Mouth, RoundEye, Scar, Shadow, Shine, Smile } from '../parts.tsx';
import { circles, leaf, leaves, strokes } from '../shapes.ts';

/** 第 6 圖 碧潮港灣：海青、珊瑚紅、麻繩米與海軍藍；水手一族是海藻青皮膚的海民。 */
export const MAP06_DESIGNS: Readonly<Record<string, CreatureDesign>> = {
  /** 木桶蟹：把空酒桶當殼住的螃蟹，只露出眼睛和兩隻鉗子。 */
  'MON-06-1': (k) => {
    const crab = k.paint(P.crab);
    return (
      <>
        <Shadow w={40} />
        <Limbs d="M18 53l-5 6M19 48l-6 3M45 53l5 6M44 48l6 3" color={P.crab} w={2} />
        <path d="M17 24Q14 38 17 54H45Q48 38 45 24Z" fill={k.paint(P.wood)} />
        <Detail d="M24 24.6Q22.6 39 24 53.4M31 24.6V53.4M38 24.6Q39.4 39 38 53.4" color="#7a4a22" w={1.1} />
        <Detail d="M15.8 31.5H46.2M15.9 46.5H46.1" color={COMMON.iron} w={2.6} />
        <ellipse cx={31} cy={24.5} rx={14} ry={3.2} fill="#5a3418" />
        <Limbs d="M26.5 21V14.5M35.5 21V13.5" color={P.crab} w={1.8} />
        <path d="M21 25Q21 17 31 17Q41 17 41 25Z" fill={crab} />
        <RoundEye x={26.5} y={12.5} r={3} />
        <RoundEye x={35.5} y={11.5} r={3} />
        <Blush x={25} y={22.5} rx={1.8} />
        <Blush x={37} y={22.5} rx={1.8} />
        <Smile x={30.5} y={21.5} w={3.4} depth={1.2} />
        <Limbs d="M17.5 39L12.5 37M44.5 39L50 37" color={P.crab} w={2.4} />
        <path d={leaves([[13, 37.5, 9, 7, 205], [13, 37.5, 8, 6, 158], [50, 37.5, 7, 5.5, -25], [50, 37.5, 6.5, 5, 22]])} fill={crab} strokeWidth={1.6} />
      </>
    );
  },

  /** 貝殼精：扇貝殼上長了臉，殼縫裡含著一顆珍珠。 */
  'MON-06-2': (k) => {
    const shell = k.paint(P.shell);
    return (
      <>
        <Shadow w={38} />
        <path d={circles([[51, 22, 2.2], [55.5, 16, 1.5], [53, 10.5, 1]])} fill="#bfe8f0" opacity={0.75} strokeWidth={1.1} />
        <path d="M12 46Q12 58 32 58Q52 58 52 46Z" fill={shell} />
        <ellipse cx={32} cy={46} rx={19} ry={4.6} fill={P.interior} strokeWidth={1.6} />
        <circle cx={32} cy={46.5} r={4} fill={k.paint(P.pearl)} />
        <circle cx={30.8} cy={45.2} r={1.1} fill={COMMON.white} stroke="none" />
        <path d="M12 44Q10 24 32 19.5Q54 24 52 44Q32 39 12 44Z" fill={shell} />
        <Detail d="M32 39.5V22M23.5 40.4L19.8 25.5M40.5 40.4L44.2 25.5M16.5 42.2L13.5 32.5M47.5 42.2L50.5 32.5" color="#d08a7a" w={1.3} />
        <Shine x={22} y={27} rx={3} ry={1.4} rotate={-40} />
        <Eye x={26} y={32} r={2.6} />
        <Eye x={35} y={32} r={2.6} />
        <Blush x={22} y={37} rx={2} />
        <Blush x={39} y={37} rx={2} />
      </>
    );
  },

  /** 紙帽水手：戴紙船帽的小海民，拖著拖把負責刷甲板。 */
  'MON-06-3': (k) => {
    const skin = k.paint(P.seaSkin);
    return (
      <>
        <Shadow w={32} />
        <Limbs d="M13.5 31L19 56" color={P.wood} w={1.8} />
        <path d={leaves([[19, 55, 6, 2.6, 110], [19, 55, 6, 2.6, 80], [19, 55, 6, 2.6, 140]])} fill={P.rope} strokeWidth={1.2} />
        <Leg x={28} top={51} w={5} fill={k.paint(P.navy)} />
        <Leg x={36} top={51} w={5} fill={k.paint(P.navy)} />
        <path d={circles([[27, 59, 2.6], [37, 59, 2.6]])} fill={P.black} strokeWidth={1.4} />
        <Limbs d="M23.5 39L17 44M40.5 39L45.5 44" color={COMMON.white} w={3} />
        <path d="M22 38Q21 52 25 52H39Q43 52 42 38Q40 34 32 34Q24 34 22 38Z" fill={k.paint(COMMON.white)} />
        <Detail d="M22.4 42.5H41.6M22.4 47H41.6" color={P.stripe} w={2.2} />
        <path d="M26 35L32 42L38 35Z" fill={P.coral} strokeWidth={1.4} />
        <path d={circles([[16.5, 44.5, 2.4], [46, 44.5, 2.4]])} fill={skin} strokeWidth={1.5} />
        <path d={leaf(41.5, 24.5, 6.5, 5, -20)} fill={skin} strokeWidth={1.4} />
        <circle cx={32} cy={25} r={10} fill={skin} />
        <path d="M18.5 19H45.5L41.5 14H22.5Z" fill={k.paint('#f2efe6')} />
        <path d="M24 14.2L32 5L40 14.2Z" fill={k.paint('#f2efe6')} />
        <Detail d="M27 11.5H31M28.5 16.5H36" color="#8f97a3" w={1.1} />
        <Eye x={27.5} y={25} r={2.6} />
        <Eye x={34} y={25} r={2.6} />
        <Blush x={24.5} y={29.5} rx={1.9} />
        <Blush x={37} y={29.5} rx={1.9} />
        <Smile x={30.5} y={29.4} w={3.4} />
      </>
    );
  },

  /** 鉗鉗蟹長：頂著藤壺冠、高舉巨鉗的老螃蟹，殼上留著刀疤。 */
  'ELT-06-1': (k) => {
    const crab = k.paint(P.crab);
    return (
      <>
        <Shadow w={56} />
        <Limbs d="M18 46l-6 9M22 48l-4 11M27 50l-2 9.5M40 50l2 9.5M45 48l4 11M49 46l6 9" color={P.crab} w={2.4} />
        <Limbs d="M18 40L11 29M50 41L56 37" color={P.crab} w={3} />
        <path d="M2 23C0 13 8 7 16.5 11C12.5 13 10.5 16.5 11.5 19.5C14.5 18.5 17.5 18.5 19.5 21.5C16.5 28 6 29.5 2 23Z" fill={crab} />
        <path d={leaves([[56, 37, 7, 5.5, -30], [56, 37, 6.5, 5, 20]])} fill={crab} strokeWidth={1.6} />
        <path d="M12 44C12 32 20 26 32 26C44 26 52 32 52 44C52 49 44 52 32 52C20 52 12 49 12 44Z" fill={crab} />
        <path d={circles([[25.5, 27, 2.6], [32, 25.2, 3], [38.5, 27, 2.6]])} fill={k.paint(P.pearl)} strokeWidth={1.4} />
        <path d={circles([[25.5, 26.4, 0.9], [32, 24.5, 1], [38.5, 26.4, 0.9]])} fill={INK} stroke="none" />
        <Scar x1={40} y1={33} x2={46} y2={42} />
        <path d={circles([[19, 40, 1.2], [44.5, 46, 1.1], [22, 46.5, 1]])} fill={COMMON.white} opacity={0.4} stroke="none" />
        <Limbs d="M26 27V19.5M37 27V18.5" color={P.crab} w={2} />
        <circle cx={26} cy={17} r={3.6} fill={P.pearl} strokeWidth={1.6} />
        <circle cx={37} cy={16} r={3.6} fill={P.pearl} strokeWidth={1.6} />
        <AngryEye x={26} y={17.4} r={2.8} inner="right" />
        <AngryEye x={37} y={16.4} r={2.8} inner="left" />
        <Mouth x={31} y={39.5} w={8} h={2} teeth />
      </>
    );
  },

  /** 木桶水手：把酒桶當背心穿的大塊頭海民，手臂上刺著錨。 */
  'ELT-06-2': (k) => {
    const skin = k.paint(P.seaSkin);
    return (
      <>
        <Shadow w={52} />
        <Leg x={24} top={50} w={8} fill={k.paint(P.navy)} />
        <Leg x={40} top={50} w={8} fill={k.paint(P.navy)} />
        <path d={circles([[23, 58.4, 4], [41, 58.4, 4]])} fill={P.black} strokeWidth={1.6} />
        <ellipse cx={53} cy={37} rx={5.6} ry={8.4} fill={skin} />
        <path d="M14 26Q10 40 14 54H50Q54 40 50 26Z" fill={k.paint(P.wood)} />
        <Detail d="M22 26.6Q20.6 40 22 53.4M32 26.6V53.4M42 26.6Q43.4 40 42 53.4" color="#7a4a22" w={1.1} />
        <Detail d="M12.6 33.5H51.4M12.6 47H51.4" color={COMMON.iron} w={2.6} />
        <Detail d="M21 26V35M43 26V35" color={P.coral} w={2.4} />
        <ellipse cx={11} cy={37} rx={5.6} ry={8.4} fill={skin} />
        <Detail d="M53 34V40M51 36H55M50.6 39Q53 42 55.4 39" color={P.navy} w={1.2} />
        <circle cx={32} cy={17} r={10} fill={skin} />
        <path d="M21 17.5Q20 31.5 32 33.5Q44 31.5 43 17.5Q40 24.5 32 24.5Q24 24.5 21 17.5Z" fill={k.paint(P.beard)} />
        <path d="M22 11Q22 3.6 32 3.6Q42 3.6 42 11Z" fill={k.paint(COMMON.white)} />
        <rect x={20.6} y={9.4} width={22.8} height={3.6} rx={1.6} fill={P.navy} strokeWidth={1.6} />
        <AngryEye x={27.5} y={16.5} r={2.6} inner="right" />
        <AngryEye x={35.5} y={16.5} r={2.6} inner="left" />
        <circle cx={31} cy={21} r={2.4} fill={k.paint(P.coral)} />
      </>
    );
  },

  /** 珊瑚巨螺：長滿珊瑚枝的大海螺，螺口裡的住客正瞪著你。 */
  'ELT-06-3': (k) => {
    const shell = k.paint('#f2d6b8');
    return (
      <>
        <Shadow w={56} />
        <Limbs d="M38 17V6M38 10.5L44 4.5M38 12.5L33 7.5M50 22L55.5 14M51.5 19.5L57 21" color={P.coral} w={3} />
        <path d="M19 27L22 17L27 24L31 13.5L35.5 22L41 13.5L44.5 22.5L50 17L51.5 27Z" fill={shell} />
        <path d="M10 52C8 38 18 25 33 24C48 23 58 32 58 44C58 53 50 57 40 57H18Q10 57 10 52Z" fill={shell} />
        <Detail d="M46 42a6 6 0 1 1 -6 -6a10 10 0 0 1 12 10a14 14 0 0 1 -14 12" color="#c8846e" w={1.6} />
        <Detail d="M26 26.5Q24 40 28 56" color="#e0a08a" w={2.2} opacity={0.8} />
        <ellipse cx={16} cy={46} rx={8.5} ry={9.5} fill={k.paint('#f2a0a0')} />
        <ellipse cx={17} cy={47} rx={6} ry={7} fill="#5a2a3a" strokeWidth={1.4} />
        <path d={leaves([[13, 52, 9, 3.6, 160], [16.5, 53.5, 8, 3.2, 135]])} fill={k.paint(P.coral)} strokeWidth={1.4} />
        <AngryEye x={14.6} y={44.5} r={2.3} inner="right" />
        <AngryEye x={20} y={44.5} r={2.3} inner="left" />
        <Shine x={36} y={31} rx={4.6} ry={1.8} rotate={-12} opacity={0.7} />
      </>
    );
  },

  /** 斷錨海盜：獨眼海民海盜，把撿來的斷錨當鐵鎚揮。 */
  'ELT-06-4': (k) => {
    const skin = k.paint(P.seaSkin);
    const iron = k.paint(COMMON.iron);
    return (
      <>
        <Shadow w={48} />
        <Leg x={30} top={49} w={6} fill={k.paint(P.stripe)} />
        <Leg x={41} top={49} w={3.6} fill={k.paint(P.wood)} />
        <Detail d="M27 52.5H33M27 56H33" color={COMMON.white} w={1.4} />
        <path d="M24 32Q23 50 27 50H43Q47 50 46 32Q44 27 35 27Q26 27 24 32Z" fill={k.paint(P.black)} />
        <path d="M31 28L35 36L39 28Z" fill={COMMON.white} strokeWidth={1.3} />
        <rect x={23.6} y={42} width={22.8} height={3.6} rx={1.4} fill={P.beard} strokeWidth={1.4} />
        <rect x={32.6} y={41.6} width={4.4} height={4.4} rx={0.8} fill={COMMON.gold} strokeWidth={1.2} />
        <Limbs d="M13 54L22 17" color={COMMON.iron} w={3} />
        <circle cx={22.4} cy={14.4} r={2.8} fill="none" stroke={COMMON.iron} strokeWidth={2} />
        <path d="M6.5 49.5Q10.5 58 19 54.5L18.2 51.5Q12 54 10.6 47.6Z" fill={iron} strokeWidth={1.6} />
        <path d="M16 49L19 47L18 50.5L21 49.5" fill="none" strokeWidth={1.4} />
        <circle cx={19.5} cy={36} r={3.2} fill={skin} />
        <circle cx={35} cy={18} r={9.5} fill={skin} />
        <path d={leaves([[44, 13, 7.5, 3.6, 20], [44, 14, 6.5, 3.2, 50]])} fill={COMMON.ruby} strokeWidth={1.3} />
        <path d="M25.5 15Q26 6 35 6Q44 6 44.5 15Q35 11 25.5 15Z" fill={k.paint(COMMON.ruby)} />
        <Detail d="M28.5 15.4L44 12.5" w={1.2} />
        <ellipse cx={31} cy={18.6} rx={3} ry={2.8} fill={INK} stroke="none" />
        <AngryEye x={39} y={18.5} r={2.6} inner="left" />
        <Mouth x={34} y={24} w={6.5} h={1.8} teeth />
      </>
    );
  },

  /** 黑帆船長：披著一面黑帆當披風的海民船長，翹鬍子一抖就開戰。 */
  'ELT-06-5': (k) => {
    const skin = k.paint(P.seaSkin);
    const black = k.paint(P.black);
    return (
      <>
        <Shadow w={50} />
        <path d="M37 18L58 22L56 54L36 50Z" fill={black} />
        <Detail d={strokes([[37, 18, 58, 22], [47, 20, 46, 52]])} color={P.rope} w={1.1} />
        <Detail d="M40 33Q48 31 55 34" color="#6a6a7a" w={2} />
        <Leg x={27} top={50} w={6} fill={black} />
        <Leg x={37} top={50} w={6} fill={black} />
        <path d="M20 30Q18 52 22 53H42Q46 52 44 30Q42 26 32 26Q22 26 20 30Z" fill={k.paint('#2a3048')} />
        <Detail d="M28.5 27L30 52M35.5 27L34 52" color={COMMON.gold} w={1.2} />
        <path d={circles([[26.6, 36, 1], [26.8, 42, 1], [37.4, 36, 1], [37.2, 42, 1]])} fill={COMMON.gold} stroke="none" />
        <path d="M17 40Q6 42.5 1.5 34Q8 36.5 16 37Z" fill={k.paint(COMMON.steel)} strokeWidth={1.6} />
        <circle cx={18} cy={39} r={2.6} fill={COMMON.gold} strokeWidth={1.4} />
        <circle cx={32} cy={18} r={9} fill={skin} />
        <path d="M24 22Q28 19.5 31 22Q34 19.5 38 22Q40 23 41 21Q40 25 36 24Q33 23.5 31 23Q29 23.5 26 24Q22 25 21 21Q22 23 24 22Z" fill="#3a2a22" strokeWidth={1.1} />
        <path d={leaf(38, 6.5, 11, 4.4, -30)} fill={P.coral} strokeWidth={1.4} />
        <path d="M16.5 15Q19.5 4.6 32 4.6Q44.5 4.6 47.5 15Q40 11.5 32 13Q24 11.5 16.5 15Z" fill={black} />
        <Detail d="M18.5 13.6Q25 10.6 32 12M45.5 13.6Q39 10.6 32 12" color={COMMON.gold} w={1.2} />
        <AngryEye x={27.5} y={17.5} r={2.5} inner="right" />
        <AngryEye x={35.5} y={17.5} r={2.5} inner="left" />
      </>
    );
  },
};
