import type { CreatureDesign } from '../kit.tsx';
import { COMMON, INK, MAP12 as P } from '../palette.ts';
import { AngryEye, Blush, Detail, Eye, Leg, Limbs, Mouth, RoundEye, Shadow, Shine, Smile } from '../parts.tsx';
import { circles, leaf } from '../shapes.ts';

/** 第 12 圖 終焉書庫：羊皮紙、墨藍、舊皮革與燭光金；書頁與墨水都活了過來。 */
export const MAP12_DESIGNS: Readonly<Record<string, CreatureDesign>> = {
  /** 紙頁犬：用書頁摺出來的小狗，身上還印著沒讀完的字。 */
  'MON-12-1': (k) => {
    const paper = k.paint(P.page);
    const leg = k.paint(P.parchment);
    return (
      <>
        <Shadow x={34} w={38} />
        <polygon points="47,38 56,29.5 52.5,41" fill={paper} strokeWidth={1.6} />
        <Leg x={25} top={47} w={4.6} fill={leg} />
        <Leg x={31} top={48} w={4.6} fill={leg} />
        <Leg x={41} top={48} w={4.6} fill={leg} />
        <Leg x={47} top={47} w={4.6} fill={leg} />
        <path d="M22 36L48 34L50.5 48L24 50Z" fill={paper} />
        <Detail d="M35 35.2L37 49" color="#c8b48a" w={1.2} />
        <Detail d="M27 40H33M27.5 43.5H34M39.6 39H46M40.2 42.6H46.6" color={P.ink} w={1.1} opacity={0.75} />
        <path d="M10 38.5L16 28L28 28L30 40L22 44.5L12 43.5Z" fill={paper} />
        <polygon points="18.5,28 25,28 22.6,38.5" fill={k.paint(P.parchment)} strokeWidth={1.6} />
        <circle cx={10.6} cy={38.8} r={1.6} fill={INK} stroke="none" />
        <Eye x={15.6} y={34.4} r={2.2} />
        <Eye x={20.4} y={34} r={2.1} />
        <Blush x={18} y={39.4} rx={1.6} />
        <path d="M14 43Q15 46 17 45L16.6 43Z" fill={COMMON.tongue} strokeWidth={1} />
      </>
    );
  },

  /** 墨水精：從打翻的墨水瓶裡溜出來的一滴墨，頭上插著一根羽毛筆。 */
  'MON-12-2': (k) => (
    <>
      <Shadow w={32} />
      <ellipse cx={32} cy={58.4} rx={14} ry={2.6} fill={k.paint(P.inkDeep)} />
      <path d={leaf(33, 21, 13, 4.6, -58)} fill={k.paint(P.page)} strokeWidth={1.5} />
      <Detail d="M33.4 20.6L39.6 10" color="#c8b48a" w={1} />
      <path d="M32 16Q42 30 46 40Q48 54 32 57Q16 54 18 40Q22 30 32 16Z" fill={k.paint(P.ink)} />
      <path d={circles([[50, 54, 1.6], [14, 55, 1.3], [53, 49, 1]])} fill={P.ink} strokeWidth={1.1} />
      <Shine x={23} y={37} rx={3.6} ry={1.6} rotate={-55} opacity={0.75} />
      <RoundEye x={26} y={42} r={3.2} />
      <RoundEye x={35} y={42} r={3.2} />
      <Detail d="M28 48.4Q30.5 50.4 33 48.4" color={COMMON.white} w={1.6} />
      <path d={circles([[22.5, 47.5, 1.4], [38.5, 47.5, 1.4]])} fill={COMMON.blush} opacity={0.6} stroke="none" />
    </>
  ),

  /** 漂浮書：自己翻頁飛起來的書，緞帶書籤垂在下面當尾巴。 */
  'MON-12-3': (k) => {
    const page = k.paint(P.page);
    return (
      <>
        <Shadow w={30} float />
        <path d="M33 43L34 51L35.6 48.8L37.2 51L36.2 42.6Z" fill={COMMON.ruby} strokeWidth={1.3} />
        <path d="M32 44Q22 38 8 41V26Q20 23 32 29Q44 23 56 26V41Q42 38 32 44Z" fill={k.paint(P.leather)} />
        <path d="M32 42Q22 36 10 39V24Q22 21 32 27Z" fill={page} />
        <path d="M32 42Q42 36 54 39V24Q42 21 32 27Z" fill={page} />
        <Detail d="M37 29Q43 26.5 50 27.4M37 33Q43 30.5 50 31.4M37 37Q43 34.5 50 35.4" color={P.ink} w={1.1} opacity={0.7} />
        <Detail d="M32 27V42" color="#c8b48a" w={1.2} />
        <Eye x={17.6} y={30.4} r={2.4} />
        <Eye x={24.6} y={31.2} r={2.3} />
        <Blush x={15} y={35} rx={1.7} />
        <Blush x={27.4} y={35.8} rx={1.7} />
        <Smile x={21.2} y={35.2} w={3} depth={1.2} />
        <path d={circles([[10, 16, 1], [52, 16, 1.2], [58, 34, 0.8]])} fill={P.candle} stroke="none" />
      </>
    );
  },

  /** 飛頁獵犬：書頁像翅膀一樣在背上翻飛的獵犬，嘴裡叼過不少禁書。 */
  'ELT-12-1': (k) => {
    const paper = k.paint(P.page);
    const leg = k.paint('#d8c49a');
    return (
      <>
        <Shadow x={34} w={54} />
        <path d="M34 31L43 11L50 15L40.5 33ZM39 33L52 19L56.5 24.5L43 35Z" fill={paper} />
        <Detail d="M42 17L46 19M45.4 24.4L50 22" color={P.ink} w={1.1} opacity={0.7} />
        <path d="M50 38L60 30L58 36L62 38L54 42Z" fill={paper} strokeWidth={1.6} />
        <Leg x={21} top={45} w={5.5} fill={leg} />
        <Leg x={28} top={47} w={5.5} fill={leg} />
        <Leg x={43} top={47} w={5.5} fill={leg} />
        <Leg x={50} top={45} w={5.5} fill={leg} />
        <path d="M18 34L50 32L54 46L22 48Z" fill={paper} />
        <path d={circles([[32, 39, 2.4], [42, 37.6, 1.8], [36, 44, 1.4]])} fill={P.inkDeep} opacity={0.85} stroke="none" />
        <path d="M4 36L11 24L26 24L28 38L19 43L6 42Z" fill={paper} />
        <polygon points="14.5,24 22,24 19.6,35" fill={k.paint(P.inkDeep)} strokeWidth={1.6} />
        <circle cx={4.6} cy={36.4} r={1.6} fill={INK} stroke="none" />
        <AngryEye x={10.6} y={31} r={2.4} iris={P.candle} inner="right" />
        <AngryEye x={15.8} y={30.6} r={2.2} iris={P.candle} inner="left" />
        <Mouth x={10.5} y={39.4} w={7} h={1.8} teeth />
      </>
    );
  },

  /** 禁書守衛：舉著被鐵鍊鎖住的禁書當盾、拄著鑰匙杖的兜帽守衛。 */
  'ELT-12-2': (k) => {
    const robe = k.paint(P.purple);
    return (
      <>
        <Shadow w={52} />
        <Limbs d="M50 58.5L48 15" color={P.clock} w={2.4} />
        <circle cx={47.8} cy={11} r={4} fill="none" stroke={INK} strokeWidth={4.4} />
        <circle cx={47.8} cy={11} r={4} fill="none" stroke={P.clock} strokeWidth={2.2} />
        <path d="M50 50H54V52H50ZM50 54H53V56H50Z" fill={P.clock} strokeWidth={1.2} />
        <Leg x={27} top={48} w={8} fill={k.paint(P.inkDeep)} />
        <Leg x={38} top={48} w={8} fill={k.paint(P.inkDeep)} />
        <path d="M18 32Q17 51 22 51H43Q48 51 47 32Q45 26 32.5 26Q20 26 18 32Z" fill={robe} />
        <circle cx={47} cy={36} r={3.4} fill={robe} />
        <path d="M21 26Q20 8 32.5 7Q45 8 44 26Q38 22 32.5 22Q27 22 21 26Z" fill={robe} />
        <ellipse cx={31} cy={19} rx={7.6} ry={6} fill="#1f1830" />
        <AngryEye x={28} y={19.4} r={2.4} iris={COMMON.eliteViolet} inner="right" />
        <AngryEye x={34.4} y={19.4} r={2.4} iris={COMMON.eliteViolet} inner="left" />
        <rect x={5} y={27} width={22} height={28} rx={2.4} fill={k.paint(P.leather)} />
        <Detail d="M7 29H25V53H7Z" color={P.clock} w={1.2} />
        <path d="M6.5 29L25.5 53M25.5 29L6.5 53" fill="none" stroke={INK} strokeWidth={4.8} />
        <path d="M6.5 29L25.5 53M25.5 29L6.5 53" fill="none" stroke={P.chain} strokeWidth={2.8} strokeDasharray="2.6 1.4" strokeLinecap="butt" />
        <path d="M13.6 39.6Q13.6 35.4 16 35.4Q18.4 35.4 18.4 39.6" fill="none" stroke={INK} strokeWidth={1.6} />
        <rect x={12.4} y={39} width={7.2} height={6} rx={1.2} fill={P.clock} strokeWidth={1.4} />
      </>
    );
  },

  /** 墨潮巨怪：整瓶墨水掀成一道浪的巨怪，浪頭裡捲著被吞掉的書頁。 */
  'ELT-12-3': (k) => {
    const ink = k.paint(P.ink);
    return (
      <>
        <Shadow w={60} />
        <path d="M5 59Q3 40 13 28Q23 13 40 13Q54 15 57 27Q50 21 42 25Q52 29 54.5 41Q58.5 51 59 59Z" fill={ink} />
        <path d="M9 52Q7 57 9.6 59.4Q12 57 11.4 52ZM50 50Q49 56 51.6 58Q54 56 52.6 50Z" fill={P.inkDeep} strokeWidth={1.4} />
        <polygon points="45,16 51,14.6 52,20 46,21.4" fill={k.paint(P.page)} strokeWidth={1.4} />
        <polygon points="8,34 13,31 15,36 10,38.6" fill={k.paint(P.page)} strokeWidth={1.4} />
        <Shine x={22} y={21} rx={5} ry={2} rotate={-40} opacity={0.6} />
        <AngryEye x={24} y={32} r={3.4} iris={P.candle} inner="right" />
        <AngryEye x={35.4} y={32} r={3.4} iris={P.candle} inner="left" />
        <Mouth x={29.6} y={41} w={13} h={3.6} teeth />
        <path d={circles([[59, 20, 1.6], [3, 24, 1.3], [61, 32, 1]])} fill={P.ink} strokeWidth={1.1} />
      </>
    );
  },

  /** 倒鐘魔像：身體是一口倒過來的鐘，胸前鐘面的指針逆著走。 */
  'ELT-12-4': (k) => {
    const stone = k.paint(P.stone);
    return (
      <>
        <Shadow w={52} />
        <Leg x={25} top={48} w={8} fill={stone} />
        <Leg x={39} top={48} w={8} fill={stone} />
        <rect x={1.6} y={20} width={9} height={20} rx={4} fill={stone} />
        <rect x={53.4} y={20} width={9} height={20} rx={4} fill={stone} />
        <path d="M8 18H56Q54 30 46 38Q42 44 42 51H22Q22 44 18 38Q10 30 8 18Z" fill={stone} />
        <rect x={6} y={15} width={52} height={5} rx={2.5} fill={stone} />
        <circle cx={32} cy={31} r={9.4} fill={k.paint(P.clock)} />
        <circle cx={32} cy={31} r={7} fill={k.paint(P.parchment)} strokeWidth={1.5} />
        <path d="M30.6 36.4L32 38.6L33.4 36.4Z" fill={INK} stroke="none" />
        <Detail d="M32 24.6V25.8M25.6 31H26.8M37.2 31H38.4M32 31L35.6 28M32 31L32 35" w={1.3} />
        <Detail d="M22 25Q20 31 22.6 36" color={P.candle} w={1.6} />
        <path d="M20.4 34.6L22.8 37.4L23.8 34Z" fill={P.candle} strokeWidth={0.8} />
        <rect x={24} y={3} width={16} height={12.6} rx={3} fill={stone} />
        <AngryEye x={28.6} y={9.6} r={2.4} iris={COMMON.eliteViolet} inner="right" />
        <AngryEye x={35.4} y={9.6} r={2.4} iris={COMMON.eliteViolet} inner="left" />
        <Detail d="M47 21L44 26L46 29" w={1.3} />
      </>
    );
  },

  /** 無字書靈：寫不出字的空白書所化的靈，四周飄著同樣空白的書頁。 */
  'ELT-12-5': (k) => {
    const page = k.paint(P.page);
    return (
      <>
        <Shadow w={48} />
        <circle cx={32} cy={30} r={18} fill={k.glow(P.candle)} stroke="none" />
        <path d="M24 49C20 36 22 20 32 13C42 20 44 36 40 49Z" fill={k.paint('#c8b8e8')} />
        <path d={leaf(25, 34, 12, 6, 205) + leaf(39, 33, 12, 6, -25)} fill={k.paint('#c8b8e8')} strokeWidth={1.6} />
        <AngryEye x={28.4} y={27} r={2.8} iris={P.candle} inner="right" />
        <AngryEye x={35.6} y={27} r={2.8} iris={P.candle} inner="left" />
        <ellipse cx={32} cy={34} rx={2} ry={2.6} fill="#3a2a4a" stroke="none" />
        <path d="M32 59Q21 54 7 57V47Q20 44 32 49Q44 44 57 47V57Q43 54 32 59Z" fill={k.paint(P.leather)} />
        <path d="M32 57Q22 52 9 55V46Q22 43 32 48Z" fill={page} />
        <path d="M32 57Q42 52 55 55V46Q42 43 32 48Z" fill={page} />
        <rect x={8} y={14} width={7} height={9} rx={1} transform="rotate(-18 11.5 18.5)" fill={page} strokeWidth={1.5} />
        <rect x={49} y={10} width={7} height={9} rx={1} transform="rotate(16 52.5 14.5)" fill={page} strokeWidth={1.5} />
        <Shine x={28} y={19} rx={2.4} ry={1.2} opacity={0.5} />
      </>
    );
  },
};
