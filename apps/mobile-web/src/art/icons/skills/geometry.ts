/**
 * 裝備與技能圖示共用的幾何產生器。輸出一律是 SVG path 字串（只用 M／L／Q／C／A／Z），
 * 讓多個小形狀可以合併成單一 <path>，把每張圖的元素數壓在預算內。
 */

/** 兩位小數：避免浮點雜訊讓 markup 變長，也讓快照比對穩定。 */
export const fmt = (value: number): string => String(Math.round(value * 100) / 100);

const TOKEN = /[MLQCZ]|-?\d*\.?\d+/g;
const UNSUPPORTED = /[AHVSTahvstmlqcz]/;

/**
 * 把以單位座標（約 -1..1）寫成的範本路徑，平移／縮放／旋轉到指定位置。
 * 範本只能使用絕對座標的 M、L、Q、C、Z，數字一律成對（x y）。
 * 用座標換算而非 transform，描邊粗細才不會跟著縮放而忽粗忽細。
 */
export function shape(template: string, cx: number, cy: number, sx: number, sy: number = sx, rotateDeg = 0): string {
  // 範本若混入 H／V／A 或相對座標，數字配對會錯位、畫出亂線；直接報錯，測試期就能抓到。
  if (UNSUPPORTED.test(template)) throw new Error(`shape() 範本只支援絕對座標 M/L/Q/C/Z：${template.slice(0, 24)}…`);
  const rad = (rotateDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const tokens = template.match(TOKEN) ?? [];
  const out: string[] = [];
  let pendingX: number | null = null;
  for (const token of tokens) {
    if (/[MLQCZ]/.test(token)) {
      out.push(token);
      continue;
    }
    const value = Number(token);
    if (pendingX === null) {
      pendingX = value;
      continue;
    }
    const x = pendingX * sx;
    const y = value * sy;
    out.push(`${fmt(cx + x * cos - y * sin)} ${fmt(cy + x * sin + y * cos)}`);
    pendingX = null;
  }
  return out.join(' ');
}

/** 完整圓（兩段弧），可與其他子路徑串在同一個 d 裡。 */
export const circle = (cx: number, cy: number, r: number): string =>
  `M${fmt(cx - r)} ${fmt(cy)}A${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(cx + r)} ${fmt(cy)}A${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(cx - r)} ${fmt(cy)}Z`;

/** 多個圓點合成一條路徑（念珠、氣泡、彩紙）。 */
export const dots = (list: readonly (readonly [number, number, number])[]): string =>
  list.map(([cx, cy, r]) => circle(cx, cy, r)).join('');

/** 多條線段合成一條路徑（速度線、裂痕、刻度）。 */
export const strokes = (list: readonly (readonly [number, number, number, number])[]): string =>
  list.map(([x1, y1, x2, y2]) => `M${fmt(x1)} ${fmt(y1)}L${fmt(x2)} ${fmt(y2)}`).join('');

/** 極座標上的點：角度 0 朝右、順時針為正（SVG 的 y 向下）。 */
export function polar(cx: number, cy: number, r: number, deg: number): readonly [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

/** n 角星（含爆裂、太陽光芒）：外徑、內徑交錯；預設第一個尖角朝上。 */
export function star(cx: number, cy: number, points: number, outer: number, inner: number, rotateDeg = -90): string {
  const parts: string[] = [];
  for (let i = 0; i < points * 2; i += 1) {
    const [x, y] = polar(cx, cy, i % 2 === 0 ? outer : inner, rotateDeg + (i * 180) / points);
    parts.push(`${i === 0 ? 'M' : 'L'}${fmt(x)} ${fmt(y)}`);
  }
  return `${parts.join('')}Z`;
}

/** 四芒閃光：內徑極小的四角星，用來點亮魔法、星光與金屬反光。 */
export const sparkle = (cx: number, cy: number, r: number, rotateDeg = -90): string => star(cx, cy, 4, r, r * 0.3, rotateDeg);

/**
 * 斬擊月牙：從 p1 到 p2 的弧形刀光。bulge 為弧頂偏移（正值往行進方向左側鼓起），
 * thick 為最厚處的厚度。二次曲線控制點取兩倍偏移，弧頂才會正好落在 bulge。
 */
export function crescent(x1: number, y1: number, x2: number, y2: number, bulge: number, thick: number): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = (y2 - y1) / len;
  const ny = -(x2 - x1) / len;
  const outer = [mx + nx * bulge * 2, my + ny * bulge * 2] as const;
  const inner = [mx + nx * (bulge - thick) * 2, my + ny * (bulge - thick) * 2] as const;
  return `M${fmt(x1)} ${fmt(y1)}Q${fmt(outer[0])} ${fmt(outer[1])} ${fmt(x2)} ${fmt(y2)}Q${fmt(inner[0])} ${fmt(inner[1])} ${fmt(x1)} ${fmt(y1)}Z`;
}

/** 齒輪外形：梯形齒，teeth 為齒數；可再疊一個圓當軸心。 */
export function gear(cx: number, cy: number, outer: number, inner: number, teeth: number, rotateDeg = 0): string {
  const step = 360 / teeth;
  const parts: string[] = [];
  for (let i = 0; i < teeth; i += 1) {
    const base = rotateDeg + i * step;
    const corners = [
      polar(cx, cy, inner, base - step * 0.5),
      polar(cx, cy, inner, base - step * 0.28),
      polar(cx, cy, outer, base - step * 0.18),
      polar(cx, cy, outer, base + step * 0.18),
      polar(cx, cy, inner, base + step * 0.28),
    ];
    corners.forEach(([x, y], index) => parts.push(`${i === 0 && index === 0 ? 'M' : 'L'}${fmt(x)} ${fmt(y)}`));
  }
  return `${parts.join('')}Z`;
}

/** 葉片／羽毛／花瓣：兩段二次曲線組成的梭形，angle 為尖端朝向。 */
export function leaf(cx: number, cy: number, length: number, width: number, angleDeg: number): string {
  return shape('M-1 0Q0 -1 1 0Q0 1 -1 0Z', cx, cy, length / 2, width, angleDeg);
}

/** 完整橢圓（兩段弧），用於法陣、光環與軌道。 */
export const ellipse = (cx: number, cy: number, rx: number, ry: number): string =>
  `M${fmt(cx - rx)} ${fmt(cy)}A${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(cx + rx)} ${fmt(cy)}A${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(cx - rx)} ${fmt(cy)}Z`;

/** 放射光芒：在指定角度各畫一道楔形，只取需要的方向（例如地平線上方的半圈）。 */
export function rays(cx: number, cy: number, inner: number, outer: number, anglesDeg: readonly number[], halfWidthDeg: number): string {
  return anglesDeg
    .map((deg) => {
      const [ax, ay] = polar(cx, cy, inner, deg - halfWidthDeg);
      const [tx, ty] = polar(cx, cy, outer, deg);
      const [bx, by] = polar(cx, cy, inner, deg + halfWidthDeg);
      return `M${fmt(ax)} ${fmt(ay)}L${fmt(tx)} ${fmt(ty)}L${fmt(bx)} ${fmt(by)}Z`;
    })
    .join('');
}

/** 正多邊形頂點連線（五脈、陣圖）。 */
export function polygon(cx: number, cy: number, r: number, sides: number, rotateDeg = -90): string {
  const points = Array.from({ length: sides }, (_, i) => polar(cx, cy, r, rotateDeg + (i * 360) / sides));
  return `${points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${fmt(x)} ${fmt(y)}`).join('')}Z`;
}
