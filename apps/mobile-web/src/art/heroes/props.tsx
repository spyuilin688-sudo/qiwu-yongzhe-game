import type { ReactNode } from 'react';
import { INK, LINE, type LineWeight, type Tone } from './palette.ts';
import type { Point } from './rig.tsx';
import { capsulePath, ellipsePath, sparklePath } from './shapes.ts';

/**
 * 多個職業共用的小道具與特效。座標皆為 HeroArt 的 64×80 viewBox。
 */

/**
 * 武器以「握點為原點、刃朝上」繪製，再旋轉到手上，避免每把武器都手算斜線座標。
 * 武器的亮面固定畫在原點的 +x 側（正手握時朝向右上方主光）；反手握時 +x 會轉到背光面，
 * 這時傳 mirror 把武器左右翻面，讓亮面仍朝主光，而且不必多包一層群組。
 */
export function Held({ at, angle, mirror = false, children }: { at: Point; angle: number; mirror?: boolean; children: ReactNode }) {
  return <g transform={`translate(${at.x} ${at.y}) rotate(${angle})${mirror ? ' scale(-1 1)' : ''}`}>{children}</g>;
}

/** 腳下魔法陣：踩在地面的亮線，在亮色與暗色地圖都看得到，是三轉的固定標記。 */
const SIGIL = { cx: 33, cy: 76.6, outer: { rx: 19, ry: 3.6 }, inner: { rx: 15.5, ry: 2.8 } } as const;
const SIGIL_PATH =
  ellipsePath(SIGIL.cx, SIGIL.cy, SIGIL.outer.rx, SIGIL.outer.ry) + ellipsePath(SIGIL.cx, SIGIL.cy, SIGIL.inner.rx, SIGIL.inner.ry);

/**
 * 三轉光暈：放射漸層加腳下魔法陣，id 由呼叫端以 useSvgId 產生確保每個實例唯一。
 * 漸層分三段，中段仍保留約三分之一的不透明度：舊版兩段式在肩膀外側只剩兩成，亮色天空上幾乎看不見。
 * 魔法陣先墊一圈半透明墨色，再疊光色細線：只有光色時，淡黃、淡藍線條在淺色地面上會消失。
 */
export function Aura({ id, color, cy = 46, r = 28 }: { id: string; color: string; cy?: number; r?: number }) {
  return (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity="0.75" />
          <stop offset="0.55" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy={cy} rx={r} ry={r * 1.12} fill={`url(#${id})`} stroke="none" />
      <path d={SIGIL_PATH} fill="none" stroke={INK} strokeWidth={LINE.silhouette + LINE.detail} opacity="0.45" />
      <path d={SIGIL_PATH} fill="none" stroke={color} strokeWidth={LINE.feature} />
    </>
  );
}

/** 閃光最小尺寸：56px 顯示時約 3px，再小就只剩一個亮點，看不出是三轉點綴。 */
export const SPARKLE_MIN_SIZE = 3.2;

export interface SparkleSpot extends Point {
  readonly size: number;
}

/** 四芒閃光：三轉點綴，避免用文字或濾鏡做發光；同色多顆合成一條路徑。 */
export function Sparkles({ spots, color }: { spots: readonly SparkleSpot[]; color: string }) {
  const d = spots.map(({ x, y, size }) => sparklePath(x, y, Math.max(size, SPARKLE_MIN_SIZE))).join('');
  return <path d={d} fill={color} stroke="none" />;
}

/** 有描邊的帶狀物（背帶、繩子）：單一膠囊路徑。帶子本身很窄，用細節線寬才看得到帶子的顏色。 */
export function Strap({ from, to, color, width = 2.2 }: { from: Point; to: Point; color: string; width?: number }) {
  return <path d={capsulePath(from, to, width / 2 + 0.6)} fill={color} strokeWidth={LINE.detail} />;
}

/**
 * 帶墨線外框的粗線條（法杖桿、弓臂、頭帶、光環）：先畫墨色底線，再疊同一路徑的彩色線。
 * 墨線每側露出 weight 線寬的一半，和填色圖形的外框粗細一致。
 */
export function InkedLine({ d, color, width, weight = 'silhouette' }: { d: string; color: string; width: number; weight?: LineWeight }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={width + LINE[weight]} />
      <path d={d} fill="none" stroke={color} strokeWidth={width} />
    </>
  );
}

/** 身後披風：tier 越高越長、越寬；顏色與滾邊由職業決定。 */
export function Cape({ color, shade, trim, length }: { color: string; shade: string; trim?: string; length: 'short' | 'long' }) {
  const hem = length === 'long' ? 73 : 62;
  const tail = length === 'long' ? 10 : 12.5;
  return (
    <>
      <path d={`M25 41C20 48 ${tail} ${hem - 6} ${tail - 1} ${hem}Q${tail + 6} ${hem + 2.4} 27 ${hem - 2}L37 41Z`} fill={color} />
      <path d={`M25.4 42.4C22 49 ${tail + 3} ${hem - 6} ${tail + 1.6} ${hem - 0.6}Q${tail + 5} ${hem + 0.8} 22 ${hem - 2.6}Z`} fill={shade} stroke="none" />
      {trim ? (
        <path d={`M${tail - 0.4} ${hem - 0.4}Q${tail + 6} ${hem + 1.8} 26.6 ${hem - 2.6}`} fill="none" stroke={trim} strokeWidth={LINE.part} />
      ) : null}
    </>
  );
}

/** 前肩護甲：劍士與熔爐神匠共用同一片肩甲，只換金屬色。 */
export function Pauldron({ tone }: { tone: Tone }) {
  return (
    <>
      <path d="M35 45.2Q35.2 40.2 40 40.2Q44.6 40.4 44.6 45.6Q40 43.6 35 45.2Z" fill={tone.base} />
      <path d="M37 42.2Q39.6 41 42 42" fill="none" stroke={tone.light} strokeWidth={LINE.detail} />
    </>
  );
}

/** 毛皮肩領的鋸齒下緣：一眼可辨的「野性」剪影；grand 是三轉加寬加長的版本。 */
const FUR_COLLAR = {
  regular: 'M22.6 40.4Q22 46 24.8 46.6L26.4 48.6L28.4 46.8L30.6 49L32.6 46.8L34.8 48.8L36.6 46.6L38.8 48.2Q41.6 46.4 41.2 40.4Z',
  grand: 'M21.4 40Q20.4 47.4 23.6 48.6L25.4 51.4L27.8 48.8L30.4 51.8L32.8 48.8L35.4 51.6L37.6 48.6L40.4 50.4Q43.2 47 42.2 40Z',
} as const;

/** 毛皮是部件而非外輪廓：用部件線寬，鋸齒才不會在胸口糊成一圈黑邊。 */
export function FurCollar({ color, grand = false }: { color: string; grand?: boolean }) {
  return <path d={grand ? FUR_COLLAR.grand : FUR_COLLAR.regular} fill={color} strokeWidth={LINE.part} />;
}
