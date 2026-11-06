import { ACCENT, FAMILY_TONES, GLOW, HAIR, INK, LEATHER, LINE, METAL, SKIN, WOOD, type Tone } from '../palette.ts';
import { Aura, Held, InkedLine, Pauldron, Sparkles } from '../props.tsx';
import { FRONT_HAND, type HeroDesign } from '../rig.tsx';
import { circlesPath, gearPath } from '../shapes.ts';
import type { HeroStage } from '../stage.ts';

/**
 * 工匠系：額上護目鏡＋皮圍裙＋工具＋厚皮手套。
 * A 線（戰鎚鐵匠→熔爐神匠）：捲袖露臂、雙手大鎚，三轉鎚頭熔紅、火星四濺。
 * B 線（機械師→機械統帥）：工作帽、大扳手與背後齒輪，三轉多齒輪背包與浮游小機器人。
 */

function Gear({ cx, cy, r, teeth, tone }: { cx: number; cy: number; r: number; teeth: number; tone: Tone }) {
  return (
    <>
      <path d={gearPath(cx, cy, r, r * 0.76, teeth)} fill={tone.base} />
      <circle cx={cx} cy={cy} r={r * 0.32} fill={tone.shade} strokeWidth={LINE.part} />
    </>
  );
}

function Goggles({ glow }: { glow: boolean }) {
  const lens = glow ? GLOW.mech : ACCENT.lens;
  return (
    <>
      <InkedLine d="M19 27.4Q31 16.6 46.6 21.6" color={LEATHER.shade} width={1.6} />
      <circle cx="35.6" cy="20.6" r="3.2" fill={METAL.brass.base} strokeWidth={LINE.part} />
      <circle cx="35.6" cy="20.6" r="1.8" fill={lens} strokeWidth={LINE.detail} />
      <circle cx="42.4" cy="20.8" r="2.8" fill={METAL.brass.base} strokeWidth={LINE.part} />
      <circle cx="42.4" cy="20.8" r="1.5" fill={lens} strokeWidth={LINE.detail} />
    </>
  );
}

function WorkCap({ tone }: { tone: Tone }) {
  return (
    <>
      <path d="M17.8 30C16.6 18.4 23.6 11.8 32.4 11.8C40 11.8 45 15.8 46.2 21L52.2 22.6Q52.8 24.4 50.8 24.8L44.8 24.6Q31.6 20.4 19.8 31Z" fill={tone.base} />
      <path d="M17.8 30C16.6 21 20.6 15 26.4 12.6Q21.4 19.6 21.8 29.2Z" fill={tone.shade} stroke="none" />
      <path d="M26.6 15Q31.4 13.2 36.6 13.8" fill="none" stroke={tone.light} strokeWidth={LINE.detail} />
    </>
  );
}

const APRON_RIVETS = circlesPath([
  { cx: 28.8, cy: 45.6, r: 1 },
  { cx: 37.2, cy: 45.6, r: 1 },
]);

function Apron({ rivets }: { rivets: boolean }) {
  return (
    <>
      <path d="M27.6 44H38.4L39.6 52.2L42.6 64.6Q42.8 66.2 41.2 66.2H26.6Q25 66.2 25.2 64.6L27 52.2Z" fill={LEATHER.base} strokeWidth={LINE.part} />
      <path d="M27.6 44H31L30.4 66.2H26.6Q25 66.2 25.2 64.6L27 52.2Z" fill={LEATHER.shade} stroke="none" />
      <rect x="31" y="56" width="6" height="4.4" rx="1" fill={LEATHER.light} strokeWidth={LINE.detail} />
      {rivets ? <path d={APRON_RIVETS} fill={METAL.gold.base} strokeWidth={LINE.detail} /> : null}
    </>
  );
}

/** 鎚頭的打擊面朝前（+x）迎著主光，所以暗面放在 -x 的後段，高光線在前段上緣。 */
function Hammer({ size, molten }: { size: 'small' | 'war'; molten: boolean }) {
  const war = size === 'war';
  const head = war ? { x: -7, y: -30, w: 14, h: 9.4 } : { x: -4.6, y: -17.6, w: 9.2, h: 5.6 };
  const top = war ? -21 : -12.4;
  return (
    <>
      <InkedLine d={`M0 ${top}V${war ? 7 : 5}`} color={WOOD.base} width={war ? 2.8 : 2.2} />
      <rect x={head.x} y={head.y} width={head.w} height={head.h} rx="1.6" fill={molten ? ACCENT.fire : METAL.iron.base} />
      <rect x={head.x} y={head.y} width={head.w * 0.38} height={head.h} rx="1.4" fill={molten ? '#c2461e' : METAL.iron.shade} stroke="none" />
      {molten ? (
        <path d={`M${head.x + 5.6} ${head.y + 2.4}L${head.x + 8.6} ${head.y + 5}L${head.x + 7.2} ${head.y + 7.4}M${head.x + 11} ${head.y + 2}L${head.x + 9.8} ${head.y + 4.6}`} fill="none" stroke={ACCENT.fireLight} strokeWidth={LINE.feature} />
      ) : (
        <path d={`M${head.x + head.w * 0.5} ${head.y + 1.8}H${head.x + head.w - 1.6}`} stroke={METAL.iron.light} strokeWidth={LINE.detail} />
      )}
      {war ? <rect x="-2.2" y="-21.4" width="4.4" height="3" rx="0.8" fill={METAL.brass.base} strokeWidth={LINE.part} /> : null}
    </>
  );
}

function Wrench({ big }: { big: boolean }) {
  const s = big ? 1.25 : 1;
  return (
    <g transform={`scale(${s})`}>
      <path d="M0 -13V5" stroke={INK} strokeWidth={(3 + LINE.silhouette) / s} />
      <path d="M0 -13V5" stroke={METAL.steel.base} strokeWidth={3 / s} />
      <path d="M-4.8 -14.6Q-5.4 -21 -1.6 -22.6L-1.3 -18.4H1.3L1.6 -22.6Q5.4 -21 4.8 -14.6Q0 -12.2 -4.8 -14.6Z" fill={METAL.steel.base} strokeWidth={LINE.silhouette / s} />
      <path d="M-2 -14Q-4 -15 -4.2 -17.4" fill="none" stroke={METAL.steel.shade} strokeWidth={LINE.detail / s} />
    </g>
  );
}

/** 浮游小機器人：機械統帥的「部下」，以簡單幾何組成。 */
function Drone() {
  return (
    <>
      <path d="M56 6.4V3.6M51.8 3H60.2" fill="none" strokeWidth={LINE.part} />
      <circle cx="56" cy="10.6" r="4.4" fill={METAL.steel.base} />
      <path d="M51.8 11.8Q56 16 60.2 11.8A4.4 4.4 0 0 1 51.8 11.8Z" fill={METAL.steel.shade} stroke="none" />
      <circle cx="57" cy="10" r="1.7" fill={GLOW.mech} strokeWidth={LINE.detail} />
    </>
  );
}

/** 火星：兩顆閃光＋兩顆小火點，各自合成一條路徑。 */
const EMBER_DOTS = circlesPath([
  { cx: 54, cy: 8, r: 1.1 },
  { cx: 12, cy: 32, r: 1 },
]);

function Embers() {
  return (
    <>
      <Sparkles spots={[{ x: 58, y: 14, size: 3.6 }, { x: 9, y: 44, size: 3.2 }]} color={GLOW.ember} />
      <path d={EMBER_DOTS} fill={ACCENT.fireLight} stroke="none" />
    </>
  );
}

/**
 * 工匠系的厚皮手套：用皮革暗色，和木頭鎚柄、鋼扳手都分得開。
 * 光源一致：前手亮、後手暗，所以前手用皮革暗色當底、後手再暗一階。
 */
const WORK_GLOVE: Tone = { base: LEATHER.shade, shade: '#58341a', light: LEATHER.base };

export function artisanDesign({ tier, branch, uid }: HeroStage): HeroDesign {
  if (tier === 1) {
    return {
      outfit: { top: FAMILY_TONES.artisan, legs: '#4a3a2e', boots: LEATHER, belt: null, hair: HAIR.auburn, gloves: WORK_GLOVE },
      cut: 'tunic',
      hair: 'short',
      mood: 'smile',
      frontHand: 'raise',
      backHand: 'low',
      coversCrown: true,
      torsoOver: <Apron rivets={false} />,
      headOver: (
        <>
          <WorkCap tone={LEATHER} />
          <Goggles glow={false} />
        </>
      ),
      handItem: (
        <Held at={FRONT_HAND.raise} angle={20}>
          <Hammer size="small" molten={false} />
        </Held>
      ),
    };
  }
  const grand = tier === 3;
  if (branch === 'A') {
    return {
      // 捲袖露臂、戴厚皮手套：鐵匠的「光臂＋手套」比整條袖子更有打鐵感。
      outfit: { top: FAMILY_TONES.artisanA, sleeve: SKIN, legs: '#3a2a22', boots: METAL.iron, belt: null, hair: HAIR.auburn, gloves: WORK_GLOVE },
      cut: 'tunic',
      hair: 'swept',
      mood: grand ? 'fierce' : 'focus',
      frontHand: 'grip',
      backHand: 'low',
      aura: grand ? <Aura id={`${uid}-aura`} color={GLOW.ember} /> : undefined,
      torsoOver: <Apron rivets={grand} />,
      headOver: (
        <>
          <InkedLine d="M18.6 28.6Q31 18 46.8 23.2" color={grand ? ACCENT.fire : '#3a2a22'} width={2.4} />
          <Goggles glow={false} />
        </>
      ),
      handItem: (
        <Held at={FRONT_HAND.grip} angle={16}>
          <Hammer size="war" molten={grand} />
        </Held>
      ),
      front: grand ? (
        <>
          <Pauldron tone={METAL.iron} />
          <Embers />
        </>
      ) : undefined,
    };
  }
  return {
    outfit: { top: FAMILY_TONES.artisanB, legs: '#2e3a48', boots: LEATHER, belt: LEATHER.shade, hair: HAIR.auburn, gloves: WORK_GLOVE },
    cut: 'tunic',
    hair: 'short',
    mood: 'smile',
    frontHand: 'grip',
    backHand: 'low',
    coversCrown: true,
    aura: grand ? <Aura id={`${uid}-aura`} color={GLOW.mech} /> : undefined,
    behind: grand ? (
      <>
        <rect x="14.6" y="41" width="12" height="16" rx="3" fill={METAL.iron.base} />
        <Gear cx={15.4} cy={40.6} r={6.4} teeth={8} tone={METAL.brass} />
        <Gear cx={12.4} cy={53.4} r={4.6} teeth={7} tone={METAL.steel} />
        <path d="M22 41V33.6" fill="none" strokeWidth={LINE.part} />
        <circle cx="22" cy="32.6" r="1.6" fill={GLOW.mech} strokeWidth={LINE.part} />
      </>
    ) : (
      <Gear cx={16} cy={43.4} r={6} teeth={8} tone={METAL.brass} />
    ),
    torsoOver: (
      <>
        <path d="M26.4 41.2V52.4M37.6 41.2V52.4" stroke={FAMILY_TONES.artisanB.shade} strokeWidth="2.2" />
        <rect x="28.6" y="45.6" width="6.8" height="5" rx="1.2" fill={FAMILY_TONES.artisanB.light} strokeWidth={LINE.part} />
      </>
    ),
    headOver: (
      <>
        <WorkCap tone={{ base: '#e0a63a', shade: '#b07a22', light: '#f6cf7a' }} />
        <Goggles glow={grand} />
      </>
    ),
    handItem: (
      <Held at={FRONT_HAND.grip} angle={18}>
        <Wrench big={grand} />
      </Held>
    ),
    front: grand ? (
      <>
        <Drone />
        <Sparkles spots={[{ x: 9, y: 64, size: 3.4 }]} color={GLOW.mech} />
      </>
    ) : undefined,
  };
}
