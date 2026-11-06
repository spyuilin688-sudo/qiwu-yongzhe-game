import type { UnitKind } from '@qiwu/content';
import type { ReactNode } from 'react';
import { Svg } from '../Svg.tsx';
import { BG08 } from '../backgrounds/palette.ts';
import { INK, LEATHER, METAL, WOOD } from '../heroes/palette.ts';
import type { ArtProps } from '../types.ts';

/**
 * 召喚物（viewBox 0 0 40 40）：戰獸、幻影、替身、砲台、機甲；區域（星陣／餘燼）另用扁長的 160×40。
 * 與角色同一套暖深色描邊與「底色＋暗面＋小高光」三階上色；一律面向右（與勇者同向），腳點在底部中央。
 * 召喚物沒有血條（規格：沒有血量、裝備或經驗），圖上也不畫任何生命值元素。
 * 以下皆為程式繪製的原創佔位美術，不是最終美術。
 */

/** 召喚物專用色（與角色調色盤分開，避免改角色色調時影響召喚物）。 */
const UNIT_COLORS = {
  shadow: '#000000',
  fur: { base: '#d9843a', shade: '#a85f22', light: '#f2ae6a' },
  cream: '#fbe9cf',
  earInner: '#f0a48a',
  saddle: { base: '#5d9a48', shade: '#3f7234', light: '#93c873' },
  fang: '#fffaf0',
  ghost: { base: '#b59cf0', shade: '#8a6fd1', light: '#e6dcff' },
  jesterHat: { left: '#5ec2b5', right: '#d9546b' },
  bell: '#f2c14e',
  card: '#fffaf0',
  heart: '#e0504b',
  mask: '#fffaf0',
  bomb: { base: '#3a3446', shade: '#25212e', light: '#8d86a0' },
  fuseSpark: '#ffb43a',
  sparkCore: '#fff2b0',
  visor: '#2f5f80',
  glow: '#7ff0ff',
  alert: '#e0504b',
  rune: { base: '#b59cf0', line: '#c8b4ff', spark: '#fff2b0' },
  ember: { base: BG08.crater, line: BG08.lava, core: BG08.lavaCore, spark: BG08.ember },
  eyeShine: '#ffffff',
} as const;

/** 召喚物共用 viewBox 邊長與描邊粗細（與角色一致）。 */
const UNIT_VIEW = 40;
const UNIT_STROKE = 1.4;
/** 召喚物腳下陰影中心的 y：戰場以它對齊地面線。 */
const UNIT_SHADOW_Y = 37.2;
/** 召喚物腳下陰影透明度；浮空的幻影、機甲較淡，看得出離地。 */
const SHADOW_OPACITY = { grounded: 0.25, hovering: 0.16 } as const;

const f = (value: number): number => Math.round(value * 100) / 100;

function GroundShadow({ width = 22, hovering = false }: { readonly width?: number; readonly hovering?: boolean }) {
  return (
    <ellipse
      cx={UNIT_VIEW / 2}
      cy={UNIT_SHADOW_Y}
      rx={width / 2}
      ry="1.8"
      fill={UNIT_COLORS.shadow}
      opacity={hovering ? SHADOW_OPACITY.hovering : SHADOW_OPACITY.grounded}
      stroke="none"
    />
  );
}

/**
 * 齒輪外形；squash < 1 時壓扁成斜看的底座。齒在半徑外再凸出 depth。
 * 砲台底座、機甲胸口徽記共用。
 */
function gearPath(cx: number, cy: number, radius: number, teeth: number, depth: number, squash = 1): string {
  const step = (Math.PI * 2) / teeth;
  const at = (r: number, a: number): string => `${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r * squash)}`;
  let d = '';
  for (let index = 0; index < teeth; index += 1) {
    const a = index * step;
    d += `${index === 0 ? 'M' : 'L'}${at(radius, a - step * 0.3)}L${at(radius + depth, a - step * 0.16)}L${at(radius + depth, a + step * 0.16)}L${at(radius, a + step * 0.3)}`;
  }
  return `${d}Z`;
}

/** 圓角矩形路徑：需要把多個圓角矩形合成一條路徑時使用。 */
function roundRect(x: number, y: number, width: number, height: number, radius: number): string {
  const r = Math.min(radius, width / 2, height / 2);
  return `M${f(x + r)} ${f(y)}H${f(x + width - r)}Q${f(x + width)} ${f(y)} ${f(x + width)} ${f(y + r)}V${f(y + height - r)}Q${f(x + width)} ${f(y + height)} ${f(x + width - r)} ${f(y + height)}H${f(x + r)}Q${f(x)} ${f(y + height)} ${f(x)} ${f(y + height - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;
}

/** 多芒星（爆炸、火花）：外半徑與內半徑交錯。 */
function burstPath(cx: number, cy: number, outer: number, inner: number, points: number, rotation = 0): string {
  const step = Math.PI / points;
  return `${Array.from({ length: points * 2 }, (_, index) => {
    const r = index % 2 === 0 ? outer : inner;
    const a = rotation + index * step - Math.PI / 2;
    return `${index === 0 ? 'M' : 'L'}${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}`;
  }).join('')}Z`;
}

/** 四芒小星：區域星點、火星。 */
function sparkPath(list: readonly (readonly [number, number, number])[]): string {
  return list.map(([cx, cy, r]) => burstPath(cx, cy, r, r * 0.3, 4)).join('');
}

/** 戰獸：前撲站姿的橘色戰狼，背上葉紋戰鞍、腹下皮帶，身側三道爪痕紋，耳朵後貼、露出尖牙。 */
function Beast() {
  const fur = UNIT_COLORS.fur;
  const saddle = UNIT_COLORS.saddle;
  return (
    <>
      <GroundShadow width={30} />
      {/* 遠側的前後腳用暗面色，和近側腳分出前後。 */}
      <path d="M12 28L10.6 36.2H14L15.6 29Z" fill={fur.shade} />
      <path d="M25.8 27.6L26.8 36.2H30.2L29 27.4Z" fill={fur.shade} />
      <path d="M11 22Q4.4 22.4 2.6 13.4Q5.8 15.4 8.4 14.6Q9.4 18.4 13 19.6Z" fill={fur.base} />
      <path d="M9.6 22Q10 17 16 17.2L25 17.6Q30.6 18.4 30.8 23.4Q30.6 28.4 25.6 28.8L14.6 29Q9.6 28.4 9.6 22Z" fill={fur.base} />
      <path d="M11 25.6Q15 28.8 25 28.4Q29 27.8 30.4 25Q27 26.8 20 27Q14 27.2 11 25.6Z" fill={fur.shade} stroke="none" />
      <path d="M15.4 20.4L13.8 24.2M18.2 20.2L16.6 24.4M21 20.4L19.6 24" fill="none" stroke={fur.shade} strokeWidth={1.3} />
      <path d="M13.4 18.6Q17 13.2 25.6 15.4Q22.6 20.6 13.4 18.6Z" fill={saddle.base} />
      <path d="M14.8 18.2Q19.6 16.4 24.6 15.8M18.4 17.2L18 15.4M21.4 16.4L21.4 14.8" fill="none" stroke={saddle.shade} strokeWidth={0.9} />
      <path d="M23.6 18.8Q24.6 23.6 23.8 28.6" fill="none" stroke={LEATHER.base} strokeWidth={1.8} />
      <path d="M13 25Q10.8 29.6 12.4 36.2H16.4Q15.4 31.6 18 27Z" fill={fur.base} />
      <path d="M26.4 25Q29.6 29 31.6 35.6L35.2 35.8Q34.8 33 32.6 30Q31 26.6 29.6 24.6Z" fill={fur.base} />
      <path d="M27.8 21Q29.8 24.6 28.2 27.4Q26.4 24.8 25.6 22.4Z" fill={UNIT_COLORS.cream} stroke="none" />
      <path d="M25.6 16.6Q26.6 11.4 31.4 11.2Q35.4 11.4 36.6 15.4L38.6 17.4Q38.8 20.4 35.6 21.2Q32.4 22.6 28.6 21.6Q25 20.4 25.6 16.6Z" fill={fur.base} />
      <path d="M33.2 17.2Q36.4 16.4 38.6 17.6Q38.6 20.2 35.6 21Q33.4 21.4 32.4 19.6Z" fill={UNIT_COLORS.cream} />
      <path d="M27.6 13.2L25 7.2L31 11.4Z" fill={fur.base} />
      <path d="M27.4 11.6L26.2 8.8L29.2 11Z" fill={UNIT_COLORS.earInner} stroke="none" />
      <circle cx="38.3" cy="17.5" r="1" fill={INK} stroke="none" />
      {/* 杏仁眼加一道壓低的眉，表情是「準備撲上去」，不是寵物的圓眼。 */}
      <path d="M30 15.6Q31.4 14.6 32.8 15.4Q31.6 16.8 30 15.6Z" fill={INK} strokeWidth={0.6} />
      <path d="M29.4 13.8L33 14.8" fill="none" strokeWidth={1.1} />
      <path d="M34.2 20.6L34.9 22.6L35.7 20.6Z" fill={UNIT_COLORS.fang} strokeWidth={0.6} />
      <path d="M11.2 20.4Q12.6 18.4 15.4 18M27 14.2Q28 12.4 30 12" fill="none" stroke={fur.light} strokeWidth={1.2} />
    </>
  );
}

/** 幻影：半透明的小丑幽影，雙角帽、右半臉戴菱形眼面具，下身收成漩渦尾巴，手持一張紅心牌。 */
function Phantom() {
  const ghost = UNIT_COLORS.ghost;
  return (
    <>
      <GroundShadow width={14} hovering />
      <g opacity={0.9}>
        <path d="M12.6 22Q12.6 14.6 20 14.2Q27.6 14.6 27.8 22Q28 28.4 23.8 31.6Q19.6 34.8 14.8 34.2Q10.6 33.4 10.8 30.2Q11.2 27.6 14 28.2Q16 28.8 15.6 30.8Q18.6 29.4 16.2 26.4Q12.8 25.4 12.6 22Z" fill={ghost.base} />
        <path d="M24.6 15.6Q28 17.4 27.8 22Q28 28 23.6 31.4Q21 33 18.2 33.6Q24.8 28.4 24.6 15.6Z" fill={ghost.shade} stroke="none" />
        <path d="M14.4 21.4Q14.8 17.6 18.4 16.4M12.6 31.4Q12.6 29.8 14 29.8" fill="none" stroke={ghost.light} strokeWidth={1.1} />
      </g>
      <path d="M13.5 18Q12 11 6.5 10.5Q13 7.5 20 13Q27 7.5 33.5 10.5Q28 11 26.5 18Z" fill={UNIT_COLORS.jesterHat.left} />
      <path d="M20 13Q27 7.5 33.5 10.5Q28 11 26.5 18L20 16.5Z" fill={UNIT_COLORS.jesterHat.right} />
      <circle cx="6.5" cy="10.5" r="1.8" fill={UNIT_COLORS.bell} />
      <circle cx="33.5" cy="10.5" r="1.8" fill={UNIT_COLORS.bell} />
      <ellipse cx="17.4" cy="22" rx="1.3" ry="1.8" fill={INK} stroke="none" />
      {/* 半臉面具：白底、菱形眼洞，讓 30px 時也認得出「戲法師的分身」而不是一般幽靈。 */}
      <path d="M20.4 18.4Q24.8 17.4 27.4 19Q27.4 24.4 24.2 26Q21.8 25.2 20.4 23.4Z" fill={UNIT_COLORS.mask} strokeWidth={1} />
      <path d="M23.6 19.8L25 21.5L23.6 23.2L22.2 21.5Z" fill={INK} stroke="none" />
      <path d="M16 25.4Q18 27 20.2 25.8" fill="none" strokeWidth={1.1} />
      <g transform="rotate(14 31 27)">
        <rect x="27.5" y="22" width="7" height="10" rx="1.4" fill={UNIT_COLORS.card} />
        <path d="M31 28.6Q28.6 26.6 29.6 25.4Q30.6 24.6 31 25.8Q31.4 24.6 32.4 25.4Q33.4 26.6 31 28.6Z" fill={UNIT_COLORS.heart} stroke="none" />
      </g>
    </>
  );
}

/** 替身：吊線木偶，懷裡抱著刻了三道倒數刻痕的炸彈，引信正在燃燒（定時爆炸，不承受傷害）。 */
function Decoy() {
  const bomb = UNIT_COLORS.bomb;
  return (
    <>
      <GroundShadow width={22} />
      <path d="M15.5 1.5L17 8.5M24.5 1.5L23 8.5" fill="none" strokeWidth={0.8} opacity={0.7} />
      <rect x="14.5" y="31" width="3.4" height="5.6" rx="1.4" fill={WOOD.shade} />
      <rect x="20.1" y="31" width="3.4" height="5.6" rx="1.4" fill={WOOD.shade} />
      <rect x="11.5" y="18" width="15" height="14.5" rx="4.5" fill={WOOD.base} />
      <path d="M22.4 18.4Q26.4 19 26.4 23V28Q26.4 32 22.6 32.4Q24.4 27 22.4 18.4Z" fill={WOOD.shade} stroke="none" />
      <path d="M14 21.5H22" fill="none" stroke={WOOD.light} strokeWidth={1.4} />
      <circle cx="19" cy="12.5" r="6.2" fill={WOOD.light} />
      <circle cx="16.8" cy="12" r="1.1" fill={INK} stroke="none" />
      <circle cx="21.4" cy="12" r="1.1" fill={INK} stroke="none" />
      <path d="M17 15.6L18 16.4L19 15.6L20 16.4L21 15.6" fill="none" strokeWidth={0.9} />
      <path d="M29.4 21.4L31.2 19.2L33.4 20.8L31.8 23Z" fill={METAL.iron.base} strokeWidth={1.1} />
      <circle cx="27.6" cy="27.4" r="6.4" fill={bomb.base} />
      <path d="M32 23.4Q34.6 28.4 31 32Q27.6 34.2 23.8 32Q29.8 31.4 32 23.4Z" fill={bomb.shade} stroke="none" />
      {/* 倒數刻痕：三道直刻，像倒數計時，30px 時仍看得出是「會爆的東西」。 */}
      <path d="M25.6 26.2V28.8M27.6 26.2V28.8M29.6 26.2V28.8" fill="none" stroke={bomb.light} strokeWidth={1.1} />
      <path d="M24.4 24.4Q25.4 22.6 27.4 22.4" fill="none" stroke={bomb.light} strokeWidth={1.3} />
      <path d="M32.4 20Q34.6 17.4 33.2 14.8" fill="none" strokeWidth={1.3} />
      <g data-unit-part="fuse">
        <path d={burstPath(33.4, 12.8, 4.4, 1.9, 6)} fill={UNIT_COLORS.fuseSpark} strokeWidth={0.9} />
        <circle cx="33.4" cy="12.8" r="1.3" fill={UNIT_COLORS.sparkCore} stroke="none" />
        <path d="M37.6 8.8h0M29.4 9h0M37.8 15.2h0" fill="none" stroke={UNIT_COLORS.fuseSpark} strokeWidth={1.3} />
      </g>
    </>
  );
}

/** 砲台：黃銅圓頂架在斜看的齒輪底座上，砲管朝右、砲口套著黃銅環。 */
function Turret() {
  const brass = METAL.brass;
  const iron = METAL.iron;
  return (
    <>
      <GroundShadow width={26} />
      <path d={gearPath(20, 33.6, 8.4, 10, 1.6, 0.42)} fill={iron.base} />
      <ellipse cx="20" cy="33.2" rx="3.8" ry="1.5" fill={iron.shade} strokeWidth={0.9} />
      <rect x="17.8" y="26" width="4.4" height="7" fill={iron.shade} />
      <g transform="rotate(-6 22 20)">
        <rect x="21" y="17.2" width="13" height="5.6" rx="1.8" fill={iron.base} />
        <rect x="22" y="20.2" width="11" height="2" fill={iron.shade} stroke="none" />
        <rect data-unit-part="muzzle" x="32.4" y="16.2" width="4.2" height="7.6" rx="1.4" fill={brass.base} />
      </g>
      <path d="M11.6 27Q11.6 15.4 20 14.6Q28.4 15.4 28.4 27Z" fill={brass.base} />
      <path d="M22.6 15.2Q28.4 16.6 28.4 27H24.6Q25.6 20.6 22.6 15.2Z" fill={brass.shade} stroke="none" />
      <rect x="10.6" y="25.2" width="18.8" height="3.2" rx="1.2" fill={brass.shade} />
      <path d="M13.6 26.8h0M17.2 26.8h0M20.8 26.8h0M24.4 26.8h0" fill="none" stroke={brass.light} strokeWidth={1.1} />
      <circle cx="23.6" cy="20.8" r="2.7" fill={brass.light} />
      <circle cx="23.9" cy="20.8" r="1.1" fill={INK} stroke="none" />
      <circle cx="19.8" cy="17.4" r="0.9" fill={UNIT_COLORS.alert} stroke="none" />
      <path d="M13.8 22.4Q14.4 19.4 16.6 18" fill="none" stroke={brass.light} strokeWidth={1.4} />
    </>
  );
}

/** 機甲：鋼製小機甲，黃銅肩甲、胸口齒輪徽記、右臂短砲，腳底噴焰浮空。 */
function Mech() {
  const steel = METAL.steel;
  const iron = METAL.iron;
  const brass = METAL.brass;
  return (
    <>
      <GroundShadow width={18} hovering />
      <g data-unit-part="thruster" stroke="none">
        <path d="M13.6 34.4Q15.6 39.6 17.6 34.4ZM22.6 34.4Q24.6 39.6 26.6 34.4Z" fill={UNIT_COLORS.fuseSpark} />
        <path d="M14.8 34.4Q15.6 37.2 16.4 34.4ZM23.8 34.4Q24.6 37.2 25.4 34.4Z" fill={UNIT_COLORS.sparkCore} />
      </g>
      {/* 左右腳、左右臂各合成一條路徑，守住元素數上限。 */}
      <path d={`${roundRect(13, 29.4, 5.2, 5.4, 1.6)}${roundRect(22, 29.4, 5.2, 5.4, 1.6)}`} fill={iron.base} />
      <path d={`${roundRect(6.8, 19.6, 4.6, 9, 2.2)}${roundRect(28.6, 19.6, 4.6, 8, 2.2)}`} fill={iron.base} />
      <rect x="30.2" y="25" width="6.4" height="4.2" rx="1.4" fill={iron.shade} />
      <path d="M20 14.5V9.4" fill="none" />
      <circle cx="20" cy="8.4" r="1.8" fill={UNIT_COLORS.alert} />
      <rect x="10" y="14.5" width="20" height="17" rx="6.5" fill={steel.base} />
      <path d="M30 22V25Q30 31.5 23.5 31.5H17Q26 30 27 22Z" fill={steel.shade} stroke="none" />
      <path d="M8.4 19.6Q8.8 14.4 14 14.6L14.6 19.8ZM25.4 19.8L26 14.6Q31.2 14.4 31.6 19.6Z" fill={brass.base} />
      <rect x="16.6" y="17.6" width="12.4" height="5.8" rx="2.9" fill={UNIT_COLORS.visor} />
      <circle cx="25.8" cy="20.5" r="1.7" fill={UNIT_COLORS.glow} stroke="none" />
      <path d="M18.4 19.2H21.6" fill="none" stroke={steel.light} strokeWidth={1.1} opacity={0.7} />
      <path d={gearPath(18.6, 27.4, 2.4, 6, 0.9)} fill={brass.base} strokeWidth={0.9} />
      <circle cx="18.6" cy="27.4" r="0.8" fill={iron.shade} stroke="none" />
    </>
  );
}

/** 區域圖的扁長 viewBox：持續傷害區鋪在地上，用 160×40 畫扁橢圓，放大到 180px 寬時描邊仍約 1.4px。 */
const ZONE_VIEW = { width: 160, height: 40 } as const;
/** 區域橢圓：中心與半徑（viewBox 單位）。中心 y 也是戰場對齊地面線的基準。 */
const ZONE_RING = { cx: 80, cy: 25, rx: 74, ry: 12 } as const;
/** 區域描邊比召喚物細一點：放大 1.1 倍左右後和角色描邊同粗。 */
const ZONE_STROKE = 1.2;
/** 地面光圈填色不透明度：太高會在敵人名稱底下鋪一大片色塊。 */
const ZONE_FILL_OPACITY = 0.18;
/** 會轉動的刻紋圈：圓形刻紋放進壓扁的群組裡，CSS 旋轉時看起來是貼地的圈在轉。 */
const ZONE_SPIN = { radius: 54, squash: 0.17, ticks: 14, gapRatio: 0.45 } as const;

/** 刻紋圈：等距的短弧，旋轉時才看得出在轉。 */
function tickRing(radius: number, ticks: number, gapRatio: number): string {
  const step = (Math.PI * 2) / ticks;
  const sweep = step * (1 - gapRatio);
  return Array.from({ length: ticks }, (_, index) => {
    const a0 = index * step;
    const a1 = a0 + sweep;
    return `M${f(Math.cos(a0) * radius)} ${f(Math.sin(a0) * radius)}A${radius} ${radius} 0 0 1 ${f(Math.cos(a1) * radius)} ${f(Math.sin(a1) * radius)}`;
  }).join('');
}

/** 區域外觀：星陣（法師系）或餘燼（工匠傳說裝備的熔爐餘燼）。 */
export const ZONE_VARIANTS = ['star', 'ember'] as const;
export type ZoneVariant = (typeof ZONE_VARIANTS)[number];

/** 產生區域時的上限群組（content 的 capGroup）→ 區域外觀；未列出的一律是星陣。 */
const ZONE_VARIANT_BY_CAP_GROUP: Readonly<Record<string, ZoneVariant>> = { FORGE_EMBER: 'ember' };

/** 純函式：依區域的 capGroup 決定畫星陣或餘燼（給戰場的顯示資料使用）。 */
export function zoneVariantFor(capGroup: string | undefined): ZoneVariant {
  return (capGroup && ZONE_VARIANT_BY_CAP_GROUP[capGroup]) || 'star';
}

/**
 * 區域圖的寬高比與橢圓中心的高度比例（由上往下）。戰場把區域容器以
 * translate(-50%, -ZONE_GROUND_RATIO×100%) 對齊地面線，橢圓中心就會落在敵人腳下。
 */
export const ZONE_ART_ASPECT = ZONE_VIEW.width / ZONE_VIEW.height;
export const ZONE_GROUND_RATIO = ZONE_RING.cy / ZONE_VIEW.height;

/**
 * 召喚物與區域的美術尺寸與腳點（viewBox 單位）：戰場用 (height - shadowY) / width 算出
 * 「影子中心／陣心離圖底多遠」，把它對齊地面線。數值與上面的繪圖共用同一來源，改圖時不會脫節。
 */
export const UNIT_ART_FOOT = {
  unit: { width: UNIT_VIEW, height: UNIT_VIEW, shadowY: UNIT_SHADOW_Y },
  zone: { width: ZONE_VIEW.width, height: ZONE_VIEW.height, shadowY: ZONE_RING.cy },
} as const;

function SpinRing({ color }: { readonly color: string }) {
  return (
    <g transform={`translate(${ZONE_RING.cx} ${ZONE_RING.cy}) scale(1 ${ZONE_SPIN.squash})`}>
      <path
        data-zone-part="ring"
        d={tickRing(ZONE_SPIN.radius, ZONE_SPIN.ticks, ZONE_SPIN.gapRatio)}
        fill="none"
        stroke={color}
        strokeWidth={ZONE_STROKE}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

/** 星陣：紫色符文圈、中央五芒星、圈上四顆小星，星點只在地面光圈的高度內，不會飄到怪物血條上。 */
function StarZone() {
  const rune = UNIT_COLORS.rune;
  const { cx, cy, rx, ry } = ZONE_RING;
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={rune.base} fillOpacity={ZONE_FILL_OPACITY} stroke={rune.line} strokeWidth={ZONE_STROKE} />
      <SpinRing color={rune.line} />
      <path d={burstPath(cx, cy, 5, 2.1, 5)} fill={rune.spark} stroke={rune.line} strokeWidth={0.8} />
      <path data-zone-part="sparks" d={sparkPath([[cx - 50, cy, 2.2], [cx + 50, cy, 2.2], [cx - 28, cy - 14, 2.6], [cx + 30, cy - 16, 2], [cx + 8, cy - 20, 1.6]])} fill={rune.spark} stroke="none" />
    </>
  );
}

/** 餘燼：熔岩色的灼熱地面，放射狀發光裂紋，往上飄的火星（顏色取自赤爐火山的熔岩）。 */
function EmberZone() {
  const ember = UNIT_COLORS.ember;
  const { cx, cy, rx, ry } = ZONE_RING;
  const cracks = `M${cx} ${cy}L${cx - 16} ${cy - 4}L${cx - 32} ${cy - 2}M${cx} ${cy}L${cx + 18} ${cy + 4}L${cx + 34} ${cy + 2}M${cx} ${cy}L${cx - 6} ${cy + 7}L${cx - 22} ${cy + 8}M${cx} ${cy}L${cx + 10} ${cy - 7}L${cx + 26} ${cy - 8}M${cx - 32} ${cy - 2}L${cx - 44} ${cy + 3}M${cx + 34} ${cy + 2}L${cx + 46} ${cy - 3}`;
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={ember.base} fillOpacity={ZONE_FILL_OPACITY} stroke={ember.line} strokeWidth={ZONE_STROKE} />
      <ellipse data-zone-part="glow" cx={cx} cy={cy} rx={rx * 0.4} ry={ry * 0.45} fill={ember.core} opacity={0.3} stroke="none" />
      <SpinRing color={ember.line} />
      <path d={cracks} fill="none" stroke={ember.line} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <path d={cracks} fill="none" stroke={ember.core} strokeWidth={0.7} strokeLinecap="round" strokeLinejoin="round" />
      <path data-zone-part="sparks" d={sparkPath([[cx - 40, cy - 13, 2], [cx - 14, cy - 19, 1.6], [cx + 12, cy - 15, 2.2], [cx + 38, cy - 20, 1.6], [cx + 52, cy - 10, 1.8]])} fill={ember.spark} stroke="none" />
    </>
  );
}

const UNIT_DESIGNS: Readonly<Record<Exclude<UnitKind, 'zone'>, () => ReactNode>> = {
  beast: Beast,
  phantom: Phantom,
  decoy: Decoy,
  turret: Turret,
  mech: Mech,
};

export interface UnitArtProps extends ArtProps {
  readonly kind: UnitKind;
  /** 只對 kind="zone" 有效：星陣或餘燼；省略為星陣。 */
  readonly zoneVariant?: ZoneVariant;
}

export function UnitArt({ kind, zoneVariant = 'star', ...rest }: UnitArtProps) {
  if (kind === 'zone') {
    return (
      <Svg viewBox={`0 0 ${ZONE_VIEW.width} ${ZONE_VIEW.height}`} {...rest}>
        <g strokeLinejoin="round" strokeLinecap="round">{zoneVariant === 'ember' ? <EmberZone /> : <StarZone />}</g>
      </Svg>
    );
  }
  const Design = UNIT_DESIGNS[kind];
  return (
    <Svg viewBox={`0 0 ${UNIT_VIEW} ${UNIT_VIEW}`} {...rest}>
      <g stroke={INK} strokeWidth={UNIT_STROKE} strokeLinejoin="round" strokeLinecap="round">
        <Design />
      </g>
    </Svg>
  );
}

/** 召喚物的短暫特效：替身定時爆炸、砲台開火的砲口火光。 */
export const UNIT_FX_KINDS = ['blast', 'muzzle'] as const;
export type UnitFxKind = (typeof UNIT_FX_KINDS)[number];

/** 替身爆炸：橘黃八芒爆炸星（顏色同引信火花），中心亮核加四顆碎片。 */
function BlastFx() {
  return (
    <>
      <path d={burstPath(20, 20, 17, 8.4, 8, Math.PI / 8)} fill={UNIT_COLORS.fuseSpark} />
      <path d={burstPath(20, 20, 9.6, 5, 8)} fill={UNIT_COLORS.sparkCore} strokeWidth={1} />
      <path d="M4 8.6h0M35.6 7.4h0M5.4 33.2h0M35 32.4h0" fill="none" stroke={UNIT_COLORS.bomb.base} strokeWidth={2.6} />
    </>
  );
}

/** 砲口火光：左端貼砲口，往右張開成三道火舌。 */
function MuzzleFx() {
  return (
    <>
      <path d="M4 20L14 11.6L16.4 16L30 8.6L24.6 18L37 20L24.6 22L30 31.4L16.4 24L14 28.4Z" fill={UNIT_COLORS.fuseSpark} />
      <path d="M6.4 20L15.6 15.6L26 20L15.6 24.4Z" fill={UNIT_COLORS.sparkCore} stroke="none" />
    </>
  );
}

const UNIT_FX_DESIGNS: Readonly<Record<UnitFxKind, () => ReactNode>> = { blast: BlastFx, muzzle: MuzzleFx };

/** 召喚物特效圖（viewBox 0 0 40 40）：給戰場在替身結算、砲台開火時短暫顯示，裝飾用。 */
export function UnitFxArt({ effect, ...rest }: ArtProps & { readonly effect: UnitFxKind }) {
  const Design = UNIT_FX_DESIGNS[effect];
  return (
    <Svg viewBox={`0 0 ${UNIT_VIEW} ${UNIT_VIEW}`} {...rest}>
      <g stroke={INK} strokeWidth={UNIT_STROKE} strokeLinejoin="round" strokeLinecap="round">
        <Design />
      </g>
    </Svg>
  );
}
