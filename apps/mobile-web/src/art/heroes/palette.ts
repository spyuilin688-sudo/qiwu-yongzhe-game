/**
 * 角色與職業系圖示的調色盤。美術檔視同圖片資產，色碼集中在這裡，
 * 換正式美術或調整色調時只需改這份檔案。
 * 色調方向：暖色奇幻、能壓在深棕色 UI 與黃銅框上仍清楚可辨。
 */

/** 全部角色共用的暖深色描邊，讓不同職業在同一畫面中風格一致。 */
export const INK = '#1f1610';

/** 一種材質的三階色：底色、陰影、小高光。 */
export interface Tone {
  readonly base: string;
  readonly shade: string;
  readonly light: string;
}

export const SKIN: Tone = { base: '#f8d2a8', shade: '#e3a97e', light: '#fff1de' };
export const BLUSH = '#f0907c';
export const EYE_SHINE = '#fffaf0';
export const GROUND_SHADOW = '#000000';

export const METAL = {
  steel: { base: '#d9e0e6', shade: '#9aa8b4', light: '#ffffff' },
  iron: { base: '#8a929c', shade: '#5f6670', light: '#c4cad1' },
  gold: { base: '#f2c14e', shade: '#c48f2c', light: '#fff0b8' },
  brass: { base: '#d9a441', shade: '#a8762a', light: '#f8d98a' },
} as const satisfies Record<string, Tone>;

export const WOOD: Tone = { base: '#b9804a', shade: '#8c5a30', light: '#dcaa72' };
export const LEATHER: Tone = { base: '#9a6439', shade: '#734625', light: '#c48f5c' };
export const CLOTH_WHITE: Tone = { base: '#f5ecd8', shade: '#d8c8a6', light: '#fffaf0' };
/** 亞麻內衫：比 CLOTH_WHITE 暗一階，襯在彩色斗篷下才分得出層次，又不會和祭司白袍混淆。 */
export const LINEN: Tone = { base: '#ddc9a0', shade: '#b89f74', light: '#f2e4c4' };

/** 頭髮色：用來在剪影相近時再多一層辨識。 */
export const HAIR = {
  chestnut: { base: '#8a5230', shade: '#653a20', light: '#b07448' },
  crimson: { base: '#d0542e', shade: '#9e3a1d', light: '#f08a5a' },
  ginger: { base: '#d9843a', shade: '#a85f22', light: '#f2ae6a' },
  blonde: { base: '#f2cf6a', shade: '#c9a040', light: '#fff0b0' },
  silver: { base: '#dfe3ee', shade: '#a9b0c6', light: '#ffffff' },
  ink: { base: '#3a3446', shade: '#25212e', light: '#5d5670' },
  rose: { base: '#ee8fb4', shade: '#c4688d', light: '#ffc2d8' },
  auburn: { base: '#a8482a', shade: '#7c321b', light: '#d06e4a' },
  brown: { base: '#7b4a2a', shade: '#5a321a', light: '#a06a42' },
} as const satisfies Record<string, Tone>;

/** 各職業系主色。A／B 分支在同色系內換副色，讓同系仍看得出血緣。 */
export const FAMILY_TONES = {
  novice: { base: '#cfae80', shade: '#a6855a', light: '#ecd3a8' },
  sword: { base: '#4f80bb', shade: '#3a6195', light: '#7fa9d9' },
  swordA: { base: '#b13b31', shade: '#842821', light: '#e0675a' },
  swordB: { base: '#3d5f9f', shade: '#2b4577', light: '#6d8fd0' },
  bow: { base: '#5f9c4b', shade: '#467a37', light: '#8cc56f' },
  bowA: { base: '#3f8a7a', shade: '#2c6a5d', light: '#6fbcaa' },
  bowB: { base: '#7b8a3a', shade: '#5c6a28', light: '#a8b85c' },
  bowStar: { base: '#2f6a86', shade: '#214d63', light: '#5d9cba' },
  mage: { base: '#6e51ad', shade: '#533b8a', light: '#977bd2' },
  mageA: { base: '#4a3d96', shade: '#342a72', light: '#7466c4' },
  mageB: { base: '#5aa7d8', shade: '#3e83b5', light: '#a5dcf6' },
  mageWinter: { base: '#3d6fb8', shade: '#2b5290', light: '#7ea8e6' },
  rogue: { base: '#4d4b5e', shade: '#363546', light: '#727089' },
  rogueA: { base: '#4b3a78', shade: '#33275a', light: '#7b65b0' },
  rogueB: { base: '#3f5a3c', shade: '#2c4129', light: '#678a5c' },
  priest: { base: '#f3e8cc', shade: '#d6c39c', light: '#fffaf0' },
  priestA: { base: '#f6efe0', shade: '#dacbae', light: '#ffffff' },
  priestB: { base: '#e48b3c', shade: '#b96a25', light: '#f7b46c' },
  jester: { base: '#d4473f', shade: '#a3302b', light: '#f07a6c' },
  jesterA: { base: '#c73a4a', shade: '#962636', light: '#ee6f7c' },
  jesterB: { base: '#7a52b4', shade: '#5a3b8c', light: '#a67fdc' },
  artisan: { base: '#4f7f91', shade: '#3a6070', light: '#7fb0c2' },
  artisanA: { base: '#8f4b30', shade: '#6a3420', light: '#c0704c' },
  artisanB: { base: '#4a7296', shade: '#345573', light: '#79a2c6' },
} as const satisfies Record<string, Tone>;

/** 三轉光暈與特效色。 */
export const GLOW = {
  gold: '#ffd977',
  holy: '#fff0a8',
  rune: '#7fe8f2',
  ice: '#c6f2ff',
  shadow: '#b48cff',
  venom: '#a6ee5a',
  ember: '#ff9a3c',
  star: '#ffe680',
  mech: '#72e2ff',
  fate: '#ffcf5c',
  phantom: '#d6a8ff',
  beast: '#ffc46b',
} as const;

/** 特效與小道具的點綴色。 */
export const ACCENT = {
  fire: '#ff7a3a',
  fireLight: '#ffd15c',
  water: '#4fc0f5',
  leaf: '#7ed957',
  crystal: '#bff0ff',
  crystalShade: '#7cc8ea',
  venom: '#86d94a',
  venomShade: '#4f9a2a',
  card: '#fffaf0',
  cardRed: '#d63c3c',
  cardInk: '#2a2230',
  mirror: '#bfe6f2',
  fur: '#d9b27c',
  furShade: '#a87e4c',
  furLight: '#f2d6a6',
  horn: '#f1e4c4',
  hornShade: '#c9b48a',
  bead: '#8c4a2c',
  lens: '#86d8ea',
  scarf: '#d9634a',
  plume: '#e2493d',
  feather: '#f4ead9',
  bell: '#f2c94c',
  rope: '#c9a46a',
  vial: '#cfe9f2',
} as const;
