import type { BossDesign } from '../kit.tsx';
import { B05, B06, B07, B08, BOSS_OUTLINE, INK, ROYAL } from '../palette.ts';
import { Blob, BossEye, Crown, Detail, FangMouth, Shadow, Shine } from '../parts.tsx';
import { circles, leaves, sparkles, strokes } from '../shapes.ts';

/** 開口朝左的大鉗（原點在手腕）：上顎長、下顎短，縮小後仍讀得出「夾子」。 */
const PINCER = 'M0 -10C-10 -19 -26 -16 -30 -4Q-18 -7 -9 0Q-15 5 -24 9C-16 16 -5 15 0 10Z';

/**
 * 粗管狀觸腕：同一路徑先畫加粗深色線、再畫本色線，得到帶描邊、圓頭的觸腕，
 * 多條觸腕只要兩個元素。
 */
function Tubes({ d, color, width }: { readonly d: string; readonly color: string; readonly width: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={width + BOSS_OUTLINE * 2} />
      <path d={d} fill="none" stroke={color} strokeWidth={width} />
    </>
  );
}

/** 第 5～8 圖的 BOSS：砂海、港灣、雪嶺、火山。 */
export const MIDDLE_BOSSES: Readonly<Record<string, BossDesign>> = {
  /** 鎏金蠍皇：金甲蠍子，尾刺高高捲過背、雙鉗朝前，背上嵌著會顯露的綠松石核心。 */
  'BOSS-05': (k) => {
    const gold = k.paint(B05.gold);
    return (
      <>
        <Shadow x={66} w={106} />
        <circle cx={101} cy={88} r={12} fill={gold} />
        <circle cx={110} cy={71} r={11} fill={gold} />
        <circle cx={109} cy={54} r={10} fill={gold} />
        <circle cx={100} cy={40} r={9.5} fill={gold} />
        <circle cx={87} cy={32} r={9} fill={gold} />
        <path d="M78 30Q66 30 64 44Q70 40 76 40Z" fill={INK} strokeWidth={2} />
        <ellipse cx={77} cy={33} rx={7} ry={6} fill={k.paint(B05.ruby)} strokeWidth={2} />
        <Detail d={strokes([[60, 110, 52, 120], [72, 113, 68, 120], [86, 113, 90, 120], [98, 108, 108, 118]])} w={4} />
        <ellipse cx={78} cy={100} rx={29} ry={15} fill={gold} />
        <Detail d="M66 86Q62 100 66 114M80 85Q76 100 80 115M94 88Q90 100 94 112" color={B05.goldDeep} w={2} />
        <circle cx={80} cy={93} r={14} fill={k.glow(B05.gem)} stroke="none" />
        <path d="M80 83L88 93L80 103L72 93Z" fill={k.paint(B05.gem)} strokeWidth={2} />
        <path d="M76 90L80 85L82 88Z" fill={ROYAL.white} opacity={0.8} stroke="none" />
        <path d="M40 86Q32 80 30 68L38 64Q38 74 46 82Z" fill={gold} />
        <path d={PINCER} transform="translate(33 62) rotate(-18) scale(1.02)" fill={gold} />
        <path d="M36 108Q30 110 27 104L33 98Q36 102 40 102Z" fill={gold} />
        <path d={PINCER} transform="translate(29 102) rotate(8) scale(0.9)" fill={gold} />
        <ellipse cx={49} cy={95} rx={21} ry={17} fill={gold} />
        <path d={circles([[27, 57, 2.6], [25, 101, 2.2]])} fill={B05.gem} strokeWidth={1.4} />
        <Crown x={48} y={81} w={22} h={12} fill={k.paint(ROYAL.gold)} gem={B05.gem} tilt={-8} />
        <BossEye x={40} y={93} r={6} inner="right" />
        <BossEye x={56} y={93} r={6.5} inner="left" />
        <FangMouth x={45} y={103} w={13} h={4} />
        <Shine x={40} y={84} rx={5} ry={2.2} opacity={0.5} />
        <Shine x={70} y={92} rx={7} ry={2.6} opacity={0.4} />
        <Shine x={106} y={64} rx={3} ry={5} rotate={10} opacity={0.4} />
      </>
    );
  },

  /** 深潮章王：紫色大章魚，頂著珊瑚金冠，一條觸腕高舉金錨，其餘觸腕捲在浪花上。 */
  'BOSS-06': (k) => {
    const body = k.paint(B06.body);
    return (
      <>
        <Shadow w={104} />
        <Blob d={circles([[16, 118, 6], [26, 116, 5], [102, 117, 6], [113, 118, 5]])} fill={B06.foam} width={2} opacity={0.85} />
        <path d="M18 24L26 24M22 20L22 62M8 54Q22 72 36 54" fill="none" stroke={INK} strokeWidth={9} />
        <path d="M18 24L26 24M22 20L22 62M8 54Q22 72 36 54" fill="none" stroke={B06.gold} strokeWidth={4.5} />
        <circle cx={22} cy={16} r={5} fill="none" stroke={INK} strokeWidth={7} />
        <circle cx={22} cy={16} r={5} fill="none" stroke={B06.gold} strokeWidth={2.6} />
        <Tubes d="M46 82C32 78 24 70 22 56" color={B06.body} width={10} />
        <Tubes
          d="M50 94C36 104 20 108 14 98C10 90 20 86 24 92M62 98C60 110 52 117 40 118M84 94C98 102 112 102 114 90C115 82 106 82 106 88M74 100C78 112 88 117 100 118"
          color={B06.body}
          width={13}
        />
        <path
          d={circles([[17, 102, 1.8], [24, 104, 1.8], [32, 103, 1.8], [108, 97, 1.8], [100, 100, 1.8], [92, 100, 1.8], [50, 116, 1.6], [88, 116, 1.6]])}
          fill={B06.sucker}
          strokeWidth={1}
        />
        <path d="M80 22L84 8M84 14L90 10M92 24L98 12M95 18L102 16" fill="none" stroke={INK} strokeWidth={6} />
        <path d="M80 22L84 8M84 14L90 10M92 24L98 12M95 18L102 16" fill="none" stroke={B06.coral} strokeWidth={2.8} />
        <path d="M30 70C24 40 40 16 66 16C92 16 108 40 102 70C98 86 84 98 66 98C48 98 34 86 30 70Z" fill={body} />
        <path d={circles([[84, 34, 4], [94, 46, 3], [78, 46, 2.6], [96, 60, 2.6]])} fill={B06.spot} stroke="none" />
        <Crown x={62} y={22} w={30} h={14} fill={k.paint(B06.gold)} gem={B06.pearl} tilt={-10} />
        <Shine x={48} y={34} rx={9} ry={4} opacity={0.35} />
        <BossEye x={46} y={64} r={7} inner="right" />
        <BossEye x={66} y={66} r={7.5} inner="left" />
        <ellipse cx={36} cy={80} rx={5.5} ry={4.5} fill={k.paint(B06.bodyDeep)} strokeWidth={2} />
        <ellipse cx={35} cy={80} rx={2.4} ry={2} fill={INK} stroke="none" />
        <ellipse cx={44} cy={76} rx={3.6} ry={2.2} fill={ROYAL.blush} opacity={0.6} stroke="none" />
      </>
    );
  },

  /** 白冠霜鵬：雪白巨鳥，三根冰尖羽冠、胸前覆著會被打破的冰殼，鉤喙朝勇者。 */
  'BOSS-07': (k) => {
    const feather = k.paint(B07.feather);
    const ice = k.fade(B07.ice, B07.iceDeep);
    return (
      <>
        <Shadow x={70} w={88} />
        <path d="M76 66C82 38 98 18 124 10C124 26 120 40 114 50Q120 54 114 60Q118 66 110 68Q112 76 100 76Z" fill={feather} />
        <Detail d="M96 40Q104 34 114 30M92 54Q102 50 110 48" color={B07.featherShade} w={2} />
        <path d={leaves([[94, 96, 30, 7, -12], [94, 100, 28, 7, 14]])} fill={k.paint(B07.ice)} />
        <Detail d="M62 108L60 118M80 108L82 118M52 120L60 117L66 120M76 120L82 117L90 120" color={B07.talon} w={4} />
        <ellipse cx={72} cy={84} rx={30} ry={27} fill={feather} />
        <path d="M46 78L54 64L60 76L68 66L72 82L64 104L50 100Z" fill={ice} opacity={0.9} />
        <Detail d="M54 64L56 90M68 66L64 92" color={ROYAL.white} w={1.4} opacity={0.8} />
        <path d="M62 72C78 62 98 68 106 84Q99 86 101 93Q93 92 93 99Q85 96 83 104Q75 100 68 104Q60 92 62 72Z" fill={feather} />
        <Detail d="M70 80Q84 76 96 84M72 90Q82 88 90 94" color={B07.featherShade} w={2} />
        <path d={leaves([[44, 34, 24, 6, -82], [48, 34, 26, 6, -58], [52, 36, 22, 6, -34]])} fill={k.paint(B07.crest)} />
        <path d={circles([[42, 11, 2.6], [61, 13, 2.6], [70, 24, 2.4]])} fill={B07.ice} strokeWidth={1.4} />
        <circle cx={44} cy={52} r={20} fill={feather} />
        <Crown x={44} y={35} w={20} h={9} fill={k.paint(ROYAL.gold)} gem={B07.iceDeep} tilt={-12} />
        <path d="M30 50C20 48 10 54 10 64C16 58 22 58 30 60Z" fill={k.paint(B07.beak)} />
        <path d="M30 60Q22 62 18 66Q26 68 32 64Z" fill={k.paint('#d8902e')} strokeWidth={2} />
        <BossEye x={37} y={48} r={5} iris={ROYAL.eyeIce} inner="right" />
        <BossEye x={51} y={49} r={5.5} iris={ROYAL.eyeIce} inner="left" />
        <ellipse cx={54} cy={60} rx={3.4} ry={2} fill={B07.ice} opacity={0.8} stroke="none" />
        <Shine x={38} y={38} rx={5} ry={2.4} opacity={0.6} />
        <path d={sparkles([[16, 30, 4], [112, 86, 3.5], [24, 92, 3]])} fill={ROYAL.white} strokeWidth={1.2} />
      </>
    );
  },

  /** 熔心巨匠：玄武岩巨人，火焰頭髮、胸口熔心發光，扛著大鍛錘、繫皮圍裙。 */
  'BOSS-08': (k) => {
    const rock = k.paint(B08.basalt);
    return (
      <>
        <Shadow w={108} />
        <path d="M26 96L34 22L40 23L33 97Z" fill={k.paint(B08.handle)} />
        <path d="M14 10L46 16L42 36L10 30Z" fill={k.paint(B08.hammer)} />
        <path d="M14 10L10 30L16 31L20 11Z" fill={B08.magma} strokeWidth={2} />
        <Detail d="M30 13L27 33" color="#4a4f5a" w={2.4} />
        <ellipse cx={48} cy={112} rx={12} ry={8} fill={rock} />
        <ellipse cx={82} cy={112} rx={12} ry={8} fill={rock} />
        <circle cx={108} cy={104} r={11} fill={rock} />
        <path d="M94 60Q112 68 112 96L102 98Q100 78 90 72Z" fill={rock} />
        <path d="M22 80C20 52 40 36 64 36C90 36 106 52 106 80C106 102 90 114 64 114C38 114 22 102 22 80Z" fill={rock} />
        <Detail d="M88 50L94 60L90 70M96 82L102 88M30 70L36 76L34 86" color={B08.magma} w={2.6} />
        <path d="M40 86L88 86L92 112Q64 118 36 112Z" fill={k.paint(B08.apron)} />
        <Detail d="M42 86L46 60M86 86L82 60" color="#6a3a22" w={2.6} />
        <path d={circles([[64, 98, 2.2], [56, 104, 1.6], [72, 104, 1.6]])} fill="#e0a85a" strokeWidth={1} />
        <circle cx={64} cy={68} r={18} fill={k.glow(B08.magma)} stroke="none" />
        <path d="M64 58L72 66L68 78L60 78L56 66Z" fill={k.paint(B08.core)} strokeWidth={2.2} />
        <Detail d="M60 66L64 62L66 70" color={B08.magma} w={1.6} />
        <path d="M38 34C34 18 46 18 46 6C52 14 56 10 60 0C66 10 72 14 70 34Z" fill={k.paint(B08.flame)} />
        <path d="M46 34C44 24 52 24 52 16C56 22 60 20 62 34Z" fill={B08.core} strokeWidth={1.6} />
        <circle cx={54} cy={42} r={17} fill={rock} />
        <BossEye x={47} y={41} r={5} iris={ROYAL.eyeHot} inner="right" />
        <BossEye x={61} y={42} r={5.5} iris={ROYAL.eyeHot} inner="left" />
        <FangMouth x={53} y={51} w={12} h={3.5} />
        <path d="M40 58Q28 62 28 74L38 78Q40 68 48 64Z" fill={rock} />
        <circle cx={32} cy={76} r={9} fill={rock} />
        <Detail d="M27 72L33 74M27 77L34 79" color={B08.basaltDeep} w={1.8} />
        <Shine x={44} y={30} rx={4} ry={2} opacity={0.3} />
        <Shine x={42} y={52} rx={8} ry={3} opacity={0.18} />
      </>
    );
  },
};
