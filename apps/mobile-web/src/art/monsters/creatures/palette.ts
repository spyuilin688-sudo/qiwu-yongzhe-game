/**
 * 小怪／小首領調色盤。美術檔視同圖片資產，色碼集中於此；
 * 每張地圖一組主題色，讓同圖怪物看起來屬於同一生態，跨圖又能一眼分辨。
 */

/** 全部怪物共用的暖深褐描邊，與 UI 深褐底、黃銅點綴同調。 */
export const INK = '#1f1610';
export const OUTLINE_WIDTH = 2;

export const COMMON = {
  white: '#fff8ea',
  blush: '#f08a7a',
  mouth: '#6a2a22',
  tongue: '#e8746a',
  tooth: '#fffaf0',
  scar: '#f2b3a6',
  /** 小首領的發光瞳色：暖金為預設，冷色地圖改用冰藍或青光。 */
  eliteGold: '#ffd23f',
  eliteRed: '#ff6a3d',
  eliteIce: '#9ff0ff',
  eliteViolet: '#d9a8ff',
  gold: '#e8b947',
  ruby: '#e0434f',
  iron: '#7c8592',
  steel: '#a8b2bf',
  wood: '#a8703f',
  rope: '#d8b27a',
} as const;

export const MAP01 = {
  leaf: '#7cc25a',
  leafDeep: '#4f9a3f',
  straw: '#e8c35a',
  soil: '#9a6a3c',
  fruit: '#e8573f',
  cream: '#f6ead0',
  pink: '#f2a48a',
  chestnut: '#c8683a',
  tailGreen: '#3f7a52',
  stone: '#a29d90',
  moss: '#78a84a',
  turtle: '#5fae8a',
  boar: '#7a4f34',
  wool: '#f3ead6',
  faceBrown: '#74503a',
  horn: '#d9b07a',
} as const;

export const MAP02 = {
  honey: '#f2b134',
  amber: '#d9822b',
  berry: '#d8456c',
  berryPurple: '#8a4aa0',
  leaf: '#5fa35a',
  wood: '#b0783f',
  cream: '#fbe3b0',
  stripe: '#4a3020',
  wing: '#e9f4ff',
  syrup: '#f0a83c',
  bear: '#8f5a7a',
  hive: '#e8a43a',
  wasp: '#c9472f',
  puppet: '#c8955a',
} as const;

export const MAP03 = {
  copper: '#d47a3c',
  copperRed: '#c0482f',
  slate: '#727a86',
  coal: '#4a4347',
  ember: '#ff9a3a',
  lamp: '#ffd35a',
  mole: '#8c6a58',
  nose: '#f0a0a0',
  helmet: '#e0a83a',
  iron: '#6f7782',
  wood: '#9a6a42',
  ore: '#5f8fb0',
  slag: '#6a5552',
} as const;

export const MAP04 = {
  lavender: '#9d8fc4',
  lantern: '#ffbf52',
  brass: '#c9a04a',
  cloth: '#d97a6a',
  ghost: '#e6edf5',
  rust: '#b5643c',
  umbrella: '#6f8fc8',
  patch: '#e8c66a',
  straw: '#d8b45a',
  coat: '#5f6f8f',
  mouse: '#b8b0c8',
  bell: '#a8743a',
} as const;

export const MAP05 = {
  sand: '#e6c27a',
  terracotta: '#c96a3f',
  turquoise: '#3fb7b0',
  clothRed: '#c94a3a',
  tan: '#c99a62',
  dune: '#d9a85a',
  scorpion: '#d39a52',
  pack: '#8a5a3a',
  turban: '#f0e2c2',
  camel: '#d8a868',
  well: '#a89a86',
  glass: '#5fd0d8',
  /** 沙狐盜首的毛色：比沙鼠一族更橘，同圖兩種獸才不會混在一起。 */
  fox: '#e39350',
} as const;

export const MAP06 = {
  sea: '#3fa6b5',
  coral: '#f07a6a',
  rope: '#d8b27a',
  navy: '#2f4f7f',
  wood: '#a8703f',
  pearl: '#f4ece0',
  crab: '#e0553c',
  shell: '#f2c6a8',
  stripe: '#3f6fa8',
  beard: '#8a5a3a',
  black: '#3a3a4a',
  /** 港灣水手一族的海藻青皮膚：讓「水手」讀成怪物而不是真人。 */
  seaSkin: '#8ccfc4',
  interior: '#7a3a4a',
} as const;

export const MAP07 = {
  snow: '#f2f5fa',
  ice: '#9fd8f0',
  iceDeep: '#5fa8d8',
  scarf: '#d9443a',
  fur: '#c8d2e0',
  wolf: '#8fa0b8',
  beak: '#f0a03a',
  bird: '#6fa8e0',
  turtle: '#7a9a8a',
  mist: '#dfe6f0',
} as const;

export const MAP08 = {
  lava: '#ff7a2a',
  basalt: '#5a4646',
  ember: '#ffd04a',
  ash: '#8f8a86',
  rock: '#a5553f',
  coal: '#4f4747',
  lizard: '#d0603a',
  sulfur: '#f2d84a',
  iron: '#4a4f5a',
  horn: '#efe0c8',
} as const;

export const MAP09 = {
  brass: '#d8a948',
  bronze: '#b7773a',
  teal: '#3f9a92',
  royal: '#b8323f',
  steel: '#8c96a3',
  copper: '#c9703f',
  enamel: '#f2e8d2',
  navy: '#34507a',
  steam: '#e8eef2',
  plume: '#e05a4a',
} as const;

export const MAP10 = {
  indigo: '#5a5aa8',
  night: '#3a4080',
  star: '#ffd95a',
  cyan: '#7fe6e6',
  pink: '#f29ac8',
  violet: '#9a7ad8',
  pumice: '#b8b0c8',
  hedgehog: '#8a6ab0',
  leaf: '#4fa88a',
  moon: '#e8ecff',
  crystal: '#8fd8ff',
} as const;

export const MAP11 = {
  cloud: '#f4f6fb',
  sky: '#8cc8f0',
  gold: '#e8c04a',
  marble: '#e6e0d4',
  blue: '#5a8fd8',
  feather: '#7fc0a8',
  face: '#8a7a9a',
  /** 普通雲翼羊的淺臉：深臉配黑豆眼在 48px 會糊成一團，淺一階才看得到眼神。 */
  faceSoft: '#bcaed0',
  horn: '#d8c09a',
  griffin: '#d8a35a',
  stone: '#b8b4aa',
} as const;

export const MAP12 = {
  parchment: '#efe0bc',
  page: '#f7efdc',
  ink: '#4a55a0',
  inkDeep: '#323a78',
  purple: '#7a5a9a',
  candle: '#ffcf5a',
  leather: '#8a4a3a',
  chain: '#8f96a0',
  clock: '#c9a04a',
  stone: '#8a8478',
} as const;
