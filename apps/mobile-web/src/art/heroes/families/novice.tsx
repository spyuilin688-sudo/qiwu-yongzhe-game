import { ACCENT, FAMILY_TONES, HAIR, LEATHER, LINE } from '../palette.ts';
import { Strap } from '../props.tsx';
import type { HeroDesign } from '../rig.tsx';

/** 見習者：樸素旅人，只有圍巾與斜背小包，刻意不拿武器。 */
export function noviceDesign(): HeroDesign {
  return {
    outfit: { top: FAMILY_TONES.novice, legs: '#6e5a44', boots: LEATHER, belt: LEATHER.shade, hair: HAIR.brown },
    cut: 'tunic',
    hair: 'tuft',
    mood: 'smile',
    frontHand: 'low',
    backHand: 'low',
    torsoOver: (
      <>
        <Strap from={{ x: 38.6, y: 41.4 }} to={{ x: 24.6, y: 55.4 }} color={LEATHER.base} width={1.8} />
        <rect x="19.4" y="54.4" width="6.6" height="6.2" rx="1.8" fill={LEATHER.base} strokeWidth={LINE.part} />
        <path d="M19.4 56.6H26" fill="none" strokeWidth={LINE.detail} />
        <path d="M25.2 41.6L22 48.6L25.2 49.2L27.8 43Z" fill={ACCENT.scarf} strokeWidth={LINE.part} />
      </>
    ),
    // 圍巾畫在臉之後，才不會被大頭完全蓋住。
    faceOver: <path d="M24.4 38.2Q32 42.6 40.2 38.2L40.8 41.6Q32 46 23.8 41.6Z" fill={ACCENT.scarf} strokeWidth={LINE.part} />,
  };
}
