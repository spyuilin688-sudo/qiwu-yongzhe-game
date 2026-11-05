import type { CreatureDesign } from '../kit.tsx';
import { COMMON, INK, MAP07 as P } from '../palette.ts';
import { AngryEye, Blush, Detail, Eye, Leg, Limbs, Mouth, Scar, Shadow, Shine, Smile } from '../parts.tsx';
import { circles, hexagons, leaf, leaves, ring } from '../shapes.ts';

/** 第 7 圖 霜羽雪嶺：雪白、冰藍、霜灰與圍巾紅；小首領一律冰藍瞳光。 */
export const MAP07_DESIGNS: Readonly<Record<string, CreatureDesign>> = {
  /** 圍巾雪兔：繫著紅圍巾的雪白兔子，圍巾尾巴被山風吹起。 */
  'MON-07-1': (k) => {
    const fur = k.paint(P.snow);
    return (
      <>
        <Shadow x={33} w={32} />
        <ellipse cx={25} cy={58.2} rx={5} ry={2.5} fill={fur} />
        <ellipse cx={37} cy={58.2} rx={5} ry={2.5} fill={fur} />
        <circle cx={47} cy={47.5} r={4} fill={fur} />
        <ellipse cx={34} cy={47} rx={12} ry={11} fill={fur} />
        <path d={leaves([[24, 26, 15, 7, -100], [30, 26, 14, 7, -74]])} fill={fur} />
        <path d={leaves([[24, 25, 11, 3.6, -100], [30, 25, 10, 3.6, -74]])} fill={COMMON.blush} opacity={0.6} stroke="none" />
        <circle cx={27} cy={32} r={9.5} fill={fur} />
        <path d="M35 39.5L46.5 36.5L45.4 42L36 44Z" fill={k.paint(P.scarf)} />
        <path d="M18 38Q27 43 37 38L37.6 42.4Q27 47.2 18.6 42.4Z" fill={k.paint(P.scarf)} />
        <Detail d="M24 41.6V44.6M30.5 41.6V44.6M41 38V42" color={COMMON.white} w={1.4} />
        <Shine x={30} y={26} rx={2.8} ry={1.4} />
        <circle cx={18.6} cy={33.6} r={1.4} fill={COMMON.blush} strokeWidth={1} />
        <Eye x={23} y={31} r={2.5} />
        <Eye x={29.5} y={31} r={2.5} />
        <Blush x={26} y={36} rx={1.9} />
        <Smile x={20.6} y={36} w={2.4} depth={1} />
      </>
    );
  },

  /** 冰帽鳥：頭頂結了一頂圓冰帽、帽緣掛著小冰柱的藍色小鳥。 */
  'MON-07-2': (k) => (
    <>
      <Shadow x={33} w={28} />
      <Limbs d="M30 52V58.5M36 52V58.5" color={P.beak} w={1.8} />
      <path d={leaves([[44, 40, 9, 6, -30], [45, 43, 8, 5, -5]])} fill={k.paint(P.iceDeep)} strokeWidth={1.6} />
      <circle cx={33} cy={42} r={12.5} fill={k.paint(P.bird)} />
      <ellipse cx={29} cy={46.5} rx={7} ry={7} fill={P.snow} stroke="none" />
      <path d={leaf(35, 42, 11, 8, 15)} fill={k.paint(P.iceDeep)} strokeWidth={1.6} />
      {/* 圓頂冰帽＋帽緣冰柱＋冰球：尖刺狀冰帽會被讀成王冠，而王冠是小首領專用的身分符號。 */}
      <circle cx={30} cy={20} r={2.8} fill={k.paint(P.snow)} strokeWidth={1.6} />
      <path d="M20.5 32.5C20 25.5 24.5 21.5 30 21.5C35.5 21.5 40 25.5 39.5 32Z" fill={k.paint(P.ice)} />
      <path d="M21.6 32.4l1.3 3.6l1.3 -3.6ZM26.2 32.2l1.2 2.8l1.2 -2.8ZM32.6 32.1l1.2 3.2l1.2 -3.2ZM36.6 32l1.1 2.5l1.1 -2.5Z" fill={P.ice} strokeWidth={1.1} />
      <Detail d="M23.6 28.5Q25 24.6 28.8 23.6" color={COMMON.white} w={1.3} />
      <path d="M21.5 38.5L15 41.4L21.5 44.2Z" fill={P.beak} strokeWidth={1.5} />
      <Eye x={25} y={38} r={2.5} />
      <Eye x={31} y={38.4} r={2.4} />
      <Blush x={29.5} y={43} rx={1.9} />
    </>
  ),

  /** 霜毛狼：脖子上一圈結霜鬃毛的小狼崽。 */
  'MON-07-3': (k) => {
    const fur = k.paint(P.wolf);
    return (
      <>
        <Shadow x={34} w={40} />
        <path d={leaf(47, 40, 14, 8, -30)} fill={k.paint(P.fur)} />
        <Leg x={25} top={48} w={5} fill={fur} />
        <Leg x={31} top={49} w={5} fill={fur} />
        <Leg x={41} top={49} w={5} fill={fur} />
        <Leg x={47} top={48} w={5} fill={fur} />
        <ellipse cx={37} cy={43} rx={13} ry={8.5} fill={fur} />
        <path d={ring(24, 37, 7, 11, 9, 10, 'point')} fill={k.paint(P.snow)} />
        <path d={leaves([[18, 27.5, 7, 5, -112], [24, 26.5, 7, 5, -74]])} fill={fur} strokeWidth={1.6} />
        <circle cx={21} cy={33} r={8} fill={fur} />
        <ellipse cx={14.5} cy={36.5} rx={4.2} ry={3.2} fill={k.paint(P.snow)} />
        <circle cx={11.4} cy={35.4} r={1.5} fill={INK} stroke="none" />
        <Eye x={18.5} y={32} r={2.3} />
        <Eye x={24} y={32} r={2.3} />
        <Blush x={22.5} y={36.5} rx={1.7} />
      </>
    );
  },

  /** 厚毛雪兔：毛厚到看不見脖子的巨兔，冰爪一揮就是一陣暴雪。 */
  'ELT-07-1': (k) => {
    const fur = k.paint(P.snow);
    return (
      <>
        <Shadow w={56} />
        <ellipse cx={20} cy={58} rx={8} ry={3} fill={fur} />
        <ellipse cx={44} cy={58} rx={8} ry={3} fill={fur} />
        <path d={leaves([[23, 20, 18, 9, -106], [33, 19, 17, 9, -72]])} fill={fur} />
        <path d={leaves([[23, 19, 13, 4.4, -106], [33, 18, 12, 4.4, -72]])} fill={COMMON.blush} opacity={0.55} stroke="none" />
        <path d={ring(32, 38, 18.5, 21.5, 13, 0, 'round')} fill={fur} />
        <Detail d="M44 26l3 -2M47.5 33l3 0.5M46 48l3 2M18 50l-2 2.5" color={P.iceDeep} w={1.4} />
        <AngryEye x={24} y={32} r={3} iris={COMMON.eliteIce} inner="right" />
        <AngryEye x={34} y={32} r={3} iris={COMMON.eliteIce} inner="left" />
        <path d="M27.4 36.6H30.6L29 38.4Z" fill={COMMON.blush} strokeWidth={1.1} />
        <rect x={27.3} y={39.4} width={3.4} height={3.2} rx={0.6} fill={COMMON.tooth} strokeWidth={1.1} />
        <ellipse cx={16} cy={46} rx={5.4} ry={4.4} fill={fur} />
        <path d="M11.5 43.5L7.5 42L10.6 45.6ZM11 47L6.8 47.6L10.4 49.6Z" fill={k.paint(P.ice)} strokeWidth={1.1} />
        <Shine x={22} y={22.5} rx={3.6} ry={1.6} rotate={-20} />
      </>
    );
  },

  /** 霜羽獵鷹：翅膀尖結著冰羽的獵鷹，一俯衝就帶下冰屑。 */
  'ELT-07-2': (k) => {
    const body = k.paint('#7a9ac8');
    return (
      <>
        <Shadow x={34} w={44} />
        <path d={leaves([[34, 34, 26, 12, -62], [37, 36, 23, 10, -36], [39, 38, 19, 9, -12]])} fill={k.paint(P.ice)} />
        <Detail d="M44 22l3 -3M50 30l3.5 -1.5" color={COMMON.white} w={1.4} />
        <Limbs d="M30 50L28 58M38 50L40 58" color={P.beak} w={2.4} />
        <Detail d="M25 59.5l3 -1.5l3 1.5M37 59.5l3 -1.5l3 1.5" w={1.6} />
        <path d={leaves([[42, 46, 15, 7, 18], [42, 48, 13, 6, 40]])} fill={k.paint(P.iceDeep)} strokeWidth={1.6} />
        <ellipse cx={32} cy={42} rx={12} ry={10} transform="rotate(-20 32 42)" fill={body} />
        <ellipse cx={27} cy={44} rx={6} ry={6.6} fill={P.snow} stroke="none" />
        <Detail d="M24 42.5h4M24.5 45.5h4.5M26 48.5h3" color="#7a9ac8" w={1.3} />
        <path d={leaf(31, 40, 15, 9, 22)} fill={k.paint(P.iceDeep)} strokeWidth={1.6} />
        <path d={leaves([[25, 21.5, 7, 3, -62], [27.5, 22.5, 6, 3, -32]])} fill={P.ice} strokeWidth={1.3} />
        <circle cx={22} cy={28} r={8} fill={body} />
        <path d="M15 25.5Q8.5 25.5 8.5 31Q10.6 29.4 14 31Z" fill={COMMON.gold} strokeWidth={1.6} />
        <Detail d="M20.5 31.5l1.8 4.4" color="#2f3f60" w={2.2} />
        <AngryEye x={19.6} y={26.8} r={2.8} iris={COMMON.eliteIce} inner="left" />
      </>
    );
  },

  /** 冰牙狼王：頭戴冰晶冠、口露兩根冰牙的狼群之王。 */
  'ELT-07-3': (k) => {
    const fur = k.paint(P.wolf);
    const dark = k.paint('#6f80a0');
    return (
      <>
        <Shadow x={34} w={56} />
        <path d={leaf(50, 36, 16, 10, -35)} fill={k.paint(P.fur)} />
        <Leg x={23} top={46} w={6.5} fill={dark} />
        <Leg x={30} top={48} w={6.5} fill={dark} />
        <Leg x={45} top={48} w={6.5} fill={dark} />
        <Leg x={52} top={46} w={6.5} fill={dark} />
        <ellipse cx={38} cy={40} rx={18} ry={11} fill={fur} />
        <Scar x1={41} y1={33} x2={47} y2={41} />
        <path d={ring(22, 34, 10, 16, 11, 5, 'point')} fill={k.paint(P.snow)} />
        <path d={leaves([[15, 24, 8, 5.5, -112], [22, 23, 8, 5.5, -70]])} fill={fur} strokeWidth={1.6} />
        <circle cx={18} cy={30} r={9.5} fill={fur} />
        <path d="M11.5 22.5L12.5 14.5L15.6 19L18.5 11L21.6 19L24.6 14.5L25.5 22.5Z" fill={k.paint(P.ice)} />
        <ellipse cx={10} cy={34} rx={5.6} ry={4} fill={k.paint(P.snow)} />
        <circle cx={6.4} cy={32.8} r={1.6} fill={INK} stroke="none" />
        <path d="M7.6 37L8.6 43.4L10.6 37ZM12.4 37.6L13.4 42.6L15 37.6Z" fill={P.ice} strokeWidth={1.2} />
        <AngryEye x={15.5} y={29} r={2.6} iris={COMMON.eliteIce} inner="right" />
        <AngryEye x={21.5} y={29} r={2.4} iris={COMMON.eliteIce} inner="left" />
      </>
    );
  },

  /** 冰殼巨龜：龜殼凍成整塊冰原、背上長出冰柱的巨龜。 */
  'ELT-07-4': (k) => {
    const skin = k.paint(P.turtle);
    return (
      <>
        <Shadow x={34} w={58} />
        <path d="M27 22L29.5 6L35 20ZM36 20L41 2.5L44.5 19ZM45 22L52 10L51.5 25.5Z" fill={k.paint(P.ice)} />
        <Detail d="M30 9L31 18M41 6L41.5 16" color={COMMON.white} w={1.2} />
        <Leg x={50} top={47} w={8} fill={skin} />
        <rect x={6} y={34} width={14} height={9} rx={4} fill={skin} />
        <path d="M14 50C14 30 25 18 38 18C51 18 61 30 60 50Z" fill={k.paint(P.iceDeep)} />
        <path d={hexagons([[30, 35, 5], [40, 30, 5], [49.5, 36, 5], [35, 44, 5], [45, 44.5, 5]])} fill={k.paint('#bfe6f6')} strokeWidth={1.4} />
        <rect x={11} y={46} width={52} height={6} rx={3} fill={k.paint(P.snow)} />
        <Leg x={24} top={49} w={8} fill={skin} />
        <circle cx={10} cy={35} r={8} fill={skin} />
        <AngryEye x={7.8} y={33} r={2.8} iris={COMMON.eliteIce} inner="left" />
        <Detail d="M3 38.6Q6 40.4 9.4 39.2" w={1.4} />
        <path d={circles([[1.6, 43, 1.6], [3.6, 46.6, 1.1]])} fill={P.mist} opacity={0.85} stroke="none" />
        <Shine x={26} y={27} rx={4} ry={1.6} rotate={-40} opacity={0.5} />
      </>
    );
  },

  /** 白霧雪人：渾身長毛、呼出白霧的雪人，頭上冒出兩根冰角。 */
  'ELT-07-5': (k) => {
    const fur = k.paint(P.snow);
    return (
      <>
        <Shadow w={54} />
        <Leg x={23} top={47} w={9} fill={k.paint(P.fur)} />
        <Leg x={41} top={47} w={9} fill={k.paint(P.fur)} />
        <path d={leaves([[18, 32, 19, 10, 122], [46, 32, 19, 10, 58]])} fill={fur} />
        <path d={leaves([[22, 18, 7, 3.6, -122], [34, 17, 7, 3.6, -58]])} fill={k.paint(P.ice)} strokeWidth={1.5} />
        <path d={ring(32, 36, 17, 21, 12, -90, 'point')} fill={fur} />
        <ellipse cx={28} cy={30} rx={9} ry={7.5} fill={k.paint('#8fa8c8')} />
        <AngryEye x={24.6} y={28.6} r={2.6} iris={COMMON.eliteIce} inner="right" />
        <AngryEye x={31.6} y={28.6} r={2.6} iris={COMMON.eliteIce} inner="left" />
        <Mouth x={28} y={33.6} w={7} h={2} teeth />
        <Detail d="M3 57Q11 52.5 19 57M45 57Q53 52.5 61 57" color={P.mist} w={2.2} opacity={0.85} />
        <path d={circles([[13, 16, 1.4], [51, 14, 1.2], [8, 26, 1]])} fill={P.mist} stroke="none" />
        <Shine x={40} y={22} rx={3.4} ry={1.5} rotate={20} opacity={0.6} />
      </>
    );
  },
};
