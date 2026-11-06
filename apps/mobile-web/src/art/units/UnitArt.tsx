import type { UnitKind } from '@qiwu/content';
import type { ReactNode } from 'react';
import { Svg } from '../Svg.tsx';
import { INK, METAL, WOOD } from '../heroes/palette.ts';
import type { ArtProps } from '../types.ts';

/**
 * 召喚物與區域（viewBox 0 0 40 40）：戰獸、幻影、替身、砲台、機甲、星陣／餘燼區域。
 * 與角色同一套暖深色描邊；一律面向右（與勇者同向），腳點在底部中央。
 * 召喚物沒有血條（規格：沒有血量、裝備或經驗），圖上也不畫任何生命值元素。
 */

/** 召喚物專用色（與角色調色盤分開，避免改角色色調時影響召喚物）。 */
const UNIT_COLORS = {
  shadow: '#000000',
  fur: { base: '#d9843a', shade: '#a85f22', light: '#f2ae6a' },
  cream: '#fbe9cf',
  earInner: '#f0a48a',
  collar: '#4d8fd1',
  ghost: { base: '#b59cf0', shade: '#8a6fd1', light: '#e6dcff' },
  jesterHat: { left: '#5ec2b5', right: '#d9546b' },
  bell: '#f2c14e',
  card: '#fffaf0',
  heart: '#e0504b',
  bomb: { base: '#3a3446', light: '#6d6680' },
  fuseSpark: '#ffb43a',
  visor: '#2f5f80',
  glow: '#7ff0ff',
  alert: '#e0504b',
  rune: { fill: 'rgba(181, 156, 240, 0.28)', line: '#c8b4ff', spark: '#fff2b0' },
  eyeShine: '#ffffff',
} as const;

function GroundShadow({ width = 22 }: { width?: number }) {
  return <ellipse cx="20" cy="37.2" rx={width / 2} ry="1.8" fill={UNIT_COLORS.shadow} opacity={0.25} stroke="none" />;
}

/** 戰獸：橘色小狼，坐姿、頸上一條藍項圈。 */
function Beast() {
  const fur = UNIT_COLORS.fur;
  return (
    <>
      <GroundShadow width={24} />
      <path d="M12 31Q3 28 6 19Q9 25 14 27Z" fill={fur.base} />
      <path d="M6 19Q5 23 7 25Q8 22 6 19Z" fill={fur.light} stroke="none" />
      <path d="M28 36Q29 26 22 23Q13 21 11 29Q10 35 13 36Z" fill={fur.base} />
      <path d="M25 35Q25 28 21.5 27Q19.5 31 21 35Z" fill={UNIT_COLORS.cream} stroke="none" />
      <ellipse cx="21.5" cy="36" rx="2.4" ry="1.3" fill={fur.shade} />
      <ellipse cx="26.5" cy="36" rx="2.4" ry="1.3" fill={fur.shade} />
      <path d="M30 19Q31 11 24 10Q17 10 16 17Q16 23 23 24Q29 24 30 19Z" fill={fur.base} />
      <path d="M29 13L30 5L24 10Z" fill={fur.base} />
      <path d="M21 10L17 4L17 12Z" fill={fur.base} />
      <path d="M28.4 11L28.9 7.4L26.2 9.8Z" fill={UNIT_COLORS.earInner} stroke="none" />
      <path d="M33 19Q33 15.6 28.6 15.8Q25.6 16.8 26.4 20Q29.4 22.2 33 19Z" fill={UNIT_COLORS.cream} />
      <circle cx="32.2" cy="17.4" r="1" fill={INK} stroke="none" />
      <circle cx="24.6" cy="15.6" r="1.4" fill={INK} stroke="none" />
      <circle cx="25" cy="15.1" r="0.45" fill={UNIT_COLORS.eyeShine} stroke="none" />
      <path d="M26 23.6Q22 25.6 18 23.2" fill="none" stroke={UNIT_COLORS.collar} strokeWidth={2.2} />
    </>
  );
}

/** 幻影：半透明的小丑幽影，雙角帽、手持一張紅心牌。 */
function Phantom() {
  const ghost = UNIT_COLORS.ghost;
  return (
    <>
      <GroundShadow width={16} />
      <g opacity={0.9}>
        <path d="M12 34Q11 19 20 15Q29 19 28 34Q26 32 24 34Q22 32 20 34Q18 32 16 34Q14 32 12 34Z" fill={ghost.base} />
        <path d="M14 24Q15 19 19 17" fill="none" stroke={ghost.light} strokeWidth={1.6} />
      </g>
      <path d="M13.5 18Q12 11 6.5 10.5Q13 7.5 20 13Q27 7.5 33.5 10.5Q28 11 26.5 18Z" fill={UNIT_COLORS.jesterHat.left} />
      <path d="M20 13Q27 7.5 33.5 10.5Q28 11 26.5 18L20 16.5Z" fill={UNIT_COLORS.jesterHat.right} />
      <circle cx="6.5" cy="10.5" r="1.8" fill={UNIT_COLORS.bell} />
      <circle cx="33.5" cy="10.5" r="1.8" fill={UNIT_COLORS.bell} />
      <ellipse cx="18" cy="23" rx="1.3" ry="1.8" fill={INK} stroke="none" />
      <ellipse cx="23.6" cy="23" rx="1.3" ry="1.8" fill={INK} stroke="none" />
      <path d="M18.4 27.4Q20.8 29.2 23.2 27.4" fill="none" strokeWidth={1.2} />
      <g transform="rotate(14 31 27)">
        <rect x="27.5" y="22" width="7" height="10" rx="1.4" fill={UNIT_COLORS.card} />
        <path d="M31 28.6Q28.6 26.6 29.6 25.4Q30.6 24.6 31 25.8Q31.4 24.6 32.4 25.4Q33.4 26.6 31 28.6Z" fill={UNIT_COLORS.heart} stroke="none" />
      </g>
    </>
  );
}

/** 替身：吊線木偶，懷裡抱著點燃引信的炸彈（定時爆炸，不承受傷害）。 */
function Decoy() {
  const bomb = UNIT_COLORS.bomb;
  return (
    <>
      <GroundShadow width={20} />
      <path d="M15.5 1.5L17 8.5M24.5 1.5L23 8.5" fill="none" strokeWidth={0.8} opacity={0.7} />
      <rect x="15.5" y="31" width="3.4" height="5.6" rx="1.4" fill={WOOD.shade} />
      <rect x="21.1" y="31" width="3.4" height="5.6" rx="1.4" fill={WOOD.shade} />
      <rect x="12.5" y="18" width="15" height="14.5" rx="4.5" fill={WOOD.base} />
      <path d="M15 21.5H25" fill="none" stroke={WOOD.light} strokeWidth={1.4} />
      <circle cx="20" cy="12.5" r="6.2" fill={WOOD.light} />
      <circle cx="17.8" cy="12" r="1.1" fill={INK} stroke="none" />
      <circle cx="22.4" cy="12" r="1.1" fill={INK} stroke="none" />
      <path d="M18 15.6L19 16.4L20 15.6L21 16.4L22 15.6" fill="none" strokeWidth={0.9} />
      <circle cx="27.5" cy="27" r="5.6" fill={bomb.base} />
      <path d="M25 24.6Q26.2 23.2 27.8 23.2" fill="none" stroke={bomb.light} strokeWidth={1.4} />
      <path d="M30.4 22.4Q33 19.2 31.2 16.6" fill="none" strokeWidth={1.3} />
      <path d="M31.2 13.2L32 15.4L34.2 15.6L32.4 16.8L33 19L31.2 17.6L29.4 19L30 16.8L28.2 15.6L30.4 15.4Z" fill={UNIT_COLORS.fuseSpark} strokeWidth={0.9} />
    </>
  );
}

/** 砲台：黃銅半球砲身架在三腳架上，砲管朝右。 */
function Turret() {
  const brass = METAL.brass;
  const iron = METAL.iron;
  return (
    <>
      <GroundShadow width={24} />
      <path d="M12 37L18 27M28 37L22 27M20 37V28" fill="none" stroke={iron.shade} strokeWidth={2.2} />
      <path d="M12 37L18 27M28 37L22 27M20 37V28" fill="none" strokeWidth={0.6} opacity={0.5} />
      <ellipse cx="20" cy="27" rx="8" ry="3" fill={brass.shade} />
      <g transform="rotate(-10 22 19.5)">
        <rect x="21" y="16.8" width="14" height="5.4" rx="2" fill={iron.base} />
        <rect x="33" y="16" width="3.4" height="7" rx="1.2" fill={iron.shade} />
      </g>
      <path d="M12.5 26Q12.5 16.5 20 15.5Q27.5 16.5 27.5 26Z" fill={brass.base} />
      <path d="M15 20Q16 17.6 19 17" fill="none" stroke={brass.light} strokeWidth={1.4} />
      <circle cx="17" cy="22.4" r="2.6" fill={brass.light} />
      <circle cx="17" cy="22.4" r="0.9" fill={iron.shade} stroke="none" />
      <circle cx="23.8" cy="20.6" r="1.1" fill={UNIT_COLORS.alert} stroke="none" />
    </>
  );
}

/** 機甲：圓滾的鋼製小機器人，藍色目鏡、頭頂紅色天線燈。 */
function Mech() {
  const steel = METAL.steel;
  const iron = METAL.iron;
  return (
    <>
      <GroundShadow width={24} />
      <rect x="13" y="30" width="5" height="6.6" rx="1.6" fill={iron.base} />
      <rect x="22" y="30" width="5" height="6.6" rx="1.6" fill={iron.base} />
      <ellipse cx="8.8" cy="24" rx="2.6" ry="4.2" fill={iron.base} />
      <ellipse cx="31.2" cy="24" rx="2.6" ry="4.2" fill={iron.base} />
      <path d="M20 15.5V9.6" fill="none" strokeWidth={1.4} />
      <circle cx="20" cy="8.6" r="1.8" fill={UNIT_COLORS.alert} />
      <rect x="10" y="15.5" width="20" height="16" rx="6.5" fill={steel.base} />
      <path d="M12.8 20Q13.6 17.8 16.4 17.4" fill="none" stroke={steel.light} strokeWidth={1.4} />
      <rect x="15" y="19.4" width="13" height="6.2" rx="3.1" fill={UNIT_COLORS.visor} />
      <circle cx="24.4" cy="22.5" r="1.7" fill={UNIT_COLORS.glow} stroke="none" />
      <circle cx="20" cy="28.6" r="1" fill={steel.shade} stroke="none" />
    </>
  );
}

/** 區域：地面上的符文陣（星陣、餘燼區域共用），只有光效，沒有實體。 */
function Zone() {
  const rune = UNIT_COLORS.rune;
  return (
    <>
      <ellipse cx="20" cy="32" rx="16.5" ry="5.6" fill={rune.fill} stroke={rune.line} strokeWidth={1.3} />
      <ellipse cx="20" cy="32" rx="11" ry="3.6" fill="none" stroke={rune.line} strokeWidth={0.9} strokeDasharray="2 1.6" />
      <path d="M20 29.4L21 31.4L23.2 31.6L21.6 33L22 35L20 34L18 35L18.4 33L16.8 31.6L19 31.4Z" fill={rune.spark} stroke={rune.line} strokeWidth={0.6} />
      <path d="M9 22L9.6 23.6L11.2 24L9.6 24.6L9 26.2L8.4 24.6L6.8 24L8.4 23.6Z" fill={rune.spark} stroke="none" />
      <path d="M30 17L30.5 18.4L32 18.8L30.5 19.3L30 20.8L29.5 19.3L28 18.8L29.5 18.4Z" fill={rune.spark} stroke="none" />
      <circle cx="24" cy="24" r="0.9" fill={rune.spark} stroke="none" />
      <circle cx="14.5" cy="19" r="0.7" fill={rune.spark} stroke="none" />
    </>
  );
}

const UNIT_DESIGNS: Readonly<Record<UnitKind, () => ReactNode>> = {
  beast: Beast,
  phantom: Phantom,
  decoy: Decoy,
  turret: Turret,
  mech: Mech,
  zone: Zone,
};

export function UnitArt({ kind, ...rest }: ArtProps & { readonly kind: UnitKind }) {
  const Design = UNIT_DESIGNS[kind];
  return (
    <Svg viewBox="0 0 40 40" {...rest}>
      <g stroke={INK} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round">
        <Design />
      </g>
    </Svg>
  );
}
