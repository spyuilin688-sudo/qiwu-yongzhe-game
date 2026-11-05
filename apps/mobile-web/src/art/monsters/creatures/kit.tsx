import type { ReactNode } from 'react';

/**
 * 每個渲染實例一套漸層登記表。漸層 id 必須每個實例唯一：同頁多隻同種怪時，
 * 瀏覽器只會套用第一個同名定義，換頁或卸載後就會整隻變黑。
 */
export interface Kit {
  /** 卡通平塗兩階明暗：左上為底色、右下以硬邊切出陰影色。回傳 url(#…)。 */
  paint(base: string): string;
  /** 由中心向外淡出的光暈（眼光、火光、星光）。回傳 url(#…)。 */
  glow(color: string): string;
}

export type CreatureDesign = (kit: Kit) => ReactNode;

const SHADE_TARGET = '#2a150c';
/** 陰影混入暖深褐的比例：太深會吃掉描邊，太淺在小尺寸看不出體積。 */
const SHADE_AMOUNT = 0.3;
/** 硬邊陰影的位置（相對外接框的放射距離），約留下右下 1/4 的月牙陰影。 */
const SHADE_EDGE = 0.7;

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

type GradientKind = 'paint' | 'glow';

export function createKit(prefix: string): { readonly kit: Kit; readonly defs: () => ReactNode } {
  const entries = new Map<string, { readonly id: string; readonly kind: GradientKind; readonly color: string }>();
  const register = (kind: GradientKind, color: string): string => {
    const key = `${kind}:${color}`;
    let entry = entries.get(key);
    if (!entry) {
      entry = { id: `${prefix}-${kind[0]}${entries.size}`, kind, color };
      entries.set(key, entry);
    }
    return `url(#${entry.id})`;
  };
  const kit: Kit = {
    paint: (base) => register('paint', base),
    glow: (color) => register('glow', color),
  };
  const defs = (): ReactNode =>
    [...entries.values()].map((entry) =>
      entry.kind === 'paint' ? (
        <radialGradient key={entry.id} id={entry.id} cx="0.36" cy="0.3" r="0.8">
          <stop offset={SHADE_EDGE} stopColor={entry.color} />
          <stop offset={SHADE_EDGE} stopColor={shadeOf(entry.color)} />
        </radialGradient>
      ) : (
        <radialGradient key={entry.id} id={entry.id}>
          <stop offset="0.15" stopColor={entry.color} stopOpacity="0.9" />
          <stop offset="1" stopColor={entry.color} stopOpacity="0" />
        </radialGradient>
      ),
    );
  return { kit, defs };
}
