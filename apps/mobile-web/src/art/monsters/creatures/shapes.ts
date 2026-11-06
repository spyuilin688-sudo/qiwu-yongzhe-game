/**
 * 路徑產生器：把常見輪廓（圓頂軟糖、葉環、齒輪、星形、火焰）參數化，
 * 讓 96 隻怪物共用同一套曲線語彙，畫面才會像同一位插畫家畫的。
 */

/** 只保留兩位小數，避免標記膨脹。 */
export const f = (value: number): number => Math.round(value * 100) / 100;

export interface Point {
  readonly x: number;
  readonly y: number;
}

export function polar(cx: number, cy: number, radius: number, degrees: number): Point {
  const radians = (degrees * Math.PI) / 180;
  return { x: f(cx + radius * Math.cos(radians)), y: f(cy + radius * Math.sin(radians)) };
}

const pt = (point: Point): string => `${point.x} ${point.y}`;

/** 圓頂軟糖身形（底部略平、頂部圓）：史萊姆、果凍、幽靈上半身。 */
export function gumdrop(cx: number, bottom: number, halfWidth: number, height: number): string {
  const a = halfWidth;
  const h = height;
  const b = bottom;
  return [
    `M${f(cx - a)} ${f(b - 0.3 * h)}`,
    `C${f(cx - a)} ${f(b - 0.85 * h)} ${f(cx - 0.55 * a)} ${f(b - h)} ${f(cx)} ${f(b - h)}`,
    `C${f(cx + 0.55 * a)} ${f(b - h)} ${f(cx + a)} ${f(b - 0.85 * h)} ${f(cx + a)} ${f(b - 0.3 * h)}`,
    `C${f(cx + a)} ${f(b - 0.04 * h)} ${f(cx + 0.7 * a)} ${f(b)} ${f(cx)} ${f(b)}`,
    `C${f(cx - 0.7 * a)} ${f(b)} ${f(cx - a)} ${f(b - 0.04 * h)} ${f(cx - a)} ${f(b - 0.3 * h)}Z`,
  ].join('');
}

/**
 * 環狀輪廓：round 為圓弧凸起（羊毛、雲、花瓣），point 為尖端（葉片、刺、冰晶）。
 * rotation 以度為單位，0 度指向右方；span 小於 360 時只畫一段弧（刺蝟背刺）。
 */
export function ring(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  count: number,
  rotation = 0,
  mode: 'round' | 'point' = 'round',
  span = 360,
): string {
  const step = span / count;
  let d = `M${pt(polar(cx, cy, inner, rotation))}`;
  for (let index = 0; index < count; index += 1) {
    const a0 = rotation + index * step;
    const a1 = a0 + step;
    const mid = a0 + step / 2;
    if (mode === 'round') {
      d += `Q${pt(polar(cx, cy, outer * 1.18 - inner * 0.18, mid))} ${pt(polar(cx, cy, inner, a1))}`;
    } else {
      d += `Q${pt(polar(cx, cy, outer * 0.92, a0 + step * 0.12))} ${pt(polar(cx, cy, outer, mid))}`;
      d += `Q${pt(polar(cx, cy, outer * 0.92, a1 - step * 0.12))} ${pt(polar(cx, cy, inner, a1))}`;
    }
  }
  // 不滿一圈時收回圓心成扇形：直邊會被身體蓋住，只留背上一排刺。
  return span >= 360 ? `${d}Z` : `${d}L${cx} ${cy}Z`;
}

/** 齒輪外形（梯形齒＋圓弧齒根）。 */
export function gear(cx: number, cy: number, radius: number, teeth: number, depth = 2.4, rotation = 0): string {
  const step = 360 / teeth;
  let d = '';
  for (let index = 0; index < teeth; index += 1) {
    const a = rotation + index * step;
    const p1 = polar(cx, cy, radius, a - step * 0.26);
    const p2 = polar(cx, cy, radius + depth, a - step * 0.16);
    const p3 = polar(cx, cy, radius + depth, a + step * 0.16);
    const p4 = polar(cx, cy, radius, a + step * 0.26);
    const next = polar(cx, cy, radius, a + step * 0.74);
    d += `${index === 0 ? 'M' : 'L'}${pt(p1)}L${pt(p2)}L${pt(p3)}L${pt(p4)}A${radius} ${radius} 0 0 1 ${pt(next)}`;
  }
  return `${d}Z`;
}

export function star(cx: number, cy: number, outer: number, inner: number, points = 5, rotation = -90): string {
  const step = 180 / points;
  const corners: string[] = [];
  for (let index = 0; index < points * 2; index += 1) {
    corners.push(pt(polar(cx, cy, index % 2 === 0 ? outer : inner, rotation + index * step)));
  }
  return `M${corners.join('L')}Z`;
}

/** 火焰（底圓、尖端略向左偏，像被前進的風吹動）。halfWidth 為半寬。 */
export function flame(cx: number, bottom: number, halfWidth: number, height: number): string {
  const w = halfWidth;
  const h = height;
  const b = bottom;
  return [
    `M${f(cx)} ${f(b)}`,
    `C${f(cx - w * 1.25)} ${f(b)} ${f(cx - w * 1.1)} ${f(b - h * 0.5)} ${f(cx - w * 0.45)} ${f(b - h * 0.72)}`,
    `C${f(cx - w * 0.25)} ${f(b - h * 0.82)} ${f(cx - w * 0.2)} ${f(b - h * 0.92)} ${f(cx - w * 0.3)} ${f(b - h)}`,
    `C${f(cx + w * 0.5)} ${f(b - h * 0.8)} ${f(cx + w * 1.2)} ${f(b - h * 0.55)} ${f(cx + w)} ${f(b - h * 0.25)}`,
    `C${f(cx + w * 0.9)} ${f(b - h * 0.06)} ${f(cx + w * 0.5)} ${f(b)} ${f(cx)} ${f(b)}Z`,
  ].join('');
}

/** 多個圓合併成單一路徑（斑點、種子、鉚釘、灰塵），一個元素就能畫一整組。 */
export function circles(list: readonly (readonly [number, number, number])[]): string {
  return list
    .map(([cx, cy, r]) => `M${f(cx - r)} ${f(cy)}a${r} ${r} 0 1 0 ${f(r * 2)} 0a${r} ${r} 0 1 0 ${f(-r * 2)} 0`)
    .join('');
}

/** 多段折線合併成單一路徑（紋路、裂痕、速度線）。 */
export function strokes(list: readonly (readonly number[])[]): string {
  return list
    .map((coords) => {
      let d = '';
      for (let index = 0; index + 1 < coords.length; index += 2) d += `${index === 0 ? 'M' : 'L'}${coords[index]} ${coords[index + 1]}`;
      return d;
    })
    .join('');
}

/**
 * 兩端尖、中段飽滿的葉形（葉片、耳朵、羽毛、尾巴、獠牙）。
 * 從基部 (x, y) 朝 angle 方向延伸 length；width 為最寬處。
 */
export function leaf(x: number, y: number, length: number, width: number, angle: number): string {
  const tip = polar(x, y, length, angle);
  const mid = polar(x, y, length * 0.5, angle);
  const side = polar(0, 0, width, angle + 90);
  return `M${x} ${y}Q${f(mid.x + side.x)} ${f(mid.y + side.y)} ${tip.x} ${tip.y}Q${f(mid.x - side.x)} ${f(mid.y - side.y)} ${x} ${y}Z`;
}

/** 多片葉形合併成一個路徑（尾羽、鬃毛、花瓣），共用同一個漸層外接框。 */
export function leaves(list: readonly (readonly [number, number, number, number, number])[]): string {
  return list.map(([x, y, length, width, angle]) => leaf(x, y, length, width, angle)).join('');
}

/** 尖頂朝上的正六邊形群（蜂巢、晶格、龜甲）。 */
export function hexagons(list: readonly (readonly [number, number, number])[]): string {
  return list
    .map(([cx, cy, r]) => {
      const corners = [0, 1, 2, 3, 4, 5].map((index) => polar(cx, cy, r, -90 + index * 60));
      return `M${corners.map(pt).join('L')}Z`;
    })
    .join('');
}
