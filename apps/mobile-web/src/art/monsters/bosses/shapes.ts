/**
 * BOSS／副目標用的路徑產生器。把重複輪廓參數化並合併成單一路徑，
 * 一隻 BOSS 才能在約 60 個 SVG 元素內畫出足夠的細節。
 */

/** 只保留兩位小數，避免標記膨脹。 */
export const f = (value: number): number => Math.round(value * 100) / 100;

export type Circle = readonly [cx: number, cy: number, r: number];
export type Segment = readonly [x1: number, y1: number, x2: number, y2: number];
/** 葉片：基點、長度、寬度、角度（度，0 指向右）。 */
export type Leaf = readonly [x: number, y: number, length: number, width: number, degrees: number];

export function polar(cx: number, cy: number, radius: number, degrees: number): readonly [number, number] {
  const radians = (degrees * Math.PI) / 180;
  return [f(cx + radius * Math.cos(radians)), f(cy + radius * Math.sin(radians))];
}

/** 多個圓合成一條路徑；搭配 <Blob> 可畫出無內線的雲朵、樹冠、泡泡。 */
export function circles(list: readonly Circle[]): string {
  return list
    .map(([cx, cy, r]) => `M${f(cx - r)} ${cy}a${r} ${r} 0 1 0 ${f(r * 2)} 0a${r} ${r} 0 1 0 ${f(-r * 2)} 0Z`)
    .join('');
}

export function strokes(list: readonly Segment[]): string {
  return list.map(([x1, y1, x2, y2]) => `M${x1} ${y1}L${x2} ${y2}`).join('');
}

export function leaf([x, y, length, width, degrees]: Leaf): string {
  const [tx, ty] = polar(x, y, length, degrees);
  const [mx, my] = polar(x, y, length * 0.5, degrees);
  // 二次曲線控制點在中段兩側各推出 width，曲線實際最寬處約為 width 的一半。
  const [ax, ay] = polar(mx, my, width, degrees - 90);
  const [bx, by] = polar(mx, my, width, degrees + 90);
  return `M${x} ${y}Q${ax} ${ay} ${tx} ${ty}Q${bx} ${by} ${x} ${y}Z`;
}

export function leaves(list: readonly Leaf[]): string {
  return list.map(leaf).join('');
}

export function star(cx: number, cy: number, outer: number, inner: number, points = 5, rotation = -90): string {
  const step = 180 / points;
  const corners = Array.from({ length: points * 2 }, (_, index) => polar(cx, cy, index % 2 === 0 ? outer : inner, rotation + index * step));
  return `M${corners.map(([x, y]) => `${x} ${y}`).join('L')}Z`;
}

/** 四芒閃光（星屑、冰晶反光），比五角星更像「發光」而不是「圖示」。 */
export function sparkle(cx: number, cy: number, radius: number): string {
  const waist = f(radius * 0.22);
  return `M${cx} ${f(cy - radius)}Q${f(cx + waist)} ${f(cy - waist)} ${f(cx + radius)} ${cy}Q${f(cx + waist)} ${f(cy + waist)} ${cx} ${f(cy + radius)}Q${f(cx - waist)} ${f(cy + waist)} ${f(cx - radius)} ${cy}Q${f(cx - waist)} ${f(cy - waist)} ${cx} ${f(cy - radius)}Z`;
}

export function sparkles(list: readonly Circle[]): string {
  return list.map(([cx, cy, r]) => sparkle(cx, cy, r)).join('');
}

/** 齒輪外形（梯形齒＋圓弧齒根）。 */
export function gear(cx: number, cy: number, radius: number, teeth: number, depth: number, rotation = 0): string {
  const step = 360 / teeth;
  let d = '';
  for (let index = 0; index < teeth; index += 1) {
    const a = rotation + index * step;
    const p1 = polar(cx, cy, radius, a - step * 0.26);
    const p2 = polar(cx, cy, radius + depth, a - step * 0.16);
    const p3 = polar(cx, cy, radius + depth, a + step * 0.16);
    const p4 = polar(cx, cy, radius, a + step * 0.26);
    const next = polar(cx, cy, radius, a + step * 0.74);
    d += `${index === 0 ? 'M' : 'L'}${p1.join(' ')}L${p2.join(' ')}L${p3.join(' ')}L${p4.join(' ')}A${radius} ${radius} 0 0 1 ${next.join(' ')}`;
  }
  return `${d}Z`;
}

/** 正多邊形（蜂巢六角、水晶切面、聖印外框）。 */
export function regular(cx: number, cy: number, radius: number, sides: number, rotation = -90): string {
  const corners = Array.from({ length: sides }, (_, index) => polar(cx, cy, radius, rotation + (index * 360) / sides));
  return `M${corners.map(([x, y]) => `${x} ${y}`).join('L')}Z`;
}

/**
 * 橢圓上的直向色帶（蜂腹條紋、蛋殼花紋）：上下緣沿橢圓弧線走，不需要 clipPath。
 * x0／x1 為色帶左右邊（必須在橢圓寬度內）；bulge 讓色帶側邊微微外凸，看起來繞著身體轉。
 */
export function ellipseBand(cx: number, cy: number, rx: number, ry: number, x0: number, x1: number, bulge = 2): string {
  const half = (x: number): number => f(ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2)));
  const h0 = half(x0);
  const h1 = half(x1);
  return `M${x0} ${f(cy - h0)}A${rx} ${ry} 0 0 1 ${x1} ${f(cy - h1)}Q${f(x1 + bulge)} ${cy} ${x1} ${f(cy + h1)}A${rx} ${ry} 0 0 1 ${x0} ${f(cy + h0)}Q${f(x0 + bulge)} ${cy} ${x0} ${f(cy - h0)}Z`;
}
