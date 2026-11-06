import type { ReactNode } from 'react';
import type { BackdropKit, Stop } from './kit.tsx';

/**
 * 背景共用構圖。戰場規格：角色腳點約在地面帶 40% 深處（y≈213），地面帶從 64%（y≈174）開始，
 * 所以遠景只畫在地平線以上，地面前緣（y>215）才放高對比的小物件；
 * 角色身後（x 60～370、y 110～210）一律維持低對比，讓角色與傷害飄字清楚。
 * 戰場以「寬度貼齊、底部對齊」顯示：每種寬度都看得到完整 390 寬構圖，地標不可超出 0～W；
 * 高螢幕多出來的高度會露出 viewBox 上方，天空與暮色因此往上多畫 SKY_OVERDRAW。
 */
export const W = 390;
export const H = 272;
export const HORIZON = 174;
/**
 * viewBox 上方額外畫出的天空高度。430×932 的戰場約 430×405，寬度貼齊後上方露出約 95 單位；
 * 取 240 留給更高的戰場（例如召喚 BOSS 時版面改變），超出部分由戰場容器裁掉。
 */
export const SKY_OVERDRAW = 240;
/** 往上延伸的天空頂端 y 座標（負值）。 */
export const SKY_TOP = -SKY_OVERDRAW;

/**
 * 背景明暗：暗色地圖上深色角色與怪物的描邊會被吃掉，戰場要加一圈邊光。
 * 依角色身後區域（x 60～370、y 110～215）的平均相對亮度分類：
 * 實測礦山、火山、花園、書庫約 0.03～0.07，古鎮約 0.12～0.17，其餘亮色圖 0.17～0.4。
 */
export type BackdropTone = 'light' | 'dark';

/** 一張背景的光線資料：給戰場決定要不要替角色、怪物加邊光，以及邊光顏色。 */
export interface BackdropLight {
  readonly tone: BackdropTone;
  /** 場景主光源（燈火、熔岩、月光）的顏色，含透明度；tone 為 dark 時拿來畫邊光。 */
  readonly rim: string;
}

export type SceneDesign = (kit: BackdropKit, zone: ZoneLook) => ReactNode;

/**
 * 一張地圖的背景登記：繪圖函式和光線資料放在一起，調整場景色調時才不會忘了同步邊光判斷。
 */
export interface SceneEntry {
  readonly mapNumber: number;
  readonly light: BackdropLight;
  /** 從第幾區（0 起算）起暮色夠深、改用暗色邊光；省略代表 6 區都沿用 light.tone。 */
  readonly darkFromZone?: number;
  readonly draw: SceneDesign;
}

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

/**
 * 從上方垂掛的道具（布幔、旗幟、冰簷）上緣：略高於 viewBox 頂端，一般比例看不到吊點；
 * 寬度貼齊的高螢幕會露出一小段上緣，看得出是掛著的，而不是一路延伸到天頂的色塊。
 */
export const HANGING_TOP = -36;

/** 腳點在地面帶的深度（0＝地平線、1＝畫面底），與戰場版面的約定相同。 */
const FOOT_DEPTH = 0.4;
/** 角色與怪物腳點的 y。 */
export const FOOT_Y = HORIZON + FOOT_DEPTH * (H - HORIZON);
/** BOSS 站位：戰場寬 76% 處（與戰場的 BOSS 欄位一致）；王庭的光與道具以這裡為中心。 */
const BOSS_STAND_RATIO = 0.76;
export const BOSS_STAND_X = Math.round(W * BOSS_STAND_RATIO);
/**
 * 王庭框景道具離 BOSS 中心的距離：BOSS 本體約 112 寬（x 240～352），道具放在它身後兩側邊緣，
 * 只露出一半，框住 BOSS 而不和 BOSS 搶視覺；左側也不會擋到勇者（x≈94）。
 */
const COURT_FRAME_OFFSET = 72;
export const COURT_FRAME_X = [BOSS_STAND_X - COURT_FRAME_OFFSET, BOSS_STAND_X + COURT_FRAME_OFFSET] as const;

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

/**
 * 雲朵：一排大小不一的圓，底部以矩形切平。
 * 矩形必須與 circles() 同為逆時針（先往下、再往右、再往上），
 * 否則 nonzero 填色規則下重疊處繞數相消，雲底會挖出一條條透明橫紋。
 */
export function cloud(x: number, y: number, size: number): string {
  const s = size;
  return `${circles([[x, y, s * 0.55], [x + s * 0.6, y - s * 0.25, s * 0.7], [x + s * 1.3, y, s * 0.5]])}M${f(x - s * 0.5)} ${f(y + s * 0.1)}v${f(s * 0.4)}h${f(s * 2.3)}v${f(-s * 0.4)}Z`;
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
 * 以下 sky、ground、zoneTint、courtSpot 是「立即呼叫」的函式而不是元件：漸層必須在場景函式執行時就登記，
 * 若包成子元件，React 會在 <defs> 輸出之後才執行它們，漸層 id 就會指向不存在的定義。
 */

/**
 * 天空＋地平線光帶。天空矩形延伸到地平線下方幾格，避免地面邊緣出現縫。
 * viewBox 上方再用天頂色（或 cap 指定的頂棚色，例如樹冠、坑頂）補到 SKY_TOP，
 * 寬度貼齊的高螢幕才不會露出底色；漸層只畫在 0～地平線，色帶位置不因補天而改變。
 */
export function sky(k: BackdropKit, stops: readonly Stop[], cap?: string): ReactNode {
  const zenith = cap ?? stops[0]?.[1];
  return (
    <>
      {/* 多畫 1 單位和下方漸層重疊，避免 y=0 處反鋸齒留下一條細縫。 */}
      <rect y={SKY_TOP} width={W} height={SKY_OVERDRAW + 1} fill={zenith} />
      <rect width={W} height={HORIZON + 8} fill={k.vertical(stops)} />
    </>
  );
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

/**
 * @deprecated 戰場改為寬度貼齊後，畫在 viewBox 頂端的暗帶會落在天空中段，
 * 已改由戰場 CSS（.backdrop::after）畫固定高度的頂部暗化；場景不再呼叫，僅保留匯出相容。
 */
export function topShade(k: BackdropKit): ReactNode {
  return <rect width={W} height={64} fill={k.vertical([[0, '#120c08', 0.5], [1, '#120c08', 0]])} />;
}

/** 地面只吃一半暮色：天空先暗下來，腳下仍保留亮度，深色角色在第 5、6 區才不會被吃掉。 */
const GROUND_DUSK_RATIO = 0.5;
/**
 * 王庭地面暗角：亮區中心放在地面帶頂端正中（cy=0），半徑等於整條地面帶（r=1），
 * 所以角色腳下幾乎不變暗，只有前景左右兩角壓到最深 strength。
 */
const COURT_VIGNETTE = { strength: 0.5, cx: 0.5, cy: 0, r: 1 } as const;
/** 王庭 BOSS 腳下聚光：寬度涵蓋 BOSS 與兩側副目標，高度只壓在地面帶。 */
const COURT_SPOT = { rx: 92, ry: 18, strength: 0.24 } as const;

const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * 區域光線（立即呼叫）：越深入越偏暮色，天空吃滿、地面減半，以連續漸層銜接，
 * 跨過地平線的樹、柱子不會出現明暗接縫。王庭區另在地面兩側加暗角，把視線收到中間的戰鬥。
 * 從 SKY_TOP 開始畫，寬度貼齊時延伸出來的天空也一起變暗。
 */
export function zoneTint(k: BackdropKit, zone: ZoneLook, color: string): ReactNode {
  if (zone.dusk <= 0) return null;
  const horizonAt = (HORIZON - SKY_TOP) / (H - SKY_TOP);
  const fill = k.vertical([
    [0, color, zone.dusk],
    [round2(horizonAt), color, zone.dusk],
    [1, color, round2(zone.dusk * GROUND_DUSK_RATIO)],
  ]);
  return (
    <>
      <rect y={SKY_TOP} width={W} height={H - SKY_TOP} fill={fill} />
      {zone.isCourt ? (
        <rect y={HORIZON} width={W} height={H - HORIZON} fill={k.vignette(color, COURT_VIGNETTE.strength, COURT_VIGNETTE.cx, COURT_VIGNETTE.cy, COURT_VIGNETTE.r)} />
      ) : null}
    </>
  );
}

/**
 * 王庭聚光（立即呼叫）：BOSS 站位腳下的一圈柔光，像舞台燈，
 * 讓第 6 區一眼看得出是王的場地；只壓在地面帶，不碰傷害飄字所在的天空。
 */
export function courtSpot(k: BackdropKit, color: string): ReactNode {
  return <ellipse cx={BOSS_STAND_X} cy={FOOT_Y} rx={COURT_SPOT.rx} ry={COURT_SPOT.ry} fill={k.glow(color, COURT_SPOT.strength)} />;
}

/**
 * @deprecated 改用 zoneTint(k, zone, color)：新版會延伸到 SKY_TOP，且地面只吃一半暮色。
 * 元件形式無法登記漸層，僅保留匯出相容。
 */
export function ZoneTint({ zone, color }: { readonly zone: ZoneLook; readonly color: string }) {
  return zone.dusk > 0 ? <rect y={SKY_TOP} width={W} height={H - SKY_TOP} fill={color} opacity={zone.dusk} /> : null;
}
