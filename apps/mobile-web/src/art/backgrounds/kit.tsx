import type { ReactNode } from 'react';

/** 漸層停駐點：位置（0～1）、顏色、不透明度（省略為 1）。 */
export type Stop = readonly [offset: number, color: string, opacity?: number];

/**
 * 每個背景實例一套漸層登記表。戰場與圖鑑可能同時掛多張背景，
 * id 必須帶 useId() 前綴，否則瀏覽器只會套用第一張圖的漸層。
 */
export interface BackdropKit {
  /** 直向漸層（天空、地面、光柱）。回傳 url(#…)。 */
  vertical(stops: readonly Stop[]): string;
  /** 由中心向外淡出的光暈（太陽、月亮、燈火、熔岩）。回傳 url(#…)。 */
  glow(color: string, strength?: number): string;
  /**
   * 暗角：中心透明、往外漸暗（王庭地面的兩側）。cx、cy、r 以填色範圍為 0～1 計算，
   * 例如 cy=0 把亮區中心放在地面帶頂端，只讓前景兩角變暗。
   */
  vignette(color: string, strength: number, cx?: number, cy?: number, r?: number): string;
}

/** 暗角從半徑多少開始變暗：太小會把 BOSS 腳下也壓暗，太大兩側看不出差別。 */
const VIGNETTE_CLEAR_RADIUS = 0.45;

type Entry =
  | { readonly id: string; readonly kind: 'vertical'; readonly stops: readonly Stop[] }
  | { readonly id: string; readonly kind: 'glow'; readonly color: string; readonly strength: number }
  | {
      readonly id: string;
      readonly kind: 'vignette';
      readonly color: string;
      readonly strength: number;
      readonly cx: number;
      readonly cy: number;
      readonly r: number;
    };

function renderEntry(entry: Entry): ReactNode {
  switch (entry.kind) {
    case 'vertical':
      return (
        <linearGradient key={entry.id} id={entry.id} x1="0" y1="0" x2="0" y2="1">
          {entry.stops.map(([offset, color, opacity = 1]) => (
            <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
          ))}
        </linearGradient>
      );
    case 'glow':
      return (
        <radialGradient key={entry.id} id={entry.id}>
          <stop offset="0" stopColor={entry.color} stopOpacity={entry.strength} />
          <stop offset="1" stopColor={entry.color} stopOpacity="0" />
        </radialGradient>
      );
    case 'vignette':
      return (
        <radialGradient key={entry.id} id={entry.id} cx={entry.cx} cy={entry.cy} r={entry.r}>
          <stop offset={VIGNETTE_CLEAR_RADIUS} stopColor={entry.color} stopOpacity="0" />
          <stop offset="1" stopColor={entry.color} stopOpacity={entry.strength} />
        </radialGradient>
      );
  }
}

export function createBackdropKit(prefix: string): { readonly kit: BackdropKit; readonly defs: () => ReactNode } {
  const entries = new Map<string, Entry>();
  const register = (key: string, build: (id: string) => Entry): string => {
    let entry = entries.get(key);
    if (!entry) {
      entry = build(`${prefix}-${entries.size}`);
      entries.set(key, entry);
    }
    return `url(#${entry.id})`;
  };
  const kit: BackdropKit = {
    vertical: (stops) => register(`v:${JSON.stringify(stops)}`, (id) => ({ id, kind: 'vertical', stops })),
    glow: (color, strength = 0.85) => register(`g:${color}:${strength}`, (id) => ({ id, kind: 'glow', color, strength })),
    vignette: (color, strength, cx = 0.5, cy = 0.5, r = 0.5) =>
      register(`n:${color}:${strength}:${cx}:${cy}:${r}`, (id) => ({ id, kind: 'vignette', color, strength, cx, cy, r })),
  };
  const defs = (): ReactNode => [...entries.values()].map(renderEntry);
  return { kit, defs };
}
