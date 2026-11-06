import type { ReactNode } from 'react';

/**
 * 每個渲染實例一套漸層登記表。BOSS 會同時出現在戰場、圖鑑與彈窗，
 * 漸層 id 若重複，瀏覽器只套用第一個定義，卸載後其他實例就會整片變黑；
 * 因此 id 一律帶 useId() 前綴，並依「種類＋顏色」去重以控制 <defs> 大小。
 */
export interface BossKit {
  /** 卡通平塗兩階明暗：左上底色、右下硬邊月牙陰影。回傳 url(#…)。 */
  paint(base: string): string;
  /** 由中心向外淡出的光暈（瞳光、核心、火光）。回傳 url(#…)。 */
  glow(color: string): string;
  /** 上下兩色的柔和直向漸層（翅膜、冰殼、披風內襯）。回傳 url(#…)。 */
  fade(top: string, bottom: string): string;
}

export type BossDesign = (kit: BossKit) => ReactNode;

const SHADE_TARGET = '#2a150c';
/** 與小怪同一套明暗比例，BOSS 和小怪並排時體積感一致。 */
const SHADE_AMOUNT = 0.3;
/** 硬邊陰影位置：大尺寸 BOSS 稍微收窄陰影，避免大面積暗色吃掉輪廓細節。 */
const SHADE_EDGE = 0.72;

function channels(hex: string): readonly [number, number, number] {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function mix(from: string, to: string, amount: number): string {
  const a = channels(from);
  const b = channels(to);
  const out = a.map((channel, index) => Math.round(channel + ((b[index] ?? channel) - channel) * amount));
  return `#${out.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

export const shadeOf = (color: string): string => mix(color, SHADE_TARGET, SHADE_AMOUNT);

type Entry =
  | { readonly id: string; readonly kind: 'paint'; readonly color: string }
  | { readonly id: string; readonly kind: 'glow'; readonly color: string }
  | { readonly id: string; readonly kind: 'fade'; readonly top: string; readonly bottom: string };

export function createBossKit(prefix: string): { readonly kit: BossKit; readonly defs: () => ReactNode } {
  const entries = new Map<string, Entry>();
  const register = (key: string, build: (id: string) => Entry): string => {
    let entry = entries.get(key);
    if (!entry) {
      entry = build(`${prefix}-${entries.size}`);
      entries.set(key, entry);
    }
    return `url(#${entry.id})`;
  };
  const kit: BossKit = {
    paint: (color) => register(`p:${color}`, (id) => ({ id, kind: 'paint', color })),
    glow: (color) => register(`g:${color}`, (id) => ({ id, kind: 'glow', color })),
    fade: (top, bottom) => register(`f:${top}:${bottom}`, (id) => ({ id, kind: 'fade', top, bottom })),
  };
  const defs = (): ReactNode => [...entries.values()].map(renderEntry);
  return { kit, defs };
}

function renderEntry(entry: Entry): ReactNode {
  switch (entry.kind) {
    case 'paint':
      return (
        <radialGradient key={entry.id} id={entry.id} cx="0.36" cy="0.3" r="0.8">
          <stop offset={SHADE_EDGE} stopColor={entry.color} />
          <stop offset={SHADE_EDGE} stopColor={shadeOf(entry.color)} />
        </radialGradient>
      );
    case 'glow':
      return (
        <radialGradient key={entry.id} id={entry.id}>
          <stop offset="0.15" stopColor={entry.color} stopOpacity="0.95" />
          <stop offset="1" stopColor={entry.color} stopOpacity="0" />
        </radialGradient>
      );
    case 'fade':
      return (
        <linearGradient key={entry.id} id={entry.id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={entry.top} />
          <stop offset="1" stopColor={entry.bottom} />
        </linearGradient>
      );
  }
}
