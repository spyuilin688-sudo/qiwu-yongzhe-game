import type { BossDesign } from '../kit.tsx';
import { B01, B02, B03, B04, INK, ROYAL } from '../palette.ts';
import { Blob, BossEye, Crown, Detail, FangMouth, Shadow, Shine } from '../parts.tsx';
import { circles, ellipseBand, leaves, strokes } from '../shapes.ts';

/** 第 1～4 圖的 BOSS：原野、林地、礦山、古鎮。 */
export const EARLY_BOSSES: Readonly<Record<string, BossDesign>> = {
  /** 冠葉樹王：矮胖樹樁身、蓬鬆樹冠當頭髮，頂著葉尖金冠、手持發光種子杖。 */
  'BOSS-01': (k) => {
    const bark = k.paint(B01.bark);
    return (
      <>
        <Shadow w={96} />
        <path d="M84 82Q98 80 106 68L112 72Q104 88 86 92Z" fill={bark} />
        <path d={leaves([[108, 69, 16, 7, -70], [109, 70, 14, 6, -15]])} fill={k.paint(B01.leaf)} strokeWidth={2} />
        <path
          d="M22 120C34 118 40 110 42 98C44 86 44 74 46 60L84 60C86 74 86 86 88 98C90 110 96 118 108 120L88 120Q82 112 76 120L54 120Q48 112 42 120Z"
          fill={bark}
        />
        <Detail d="M78 66Q81 80 78 94M84 104Q88 112 96 117M46 106Q44 112 34 117M72 104Q74 110 72 116" color={B01.barkDeep} w={2} />
        <Blob
          d={circles([[64, 44, 22], [42, 50, 16], [86, 50, 16], [48, 32, 14], [80, 32, 14], [64, 28, 13], [28, 60, 10], [100, 60, 10]])}
          fill={k.paint(B01.leaf)}
        />
        <Detail d="M36 48Q42 40 52 40M76 34Q86 34 92 44M54 60Q64 55 74 60M24 60Q28 55 34 56" color={B01.leafDeep} w={2} />
        <path d={circles([[34, 42, 4.2], [90, 36, 4.2], [70, 48, 3.6]])} fill={k.paint(B01.apple)} strokeWidth={1.8} />
        <Shine x={50} y={26} rx={8} ry={3.5} opacity={0.35} />
        <Crown x={64} y={18} w={30} h={15} fill={k.paint(ROYAL.gold)} gem={ROYAL.emerald} tilt={-8} />
        <circle cx={20} cy={48} r={15} fill={k.glow(B01.seed)} stroke="none" />
        <path d="M18 54L23 54L26 118L19 118Z" fill={k.paint(B01.barkDeep)} />
        <path d={leaves([[20, 54, 12, 6, -150], [21, 54, 12, 6, -30]])} fill={k.paint(B01.leaf)} strokeWidth={1.8} />
        <circle cx={20.5} cy={46} r={7} fill={k.paint(B01.seed)} strokeWidth={2} />
        <path d="M46 82Q34 84 24 78L21 84Q32 94 47 92Z" fill={bark} />
        <path d={circles([[23, 82, 4]])} fill={bark} strokeWidth={2} />
        <BossEye x={52} y={80} r={7} inner="right" />
        <BossEye x={71} y={80} r={7.5} inner="left" />
        <ellipse cx={58} cy={90} rx={5} ry={4} fill={k.paint(B01.barkDeep)} strokeWidth={2} />
        <path d="M48 98Q62 94 76 98Q76 108 70 112Q66 108 63 117Q58 109 54 112Q48 106 48 98Z" fill={k.paint(B01.moss)} strokeWidth={2} />
        <FangMouth x={62} y={99} w={18} h={5} />
      </>
    );
  },

  /** 琥珀蜂后：圓滾滾的女王蜂，戴小金冠、手持蜂蜜杓，條紋腹部在身後翹起。 */
  'BOSS-02': (k) => {
    const amber = k.paint(B02.amber);
    return (
      <>
        <Shadow x={66} w={66} float />
        <path d={leaves([[72, 46, 46, 15, -62], [78, 50, 38, 12, -24]])} fill={k.fade(B02.wing, '#b8d8f0')} opacity={0.92} />
        <Detail d="M74 44Q84 26 90 10M80 50Q98 40 112 36" color="#8fb4d8" w={1.4} />
        <g transform="rotate(28 88 82)">
          <ellipse cx={88} cy={82} rx={26} ry={21} fill={amber} />
          <path d={`${ellipseBand(88, 82, 26, 21, 80, 87)}${ellipseBand(88, 82, 26, 21, 96, 103)}`} fill={B02.stripe} stroke="none" />
          <ellipse cx={88} cy={82} rx={26} ry={21} fill="none" />
          <path d="M113 78L124 82L113 86Z" fill={B02.stripe} strokeWidth={2} />
        </g>
        <Detail d={strokes([[58, 96, 54, 108], [66, 98, 64, 110], [74, 96, 76, 106]])} w={3} />
        <ellipse cx={64} cy={80} rx={17} ry={18} fill={amber} />
        <Blob d={circles([[50, 70, 7], [60, 72, 7], [70, 70, 7], [77, 64, 6], [44, 64, 6]])} fill={k.paint(B02.fluff)} width={2} />
        <Detail d="M41 30Q34 18 26 16M50 29Q54 16 62 12" w={2.4} />
        <path d={circles([[25, 15, 4], [63, 11, 4]])} fill={B02.stripe} strokeWidth={2} />
        <circle cx={45} cy={48} r={21} fill={amber} />
        <path d="M30 34Q44 26 60 34Q52 30 45 31Q37 31 30 34Z" fill={B02.amberDeep} strokeWidth={1.6} />
        <Crown x={46} y={30} w={22} h={12} fill={k.paint(ROYAL.gold)} gem={B02.berry} tilt={-10} />
        <BossEye x={35} y={49} r={6} inner="right" anger={0.5} />
        <BossEye x={51} y={50} r={6.5} inner="left" anger={0.5} />
        <ellipse cx={30} cy={58} rx={3.5} ry={2.2} fill={ROYAL.blush} opacity={0.75} stroke="none" />
        <ellipse cx={56} cy={59} rx={3.5} ry={2.2} fill={ROYAL.blush} opacity={0.75} stroke="none" />
        <path d="M37 60Q42 64 47 60" fill="none" strokeWidth={2} />
        <Shine x={36} y={36} rx={6} ry={3} opacity={0.4} />
        <path d="M26 62L30 62L31 110L27 110Z" fill={k.paint('#b0783f')} />
        <ellipse cx={28} cy={62} rx={8} ry={10} fill={k.paint(B02.honey)} />
        <Detail d={strokes([[21, 58, 35, 58], [20.5, 63, 35.5, 63], [22, 68, 34, 68]])} color={B02.amberDeep} w={1.6} />
        <path d="M25 71Q24 78 26.5 80Q29 78 28 71Z" fill={B02.honey} strokeWidth={1.4} />
        <path d="M50 82Q40 86 30 80L28 86Q38 94 52 90Z" fill={amber} />
      </>
    );
  },

  /** 轟鳴鑽王：戴金色礦帽的胖鼴鼠王，帽前裝著大鑽頭，背後銅管冒著蒸汽。 */
  'BOSS-03': (k) => {
    const fur = k.paint(B03.mole);
    const copper = k.paint(B03.copper);
    return (
      <>
        <Shadow x={66} w={100} />
        <Blob d={circles([[102, 18, 7], [110, 12, 6], [96, 10, 5]])} fill="#d8d2cc" width={2} opacity={0.85} />
        <path d="M92 56L94 28L104 28L104 58Z" fill={copper} />
        <rect x={91} y={24} width={15} height={6} rx={2} fill={copper} strokeWidth={2} />
        <ellipse cx={72} cy={86} rx={36} ry={32} fill={fur} />
        <ellipse cx={64} cy={96} rx={20} ry={18} fill={k.paint('#b89480')} strokeWidth={0} />
        <path d="M78 64Q100 62 106 84Q96 90 84 84Q76 76 78 64Z" fill={copper} />
        <path d={circles([[88, 70, 1.8], [98, 76, 1.8], [90, 80, 1.8]])} fill={B03.lamp} strokeWidth={1.2} />
        <circle cx={46} cy={62} r={24} fill={fur} />
        <path d="M20 46Q22 22 48 22Q72 22 72 46Q60 40 46 40Q32 40 20 46Z" fill={k.paint(B03.helmet)} />
        <path d="M14 48Q46 36 76 48L76 52Q46 42 14 54Z" fill={k.paint(B03.helmet)} strokeWidth={2} />
        <path d="M32 24L36 12L42 22L48 10L54 22L60 13L62 25Z" fill={k.paint(ROYAL.gold)} strokeWidth={2} />
        <circle cx={48} cy={20} r={3} fill={ROYAL.ruby} strokeWidth={1.4} />
        <circle cx={18} cy={42} r={13} fill={k.glow(B03.lamp)} stroke="none" />
        <circle cx={22} cy={42} r={6} fill={copper} strokeWidth={2} />
        <circle cx={21} cy={42} r={3.4} fill={B03.lamp} strokeWidth={1.4} />
        <BossEye x={34} y={57} r={5.5} inner="right" />
        <BossEye x={50} y={58} r={6} inner="left" />
        <ellipse cx={28} cy={72} rx={13} ry={9} fill={k.paint('#a88470')} />
        <ellipse cx={17} cy={70} rx={5} ry={4} fill={B03.nose} strokeWidth={2} />
        <Detail d="M22 76Q14 80 8 78M24 79Q18 85 12 86M36 76Q44 80 50 78" w={1.4} />
        <FangMouth x={30} y={79} w={12} h={4} />
        <ellipse cx={50} cy={102} rx={13} ry={11} fill={fur} />
        <path d="M40 88L3 103L40 118Q45 103 40 88Z" fill={k.paint(B03.steel)} />
        <Detail d="M32 92.5L27 113M23 96.5L19 110M14 100L11.5 106.5" color="#5a626e" w={2} />
        <rect x={36} y={86} width={10} height={34} rx={4} fill={copper} />
        <path d={circles([[41, 93, 1.6], [41, 103, 1.6], [41, 113, 1.6]])} fill={B03.lamp} strokeWidth={1.1} />
        <ellipse cx={96} cy={112} rx={14} ry={9} fill={fur} />
        <Shine x={36} y={30} rx={7} ry={3} opacity={0.45} />
        <Shine x={60} y={70} rx={8} ry={3.5} opacity={0.25} />
      </>
    );
  },

  /** 無面鐘匠：鐘面當臉、指針成怒眉，戴高帽、披霧色長斗篷，手握大發條鑰匙。 */
  'BOSS-04': (k) => {
    const cloak = k.paint(B04.cloak);
    const brass = k.paint(B04.brass);
    return (
      <>
        <Shadow w={92} />
        <Blob d={circles([[22, 116, 8], [36, 118, 7], [96, 118, 7], [108, 115, 8]])} fill={B04.mist} width={2} opacity={0.7} />
        <path d="M86 70Q100 76 104 92L96 96Q92 84 82 80Z" fill={cloak} />
        <path d="M100 96L100 104" strokeWidth={2} />
        <path d="M92 104Q100 100 108 104L106 116Q100 120 94 116Z" fill={k.paint(B04.bell)} />
        <circle cx={100} cy={112} r={9} fill={k.glow('#ffcf6a')} stroke="none" />
        <path d="M44 62Q64 54 84 62Q96 90 106 118Q86 122 64 121Q42 122 22 118Q32 90 44 62Z" fill={cloak} />
        <path d="M58 66L70 66L74 120L54 120Z" fill={B04.cloakDeep} strokeWidth={2} />
        <path d={circles([[64, 78, 2.4], [64.5, 90, 2.4], [65, 102, 2.4]])} fill={brass} strokeWidth={1.4} />
        <Detail d="M40 90Q36 104 32 116M90 92Q94 106 98 116" color={B04.cloakDeep} w={2} />
        <path d="M42 64L50 50L58 62L64 52L70 62L78 50L86 64Q64 72 42 64Z" fill={k.paint(B04.cloakDeep)} />
        <circle cx={62} cy={40} r={21} fill={brass} />
        <circle cx={62} cy={40} r={16.5} fill={k.paint(B04.dial)} strokeWidth={2} />
        <Detail
          d={strokes([[62, 25.5, 62, 28.5], [62, 51.5, 62, 54.5], [47.5, 40, 50.5, 40], [73.5, 40, 76.5, 40], [51.8, 29.8, 53.6, 31.6], [72.2, 29.8, 70.4, 31.6], [51.8, 50.2, 53.6, 48.4], [72.2, 50.2, 70.4, 48.4]])}
          color="#7a6a4a"
          w={1.6}
        />
        <path d="M62 42L50 33L49 36ZM62 42L75 34L76 37Z" fill={INK} strokeWidth={2.6} />
        <circle cx={62} cy={42} r={2.4} fill={ROYAL.gold} strokeWidth={1.4} />
        <path d={circles([[54, 45, 4.6], [70, 45, 4.6]])} fill={k.glow(ROYAL.eyeViolet)} stroke="none" />
        <path d={circles([[54, 45, 1.5], [70, 45, 1.5]])} fill="#b06ae0" stroke="none" />
        <path d="M48 23L47 7Q62 3 77 7L76 23Q62 19 48 23Z" fill={k.paint(B04.hat)} />
        <path d="M47.5 16Q62 12 76.5 16L76.5 20Q62 16 47.5 20Z" fill={brass} strokeWidth={1.6} />
        <path d="M38 24Q62 15 86 24L84 29Q62 21 40 29Z" fill={k.paint(B04.hat)} strokeWidth={2} />
        <Shine x={52} y={32} rx={5} ry={2.4} opacity={0.6} />
        <path d="M22 30Q12 30 12 22Q12 14 22 14Q32 14 32 22Q32 30 22 30ZM22 26Q26 26 26 22Q26 18 22 18Q18 18 18 22Q18 26 22 26Z" fill={brass} fillRule="evenodd" />
        <path d="M20 30L24 30L25 112L19 112Z" fill={brass} />
        <path d="M25 96L32 96L32 102L25 102ZM25 106L30 106L30 110L25 110Z" fill={brass} strokeWidth={1.8} />
        <path d="M46 72Q34 78 26 74L24 82Q36 88 48 82Z" fill={cloak} />
        <circle cx={23} cy={78} r={5} fill={k.paint(B04.glove)} strokeWidth={2} />
      </>
    );
  },
};
