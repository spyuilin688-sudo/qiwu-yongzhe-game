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
}

type Entry =
  | { readonly id: string; readonly kind: 'vertical'; readonly stops: readonly Stop[] }
  | { readonly id: string; readonly kind: 'glow'; readonly color: string; readonly strength: number };

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
  };
  const defs = (): ReactNode =>
    [...entries.values()].map((entry) =>
      entry.kind === 'vertical' ? (
        <linearGradient key={entry.id} id={entry.id} x1="0" y1="0" x2="0" y2="1">
          {entry.stops.map(([offset, color, opacity = 1]) => (
            <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
          ))}
        </linearGradient>
      ) : (
        <radialGradient key={entry.id} id={entry.id}>
          <stop offset="0" stopColor={entry.color} stopOpacity={entry.strength} />
          <stop offset="1" stopColor={entry.color} stopOpacity="0" />
        </radialGradient>
      ),
    );
  return { kit, defs };
}
