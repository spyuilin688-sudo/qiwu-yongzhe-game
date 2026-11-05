import type { ReactNode } from 'react';
import { fmt, shape } from './geometry.ts';
import { FX, INK, type Tone } from './palette.ts';
import { isRedSuit, suitPath, type Suit } from './suits.ts';

/** 技能符號一律平塗（不用漸層），省下的元素預算留給造型本身。 */
export type SkillGlyph = () => ReactNode;

/** 符號描邊：比外框略細，避免小尺寸時線條糊在一起。 */
export const GLYPH_STROKE = 1.8;

/** 單位座標範本（約 -1..1），交給 geometry.shape() 放到指定位置。 */
export const TEMPLATE = {
  drop: 'M0 -1C0.3 -0.5 0.7 -0.1 0.7 0.35C0.7 0.75 0.38 1 0 1C-0.38 1 -0.7 0.75 -0.7 0.35C-0.7 -0.1 -0.3 -0.5 0 -1Z',
  flame:
    'M0 -1C0.18 -0.6 0.75 -0.35 0.75 0.25C0.75 0.72 0.4 1 0 1C-0.4 1 -0.75 0.72 -0.75 0.25C-0.75 -0.15 -0.5 -0.3 -0.42 -0.6C-0.25 -0.35 -0.15 -0.25 -0.05 -0.3C-0.12 -0.55 -0.1 -0.8 0 -1Z',
  bolt: 'M0.2 -1L-0.5 0.12L-0.04 0.12L-0.25 1L0.52 -0.2L0.06 -0.2L0.38 -1Z',
  diamond: 'M0 -1L0.42 0L0 1L-0.42 0Z',
  kite: 'M0 -1L0.36 0.45L0 1L-0.36 0.45Z',
  chevron: 'M-1 0.4L0 -0.6L1 0.4L1 1L0 0L-1 1Z',
  crown: 'M-1 0.6L-0.85 -0.55L-0.4 -0.05L0 -0.8L0.4 -0.05L0.85 -0.55L1 0.6Z',
  heart: 'M0 0.95C-0.25 0.7 -1 0.25 -1 -0.3C-1 -0.75 -0.65 -1 -0.32 -1C-0.12 -1 0 -0.85 0 -0.65C0 -0.85 0.12 -1 0.32 -1C0.65 -1 1 -0.75 1 -0.3C1 0.25 0.25 0.7 0 0.95Z',
} as const;

/** 群組變換：只平移、旋轉、等比縮放；描邊依縮放反向補償，維持全圖一致粗細。 */
export function Place({ x, y, angle = 0, scale = 1, children, opacity }: PlaceProps) {
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(angle)}) scale(${fmt(scale)})`} strokeWidth={GLYPH_STROKE / scale} opacity={opacity}>
      {children}
    </g>
  );
}

interface PlaceProps {
  readonly x: number;
  readonly y: number;
  readonly angle?: number;
  readonly scale?: number;
  readonly opacity?: number;
  readonly children: ReactNode;
}

/**
 * 雙層線（光束、震波、雷電、軌跡）：先畫寬墨線、再疊亮色細線，
 * 在任何底色上都能保持輪廓；dash 用於追蹤軌跡與虛線圈。
 */
export function Beam({ d, color, width = 2, dash }: { readonly d: string; readonly color: string; readonly width?: number; readonly dash?: string }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={width + 2.2} strokeDasharray={dash} />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash} />
    </>
  );
}

/** 無描邊的亮線（刃面高光、速度線的亮芯）。 */
export function Glint({ d, color = FX.white, width = 1.2, opacity }: { readonly d: string; readonly color?: string; readonly width?: number; readonly opacity?: number }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={width} opacity={opacity} />;
}

/** 直立長劍（尖端朝上、長約 32）：劍士系多數符號的主角。 */
export function Sword({ blade = FX.steel, hilt = FX.gold }: { readonly blade?: Tone; readonly hilt?: Tone }) {
  return (
    <>
      <path d="M0 -15L2.7 -11V4.6H-2.7V-11Z" fill={blade.base} />
      <path d="M0 -11.6V2.8" fill="none" stroke={blade.shade} strokeWidth={1.1} />
      <rect x="-7" y="4.4" width="14" height="3.4" rx="1.6" fill={hilt.base} />
      <rect x="-1.6" y="7.8" width="3.2" height="5.8" rx="1" fill={FX.wood.base} />
      <circle cx="0" cy="15" r="2" fill={hilt.base} />
    </>
  );
}

/** 迷你劍（長約 18）：多把劍同框時用，三個元素以控制預算。 */
export function MiniSword({ blade = FX.steel }: { readonly blade?: Tone }) {
  return (
    <>
      <path d="M0 -9L2 -6V3H-2V-6Z" fill={blade.base} />
      <path d="M-4.6 3H4.6V5.4H-4.6Z" fill={FX.gold.base} />
      <path d="M-1.1 5.4H1.1V9.4H-1.1Z" fill={FX.wood.base} />
    </>
  );
}

/** 短刀（尖端朝上、長約 22）：盜賊系使用。ghost 為殘影：只留剪影、不描邊。 */
export function Dagger({ blade = FX.steel, ghost }: { readonly blade?: Tone; readonly ghost?: string }) {
  if (ghost) return <path d="M0 -11L2.8 -4L2 3H4.8V5.4H1.4V10.6H-1.4V5.4H-4.8V3H-2L-2.8 -4Z" fill={ghost} stroke="none" />;
  return (
    <>
      <path d="M0 -11L2.8 -4L2 3H-2L-2.8 -4Z" fill={blade.base} />
      <path d="M0 -8V1.6" fill="none" stroke={blade.shade} strokeWidth={1} />
      <rect x="-4.8" y="3" width="9.6" height="2.6" rx="1.2" fill={FX.darkIron.base} />
      <rect x="-1.4" y="5.6" width="2.8" height="5" rx="0.8" fill={FX.shadow.shade} />
      <circle cx="0" cy="11.6" r="1.4" fill={FX.gold.base} />
    </>
  );
}

/**
 * 箭：從 (x1,y1) 箭尾射向 (x2,y2) 箭尖。沿 +x 軸繪製再旋轉，
 * 箭桿用雙層線，箭頭與箭羽用填色，四個元素。
 */
export function Arrow({ x1, y1, x2, y2, fletch = FX.mark, head = FX.steel.base }: ArrowProps) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const shaft = `M2 0H${fmt(length - 4)}`;
  return (
    <g transform={`translate(${fmt(x1)} ${fmt(y1)}) rotate(${fmt(angle)})`}>
      <path d={shaft} fill="none" stroke={INK} strokeWidth={3.6} />
      <path d={shaft} fill="none" stroke={FX.wood.light} strokeWidth={1.4} />
      <path d={`M${fmt(length)} 0L${fmt(length - 6.4)} -3.6L${fmt(length - 5)} 0L${fmt(length - 6.4)} 3.6Z`} fill={head} />
      <path d="M-1 0L-3.4 -3.4H2.6L5 0L2.6 3.4H-3.4Z" fill={fletch} />
    </g>
  );
}

interface ArrowProps {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly fletch?: string;
  readonly head?: string;
}

/** 撲克牌（13×18，中心為原點）：正面印花色；back 為紅色牌背。 */
export function Card({ suit, back, ghost }: { readonly suit?: Suit; readonly back?: boolean; readonly ghost?: boolean }) {
  if (ghost) return <rect x="-6.5" y="-9" width="13" height="18" rx="2" fill={FX.white} fillOpacity={0.28} strokeDasharray="2.2 1.6" />;
  if (back)
    return (
      <>
        <rect x="-6.5" y="-9" width="13" height="18" rx="2" fill={FX.cardBack} />
        <rect x="-4.3" y="-6.8" width="8.6" height="13.6" rx="1" fill="none" stroke={FX.gold.light} strokeWidth={0.9} />
      </>
    );
  return (
    <>
      <rect x="-6.5" y="-9" width="13" height="18" rx="2" fill={FX.paper} />
      {suit ? <path d={suitPath(suit, 0, 0, 4.2)} fill={isRedSuit(suit) ? FX.cardRed : FX.cardInk} strokeWidth={1} /> : null}
    </>
  );
}

/** 側面拳頭（指節朝右，約 19×16）：武僧系出拳。ghost 為殘影剪影。 */
export function Fist({ ghost }: { readonly ghost?: string }) {
  const body = 'M-7 -5Q-7 -8 -4 -8H5Q8.6 -8 8.6 -4.6V4.2Q8.6 8 4.6 8H-4Q-7 8 -7 5Z';
  if (ghost) return <path d={`${body}M-11 -5H-7V5H-11Z`} fill={ghost} stroke="none" />;
  return (
    <>
      <rect x="-11.4" y="-5.4" width="5" height="10.8" rx="1.4" fill={FX.cream} />
      <path d={body} fill={FX.skin.base} />
      <path d="M3.4 -3.2H8.4M3.4 0.6H8.4M3.4 4.2H7.8" fill="none" stroke={FX.skin.shade} strokeWidth={1.1} />
      <path d="M-7 0.6Q-1.6 -0.6 1.2 2.6Q-0.8 6.4 -6.4 5.8" fill={FX.skin.light} strokeWidth={1.3} />
    </>
  );
}

/** 鎚子（鎚頭朝上、長約 28）：工匠系。hot 時鎚頭燒紅。 */
export function Hammer({ hot }: { readonly hot?: boolean }) {
  const head = hot ? FX.fire : FX.iron;
  return (
    <>
      <path d="M0 -3V13" fill="none" stroke={INK} strokeWidth={5.4} strokeLinecap="round" />
      <path d="M0 -3V13" fill="none" stroke={FX.wood.base} strokeWidth={2.4} strokeLinecap="round" />
      <rect x="-9" y="-11" width="18" height="8.4" rx="1.8" fill={head.base} />
      <path d="M2 -11H7.2Q9 -11 9 -9.2V-4.4Q9 -2.6 7.2 -2.6H2Z" fill={head.shade} stroke="none" />
      <rect x="-2.4" y="-12" width="4.8" height="10.4" rx="1" fill={FX.copper.base} />
    </>
  );
}

/** 範本形狀的快捷：回傳 path 字串（等比）。 */
export const at = (template: string, x: number, y: number, size: number, rotateDeg = 0, stretch = 1): string =>
  shape(template, x, y, size, size * stretch, rotateDeg);
