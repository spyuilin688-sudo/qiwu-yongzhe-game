import { useId } from 'react';

/**
 * 同一張圖可能在畫面上同時出現多次（列表、戰場、彈窗），漸層 id 若重複，
 * 瀏覽器會全部套用第一個定義；因此每個渲染實例都用 useId() 產生獨立前綴。
 * React 產生的 id 含 ':'、'«' 等字元，放進 url(#...) 會失效，必須先清掉。
 */
export function useSvgId(prefix: string): string {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
}
