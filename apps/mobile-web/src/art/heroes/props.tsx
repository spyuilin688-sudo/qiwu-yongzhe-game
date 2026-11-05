import type { ReactNode } from 'react';
import type { Point } from './rig.tsx';
import { capsulePath } from './shapes.ts';

/**
 * 多個職業共用的小道具與特效。座標皆為 HeroArt 的 64×80 viewBox。
 */

/** 武器以「握點為原點、刃朝上」繪製，再旋轉到手上，避免每把武器都手算斜線座標。 */
export function Held({ at, angle, children }: { at: Point; angle: number; children: ReactNode }) {
  return <g transform={`translate(${at.x} ${at.y}) rotate(${angle})`}>{children}</g>;
}

/** 三轉光暈：放射漸層，id 由呼叫端以 useSvgId 產生確保每個實例唯一。 */
export function Aura({ id, color, cy = 46, r = 28 }: { id: string; color: string; cy?: number; r?: number }) {
  return (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity="0.7" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy={cy} rx={r} ry={r * 1.12} fill={`url(#${id})`} stroke="none" />
    </>
  );
}

/** 四芒閃光：三轉點綴，避免用文字或濾鏡做發光。 */
export function Sparkle({ x, y, size, color }: Point & { size: number; color: string }) {
  const s = size;
  const w = s * 0.28;
  return (
    <path
      d={`M${x} ${y - s}Q${x + w} ${y - w} ${x + s} ${y}Q${x + w} ${y + w} ${x} ${y + s}Q${x - w} ${y + w} ${x - s} ${y}Q${x - w} ${y - w} ${x} ${y - s}Z`}
      fill={color}
      stroke="none"
    />
  );
}

/** 有描邊的帶狀物（背帶、繩子）：單一膠囊路徑。 */
export function Strap({ from, to, color, width = 2.2 }: { from: Point; to: Point; color: string; width?: number }) {
  return (
    <path d={capsulePath(from, to, width / 2 + 0.6)} fill={color} strokeWidth="1.2" />
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
        <path d={`M${tail - 0.4} ${hem - 0.4}Q${tail + 6} ${hem + 1.8} 26.6 ${hem - 2.6}`} fill="none" stroke={trim} strokeWidth="1.6" />
      ) : null}
    </>
  );
}
