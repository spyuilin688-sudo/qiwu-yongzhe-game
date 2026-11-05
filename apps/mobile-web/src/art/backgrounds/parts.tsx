import type { ReactNode } from 'react';
import type { BackdropKit, Stop } from './kit.tsx';

/**
 * 背景共用構圖。戰場規格：角色腳點在高度 74～76%，地面帶從 64%（y≈174）開始，
 * 所以遠景只畫在地平線以上，地面前緣（y>215）才放高對比的小物件；
 * 角色身後（x 60～370、y 110～210）一律維持低對比，讓角色與傷害飄字清楚。
 */
export const W = 390;
export const H = 272;
export const HORIZON = 174;

export type SceneDesign = (kit: BackdropKit, zone: ZoneLook) => ReactNode;

/**
 * 區域外觀：同一張地圖的 6 個區域共用場景，只換光線與道具位置，
 * 第 6 區（BOSS 王庭）額外加上王庭點綴，玩家走到最後一區會感覺「快到王了」。
 */
export interface ZoneLook {
  readonly index: number;
  /** 遠景與道具的水平位移（px），製造「往前走了一段」的感覺。 */
  readonly shift: number;
  /** 越深入地圖光線越偏暮色（0～1，由場景決定混入哪個色）。 */
  readonly dusk: number;
  readonly isCourt: boolean;
}

export const ZONE_COUNT = 6;
const ZONE_SHIFTS = [0, -46, 28, -72, 52, -18] as const;
const ZONE_DUSK = [0, 0.05, 0.1, 0.15, 0.2, 0.3] as const;

export function zoneLook(zoneIndex: number | undefined): ZoneLook {
  const raw = Number.isFinite(zoneIndex) ? Math.trunc(zoneIndex ?? 0) : 0;
  const index = Math.min(ZONE_COUNT - 1, Math.max(0, raw));
  return { index, shift: ZONE_SHIFTS[index] ?? 0, dusk: ZONE_DUSK[index] ?? 0, isCourt: index === ZONE_COUNT - 1 };
}

const f = (value: number): number => Math.round(value * 10) / 10;

/** Catmull-Rom 轉三次貝茲：把取樣點連成平滑稜線，丘陵、沙丘、雲海都用它。 */
export function smooth(points: readonly (readonly [number, number])[]): string {
  if (points.length === 0) return '';
  const first = points[0]!;
  let d = `M${f(first[0])} ${f(first[1])}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index]!;
    const p1 = points[index]!;
    const p2 = points[index + 1]!;
    const p3 = points[index + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/**
 * 起伏稜線（封閉到 bottom）：兩組不同頻率的正弦疊加，看起來自然而不規則；
 * phase 讓不同區域的丘陵形狀不同。
 */
export function hills(base: number, amplitude: number, waves: number, phase: number, bottom = HORIZON + 6): string {
  const samples = Math.max(6, Math.round(waves * 6));
  const points = Array.from({ length: samples + 1 }, (_, index): readonly [number, number] => {
    const t = index / samples;
    const angle = t * Math.PI * 2 * waves + phase;
    return [-12 + t * (W + 24), base - amplitude * (0.62 * Math.sin(angle) + 0.38 * Math.sin(angle * 2.3 + 1.7))];
  });
  return `${smooth(points)}L${W + 12} ${bottom}L-12 ${bottom}Z`;
}

/** 尖峰山脈：峰點列表直線相連（雪山、火山、岩壁）。 */
export function ridge(peaks: readonly (readonly [number, number])[], bottom = HORIZON + 6): string {
  return `M-12 ${bottom}L${peaks.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}L${W + 12} ${bottom}Z`;
}

export type Circle = readonly [cx: number, cy: number, r: number];

export function circles(list: readonly Circle[]): string {
  return list.map(([cx, cy, r]) => `M${f(cx - r)} ${f(cy)}a${r} ${r} 0 1 0 ${f(r * 2)} 0a${r} ${r} 0 1 0 ${f(-r * 2)} 0Z`).join('');
}

/** 雲朵：一排大小不一的圓，底部切平（以扁橢圓壓底）。 */
export function cloud(x: number, y: number, size: number): string {
  const s = size;
  return `${circles([[x, y, s * 0.55], [x + s * 0.6, y - s * 0.25, s * 0.7], [x + s * 1.3, y, s * 0.5]])}M${f(x - s * 0.5)} ${f(y + s * 0.1)}h${f(s * 2.3)}v${f(s * 0.4)}h${f(-s * 2.3)}Z`;
}

/** 四芒星點（星空、雪花、火星）。 */
export function sparkles(list: readonly Circle[]): string {
  return list
    .map(([cx, cy, r]) => {
      const w = f(r * 0.25);
      return `M${f(cx)} ${f(cy - r)}Q${f(cx + w)} ${f(cy - w)} ${f(cx + r)} ${f(cy)}Q${f(cx + w)} ${f(cy + w)} ${f(cx)} ${f(cy + r)}Q${f(cx - w)} ${f(cy + w)} ${f(cx - r)} ${f(cy)}Q${f(cx - w)} ${f(cy - w)} ${f(cx)} ${f(cy - r)}Z`;
    })
    .join('');
}

export function strokes(list: readonly (readonly [number, number, number, number])[]): string {
  return list.map(([x1, y1, x2, y2]) => `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`).join('');
}

/*
 * 以下三個是「立即呼叫」的函式而不是元件：漸層必須在場景函式執行時就登記，
 * 若包成子元件，React 會在 <defs> 輸出之後才執行它們，漸層 id 就會指向不存在的定義。
 */

/** 天空＋地平線光帶。天空矩形延伸到地平線下方幾格，避免地面邊緣出現縫。 */
export function sky(k: BackdropKit, stops: readonly Stop[]): ReactNode {
  return <rect width={W} height={HORIZON + 8} fill={k.vertical(stops)} />;
}

/**
 * 地面帶：從地平線到底部的直向漸層，地平線處較亮（遠處受光），
 * 前景較暗，讓角色腳下陰影與下方 UI 自然銜接。
 */
export function ground(k: BackdropKit, top: string, bottom: string, lip?: string): ReactNode {
  return (
    <>
      <rect y={HORIZON} width={W} height={H - HORIZON} fill={k.vertical([[0, top], [1, bottom]])} />
      {lip ? <rect y={HORIZON} width={W} height={3} fill={lip} opacity={0.7} /> : null}
    </>
  );
}

/** 上緣壓暗：BOSS 血條與提示文字疊在天空上方，壓暗後文字對比穩定。 */
export function topShade(k: BackdropKit): ReactNode {
  return <rect width={W} height={64} fill={k.vertical([[0, '#120c08', 0.5], [1, '#120c08', 0]])} />;
}

/** 區域光線：越深入越偏暮色；王庭區再壓一點暗，讓 BOSS 的亮色更跳。 */
export function ZoneTint({ zone, color }: { readonly zone: ZoneLook; readonly color: string }) {
  return zone.dusk > 0 ? <rect width={W} height={H} fill={color} opacity={zone.dusk} /> : null;
}
