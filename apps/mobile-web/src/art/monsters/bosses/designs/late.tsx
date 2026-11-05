import type { BossDesign } from '../kit.tsx';
import { B09, B10, B11, B12, BOSS_OUTLINE, INK, ROYAL } from '../palette.ts';
import { Blob, BossEye, Crown, Detail, Shadow, Shine } from '../parts.tsx';
import { circles, gear, leaves, sparkles, star, strokes } from '../shapes.ts';

/** 帶描邊的粗線（鹿角、天平桿、權杖）：深色粗線打底、本色細線疊上，一組只要兩個元素。 */
function Rod({ d, color, width }: { readonly d: string; readonly color: string; readonly width: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={width + BOSS_OUTLINE * 2} />
      <path d={d} fill="none" stroke={color} strokeWidth={width} />
    </>
  );
}

/** 第 9～12 圖的 BOSS：王城、花園、空島、書庫。 */
export const LATE_BOSSES: Readonly<Record<string, BossDesign>> = {
  /** 零號機械王：黃銅鍋爐身的發條國王，齒輪王冠、紅披風、背後插著上鍊鑰匙。 */
  'BOSS-09': (k) => {
    const brass = k.paint(B09.brass);
    return (
      <>
        <Shadow w={100} />
        <Rod d="M84 60L101 47" color={B09.key} width={4.5} />
        <Blob d={circles([[100, 39, 7], [109, 51, 7]])} fill={k.paint(B09.key)} />
        <path d={circles([[100, 38.5, 2.6], [109.5, 51, 2.6]])} fill={INK} stroke="none" />
        <path d="M44 62Q66 52 92 62Q104 92 114 118Q90 122 70 116Z" fill={k.paint(B09.royal)} />
        <Rod d="M50 104L48 118M80 104L82 118" color={B09.steel} width={7} />
        <ellipse cx={47} cy={118} rx={9} ry={4} fill={k.paint(B09.brassDeep)} strokeWidth={2} />
        <ellipse cx={83} cy={118} rx={9} ry={4} fill={k.paint(B09.brassDeep)} strokeWidth={2} />
        <ellipse cx={65} cy={86} rx={29} ry={24} fill={brass} />
        <circle cx={63} cy={88} r={11} fill={k.glow(B09.teal)} stroke="none" />
        <path d={gear(63, 88, 7, 8, 2.4, 10)} fill={k.paint(B09.brassDeep)} strokeWidth={1.8} />
        <ellipse cx={63} cy={88} rx={12.5} ry={12.5} fill="none" strokeWidth={3} />
        <ellipse cx={63} cy={88} rx={2.4} ry={3.4} fill="none" stroke={B09.teal} strokeWidth={1.6} />
        <path d={circles([[44, 78, 1.8], [46, 98, 1.8], [84, 78, 1.8], [86, 96, 1.8]])} fill={B09.brassDeep} strokeWidth={1} />
        <Blob d={circles([[42, 64, 6.5], [52, 66, 6.5], [62, 67, 6.5], [72, 66, 6.5], [82, 64, 6.5]])} fill={B09.ermine} width={2} />
        <path d={circles([[46, 64, 1.3], [58, 68, 1.3], [70, 67, 1.3], [80, 63, 1.3]])} fill={INK} stroke="none" />
        <path d={gear(60, 24, 13, 9, 4.5)} fill={k.paint(ROYAL.gold)} />
        <circle cx={60} cy={24} r={4} fill={ROYAL.ruby} strokeWidth={1.6} />
        <rect x={38} y={30} width={44} height={32} rx={11} fill={brass} />
        <rect x={32} y={38} width={7} height={14} rx={3} fill={k.paint(B09.steel)} strokeWidth={2} />
        <rect x={42} y={36} width={34} height={18} rx={8} fill={k.paint('#2f3a48')} strokeWidth={2} />
        <BossEye x={51} y={45} r={5} iris={B09.teal} inner="right" />
        <BossEye x={66} y={45} r={5.5} iris={B09.teal} inner="left" />
        <Detail d={strokes([[48, 57, 48, 60], [53, 57, 53, 60], [58, 57, 58, 60], [63, 57, 63, 60]])} color={INK} w={1.8} />
        <Shine x={46} y={33} rx={5} ry={1.6} opacity={0.55} rotate={-8} />
        <Rod d="M20 40L24 112" color={B09.brassDeep} width={4} />
        <path d={star(20, 34, 9, 4.2, 4, -90)} fill={k.paint(ROYAL.gold)} />
        <circle cx={20} cy={34} r={2.6} fill={B09.teal} strokeWidth={1.2} />
        <path d="M42 76Q32 80 26 76L24 84Q34 90 44 86Z" fill={brass} />
        <circle cx={24} cy={80} r={5.5} fill={k.paint(B09.steel)} strokeWidth={2} />
        <Shine x={52} y={74} rx={9} ry={3} opacity={0.35} />
        <Blob d={circles([[104, 36, 5], [110, 30, 4], [116, 26, 3]])} fill="#e8eef2" width={1.8} opacity={0.8} />
      </>
    );
  },

  /** 逐星巨鹿：夜空色的大鹿，鹿角末端長著星晶，身上散落星點，溫柔但不好惹。 */
  'BOSS-10': (k) => {
    const fur = k.paint(B10.fur);
    return (
      <>
        <Shadow x={70} w={96} />
        <Rod d="M94 92L96 116M104 90L108 116" color={B10.furDeep} width={8} />
        <Detail d="M93 118L99 118M105 118L111 118" color={B10.hoof} w={5} />
        <path d={leaves([[104, 76, 14, 5, -30]])} fill={k.paint(B10.belly)} strokeWidth={2} />
        <ellipse cx={80} cy={84} rx={30} ry={19} fill={fur} />
        <path d={sparkles([[86, 76, 2.6], [98, 84, 2], [74, 90, 2], [94, 94, 1.6]])} fill={B10.star} stroke="none" />
        <Rod d="M60 96L58 116M72 98L72 116" color={B10.fur} width={8} />
        <Detail d="M55 118L61 118M69 118L75 118" color={B10.hoof} w={5} />
        <Blob d={circles([[54, 84, 8], [57, 93, 7]])} fill={k.paint(B10.belly)} width={2} />
        <Rod
          d="M38 38C34 26 28 20 20 16M32 27L26 30M30 23Q28 14 32 8M48 36C52 24 60 18 70 16M56 25L60 31M62 20Q62 10 58 6M66 17L76 12"
          color={B10.antler}
          width={4.5}
        />
        <circle cx={44} cy={13} r={10} fill={k.glow(B10.crystal)} stroke="none" />
        <path d="M44 5L49 13L44 21L39 13Z" fill={k.paint(B10.crystal)} strokeWidth={2} />
        <path d={`${star(20, 15, 6, 2.6)}${star(32, 7, 5, 2.2)}${star(58, 5, 5, 2.2)}${star(77, 11, 6, 2.6)}`} fill={k.paint(B10.star)} strokeWidth={1.6} />
        <path d="M42 60Q50 76 54 88L70 80Q62 62 56 52Z" fill={fur} />
        <path d={leaves([[34, 44, 16, 6, -160], [54, 42, 16, 6, -20]])} fill={fur} />
        <path d="M58 56Q60 40 46 38Q32 38 28 50L16 58Q14 68 24 70Q40 72 52 68Q58 64 58 56Z" fill={fur} />
        <ellipse cx={17} cy={60} rx={4.5} ry={3.6} fill={B10.hoof} strokeWidth={2} />
        <path d={sparkles([[49, 46, 2.2]])} fill={B10.star} stroke="none" />
        <BossEye x={32} y={52} r={5} iris={B10.crystal} inner="right" anger={0.45} />
        <BossEye x={45} y={53} r={5.5} iris={B10.crystal} inner="left" anger={0.45} />
        <ellipse cx={42} cy={63} rx={3.6} ry={2.2} fill={B10.glowPink} opacity={0.75} stroke="none" />
        <path d="M22 66Q27 69 32 66" fill="none" strokeWidth={1.8} />
        <Shine x={70} y={72} rx={10} ry={3.2} opacity={0.3} />
        <Shine x={38} y={42} rx={5} ry={2} opacity={0.35} />
        <path d={sparkles([[104, 22, 4], [116, 44, 3], [8, 40, 3]])} fill={B10.star} strokeWidth={1.2} />
      </>
    );
  },

  /** 天穹審判官：飄在雲上的白石聖騎，金光環、發光面甲，手提天平。 */
  'BOSS-11': (k) => {
    const marble = k.paint(B11.marble);
    const wing = k.paint(B11.wing);
    return (
      <>
        <Shadow w={70} float />
        <path d="M76 52C92 30 110 18 126 18C124 34 120 44 112 54Q118 58 110 64Q114 70 104 72Q104 80 92 78Z" fill={wing} />
        <Detail d="M96 42Q108 34 118 30M92 56Q104 52 112 52" color={B11.marbleDeep} w={2} />
        <ellipse cx={64} cy={32} rx={24} ry={8} fill="none" stroke={INK} strokeWidth={7} transform="rotate(-10 64 32)" />
        <ellipse cx={64} cy={32} rx={24} ry={8} fill="none" stroke={B11.halo} strokeWidth={3.2} transform="rotate(-10 64 32)" />
        <Blob d={circles([[40, 108, 10], [54, 112, 11], [70, 112, 11], [86, 108, 10], [64, 102, 10]])} fill={k.paint(B11.cloud)} />
        <path d="M46 60Q64 52 82 60L92 104Q64 112 36 104Z" fill={k.paint(B11.robe)} />
        <path d="M58 60L70 60L74 106L54 106Z" fill={k.paint(B11.marble)} strokeWidth={2} />
        <circle cx={64} cy={78} r={12} fill={k.glow(B11.halo)} stroke="none" />
        <circle cx={64} cy={78} r={6.5} fill={k.paint(B11.gold)} strokeWidth={2} />
        <path d={star(64, 78, 4.6, 1.6, 4, -90)} fill={ROYAL.white} strokeWidth={1} />
        <path d="M44 58C42 44 50 36 62 36C76 36 82 44 80 58Q62 64 44 58Z" fill={marble} />
        <path d="M48 48L58 52L62 50L66 52L78 46L78 52L66 57L58 57L46 54Z" fill={k.paint('#3a4258')} strokeWidth={2} />
        <path d="M50 50L58 53M68 53L76 49" fill="none" stroke={B11.visor} strokeWidth={2.4} />
        <circle cx={53} cy={51} r={6} fill={k.glow(B11.visor)} stroke="none" />
        <circle cx={72} cy={50} r={6} fill={k.glow(B11.visor)} stroke="none" />
        <path d="M60 36C58 26 64 20 72 18C70 24 72 30 68 36Z" fill={k.paint(B11.gold)} />
        <Shine x={52} y={42} rx={5} ry={2.2} opacity={0.6} />
        <path d={leaves([[44, 62, 26, 9, 110]])} fill={wing} />
        <Rod d="M22 34L22 92M8 42L36 42" color={B11.gold} width={3.4} />
        <Detail d="M8 42L2 62M8 42L14 62M36 42L30 70M36 42L42 70" color={B11.gold} w={1.4} />
        <path d="M0 62Q8 70 16 62ZM28 70Q36 78 44 70Z" fill={k.paint(B11.gold)} strokeWidth={2} />
        <circle cx={22} cy={30} r={4} fill={k.paint(B11.gold)} strokeWidth={2} />
        <path d="M42 66Q30 68 26 62L22 70Q32 78 44 74Z" fill={k.paint(B11.robe)} />
        <circle cx={23} cy={66} r={5} fill={marble} strokeWidth={2} />
      </>
    );
  },

  /** 噬頁龍王：墨藍鱗片的胖龍，書頁翅膀、書籤緞帶尾，嘴裡還叼著一張撕下的書頁。 */
  'BOSS-12': (k) => {
    const scale = k.paint(B12.scale);
    const page = k.paint(B12.page);
    return (
      <>
        <Shadow x={68} w={104} />
        <path d="M74 60Q86 22 116 10Q112 34 106 50Z" fill={page} />
        <path d="M78 64Q100 36 126 34Q118 54 108 66Z" fill={page} />
        <Detail d="M84 48L108 22M88 58L114 42M74 60Q86 22 116 10M78 64Q100 36 126 34" color={B12.leather} w={2.4} />
        <Detail d={strokes([[92, 40, 104, 30], [96, 46, 108, 36], [96, 58, 112, 48]])} color="#b8aa90" w={1.4} />
        <path d="M96 104C108 110 118 104 118 94C118 86 110 84 106 90" fill="none" stroke={INK} strokeWidth={14} />
        <path d="M96 104C108 110 118 104 118 94C118 86 110 84 106 90" fill="none" stroke={B12.scale} strokeWidth={9} />
        <path d="M104 90L100 78L106 82L110 76L110 90Z" fill={B12.ribbon} strokeWidth={2} />
        <ellipse cx={86} cy={112} rx={12} ry={8} fill={scale} />
        {/* 背棘畫在身體之前：基部被身體蓋住、只露出尖端，背脊輪廓才像龍而不是貼在背上的三角形。 */}
        <path d="M62 70L70 52L76 67L82 51L88 69L94 57L96 76L103 66L100 82Z" fill={k.paint(B12.horn)} strokeWidth={2} />
        <ellipse cx={74} cy={88} rx={30} ry={26} fill={scale} />
        <ellipse cx={64} cy={94} rx={17} ry={18} fill={k.paint(B12.belly)} strokeWidth={2} />
        <Detail d={strokes([[52, 86, 76, 86], [50, 93, 78, 93], [51, 100, 77, 100], [54, 107, 74, 107]])} color="#c8b48a" w={1.4} />
        <ellipse cx={50} cy={114} rx={12} ry={7} fill={scale} />
        {/* 雙角往後掃（朝右上）：朝上豎起的角縮小後像狗耳朵，往後掃才是龍。 */}
        <path d={leaves([[50, 36, 22, 6, -58], [58, 40, 24, 6, -30]])} fill={k.paint(B12.horn)} />
        <path d="M66 52C66 34 54 30 42 32C30 34 26 42 24 46L10 50Q6 60 12 66Q28 72 48 70Q66 68 66 52Z" fill={scale} />
        <path d="M2 58L18 52L24 70L6 74Z" fill={page} strokeWidth={2} />
        <Detail d={strokes([[6, 60, 18, 56], [7, 65, 20, 61], [8, 70, 21, 66]])} color={B12.ink} w={1.2} />
        <path d="M12 64Q24 70 34 64Q26 74 12 70Z" fill={ROYAL.mouth} strokeWidth={2} />
        <path d="M17 66L19 70L21 66.5Z" fill={ROYAL.tooth} strokeWidth={1} />
        <ellipse cx={14} cy={52} rx={2} ry={1.4} fill={INK} stroke="none" />
        <Crown x={46} y={32} w={20} h={11} fill={k.paint(ROYAL.gold)} gem={B12.candle} tilt={-14} />
        <BossEye x={35} y={47} r={5.5} inner="right" />
        <BossEye x={50} y={47} r={6} inner="left" />
        <Shine x={40} y={38} rx={5} ry={2.2} opacity={0.4} />
        <path d="M46 84Q36 86 32 80L28 88Q38 94 50 90Z" fill={scale} />
        <path d="M26 82L22 86M28 88L23 91" fill="none" strokeWidth={2} />
        <Shine x={66} y={70} rx={8} ry={3} opacity={0.25} />
      </>
    );
  },
};
