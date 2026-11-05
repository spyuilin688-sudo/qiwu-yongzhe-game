/**
 * 路徑產生小工具。把同色的多個小圓、膠囊合併成單一 <path>，
 * 讓每張圖維持在約 60 個 SVG 元素以內（大量同屏時繪製較輕）。
 */

export interface Circle {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
}

const fmt = (value: number): string => (Math.round(value * 100) / 100).toString();

export function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M${fmt(cx - rx)} ${fmt(cy)}a${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(rx * 2)} 0a${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(-rx * 2)} 0Z`;
}

export function circlesPath(circles: readonly Circle[]): string {
  return circles.map((c) => ellipsePath(c.cx, c.cy, c.r, c.r)).join('');
}

/** 兩端半圓的柱體（手臂、握柄）；單一路徑即可帶描邊，取代兩條疊線。 */
export function capsulePath(from: { x: number; y: number }, to: { x: number; y: number }, radius: number): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = (-dy / length) * radius;
  const ny = (dx / length) * radius;
  const r = fmt(radius);
  return `M${fmt(from.x + nx)} ${fmt(from.y + ny)}L${fmt(to.x + nx)} ${fmt(to.y + ny)}A${r} ${r} 0 0 0 ${fmt(to.x - nx)} ${fmt(to.y - ny)}L${fmt(from.x - nx)} ${fmt(from.y - ny)}A${r} ${r} 0 0 0 ${fmt(from.x + nx)} ${fmt(from.y + ny)}Z`;
}

/** 依齒數產生齒輪外形；用單一路徑以控制元素數量。 */
export function gearPath(cx: number, cy: number, outer: number, inner: number, teeth: number): string {
  const step = (Math.PI * 2) / teeth;
  const points: string[] = [];
  for (let index = 0; index < teeth; index += 1) {
    const base = index * step;
    const corners = [
      { angle: base - step * 0.3, radius: inner },
      { angle: base - step * 0.18, radius: outer },
      { angle: base + step * 0.18, radius: outer },
      { angle: base + step * 0.3, radius: inner },
    ];
    for (const corner of corners) {
      points.push(`${(cx + Math.cos(corner.angle) * corner.radius).toFixed(2)} ${(cy + Math.sin(corner.angle) * corner.radius).toFixed(2)}`);
    }
  }
  return `M${points.join('L')}Z`;
}
