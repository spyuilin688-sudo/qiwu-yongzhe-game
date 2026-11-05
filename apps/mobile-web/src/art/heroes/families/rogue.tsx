import { ACCENT, EYE_SHINE, FAMILY_TONES, GLOW, HAIR, INK, LEATHER, METAL, SKIN, type Tone } from '../palette.ts';
import { Aura, Held, Sparkle, Strap } from '../props.tsx';
import { BACK_HAND, FRONT_HAND, type HeroDesign } from '../rig.tsx';
import { circlesPath, ellipsePath } from '../shapes.ts';
import type { HeroStage } from '../stage.ts';

/**
 * 盜賊系：頭巾＋眼罩＋雙短刀。
 * A 線（影刃刺客→影舞者）：彎月暗影刃與身後飄帶，三轉飄帶加長並帶紫色刀光。
 * B 線（毒刃獵手→劇毒使徒）：綠刃、腰間毒瓶，三轉改為胸前毒瓶彈帶、後手舉毒瓶與毒泡。
 */

type BladeKind = 'dagger' | 'shadow' | 'venom';

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
        <path d="M1.2 -4.4C1.8 -9 1.8 -13 3.6 -16.6" fill="none" stroke={GLOW.shadow} strokeWidth="1.3" />
      ) : (
        <path d="M0 -15.4V-3H1.8V-13.4Z" fill={kind === 'venom' ? ACCENT.venom : METAL.steel.shade} stroke="none" />
      )}
      <rect x="-3.4" y="-3.6" width="6.8" height="1.9" rx="0.8" fill={kind === 'venom' ? ACCENT.venomShade : METAL.iron.base} strokeWidth="1.4" />
      <rect x="-1" y="-1.6" width="2" height="4.6" rx="0.8" fill={LEATHER.shade} strokeWidth="1.4" />
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
      <circle cx="19.4" cy="26.2" r="2" fill={tone.base} strokeWidth="1.5" />
      <path d="M27 15Q31.6 13.2 36.6 13.8" fill="none" stroke={tone.light} strokeWidth="1.2" />
    </>
  );
}

const MASK_HOLES = ellipsePath(36, 29.2, 1.9, 1.5) + ellipsePath(41.8, 29, 1.7, 1.4);
const MASK_PUPILS = circlesPath([{ cx: 36.5, cy: 29.3, r: 0.95 }, { cx: 42.2, cy: 29.1, r: 0.9 }]);
const MASK_SHINE = circlesPath([{ cx: 36.9, cy: 28.8, r: 0.38 }, { cx: 42.6, cy: 28.6, r: 0.35 }]);

/**
 * 眼罩蓋住眼睛後再補上眼洞與瞳孔，保留 Q 版表情。
 * 眼洞預設透出膚色：白色眼洞在 38–48px 會被看成眼鏡或護目鏡（與工匠撞型）；
 * 三轉才換成發光色，當作「眼神發光」的升級點綴。外側上挑的尖角是蒙面俠眼罩的辨識輪廓。
 */
function DominoMask({ glow }: { glow?: string }) {
  return (
    <>
      <path d="M31.4 26.4Q38.6 24.4 45.6 26.2L45.4 29.8Q44.2 32.2 41.8 31.9Q39.8 31.6 38.9 30Q37.9 32.2 35.4 32.1Q33 31.8 32.6 29.4Z" fill={INK} />
      <path d={MASK_HOLES} fill={glow ?? SKIN.base} stroke="none" />
      <path d={MASK_PUPILS} fill={INK} stroke="none" />
      <path d={MASK_SHINE} fill={EYE_SHINE} stroke="none" />
    </>
  );
}

const SCARF_VIOLET = '#9a80d4';

/** 飄帶畫在後手之上，奔跑感才不會被手臂擋掉。 */
function FlowingScarf({ long }: { long: boolean }) {
  return (
    <g fill={SCARF_VIOLET}>
      <path d={long ? 'M25 37.6C17.6 36 10.4 30.4 2.6 31.6C8.4 36.6 15.4 41.4 25 41.2Z' : 'M25 37.8C19 37.2 13.4 34.2 7.6 35.2C11.6 38.8 17.4 41.6 25 41.2Z'} />
      {long ? <path d="M24.6 40C18 42.6 11.4 42.6 4.6 47.4C12.2 48.6 19 46.4 25.6 43Z" fill={FAMILY_TONES.rogueA.light} /> : null}
    </g>
  );
}

interface VialSpot {
  readonly x: number;
  readonly y: number;
}

/** 一排毒瓶合併成瓶頸／瓶身／高光三條路徑，不論幾瓶都只佔三個元素。 */
function Vials({ spots, r }: { spots: readonly VialSpot[]; r: number }) {
  const necks = spots.map(({ x, y }) => `M${x - 0.9} ${y - r - 2}h1.8v2.4h-1.8Z`).join('');
  return (
    <>
      <path d={necks} fill={ACCENT.vial} strokeWidth="1.4" />
      <path d={circlesPath(spots.map(({ x, y }) => ({ cx: x, cy: y, r })))} fill={ACCENT.venom} strokeWidth="1.4" />
      <path d={circlesPath(spots.map(({ x, y }) => ({ cx: x - r * 0.35, cy: y - r * 0.3, r: r * 0.3 })))} fill={ACCENT.vial} stroke="none" />
    </>
  );
}

function PoisonFlask() {
  return (
    <>
      <rect x="-1.6" y="-11.4" width="3.2" height="2.4" rx="0.8" fill={LEATHER.base} strokeWidth="1.5" />
      <rect x="-1.4" y="-9.4" width="2.8" height="3.4" fill={ACCENT.vial} strokeWidth="1.5" />
      <circle cx="0" cy="-2.8" r="4.4" fill={ACCENT.venom} />
      <path d="M-4.2 -2Q0 -0.4 4.2 -2A4.4 4.4 0 0 1 -4.2 -2Z" fill={ACCENT.venomShade} stroke="none" />
      <circle cx="-1.6" cy="-4.4" r="1.1" fill={ACCENT.vial} stroke="none" />
    </>
  );
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
      strokeWidth="1.3"
    />
  );
}

export function rogueDesign({ tier, branch, uid }: HeroStage): HeroDesign {
  if (tier === 1) {
    return {
      outfit: { top: FAMILY_TONES.rogue, legs: '#2f2c38', boots: LEATHER, belt: LEATHER.shade, hair: HAIR.ink },
      cut: 'tunic',
      hair: 'swept',
      mood: 'sly',
      frontHand: 'grip',
      backHand: 'raise',
      backItem: (
        <Held at={BACK_HAND.raise} angle={-38}>
          <Blade kind="dagger" />
        </Held>
      ),
      torsoOver: <rect x="36" y="55.4" width="4.6" height="4" rx="1.2" fill={LEATHER.base} strokeWidth="1.5" />,
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
      outfit: { top: FAMILY_TONES.rogueA, legs: '#241d33', boots: { base: '#3a3046', shade: '#2a2234', light: '#5a4c6a' }, belt: '#2a2234', hair: HAIR.ink },
      cut: 'tunic',
      hair: 'swept',
      mood: 'sly',
      frontHand: 'grip',
      backHand: 'low',
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
          <path d="M24.4 38.4Q32 42.6 40.2 38.4L40.8 41.4Q32 45.6 23.8 41.4Z" fill={SCARF_VIOLET} />
        </>
      ),
      headOver: <Bandana tone={{ base: '#2e2540', shade: '#1f1a2c', light: '#54476e' }} />,
      handItem: (
        <Held at={FRONT_HAND.grip} angle={34}>
          <Blade kind="shadow" />
        </Held>
      ),
      // 刀光用實心彎月而非線條，避免左右兩道弧被看成弓。
      front: grand ? (
        <g fill={GLOW.shadow} stroke="none" opacity="0.9">
          <path d="M49.4 26.6Q63 32.4 58.4 49.6Q59 37.4 49.4 26.6Z" />
          <path d="M12.6 58.6Q3.6 52 6.8 40.4Q7.4 51 12.6 58.6Z" />
          <Sparkle x={57} y={22} size={2.6} color={GLOW.shadow} />
        </g>
      ) : undefined,
    };
  }
  return {
    outfit: { top: FAMILY_TONES.rogueB, legs: '#242c22', boots: LEATHER, belt: LEATHER.shade, hair: HAIR.ink },
    cut: 'tunic',
    hair: 'swept',
    mood: 'sly',
    // 三轉改由前手高舉毒瓶，讓「毒」成為最先被看見的道具。
    frontHand: grand ? 'reach' : 'grip',
    backHand: 'raise',
    aura: grand ? <Aura id={`${uid}-aura`} color={GLOW.venom} /> : undefined,
    backItem: (
      <Held at={BACK_HAND.raise} angle={-38}>
        <Blade kind="venom" />
      </Held>
    ),
    torsoOver: grand ? (
      <>
        <Strap from={{ x: 25.4, y: 41.6 }} to={{ x: 40.4, y: 55.4 }} color={LEATHER.shade} width={2.2} />
        <Vials spots={[{ x: 29.4, y: 47 }, { x: 33.6, y: 50.6 }, { x: 37.6, y: 54.2 }]} r={1.9} />
      </>
    ) : (
      <>
        <Vials spots={[{ x: 30, y: 58.6 }, { x: 35, y: 58.6 }]} r={1.8} />
      </>
    ),
    faceOver: <DominoMask glow={grand ? GLOW.venom : undefined} />,
    headOver: <Bandana tone={{ base: '#3f6a34', shade: '#2c4c24', light: '#6a9a5a' }} />,
    handItem: grand ? (
      <Held at={FRONT_HAND.reach} angle={8}>
        <PoisonFlask />
      </Held>
    ) : (
      <Held at={FRONT_HAND.grip} angle={58}>
        <Blade kind="venom" />
        <path d="M2.4 -8Q3.6 -6 2.6 -5" fill="none" stroke={ACCENT.venom} strokeWidth="1.2" />
      </Held>
    ),
    front: grand ? <Bubbles /> : undefined,
  };
}
