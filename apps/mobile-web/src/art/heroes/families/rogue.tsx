import { ACCENT, EYE_SHINE, FAMILY_TONES, GLOVE, GLOW, HAIR, INK, LEATHER, LINE, METAL, SKIN, type Tone } from '../palette.ts';
import { Aura, Held, Sparkles, Strap } from '../props.tsx';
import { BACK_HAND, FRONT_HAND, type HeroDesign } from '../rig.tsx';
import { circlesPath, ellipsePath } from '../shapes.ts';
import type { HeroStage } from '../stage.ts';

/**
 * 盜賊系：頭巾＋雙短刀＋深色皮手套。
 * 一轉與 A 線（影刃刺客→影舞者）戴蒙面俠眼罩：彎月暗影刃與身後飄帶，三轉飄帶加長並帶紫色刀光。
 * B 線（毒刃獵手→劇毒使徒）改戴下半臉蒙面巾、露出眼睛：二轉垂手反握毒刃、後手藏小毒瓶，
 * 剪影是「垂手潛行」而不是一轉的「雙手舉刀」；三轉改為胸前毒瓶彈帶、前手高舉毒瓶、綠色眼神光與毒泡。
 */

type BladeKind = 'dagger' | 'shadow' | 'venom';

/** 直刃的暗面在 -x（背光側）；毒刃的同一半改塗成毒液色。 */
function Blade({ kind }: { kind: BladeKind }) {
  const curved = kind === 'shadow';
  return (
    <>
      {curved ? (
        <path d="M-2 -2.6C-3.8 -8.4 -2 -14.6 4.8 -19.2C2.4 -13.4 3.2 -7.6 2 -2.6Z" fill="#6f58a8" />
      ) : (
        <path d="M-1.8 -2.6V-13.4L0 -17L1.8 -13.4V-2.6Z" fill={METAL.steel.base} />
      )}
      {curved ? (
        <path d="M1.2 -4.4C1.8 -9 1.8 -13 3.6 -16.6" fill="none" stroke={GLOW.shadow} strokeWidth={LINE.feature} />
      ) : (
        <path d="M0 -15.4V-3H-1.8V-13.4Z" fill={kind === 'venom' ? ACCENT.venom : METAL.steel.shade} stroke="none" />
      )}
      <rect x="-3.4" y="-3.6" width="6.8" height="1.9" rx="0.8" fill={kind === 'venom' ? ACCENT.venomShade : METAL.iron.base} strokeWidth={LINE.part} />
      <rect x="-1" y="-1.6" width="2" height="4.6" rx="0.8" fill={LEATHER.shade} strokeWidth={LINE.part} />
    </>
  );
}

function Bandana({ tone }: { tone: Tone }) {
  return (
    <>
      <path d="M19.4 25L10 21.6L11 25.8Z" fill={tone.shade} />
      <path d="M19.6 27.2L11.2 32L14 33.6Z" fill={tone.shade} />
      <path d="M17.8 30C16.4 18.4 23.6 11.8 32.4 11.8C41.4 11.8 46.8 17.4 46.6 23.4Q31.6 19.4 19.8 31Z" fill={tone.base} />
      <path d="M17.8 30C16.6 21 20.6 15 26.4 12.8Q21.4 19.6 21.8 29.2Z" fill={tone.shade} stroke="none" />
      <circle cx="19.4" cy="26.2" r="2" fill={tone.base} strokeWidth={LINE.part} />
      <path d="M27 15Q31.6 13.2 36.6 13.8" fill="none" stroke={tone.light} strokeWidth={LINE.detail} />
    </>
  );
}

/**
 * 蒙面俠眼罩：上緣往外上挑出尖角、下緣在鼻樑處收窄成蝴蝶形，一眼就是「眼罩」而不是鏡框。
 * 眼洞做成外眼角上挑的杏仁形（不是圓形），瞳孔和一般角色一樣是直橢圓＋反光，
 * 超出眼洞的部分落在同色的眼罩上自然被吃掉，Q 版表情才不會縮成小黑點或變成一副圓眼鏡。
 * 眼洞預設透出膚色：白色眼洞在 38–48px 會被看成護目鏡（與工匠撞型）；三轉才換成發光色。
 */
const MASK_SHAPE =
  'M30.8 28.6Q32.4 25.4 38.4 25.4Q43.4 24.4 47.4 24.4L46 29.2Q45.4 32.8 42.4 32.6Q40.2 32.4 39.2 30.8Q38 33 35.2 33Q32.2 32.8 31.6 30.6Z';
const MASK_HOLES = 'M33.6 28.2Q36 26 38.6 29.8Q36.4 32.4 33.6 28.2Z' + 'M40 29.8Q42.4 26.2 44.6 27.8Q43 32.2 40 29.8Z';
const MASK_PUPILS = ellipsePath(36.5, 29.5, 1.4, 1.9) + ellipsePath(42.3, 29.3, 1.25, 1.75);
const MASK_SHINE = circlesPath([
  { cx: 37.05, cy: 28.75, r: 0.55 },
  { cx: 42.75, cy: 28.6, r: 0.5 },
]);

function DominoMask({ glow }: { glow?: string }) {
  return (
    <>
      <path d={MASK_SHAPE} fill={INK} strokeWidth={LINE.part} />
      <path d={MASK_HOLES} fill={glow ?? SKIN.base} stroke="none" />
      <path d={MASK_PUPILS} fill={INK} stroke="none" />
      <path d={MASK_SHINE} fill={EYE_SHINE} stroke="none" />
    </>
  );
}

/** 毒刃線的布料色：頭巾與蒙面巾同一塊布。 */
const VENOM_CLOTH: Tone = { base: '#3f6a34', shade: '#2c4c24', light: '#6a9a5a' };

/**
 * 下半臉蒙面巾（覆蓋鼻樑以下到下巴）：毒刃線不戴眼罩、露出正常眼睛，
 * 和刺客線在臉部就分得開；鼻樑處微微凸出臉緣，看得出是布而不是陰影。
 */
function FaceWrap() {
  return (
    <>
      <path d="M24.6 32.6Q32 33.6 40.6 30.8L45.8 31.2Q45.6 34.4 41.6 38.4Q37.4 41.4 32 40.8Q27.4 40.4 24.8 37.4Z" fill={VENOM_CLOTH.shade} strokeWidth={LINE.part} />
      <path d="M27.2 36.2Q34 37.6 42.4 34.6" fill="none" stroke={VENOM_CLOTH.light} strokeWidth={LINE.detail} />
    </>
  );
}

/** 劇毒使徒的綠色眼神光：兩眼反光改成毒綠色，前眼再拖出一道往外的光尾。 */
const VENOM_EYE_GLINT =
  circlesPath([
    { cx: 36.5, cy: 28.6, r: 0.8 },
    { cx: 42.05, cy: 28.6, r: 0.75 },
  ]) + 'M43 28.2L47.6 26.4L43.4 29.2Z';

const SCARF_VIOLET = '#9a80d4';

/** 飄帶畫在後手之上，奔跑感才不會被手臂擋掉。 */
function FlowingScarf({ long }: { long: boolean }) {
  return (
    <>
      <path d={long ? 'M25 37.6C17.6 36 10.4 30.4 2.6 31.6C8.4 36.6 15.4 41.4 25 41.2Z' : 'M25 37.8C19 37.2 13.4 34.2 7.6 35.2C11.6 38.8 17.4 41.6 25 41.2Z'} fill={SCARF_VIOLET} />
      {long ? <path d="M24.6 40C18 42.6 11.4 42.6 4.6 47.4C12.2 48.6 19 46.4 25.6 43Z" fill={FAMILY_TONES.rogueA.light} /> : null}
    </>
  );
}

interface VialSpot {
  readonly x: number;
  readonly y: number;
}

/** 一排毒瓶合併成瓶頸／瓶身／高光三條路徑，不論幾瓶都只佔三個元素；瓶子小，用細節線寬才不會糊成黑團。 */
function Vials({ spots, r }: { spots: readonly VialSpot[]; r: number }) {
  const necks = spots.map(({ x, y }) => `M${x - 0.9} ${y - r - 2}h1.8v2.4h-1.8Z`).join('');
  return (
    <>
      <path d={necks} fill={ACCENT.vial} strokeWidth={LINE.detail} />
      <path d={circlesPath(spots.map(({ x, y }) => ({ cx: x, cy: y, r })))} fill={ACCENT.venom} strokeWidth={LINE.detail} />
      <path d={circlesPath(spots.map(({ x, y }) => ({ cx: x + r * 0.35, cy: y - r * 0.3, r: r * 0.3 })))} fill={ACCENT.vial} stroke="none" />
    </>
  );
}

/** 毒瓶以握點為底；scale 縮小時線寬反向放大，外框粗細維持一致。 */
function PoisonFlask({ scale = 1 }: { scale?: number }) {
  const line = LINE.part / scale;
  const flask = (
    <>
      <rect x="-1.6" y="-11.4" width="3.2" height="2.4" rx="0.8" fill={LEATHER.base} strokeWidth={line} />
      <rect x="-1.4" y="-9.4" width="2.8" height="3.4" fill={ACCENT.vial} strokeWidth={line} />
      <circle cx="0" cy="-2.8" r="4.4" fill={ACCENT.venom} strokeWidth={LINE.silhouette / scale} />
      <path d="M-4.2 -2Q0 -0.4 4.2 -2A4.4 4.4 0 0 1 -4.2 -2Z" fill={ACCENT.venomShade} stroke="none" />
      <circle cx="1.6" cy="-4.4" r="1.1" fill={ACCENT.vial} stroke="none" />
    </>
  );
  // 原尺寸時不包群組，省一個元素。
  return scale === 1 ? flask : <g transform={`scale(${scale})`}>{flask}</g>;
}

function Bubbles() {
  return (
    <path
      d={circlesPath([
        { cx: 55.6, cy: 33.4, r: 1.8 },
        { cx: 58.8, cy: 28, r: 1.2 },
        { cx: 10.6, cy: 56, r: 1.5 },
      ])}
      fill={ACCENT.venom}
      strokeWidth={LINE.part}
    />
  );
}

/** 影舞者的刀光：兩道實心彎月合成一條路徑（避免左右兩道弧被看成弓）。 */
const SHADOW_SLASHES = 'M49.4 26.6Q63 32.4 58.4 49.6Q59 37.4 49.4 26.6ZM12.6 58.6Q3.6 52 6.8 40.4Q7.4 51 12.6 58.6Z';

export function rogueDesign({ tier, branch, uid }: HeroStage): HeroDesign {
  if (tier === 1) {
    return {
      outfit: { top: FAMILY_TONES.rogue, legs: '#2f2c38', boots: LEATHER, belt: LEATHER.shade, hair: HAIR.ink, gloves: GLOVE.rogue },
      cut: 'tunic',
      hair: 'swept',
      mood: 'sly',
      frontHand: 'grip',
      backHand: 'raise',
      coversCrown: true,
      backItem: (
        <Held at={BACK_HAND.raise} angle={-38}>
          <Blade kind="dagger" />
        </Held>
      ),
      torsoOver: <rect x="36" y="55.4" width="4.6" height="4" rx="1.2" fill={LEATHER.base} strokeWidth={LINE.part} />,
      faceOver: <DominoMask />,
      headOver: <Bandana tone={{ base: '#8a3b4f', shade: '#64283a', light: '#b8607a' }} />,
      handItem: (
        <Held at={FRONT_HAND.grip} angle={58}>
          <Blade kind="dagger" />
        </Held>
      ),
    };
  }
  const grand = tier === 3;
  if (branch === 'A') {
    return {
      outfit: {
        top: FAMILY_TONES.rogueA,
        legs: '#241d33',
        boots: { base: '#3a3046', shade: '#2a2234', light: '#5a4c6a' },
        belt: '#2a2234',
        hair: HAIR.ink,
        gloves: GLOVE.rogue,
      },
      cut: 'tunic',
      hair: 'swept',
      mood: 'sly',
      frontHand: 'grip',
      backHand: 'low',
      coversCrown: true,
      aura: grand ? <Aura id={`${uid}-aura`} color={GLOW.shadow} /> : undefined,
      torsoOver: <FlowingScarf long={grand} />,
      // 刺客線後手反握：刃朝下，與 B 線高舉毒瓶的剪影錯開。
      backItem: (
        <Held at={BACK_HAND.low} angle={200}>
          <Blade kind="shadow" />
        </Held>
      ),
      faceOver: (
        <>
          <DominoMask glow={grand ? GLOW.shadow : undefined} />
          <path d="M24.4 38.4Q32 42.6 40.2 38.4L40.8 41.4Q32 45.6 23.8 41.4Z" fill={SCARF_VIOLET} strokeWidth={LINE.part} />
        </>
      ),
      headOver: <Bandana tone={{ base: '#2e2540', shade: '#1f1a2c', light: '#54476e' }} />,
      handItem: (
        <Held at={FRONT_HAND.grip} angle={34}>
          <Blade kind="shadow" />
        </Held>
      ),
      front: grand ? (
        <>
          <path d={SHADOW_SLASHES} fill={GLOW.shadow} stroke="none" opacity="0.9" />
          <Sparkles spots={[{ x: 57, y: 22, size: 3.4 }]} color={GLOW.shadow} />
        </>
      ) : undefined,
    };
  }
  return {
    outfit: { top: FAMILY_TONES.rogueB, legs: '#242c22', boots: LEATHER, belt: LEATHER.shade, hair: HAIR.ink, gloves: GLOVE.rogue },
    cut: 'tunic',
    hair: 'swept',
    mood: 'sly',
    // 二轉垂手反握毒刃（潛行），三轉改由前手高舉毒瓶，讓「毒」成為最先被看見的道具。
    frontHand: grand ? 'reach' : 'low',
    backHand: grand ? 'raise' : 'low',
    coversCrown: true,
    aura: grand ? <Aura id={`${uid}-aura`} color={GLOW.venom} /> : undefined,
    backItem: grand ? (
      <Held at={BACK_HAND.raise} angle={-38}>
        <Blade kind="venom" />
      </Held>
    ) : (
      // 小毒瓶倒提在後手下方：瓶頸被手指握住、瓶身垂在身後，不會被後臂整個蓋掉。
      <Held at={BACK_HAND.low} angle={200}>
        <PoisonFlask scale={0.9} />
      </Held>
    ),
    torsoOver: grand ? (
      <>
        <Strap from={{ x: 25.4, y: 41.6 }} to={{ x: 40.4, y: 55.4 }} color={LEATHER.shade} width={2.2} />
        <Vials spots={[{ x: 29.4, y: 47 }, { x: 33.6, y: 50.6 }, { x: 37.6, y: 54.2 }]} r={1.9} />
      </>
    ) : (
      <Vials spots={[{ x: 30, y: 58.6 }, { x: 35, y: 58.6 }]} r={1.8} />
    ),
    faceOver: (
      <>
        <FaceWrap />
        {grand ? <path d={VENOM_EYE_GLINT} fill={GLOW.venom} stroke="none" /> : null}
      </>
    ),
    headOver: <Bandana tone={VENOM_CLOTH} />,
    // 反手握：刃朝下往前，左右翻面讓亮面仍朝主光。
    handItem: grand ? (
      <Held at={FRONT_HAND.reach} angle={8}>
        <PoisonFlask />
      </Held>
    ) : (
      <Held at={FRONT_HAND.low} angle={150} mirror>
        <Blade kind="venom" />
        <path d="M2.4 -8Q3.6 -6 2.6 -5" fill="none" stroke={ACCENT.venom} strokeWidth={LINE.feature} />
      </Held>
    ),
    front: grand ? <Bubbles /> : undefined,
  };
}
