import { ACCENT, CLOTH_WHITE, FAMILY_TONES, GLOW, HAIR, LEATHER, LINE, METAL, type Tone } from '../palette.ts';
import { Aura, Held, InkedLine, Sparkles } from '../props.tsx';
import { BACK_HAND, FRONT_HAND, type HeroDesign, type Point } from '../rig.tsx';
import { circlesPath, ellipsePath, pointText, rotatePoint, tiltedEllipsePath } from '../shapes.ts';
import type { HeroStage } from '../stage.ts';

/**
 * 祭司系：頭頂光環＋米白長袍＋金飾。
 * A 線（聖詠祭司→審判主教）：攤開的聖典與詠唱音符，三轉戴主教冠、背後日輪光環、金封面聖典。
 * B 線（武僧→修羅武聖）：短打功夫服、纏布拳套、念珠，三轉拳頭燃起火焰、光環變成輪狀。
 */

const STOLE_BLUE: Tone = { base: '#4f86c9', shade: '#3a679f', light: '#86b4e6' };
const STOLE_RED: Tone = { base: '#b8383d', shade: '#8a262b', light: '#e0676a' };

function Halo({ y = 8.6, rx = 8.4 }: { y?: number; rx?: number }) {
  return <InkedLine d={ellipsePath(32.6, y, rx, 2.5)} color={GLOW.holy} width={2} />;
}

/** 把同一個尖角以 center 為軸複製到各角度，串成一條路徑（射線 8 條、尖刺 6 條都只佔一個元素）。 */
function radialCopies(points: readonly Point[], center: Point, degrees: readonly number[], toPath: (rotated: readonly string[]) => string): string {
  return degrees.map((deg) => toPath(points.map((point) => pointText(rotatePoint(point, center, deg))))).join('');
}

const SUN_CENTER: Point = { x: 32, y: 21 };
const SUN_RAY_DEGREES = [0, 45, 90, 135, 180, 225, 270, 315] as const;
const SUN_RAYS = radialCopies(
  [{ x: 30, y: 7.6 }, { x: 32, y: 1.6 }, { x: 34, y: 7.6 }],
  SUN_CENTER,
  SUN_RAY_DEGREES,
  ([a, b, c]) => `M${a}L${b}L${c}Z`,
);

/** 日輪光環放在頭後：主教冠擋住頭頂，光環改成背景圓盤才看得到。 */
function SunHalo() {
  return (
    <>
      <path d={SUN_RAYS} fill={METAL.gold.base} strokeWidth={LINE.part} />
      <InkedLine d={ellipsePath(SUN_CENTER.x, SUN_CENTER.y, 14.2, 14.2)} color={GLOW.holy} width={2.2} />
    </>
  );
}

const WHEEL_CENTER: Point = { x: 32, y: 22 };
const WHEEL_SPIKE_DEGREES = [0, 60, 120, 180, 240, 300] as const;
const WHEEL_SPIKES = radialCopies(
  [{ x: 30, y: 6.2 }, { x: 32, y: 0.8 }, { x: 34, y: 6.2 }],
  WHEEL_CENTER,
  WHEEL_SPIKE_DEGREES,
  ([a, control, b]) => `M${a}Q${control} ${b}Z`,
);

function WheelHalo() {
  return (
    <>
      <path d={WHEEL_SPIKES} fill={ACCENT.fire} strokeWidth={LINE.part} />
      <InkedLine d={ellipsePath(WHEEL_CENTER.x, WHEEL_CENTER.y, 15, 15)} color={ACCENT.fireLight} width={2.2} />
    </>
  );
}

function Mitre() {
  return (
    <>
      <path d="M22.4 19.6Q21 9.6 27.6 4.4L32 8.4L36.4 4.4Q43 9.6 41.6 19.6Q32 16.8 22.4 19.6Z" fill={CLOTH_WHITE.base} />
      <path d="M22.4 19.6Q21 9.6 27.6 4.4L29.6 6.2Q25.6 11.4 27 18.4Q24.4 18.8 22.4 19.6Z" fill={CLOTH_WHITE.shade} stroke="none" />
      <path d="M22.6 18.4Q32 15.4 41.4 18.4" fill="none" stroke={METAL.gold.base} strokeWidth="2.6" />
      <path d="M32 9V16" stroke={STOLE_RED.base} strokeWidth="2.4" />
      <circle cx="32" cy="11.6" r="2" fill={METAL.gold.base} strokeWidth={LINE.part} />
    </>
  );
}

function Stole({ tone }: { tone: Tone }) {
  return (
    <>
      <path d="M34.6 40.2L35.8 70.4H40.6L38.8 40.2Z" fill={tone.base} strokeWidth={LINE.part} />
      <path d="M35.6 66.4H40.4" stroke={METAL.gold.base} strokeWidth={LINE.part} />
    </>
  );
}

function SunScepter() {
  return (
    <>
      <InkedLine d="M0 -14V8" color={METAL.gold.base} width={2} />
      <circle cx="0" cy="-18" r="4.4" fill={METAL.gold.base} />
      <circle cx="0" cy="-18" r="2" fill={GLOW.holy} strokeWidth={LINE.detail} />
    </>
  );
}

/** 聖典向右攤開：右頁朝主光所以最亮，左頁次之。 */
function OpenTome({ grand }: { grand: boolean }) {
  const cover = grand ? METAL.gold : STOLE_RED;
  return (
    <>
      <path d="M39.6 46.6L47 49L54.4 46.6V56.4L47 58.8L39.6 56.4Z" fill={cover.base} />
      <path d="M40.8 45.6L47 47.8V56.6L40.8 54.6Z" fill={CLOTH_WHITE.base} strokeWidth={LINE.part} />
      <path d="M53.2 45.6L47 47.8V56.6L53.2 54.6Z" fill={CLOTH_WHITE.light} strokeWidth={LINE.part} />
      <path d="M42.4 49.4L45.4 50.4M42.4 52L45.4 53M48.6 50.4L51.6 49.4" fill="none" stroke={CLOTH_WHITE.shade} strokeWidth={LINE.detail} />
      {grand ? <circle cx="47" cy="58" r="1.6" fill={STOLE_RED.base} strokeWidth={LINE.detail} /> : null}
    </>
  );
}

/** 詠唱音符：音符頭、符桿與符尾合成一條路徑，以路徑畫出，不使用文字。 */
function ChantNote({ x, y }: { x: number; y: number }) {
  const head = tiltedEllipsePath(x, y, 1.9, 1.4, -20);
  const stem = `M${x + 1.2} ${y - 0.2}V${y - 6.6}L${x + 4.6} ${y - 5.2}V${y - 4}L${x + 2} ${y - 4.9}V${y - 0.2}Z`;
  return <path d={head + stem} fill={GLOW.holy} strokeWidth={LINE.feature} />;
}

/** 纏布拳套刻意畫得比手大一圈，武僧不拿武器也能一眼看出「用拳」。 */
function WrappedFist({ x, y, flame }: { x: number; y: number; flame: boolean }) {
  return (
    <>
      {flame ? (
        <path
          d={`M${x + 4.6} ${y + 4}Q${x - 10} ${y + 5} ${x - 8.6} ${y - 9.6}Q${x - 4.4} ${y - 4.6} ${x - 1.4} ${y - 9.4}Q${x + 2} ${y - 3.6} ${x + 5.4} ${y - 7}Q${x + 9} ${y - 1} ${x + 4.6} ${y + 4}Z`}
          fill={ACCENT.fire}
        />
      ) : null}
      {flame ? <path d={`M${x + 2} ${y + 2}Q${x - 6} ${y + 2} ${x - 5} ${y - 5.4}Q${x - 1} ${y - 2} ${x + 3.6} ${y - 3}Z`} fill={ACCENT.fireLight} stroke="none" /> : null}
      <rect x={x - 4.2} y={y - 3.8} width="8.4" height="7.6" rx="2.8" fill={CLOTH_WHITE.base} />
      <path d={`M${x - 4} ${y - 0.6}H${x + 4}M${x - 1.2} ${y - 3.6}V${y + 3.6}`} fill="none" stroke={CLOTH_WHITE.shade} strokeWidth={LINE.detail} />
    </>
  );
}

const BEADS = {
  small: { spots: [{ x: 26, y: 43.2 }, { x: 29.2, y: 45.4 }, { x: 32.8, y: 45.8 }, { x: 36.2, y: 44.4 }, { x: 38.8, y: 42 }], r: 1.6 },
  large: { spots: [{ x: 24.6, y: 42.4 }, { x: 27.2, y: 45 }, { x: 30.4, y: 46.6 }, { x: 33.8, y: 46.8 }, { x: 37, y: 45.4 }, { x: 39.6, y: 42.8 }], r: 1.9 },
} as const;

/** 念珠合成一條路徑；珠子小又密，用細節線寬，胸口才不會變成一圈黑。 */
function PrayerBeads({ large }: { large: boolean }) {
  const beads = large ? BEADS.large : BEADS.small;
  return (
    <>
      <path d={circlesPath(beads.spots.map(({ x, y }) => ({ cx: x, cy: y, r: beads.r })))} fill={ACCENT.bead} strokeWidth={LINE.detail} />
      {large ? <circle cx="32.2" cy="50.4" r="2.4" fill={METAL.gold.base} strokeWidth={LINE.part} /> : null}
    </>
  );
}

export function priestDesign({ tier, branch, uid }: HeroStage): HeroDesign {
  if (tier === 1) {
    return {
      outfit: { top: FAMILY_TONES.priest, legs: '#5a4a3a', boots: LEATHER, belt: null, hair: HAIR.blonde },
      cut: 'robe',
      hair: 'short',
      mood: 'calm',
      frontHand: 'grip',
      backHand: 'low',
      torsoOver: <Stole tone={STOLE_BLUE} />,
      headOver: <Halo />,
      handItem: (
        <Held at={FRONT_HAND.grip} angle={10}>
          <SunScepter />
        </Held>
      ),
    };
  }
  const grand = tier === 3;
  if (branch === 'A') {
    return {
      outfit: { top: FAMILY_TONES.priestA, legs: '#5a4a3a', boots: METAL.gold, belt: null, hair: HAIR.blonde },
      cut: 'robe',
      hair: 'long',
      // 聖詠祭司保留閉眼詠唱；審判主教在戰鬥中改成半睜眼，看起來是醒著在審判。
      mood: grand ? 'serene' : 'calm',
      frontHand: 'chest',
      backHand: 'low',
      aura: grand ? <Aura id={`${uid}-aura`} color={GLOW.holy} /> : undefined,
      behind: grand ? <SunHalo /> : undefined,
      torsoOver: (
        <>
          <Stole tone={grand ? STOLE_RED : STOLE_BLUE} />
          <path d="M20.8 66.8H43.6" stroke={METAL.gold.base} strokeWidth={LINE.silhouette} />
          {grand ? <path d="M23.4 41.2L26 52L28.8 41" fill="none" stroke={METAL.gold.base} strokeWidth={LINE.part} /> : null}
        </>
      ),
      headOver: grand ? <Mitre /> : <Halo />,
      front: (
        <>
          <OpenTome grand={grand} />
          <ChantNote x={55} y={38} />
          {grand ? (
            <>
              <ChantNote x={9} y={46} />
              <Sparkles spots={[{ x: 57, y: 60, size: 3.4 }]} color={GLOW.holy} />
            </>
          ) : null}
        </>
      ),
    };
  }
  const gi = grand ? { base: '#d0592e', shade: '#a2401f', light: '#f08a5a' } : FAMILY_TONES.priestB;
  return {
    outfit: { top: gi, legs: '#4a3428', boots: CLOTH_WHITE, belt: '#2f2a3a', hair: HAIR.ink },
    cut: 'tunic',
    hair: 'bun',
    mood: grand ? 'fierce' : 'focus',
    frontHand: 'reach',
    backHand: 'hip',
    aura: grand ? <Aura id={`${uid}-aura`} color={GLOW.ember} /> : undefined,
    behind: grand ? <WheelHalo /> : undefined,
    torsoOver: (
      <>
        <path d="M24.6 40.4L32 50L39.4 40.4" fill="none" stroke={gi.shade} strokeWidth={LINE.part} />
        <PrayerBeads large={grand} />
        {grand ? <path d="M22.4 55.4L16.6 64.4L20.6 65L24.6 56.4Z" fill="#2f2a3a" strokeWidth={LINE.part} /> : null}
      </>
    ),
    headOver: grand ? undefined : <Halo y={9.6} rx={7.2} />,
    front: (
      <>
        <WrappedFist x={FRONT_HAND.reach.x + 1} y={FRONT_HAND.reach.y} flame={grand} />
        <WrappedFist x={BACK_HAND.hip.x - 0.4} y={BACK_HAND.hip.y} flame={false} />
        {grand ? <Sparkles spots={[{ x: 56, y: 30, size: 3.4 }]} color={GLOW.ember} /> : null}
      </>
    ),
  };
}
