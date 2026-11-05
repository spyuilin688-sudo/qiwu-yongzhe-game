/**
 * 裝備圖示調色盤。美術檔視同圖片資產，色碼集中於此；換正式美術時只改這份。
 * 方向：暖色奇幻材質，放在深棕卡框與品質色邊上仍要清楚。中間調為主，
 * 避免純黑金屬在深色 UI 上糊成一片。
 */

/** 全部原創圖共用的暖深色描邊。 */
export const INK = '#1f1610';

/** 一種材質的三階色：底色、陰影、小高光。 */
export interface Tone {
  readonly base: string;
  readonly shade: string;
  readonly light: string;
}

export const MAT = {
  steel: { base: '#dfe6ec', shade: '#9eacba', light: '#ffffff' },
  iron: { base: '#b3bcc6', shade: '#7d8794', light: '#eef2f6' },
  darkIron: { base: '#6a707c', shade: '#474c56', light: '#9aa1ae' },
  silver: { base: '#d8deea', shade: '#a2aac0', light: '#ffffff' },
  brass: { base: '#d9a441', shade: '#a8762a', light: '#f8d98a' },
  gold: { base: '#f2c14e', shade: '#c48f2c', light: '#fff0b8' },
  copper: { base: '#cf7a40', shade: '#9a532a', light: '#f2aa76' },
  wood: { base: '#b9804a', shade: '#8c5a30', light: '#dcaa72' },
  darkWood: { base: '#80502e', shade: '#5c361d', light: '#a8744c' },
  greenWood: { base: '#a99a52', shade: '#7c7034', light: '#d2c47e' },
  leather: { base: '#9a6439', shade: '#734625', light: '#c48f5c' },
  redLeather: { base: '#b5432f', shade: '#86301f', light: '#df7058' },
  cloth: { base: '#f3e8d0', shade: '#d4c19c', light: '#fffaf0' },
  rag: { base: '#cdb88f', shade: '#a28d66', light: '#ece0c2' },
  paper: { base: '#f7eedb', shade: '#dccba6', light: '#fffdf5' },
  bone: { base: '#efe2c0', shade: '#c7b287', light: '#fffaea' },
  blueCloth: { base: '#4f80bb', shade: '#3a6195', light: '#86b0e0' },
  tealCloth: { base: '#4f9a8a', shade: '#38766a', light: '#82c6b6' },
  purple: { base: '#7a5ac0', shade: '#5a3f96', light: '#a98be6' },
  night: { base: '#4b4a6e', shade: '#33324d', light: '#7a77a3' },
  cosmos: { base: '#4b5fc4', shade: '#33408f', light: '#8ea0f0' },
  frost: { base: '#5f9fd6', shade: '#4479b0', light: '#a8d4f6' },
  ruby: { base: '#e2493d', shade: '#a82e26', light: '#ffab9c' },
  sapphire: { base: '#4fa3e8', shade: '#2f72b8', light: '#c4e6ff' },
  emerald: { base: '#5cba5e', shade: '#3a8442', light: '#b8eeb0' },
  venom: { base: '#8ed64a', shade: '#55982a', light: '#d6f7a6' },
  ice: { base: '#c4ecff', shade: '#7cbfe6', light: '#ffffff' },
  amethyst: { base: '#b89af0', shade: '#7c5cc8', light: '#efe6ff' },
  amber: { base: '#f0a33a', shade: '#bf7420', light: '#ffdc94' },
  ember: { base: '#ff8a3a', shade: '#d4542a', light: '#ffd15c' },
  mech: { base: '#72e2ff', shade: '#3aa6cf', light: '#e2fbff' },
  glass: { base: '#dcefee', shade: '#a9cfd2', light: '#ffffff' },
  cardBack: { base: '#c8423e', shade: '#962d2c', light: '#ef7a70' },
  jester: { base: '#d4473f', shade: '#a3302b', light: '#f07a6c' },
  feather: { base: '#e65a45', shade: '#b13b2c', light: '#ff9e88' },
  plume: { base: '#5fa6e0', shade: '#3b78b4', light: '#bfe0ff' },
} as const satisfies Record<string, Tone>;

/** 平面細節色：牌面墨色、瓶內暗面、鞘口等。 */
export const DETAIL = {
  hollow: '#3a2a1e',
  cardInk: '#2a2230',
  cardRed: '#d63c3c',
  stitch: '#e8cfa4',
  holyGlow: '#fff0a8',
  rope: '#c9a46a',
  white: '#ffffff',
} as const;
