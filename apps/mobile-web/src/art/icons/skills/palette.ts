import type { Tone } from '../equipment/palette.ts';

export { INK, type Tone } from '../equipment/palette.ts';

/** 技能圖示依職業系分底色；見習者沒有技能，所以只列七系。 */
export type SkillFamily = 'sword' | 'bow' | 'mage' | 'rogue' | 'priest' | 'jester' | 'artisan';

/**
 * 職業系底色：在技能欄一排排列時，靠色相就分得出系別。
 * 祭司系改用青綠（職業徽章的藍色會與劍士系撞色），工匠系用鍛爐紅銅，呼應其火與機械主題。
 */
export const FIELD: Readonly<Record<SkillFamily, Tone>> = {
  sword: { base: '#4f80bb', shade: '#2d4f86', light: '#8db6e6' },
  bow: { base: '#5c9a48', shade: '#386a2b', light: '#9bd07a' },
  mage: { base: '#6e51ad', shade: '#432e78', light: '#a78bdb' },
  rogue: { base: '#4a5066', shade: '#272a38', light: '#808aa6' },
  priest: { base: '#2f8f8a', shade: '#1b5e5b', light: '#6cc7be' },
  jester: { base: '#c94552', shade: '#8a2633', light: '#f2838b' },
  artisan: { base: '#b8673a', shade: '#7a3f1f', light: '#ea9e6a' },
};

/** 絕招外框的黃銅：與 UI 的黃銅邊框同色系，一眼看出是絕招欄。 */
export const BRASS: Tone = { base: '#d9a441', shade: '#93621f', light: '#fbe29a' };
export const ULT_GEM: Tone = { base: '#e2493d', shade: '#a82e26', light: '#ffb0a2' };

/** 技能符號的效果色：盡量用亮色，壓在七種底色上都看得清楚。 */
export const FX = {
  white: '#ffffff',
  cream: '#fff6e0',
  steel: { base: '#e8eef4', shade: '#a9b8c8', light: '#ffffff' },
  iron: { base: '#aab3bd', shade: '#737d89', light: '#dfe5ea' },
  darkIron: { base: '#5d6370', shade: '#40444d', light: '#8c93a0' },
  gold: { base: '#f6c94e', shade: '#c8902c', light: '#fff0b8' },
  fire: { base: '#ff8a3a', shade: '#e0502a', light: '#ffd45c' },
  ice: { base: '#c6f0ff', shade: '#7cc4ea', light: '#ffffff' },
  bolt: { base: '#ffe45c', shade: '#f2a92c', light: '#fff9c8' },
  venom: { base: '#9be05a', shade: '#5a9e2e', light: '#dcf8b0' },
  holy: { base: '#fff2b0', shade: '#f2c94c', light: '#ffffff' },
  shadow: { base: '#b48cff', shade: '#7a55c8', light: '#e4d6ff' },
  rune: { base: '#8af0ee', shade: '#3fb8c4', light: '#e0fffd' },
  fur: { base: '#f2c46b', shade: '#c08a40', light: '#ffe2a8' },
  stone: { base: '#a9a59c', shade: '#77736b', light: '#d6d2c8' },
  wood: { base: '#b9804a', shade: '#8c5a30', light: '#dcaa72' },
  copper: { base: '#cf7a40', shade: '#9a532a', light: '#f2aa76' },
  bone: { base: '#efe2c0', shade: '#c7b287', light: '#fffaea' },
  skin: { base: '#f8d2a8', shade: '#e3a97e', light: '#fff1de' },
  mech: { base: '#72e2ff', shade: '#2f9ccc', light: '#e2fbff' },
  petal: { base: '#ffb3c8', shade: '#e07898', light: '#ffe2ea' },
  bomb: { base: '#4a4360', shade: '#312c42', light: '#7d7698' },
  mark: '#e8463c',
  paper: '#fffaf0',
  cardRed: '#d63c3c',
  cardBack: '#c8423e',
  cardInk: '#2a2230',
  confettiBlue: '#5fb8f0',
  confettiGreen: '#8fe06a',
} as const;
