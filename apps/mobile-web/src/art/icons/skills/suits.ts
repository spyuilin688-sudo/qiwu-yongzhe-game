import { fmt, shape } from './geometry.ts';

/** 四種牌面花色（原創造型，非任何既有牌組的字型）。小丑系技能與牌組類裝備共用。 */
export type Suit = 'heart' | 'spade' | 'diamond' | 'club';

const HEART = 'M0 0.95C-0.25 0.7 -1 0.25 -1 -0.3C-1 -0.75 -0.65 -1 -0.32 -1C-0.12 -1 0 -0.85 0 -0.65C0 -0.85 0.12 -1 0.32 -1C0.65 -1 1 -0.75 1 -0.3C1 0.25 0.25 0.7 0 0.95Z';
const SPADE =
  'M0 -1C0.25 -0.7 1 -0.3 1 0.18C1 0.55 0.72 0.75 0.42 0.75C0.25 0.75 0.12 0.66 0.06 0.55L0.3 1L-0.3 1L-0.06 0.55C-0.12 0.66 -0.25 0.75 -0.42 0.75C-0.72 0.75 -1 0.55 -1 0.18C-1 -0.3 -0.25 -0.7 0 -1Z';
const DIAMOND = 'M0 -1L0.72 0L0 1L-0.72 0Z';

/**
 * 梅花需要三個圓的聯集外框：若用三個重疊圓，描邊會在內部畫出交線，
 * 因此預先算好相鄰圓的外側交點，用三段大弧接成一條輪廓。
 */
function club(cx: number, cy: number, size: number): string {
  const r = 0.38 * size;
  const p = (x: number, y: number): string => `${fmt(cx + x * size)} ${fmt(cy + y * size)}`;
  const arc = `A${fmt(r)} ${fmt(r)} 0 1 1`;
  return `M${p(-0.111, 0.33)}${arc} ${p(-0.325, -0.222)}${arc} ${p(0.325, -0.222)}${arc} ${p(0.111, 0.33)}L${p(0.3, 1)}L${p(-0.3, 1)}Z`;
}

/** 花色路徑；size 約為半高。 */
export function suitPath(suit: Suit, cx: number, cy: number, size: number, rotateDeg = 0): string {
  switch (suit) {
    case 'heart':
      return shape(HEART, cx, cy, size, size, rotateDeg);
    case 'spade':
      return shape(SPADE, cx, cy, size, size, rotateDeg);
    case 'diamond':
      return shape(DIAMOND, cx, cy, size, size, rotateDeg);
    case 'club':
      return club(cx, cy, size);
  }
}

/** 紅黑兩色：紅心與方塊為紅，黑桃與梅花為墨色。 */
export const isRedSuit = (suit: Suit): boolean => suit === 'heart' || suit === 'diamond';
