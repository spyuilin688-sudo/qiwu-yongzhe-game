/**
 * 地圖 BOSS 與副目標調色盤。美術檔視同圖片資產，色碼集中於此。
 * 每位 BOSS 沿用該地圖小怪的主題色（同一生態的王），再加一道「王者色」
 * （金冠、發光瞳）讓玩家在戰場上一眼分辨這是 BOSS 而不是小首領。
 */

/** 與小怪同一支暖深褐描邊，BOSS 才會像同一位插畫家畫的。 */
export const INK = '#1f1610';
/** 128 格畫布在戰場上縮到約 112px 顯示，2.5 的線寬落在螢幕上約 2px，與 64 格小怪一致。 */
export const BOSS_OUTLINE = 2.5;
/** 48 格副目標縮到約 40px 顯示，線寬 2 才不會比本體細得突兀。 */
export const ADD_OUTLINE = 2;

export const ROYAL = {
  white: '#fff8ea',
  gold: '#f0c24a',
  goldDeep: '#c48a2a',
  eye: '#ffd23f',
  eyeHot: '#ff7a3d',
  eyeIce: '#a8f2ff',
  eyeViolet: '#e2b4ff',
  ruby: '#e0434f',
  sapphire: '#4f8fe0',
  emerald: '#3fbf8a',
  mouth: '#5a2018',
  tooth: '#fffaf0',
  tongue: '#e8746a',
  socket: '#3a2416',
  blush: '#f08a7a',
} as const;

export const B01 = { bark: '#9a6438', barkDeep: '#6e4426', leaf: '#6cb84e', leafDeep: '#3f8a3a', moss: '#8cc05a', apple: '#e8573f', seed: '#ffe27a' } as const;
export const B02 = { amber: '#f2b134', amberDeep: '#d9822b', stripe: '#4a3020', fluff: '#fbe3b0', wing: '#e9f4ff', berry: '#d8456c', honey: '#ffcf4a' } as const;
export const B03 = { mole: '#987562', moleDeep: '#5e4438', copper: '#d47a3c', copperDeep: '#a8552a', helmet: '#e0a83a', lamp: '#ffd35a', nose: '#f0a0a0', claw: '#f2e2c8', steel: '#9aa3ae' } as const;
export const B04 = { cloak: '#5f6f9f', cloakDeep: '#3f4a78', dial: '#f2ead6', brass: '#c9a04a', hat: '#3a3550', mist: '#c8d2e6', glove: '#e6e0f0', bell: '#b8843a' } as const;
export const B05 = { gold: '#e8b940', goldDeep: '#b8812a', shell: '#d39a52', gem: '#3fc7c0', gemDeep: '#2a8f9a', ruby: '#d8433a', sand: '#f0d9a0' } as const;
export const B06 = { body: '#8a56a8', bodyDeep: '#643c80', spot: '#b88ad0', sucker: '#f6c6d6', coral: '#f07a6a', pearl: '#f6efe2', gold: '#e8c04a', foam: '#d8f2f2' } as const;
export const B07 = { feather: '#eef3fa', featherShade: '#b8c8de', ice: '#9fdcf2', iceDeep: '#5fa8d8', beak: '#f0b04a', crest: '#ffffff', talon: '#6f7f99' } as const;
/** 熔心巨匠站在暗紅火山前：玄武岩刻意比小怪的岩石亮一階，剪影才不會溶進背景。 */
export const B08 = { basalt: '#86685f', basaltDeep: '#57423f', magma: '#ff7a2a', core: '#ffd04a', apron: '#a8643a', hammer: '#6f7682', handle: '#9a6a42', flame: '#ffb03a' } as const;
export const B09 = { brass: '#d8a948', brassDeep: '#a8772f', steel: '#8c96a3', royal: '#b8323f', teal: '#5fe0d0', glass: '#bfe8ec', key: '#e8c86a', ermine: '#f4ecdc' } as const;
/** 逐星巨鹿站在深藍夜空花園：毛色用偏亮的長春花藍，深夜藍會整隻溶進背景，只剩星點與鹿角。 */
export const B10 = { fur: '#717ed6', furDeep: '#5260b4', belly: '#b9c1f2', antler: '#efe2c8', star: '#ffd95a', crystal: '#8fe0ff', crystalDeep: '#5fb0e0', hoof: '#2f2f55', glowPink: '#f29ac8' } as const;
export const B11 = { marble: '#ece6da', marbleDeep: '#bdb4a4', gold: '#e8c04a', robe: '#6f8fd8', robeDeep: '#4a66b0', visor: '#8ff0ff', halo: '#ffe58a', wing: '#f8f6f0', cloud: '#f4f6fb' } as const;
export const B12 = { scale: '#4a55a0', scaleDeep: '#323a78', belly: '#efe0bc', page: '#f7efdc', leather: '#8a4a3a', ribbon: '#d8433a', ink: '#2a2f60', horn: '#e6d6b4', candle: '#ffcf5a' } as const;
