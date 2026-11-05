/**
 * 介面圖示共用線條規格（viewBox 0 0 24 24）：一律以 currentColor 著色，
 * 讓 CSS 依狀態（啟用、停用、警示）切換顏色；面積區塊用低不透明度填色做出雙色調。
 */
export const ICON_STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** 雙色調的「面」：同色但淡，深色或淺色底都能看出輪廓與量體。 */
export const TONE_FILL = { fill: 'currentColor', fillOpacity: 0.22 } as const;
export const SOLID_FILL = { fill: 'currentColor', stroke: 'none' } as const;
