import type { ReactNode } from 'react';
import { INK, type Tone } from './palette.ts';

/**
 * 每個渲染實例一套漸層登記表：背包列表會同時出現多把同款武器，
 * 漸層 id 若重複，瀏覽器只會套用第一個定義，卸載後其餘圖示就會失去顏色。
 */
export interface Paint {
  /** 直向物件（刀身、杖身、盒面）：左亮右暗的硬邊雙色；旋轉後仍沿物件寬度分界。 */
  split(tone: Tone): string;
  /** 球體與圓面：左上底色、右下以硬邊切出月牙陰影。 */
  ball(tone: Tone): string;
  /** 橫向物件（砲管、盒身、靴子）：上亮下暗。 */
  fall(tone: Tone): string;
}

export type EquipDesign = (paint: Paint) => ReactNode;

type PaintKind = 'split' | 'ball' | 'fall';

/** 硬邊位置：留下約四成陰影，48px 下才看得出體積又不會吃掉底色。 */
const SPLIT_EDGE = 0.56;
const BALL_EDGE = 0.68;

export function createPaint(prefix: string): { readonly paint: Paint; readonly defs: () => ReactNode } {
  const entries = new Map<string, { readonly id: string; readonly kind: PaintKind; readonly tone: Tone }>();
  const register = (kind: PaintKind, tone: Tone): string => {
    const key = `${kind}:${tone.base}:${tone.shade}`;
    let entry = entries.get(key);
    if (!entry) {
      entry = { id: `${prefix}-${kind[0]}${entries.size}`, kind, tone };
      entries.set(key, entry);
    }
    return `url(#${entry.id})`;
  };
  const paint: Paint = {
    split: (tone) => register('split', tone),
    ball: (tone) => register('ball', tone),
    fall: (tone) => register('fall', tone),
  };
  const defs = (): ReactNode =>
    [...entries.values()].map((entry) =>
      entry.kind !== 'ball' ? (
        <linearGradient key={entry.id} id={entry.id} x1="0" y1="0" x2={entry.kind === 'split' ? 1 : 0} y2={entry.kind === 'split' ? 0 : 1}>
          <stop offset={SPLIT_EDGE} stopColor={entry.tone.base} />
          <stop offset={SPLIT_EDGE} stopColor={entry.tone.shade} />
        </linearGradient>
      ) : (
        <radialGradient key={entry.id} id={entry.id} cx="0.38" cy="0.32" r="0.8">
          <stop offset={BALL_EDGE} stopColor={entry.tone.base} />
          <stop offset={BALL_EDGE} stopColor={entry.tone.shade} />
        </radialGradient>
      ),
    );
  return { paint, defs };
}

/** 外框統一規格：48 格 viewBox 下 2 單位粗、圓角接合，與角色、怪物同一套描邊語言。 */
export const OUTLINE = { stroke: INK, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;

/**
 * 長柄物件以直立方式繪製，再整組轉 45° 成「左下握柄、右上尖端」的標準道具角度。
 * mid 為物件直立時的長度中點，轉動前先把它移到畫面中心，物件才會置中。
 */
export function Diagonal({ mid = 24, angle = 45, children }: { readonly mid?: number; readonly angle?: number; readonly children: ReactNode }) {
  return <g transform={`rotate(${angle} 24 24) translate(0 ${24 - mid})`}>{children}</g>;
}

/** 小高光：不填色的亮色細線，放在物件左上受光面。 */
export function Shine({ d, color, width = 1.4 }: { readonly d: string; readonly color: string; readonly width?: number }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />;
}

/** 墨線細節（纏繩、刻痕、縫線）：比外框細，才不會跟輪廓搶。 */
export function Ink({ d, width = 1.2, color = INK }: { readonly d: string; readonly width?: number; readonly color?: string }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />;
}

interface TubeProps {
  readonly d: string;
  /** 管子的視覺寬度（含外框）。 */
  readonly width: number;
  readonly color: string;
  readonly dash?: string;
  /** 細線（弓弦、絲線）時直接指定色線寬，避免扣掉外框後細到看不見。 */
  readonly core?: number;
}

/**
 * 管狀物（弓臂、繩索、杖身、鍊條）：先畫寬墨線、再疊窄色線，視覺上等同有外框的填色形狀，
 * 但只需兩個元素；dash 用於鍊條與條紋。
 */
export function Tube({ d, width, color, dash, core }: TubeProps) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={width + 2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={core ?? Math.max(width - 2, 0.8)} strokeLinecap={dash ? 'butt' : 'round'} strokeLinejoin="round" strokeDasharray={dash} />
    </>
  );
}
