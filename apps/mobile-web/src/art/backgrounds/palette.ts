/**
 * 12 張地圖背景調色盤。背景視同圖片資產，色碼集中於此。
 * 原則：整體明度落在中間調（UI 是深褐底、傷害飄字是白字黑影），
 * 遠景顏色往天空色靠攏（空氣透視），越近越飽和；角色身後不放接近白色的大色塊。
 */

export const BG01 = {
  skyTop: '#5b88b0', skyMid: '#9cbcc0', skyLow: '#c4d2ae', sun: '#fff2c8', cloud: '#e8eee6',
  farHill: '#86a891', nearHill: '#79a061', tree: '#5f8a4f', treeDeep: '#4a7342', trunk: '#6a5038',
  millWall: '#c8b28c', millRoof: '#a05a3c', millSail: '#e6dcc4', line: '#5f5040',
  groundTop: '#86a052', groundLow: '#4a6334', lip: '#a8c070', path: '#b09a68', tuft: '#3f5a2c',
  flowerA: '#f0d070', flowerB: '#f0a0a0', reed: '#8a8a4a', reedHead: '#7a4f30', apple: '#d8503a',
  wool: '#eeeadc', river: '#7fb0c0', dusk: '#5a3a5a',
} as const;

export const BG02 = {
  skyTop: '#4a3a26', skyMid: '#a8743a', skyLow: '#d8a656', light: '#ffd890', farTrunk: '#8a6a44',
  trunk: '#6a4a2e', bark: '#4f3620', canopy: '#4f5a2a', canopyLight: '#6f7a34', shaft: '#ffe6a8',
  hive: '#e0a040', hiveBand: '#b8742a', honey: '#f0b848', bush: '#5a6a30', berry: '#d8456c',
  cap: '#d8603a', stem: '#efe0c0', groundTop: '#9a8040', groundLow: '#5a4422', lip: '#b8a050',
  pollen: '#ffe9a0', comb: '#c88a3a', petal: '#f2b6c8', dusk: '#3a2a3a',
} as const;

export const BG03 = {
  skyTop: '#2a2224', skyMid: '#4a3c38', skyLow: '#6a5444', ceiling: '#231c1d', farRock: '#584640',
  tunnel: '#1f1818', timber: '#8a6038', timberDeep: '#5f3f26', lamp: '#ffcf5a', lampBody: '#c9803a',
  ore: '#d47a3c', glint: '#ffd38a', rail: '#8a8a92', sleeper: '#5a3a28', groundTop: '#6a5546',
  groundLow: '#3a2e28', lip: '#7a6450', rubble: '#4a3c36', crystal: '#e89a5a', slag: '#ff8a3a',
  chain: '#7a7a82', dusk: '#1a1018',
} as const;

export const BG04 = {
  skyTop: '#3c4068', skyMid: '#7a7aa0', skyLow: '#a8a4bc', moon: '#f4f0e0', farRoof: '#5a5a82',
  farRoofDeep: '#4a4a72', mist: '#eef0fa', wall: '#8a7a8a', roof: '#5a4a6a', window: '#ffcf6a',
  lampPost: '#3a3550', bell: '#c9a04a', clock: '#e8e0c8', groundTop: '#6c6880', groundLow: '#3e3b52',
  lip: '#8a86a0', cobble: '#4f4c66', curtain: '#9a3a4a', string: '#5a5470', dusk: '#2a2048',
} as const;

export const BG05 = {
  skyTop: '#5a80aa', skyMid: '#d49a6c', skyLow: '#e2b072', sun: '#fff0c0', farDune: '#cf9658',
  mesa: '#b0704a', nearDune: '#d8a05e', ruin: '#c89a6a', ruinLine: '#8a6040', palm: '#8a6038',
  frond: '#5a8a4a', camel: '#a87a50', groundTop: '#d4a462', groundLow: '#8f6038', lip: '#e8c482',
  ripple: '#b07a44', stone: '#a87a52', dome: '#e8b940', water: '#5fb8c0', sign: '#7a5232', tent: '#d4bf98', tentStripe: '#b25a40', dusk: '#6a3a3a',
} as const;

export const BG06 = {
  skyTop: '#4f86ac', skyMid: '#9cc6cc', skyLow: '#c4dcd0', sun: '#fff4d0', seaTop: '#3f8aa0',
  seaLow: '#5aa8b0', foam: '#e8f6f4', cliff: '#6a8a7a', lighthouse: '#f0e8dc', stripe: '#c8503a',
  hull: '#8a5a3a', sail: '#efe6d2', plankTop: '#9a7a54', plankLow: '#5a4430', seam: '#6a5038',
  sandTop: '#d8c08a', sandLow: '#a08a5a', post: '#6a4a30', rope: '#d8b27a', barrel: '#a8703f',
  coral: '#e87a6a', shell: '#f2d0c0', gull: '#f4f4f0', dusk: '#2a3a5a',
} as const;

/**
 * 雪嶺與空島是最亮的兩張圖：白色怪物（雪兔、霜鵬、審判官）與白色傷害飄字都疊在上面，
 * 所以天空與雪地刻意壓到中間調的藍灰，白色只留給遠山雪冠與前景小物。
 */
export const BG07 = {
  skyTop: '#3f5c8a', skyMid: '#7890b4', skyLow: '#98abc6', farMount: '#6c84aa', midMount: '#7d92b2',
  snowCap: '#d4dfeb', pine: '#3f6a6e', pineDeep: '#2f5458', snowTop: '#a9b9cf', snowLow: '#5f7090',
  lip: '#c8d4e2', ice: '#9cc6e2', drift: '#91a2bb', flake: '#ffffff', twig: '#8a7a6a', rock: '#6d7c96', cabinLight: '#ffcf6a', dusk: '#3a3a6a',
} as const;

export const BG08 = {
  skyTop: '#2a1a20', skyMid: '#7a3428', skyLow: '#b8582e', volcano: '#4a2e2c', volcanoFar: '#5f3630',
  crater: '#ff8a3a', lava: '#ff7a2a', lavaCore: '#ffd04a', smoke: '#5a4040', ember: '#ffb050',
  spire: '#3a2a2a', forge: '#5a4440', forgeLine: '#2a1e1c', groundTop: '#5a3e36', groundLow: '#2a1e1c',
  lip: '#8a4a30', obsidian: '#2a2030', dusk: '#2a0a10',
} as const;

export const BG09 = {
  skyTop: '#34506a', skyMid: '#8a9a98', skyLow: '#d0b67a', tower: '#5a6a78', towerDeep: '#4a5866',
  clock: '#e8dcb8', gear: '#6a7480', steam: '#e8eef2', pipe: '#a8773a', pipeDeep: '#7a5228',
  banner: '#b8323f', trim: '#e8c060', tileTop: '#9a7a48', tileLow: '#4a3a28', tileLine: '#6a5232',
  lip: '#c8a060', teal: '#5fe0d0', water: '#5a8a9a', dusk: '#2a2a40',
} as const;

export const BG10 = {
  skyTop: '#161a44', skyMid: '#3a3a7a', skyLow: '#5a4a8a', star: '#ffe9a0', moon: '#f0ecff',
  hedge: '#2a3060', hedgeLight: '#363c74', stone: '#5a5a80', moss: '#7fe6c6', flowerCyan: '#7fe6e6',
  flowerPink: '#f29ac8', stem: '#3f7a6a', groundTop: '#3a4470', groundLow: '#1e2240', lip: '#5a68a0',
  pool: '#a8b8f0', brass: '#c9a04a', dusk: '#0a0a2a',
} as const;

export const BG11 = {
  skyTop: '#3a68a4', skyMid: '#7097c2', skyLow: '#93b1cf', sun: '#fff6d8', island: '#6f8aa6',
  islandTop: '#8fb08f', fall: '#e6f0f6', cloud: '#dfe6f0', column: '#d0c8b8', columnLine: '#8f877a',
  gold: '#e8c04a', tileTop: '#a39d8e', tileLow: '#5f5b54', tileLine: '#827c70', lip: '#c4bead',
  feather: '#ffffff', dusk: '#3a3a6a',
} as const;

export const BG12 = {
  skyTop: '#1e1626', skyMid: '#3e2c40', skyLow: '#5a4048', window: '#a8b0e0', windowFrame: '#2e2030',
  shelf: '#5a3428', shelfDeep: '#3e2218', farShelf: '#3a2a3a', farSpine: '#4a3a4a', spineA: '#8a3a3a',
  spineB: '#3a5a7a', spineC: '#c9a04a', page: '#f0e4c8', candle: '#ffcf5a', floorTop: '#5a3a2e',
  floorLow: '#2e1e18', carpet: '#7a2a2a', carpetTrim: '#c9a04a', lip: '#7a5040', cover: '#6a3a2a', dusk: '#140a18',
} as const;
