import type { ReactNode } from 'react';
import { ACCENT, CLOTH_WHITE, FAMILY_TONES, GLOW, INK, LEATHER, METAL, WOOD, type Tone } from '../../heroes/palette.ts';
import { gearPath } from '../../heroes/shapes.ts';
import type { FamilyKey } from '../../types.ts';

/**
 * 職業系徽章（32×32）：黃銅外環＋職業色底＋代表物。
 * 代表物與角色立繪的招牌道具一致（劍、弓、尖帽、眼罩、光環日輪、小丑帽、齒輪鎚），
 * 讓玩家在轉職樹與角色圖之間可以直接對上。
 */
export const EMBLEM_FIELD: Readonly<Record<FamilyKey, Tone>> = {
  novice: { base: '#a08356', shade: '#6e5434', light: '#d0b483' },
  sword: FAMILY_TONES.sword,
  bow: FAMILY_TONES.bow,
  mage: FAMILY_TONES.mage,
  rogue: FAMILY_TONES.rogue,
  // 祭司底色用象牙白呼應米白長袍；原本的藍底與劍士幾乎同色，並排時分不出來。
  priest: { base: '#ecdcb8', shade: '#bfa272', light: '#fffaf0' },
  jester: FAMILY_TONES.jester,
  artisan: FAMILY_TONES.artisan,
};

const SPROUT = '#8fd05a';
const SUN_RAYS = [0, 45, 90, 135, 180, 225, 270, 315]
  .map((deg) => {
    const rad = (deg * Math.PI) / 180;
    const tip = { x: 16 + Math.cos(rad) * 8.6, y: 18 + Math.sin(rad) * 8.6 };
    const left = { x: 16 + Math.cos(rad - 0.32) * 5, y: 18 + Math.sin(rad - 0.32) * 5 };
    const right = { x: 16 + Math.cos(rad + 0.32) * 5, y: 18 + Math.sin(rad + 0.32) * 5 };
    return `M${left.x.toFixed(2)} ${left.y.toFixed(2)}L${tip.x.toFixed(2)} ${tip.y.toFixed(2)}L${right.x.toFixed(2)} ${right.y.toFixed(2)}Z`;
  })
  .join('');

export const EMBLEM_GLYPHS: Readonly<Record<FamilyKey, ReactNode>> = {
  novice: (
    <>
      <path d="M16 23V15.4" strokeWidth="1.8" />
      <path d="M16 17.4C12 17.4 9.4 15 9.2 11.6C13 11.4 15.6 13.6 16 17.4Z" fill={SPROUT} />
      <path d="M16 15.4C16.4 11.2 19.4 8.6 23 8.8C22.8 12.6 20 15.2 16 15.4Z" fill={SPROUT} />
      <path d="M9.8 24.2Q16 20.4 22.2 24.2Z" fill={LEATHER.base} />
    </>
  ),
  sword: (
    <>
      <path d="M14.5 20.6V8.6L16 5.4L17.5 8.6V20.6Z" fill={METAL.steel.base} />
      <path d="M16 6.6V20.4H17.5V8.6Z" fill={METAL.steel.shade} stroke="none" />
      <rect x="11" y="20.2" width="10" height="2.2" rx="1" fill={METAL.gold.base} />
      <path d="M16 22.4V25.4" stroke={INK} strokeWidth="3.2" />
      <path d="M16 22.4V25.4" stroke={LEATHER.base} strokeWidth="1.4" />
      <circle cx="16" cy="26.4" r="1.4" fill={METAL.gold.base} strokeWidth="1.2" />
    </>
  ),
  bow: (
    <>
      <path d="M11.2 6.4V25.6" stroke={CLOTH_WHITE.base} strokeWidth="0.9" />
      <path d="M8.6 21.8L22 9.8" stroke={INK} strokeWidth="2.8" />
      <path d="M8.6 21.8L22 9.8" stroke={WOOD.light} strokeWidth="1.1" />
      <path d="M24 8.2L20.2 8.8L22.6 11.6Z" fill={METAL.steel.base} strokeWidth="1.2" />
      <path d="M11.2 6.4Q23.4 16 11.2 25.6" fill="none" stroke={INK} strokeWidth="4" />
      <path d="M11.2 6.4Q23.4 16 11.2 25.6" fill="none" stroke={WOOD.base} strokeWidth="2" />
    </>
  ),
  mage: (
    <>
      <path d="M10.4 21L15.4 6.4Q16.4 4.4 17.6 6.2L21.8 21Z" fill={FAMILY_TONES.mage.light} />
      <path d="M6.4 21.8Q16 18.2 25.6 21.8Q16 25.6 6.4 21.8Z" fill={FAMILY_TONES.mage.light} />
      <path d="M11 19.2Q16 17.6 21.2 19.2" fill="none" stroke={METAL.gold.base} strokeWidth="1.8" />
      <path d="M22.6 7.4Q23 10 25.4 10.4Q23 10.8 22.6 13.4Q22.2 10.8 19.8 10.4Q22.2 10 22.6 7.4Z" fill={GLOW.star} strokeWidth="1" />
    </>
  ),
  rogue: (
    <>
      <path d="M6.8 14.6L3.6 12.2M6.8 16.2L3.6 18.6" strokeWidth="1.8" />
      <path d="M6.2 13.2Q16 10 25.8 13.2Q25.6 19.6 20.6 19.8Q17.4 19.8 16 16.8Q14.6 19.8 11.4 19.8Q6.4 19.6 6.2 13.2Z" fill="#2a2230" />
      <ellipse cx="11.6" cy="15.6" rx="2.4" ry="1.9" fill={CLOTH_WHITE.light} strokeWidth="1" />
      <ellipse cx="20.4" cy="15.6" rx="2.4" ry="1.9" fill={CLOTH_WHITE.light} strokeWidth="1" />
    </>
  ),
  priest: (
    <>
      <path d={SUN_RAYS} fill={METAL.gold.base} strokeWidth="1" />
      <circle cx="16" cy="18" r="4.6" fill={GLOW.holy} strokeWidth="1.4" />
      <ellipse cx="16" cy="6.8" rx="5.4" ry="1.7" fill="none" stroke={INK} strokeWidth="3.2" />
      <ellipse cx="16" cy="6.8" rx="5.4" ry="1.7" fill="none" stroke={GLOW.holy} strokeWidth="1.4" />
    </>
  ),
  // 小丑帽：兩側帽尖往外再「下垂」、鈴鐺掛在垂下的尖端。舊版尖角朝上，32px 下會被看成王冠。
  // 左帽尖用米白而非紅色，否則會和紅色底融在一起。
  jester: (
    <>
      <path d="M10.4 21.4Q9.6 13.6 6.2 12.4Q5.2 15.6 6.8 19Q4.6 18.6 4.4 16.2Q3.8 9.6 9.6 9.2Q14 9.2 15 15.6Z" fill={CLOTH_WHITE.base} />
      <path d="M21.6 21.4Q22.4 13.6 25.8 12.4Q26.8 15.6 25.2 19Q27.4 18.6 27.6 16.2Q28.2 9.6 22.4 9.2Q18 9.2 17 15.6Z" fill="#62cbc4" />
      <path d="M12.6 19.2Q13.4 10.4 16 6.6Q18.6 10.4 19.4 19.2Z" fill={METAL.gold.base} />
      <path d="M9.4 22.6Q16 18.2 22.6 22.6V24.2Q16 20.6 9.4 24.2Z" fill={CLOTH_WHITE.base} />
      <path d="M8.4 19.4a1.7 1.7 0 1 0 -3.4 0a1.7 1.7 0 1 0 3.4 0ZM27 19.4a1.7 1.7 0 1 0 -3.4 0a1.7 1.7 0 1 0 3.4 0ZM17.7 6a1.7 1.7 0 1 0 -3.4 0a1.7 1.7 0 1 0 3.4 0Z" fill={ACCENT.bell} strokeWidth="1.2" />
    </>
  ),
  artisan: (
    <>
      <path d={gearPath(16, 16, 9.2, 7, 9)} fill={METAL.brass.base} strokeWidth="1.2" />
      <circle cx="16" cy="16" r="3.4" fill={FAMILY_TONES.artisan.shade} strokeWidth="1.2" />
      <path d="M10.4 23.6L19.2 13" stroke={INK} strokeWidth="3.6" />
      <path d="M10.4 23.6L19.2 13" stroke={WOOD.base} strokeWidth="1.8" />
      <path d="M16.4 10.4L20.2 7.2L24.8 12.6L21 15.8Z" fill={METAL.iron.base} />
    </>
  ),
};
