import { ACCENT, FAMILY_TONES, GLOW, HAIR, INK, LEATHER, LINEN, METAL, WOOD, type Tone } from '../palette.ts';
import { Aura, Cape, Held, Sparkle, Strap } from '../props.tsx';
import { FRONT_HAND, type HeroDesign } from '../rig.tsx';
import type { HeroStage } from '../stage.ts';

/**
 * 弓手系：兜帽＋弓＋背後箭袋。
 * A 線（神射手→星隼遊俠）：比人還高的長弓、羽飾兜帽，三轉加隼翼與星光。
 * B 線（馴獸師→獸王獵手）：獸耳／獸角兜帽、毛皮肩披、腰間號角與反曲弓。
 */

type BowShape = 'short' | 'long' | 'recurve';

const BOW_LIMBS: Record<BowShape, { limb: string; string: string }> = {
  short: { limb: 'M-1 -16Q8.4 -8 1.4 0Q8.4 8 -1 16', string: 'M-1 -16V16' },
  long: { limb: 'M-1 -24Q9.6 -12 1.6 0Q9.6 12 -1 24', string: 'M-1 -24V24' },
  recurve: { limb: 'M3.6 -18.4Q0.6 -17.6 1.6 -14.6Q8.4 -7 1.4 0Q8.4 7 1.6 14.6Q0.6 17.6 3.6 18.4', string: 'M1.6 -14.6V14.6' },
};

function Bow({ shape, wood, arrow, gem }: { shape: BowShape; wood: Tone; arrow: boolean; gem?: string }) {
  const bow = BOW_LIMBS[shape];
  return (
    <g fill="none">
      <path d={bow.string} stroke={ACCENT.feather} strokeWidth="0.9" />
      {arrow ? (
        <>
          <path d="M-1 0H13" stroke={INK} strokeWidth="2.8" />
          <path d="M-1 0H13" stroke={WOOD.light} strokeWidth="1.2" />
          <path d="M12 -2.2L16 0L12 2.2Z" fill={METAL.steel.base} strokeWidth="1.2" />
        </>
      ) : null}
      <path d={bow.limb} stroke={INK} strokeWidth="4.6" />
      <path d={bow.limb} stroke={wood.base} strokeWidth="2.4" />
      {gem ? <circle cx="2.6" cy="0" r="2.2" fill={gem} strokeWidth="1.4" /> : null}
    </g>
  );
}

function Quiver({ fletch }: { fletch: string }) {
  return (
    <Held at={{ x: 25, y: 57 }} angle={-26}>
      <path d="M-2.6 -22.6L-0.8 -27.4L0.6 -22.6Z" fill={fletch} strokeWidth="1.4" />
      <path d="M0.4 -22.6L2.6 -26.6L3.4 -22.6Z" fill={ACCENT.feather} strokeWidth="1.4" />
      <rect x="-3.4" y="-22" width="7" height="22" rx="2.2" fill={LEATHER.base} />
      <path d="M-3.4 -18.4H3.6" stroke={LEATHER.shade} strokeWidth="1.6" />
    </Held>
  );
}

const HOOD =
  'M16.4 34C15.2 28 15.6 24 16.8 21L9.6 17.4C14 12.6 20 10.2 26.4 10.4C29 9.8 31 9.8 32.6 10C43 10 49.4 17 48.4 26.4C46 22.6 42.4 21 38.6 21.6C35 21.6 31.4 22.4 29.4 25C27.6 27.4 27.6 31 28.4 34.6C29 37 30.6 39 32.4 40.4L26 42.4C21.6 41.4 17.8 38.6 16.4 34Z';

function Hood({ tone, ornament }: { tone: Tone; ornament: 'none' | 'feather' | 'wing' | 'ears' | 'horns' }) {
  return (
    <>
      {ornament === 'ears' ? (
        <g fill={ACCENT.furShade}>
          <path d="M21.4 13.6L20.6 4.6L28 10.6Z" />
          <path d="M33.6 10.4L38.6 3.4L41.2 12.6Z" />
        </g>
      ) : null}
      {ornament === 'horns' ? (
        <g fill={ACCENT.horn}>
          <path d="M22.6 12.6C17 9.8 13 5.8 13.8 2.2C16.6 5.6 21.4 6.8 26.6 9.8Z" />
          <path d="M34.6 10.4C37.6 5.4 42.6 2.6 47 3.4C43.6 5 40.6 8.6 39.8 12.6Z" />
        </g>
      ) : null}
      <path d={HOOD} fill={tone.base} />
      <path d="M16.4 34C15.2 28 15.6 24 16.8 21L9.6 17.4C13 14 16.6 12 20.6 11Q17.6 20 21.6 41Q18 39 16.4 34Z" fill={tone.shade} stroke="none" />
      <path d="M47.2 24.4C44.6 22.4 41.8 21.6 38.6 21.8C35 22 31.8 23 30 25.2" fill="none" stroke={tone.shade} strokeWidth="1.6" />
      <path d="M26 13.4Q31.4 11.4 37.4 12.6" fill="none" stroke={tone.light} strokeWidth="1.2" />
      {ornament === 'feather' ? (
        <>
          <path d="M27 14.6C22 12 17.6 8.6 15.6 4.4C21 5.4 26 8.6 29 12.6Z" fill={ACCENT.feather} />
          <path d="M28 13.4L18.4 6.6" fill="none" strokeWidth="1" />
        </>
      ) : null}
      {ornament === 'wing' ? (
        <>
          <path d="M26 16.6C19.6 15.6 13.4 12.6 10 7.6C13.6 8.4 15.8 8.2 17.6 7.2C17.6 9.2 19 10.4 20.8 10.6C20.4 8.6 21.4 7 23.4 6.4C23.4 9.4 25.4 12 28.6 13Z" fill={ACCENT.feather} />
          <circle cx="28.4" cy="15" r="1.8" fill={GLOW.star} strokeWidth="1.3" />
        </>
      ) : null}
    </>
  );
}

function FurMantle({ grand }: { grand: boolean }) {
  return (
    <>
      <path
        d={
          grand
            ? 'M21.4 40Q20.4 47.4 23.6 48.6L25.4 51.4L27.8 48.8L30.4 51.8L32.8 48.8L35.4 51.6L37.6 48.6L40.4 50.4Q43.2 47 42.2 40Z'
            : 'M22.6 40.4Q22 46 24.8 46.6L26.4 48.6L28.4 46.8L30.6 49L32.6 46.8L34.8 48.8L36.6 46.6L38.8 48.2Q41.6 46.4 41.2 40.4Z'
        }
        fill={ACCENT.fur}
      />
      <path d="M23.4 41.4Q23.4 45.6 25.6 46.4L26.6 47.6Q24 42.6 26.4 40.6Z" fill={ACCENT.furShade} stroke="none" />
      {grand ? (
        <g fill={ACCENT.horn} strokeWidth="1.2">
          <path d="M28.6 48.4L29.8 52.6L31 48.4Z" />
          <path d="M33.2 48.4L34.4 52.6L35.6 48.4Z" />
        </g>
      ) : null}
    </>
  );
}

/**
 * 神射手線的兜帽披肩：從下巴垂到胸口的尖角罩肩，把一轉「兜帽＋上衣」的剪影
 * 改成寬肩斗篷輪廓；B 線則是鋸齒毛皮肩披，兩條線在肩部就分得開。
 */
function HoodMantle({ tone, trim }: { tone: Tone; trim?: string }) {
  return (
    <>
      <path d="M21.4 40.6Q20.6 46.6 23 49Q27.6 48.4 32 52.2Q36.4 48.4 41 49Q43.4 46.6 42.6 40.6Q32 37.8 21.4 40.6Z" fill={tone.base} />
      <path d="M21.4 40.6Q20.6 46.6 23 49Q25.4 48.6 27.6 49.4Q24.6 45 25.8 39.8Q23.4 40 21.4 40.6Z" fill={tone.shade} stroke="none" />
      {trim ? <path d="M23.4 48.6Q27.8 48.2 32 51.4Q36.2 48.2 40.6 48.6" fill="none" stroke={trim} strokeWidth="1.4" /> : null}
    </>
  );
}

function HuntingHorn() {
  return (
    <>
      <path d="M28.2 56.4C29.6 61.6 35.4 62.6 38.6 58.4L36.6 56.4C34.6 59 31.6 58.8 30.6 56Z" fill={ACCENT.horn} />
      <path d="M36.4 55.2L39.6 58.8" stroke={METAL.brass.base} strokeWidth="2.2" />
    </>
  );
}

export function bowDesign({ tier, branch, uid }: HeroStage): HeroDesign {
  const strap = <Strap from={{ x: 25.4, y: 41.6 }} to={{ x: 40.4, y: 55.4 }} color={LEATHER.shade} width={1.8} />;
  if (tier === 1) {
    return {
      outfit: { top: FAMILY_TONES.bow, legs: '#5a4a34', boots: LEATHER, belt: LEATHER.shade, hair: HAIR.ginger },
      cut: 'tunic',
      hair: 'short',
      mood: 'smile',
      frontHand: 'grip',
      backHand: 'low',
      hideEar: true,
      behind: <Quiver fletch={ACCENT.plume} />,
      torsoOver: strap,
      headOver: <Hood tone={FAMILY_TONES.bow} ornament="none" />,
      handItem: (
        <Held at={FRONT_HAND.grip} angle={0}>
          <Bow shape="short" wood={WOOD} arrow />
        </Held>
      ),
    };
  }
  const grand = tier === 3;
  if (branch === 'A') {
    const tone = grand ? FAMILY_TONES.bowStar : FAMILY_TONES.bowA;
    return {
      // 亞麻內衫＋彩色兜帽披肩：與一轉「整身同色」的剪影拉開，一眼看出是升級後的斗篷遊俠。
      outfit: { top: LINEN, sleeve: tone, legs: '#3a3a3a', boots: LEATHER, belt: grand ? METAL.gold.shade : LEATHER.shade, hair: HAIR.ginger },
      cut: 'tunic',
      hair: 'short',
      mood: 'focus',
      frontHand: 'grip',
      backHand: 'low',
      hideEar: true,
      aura: grand ? <Aura id={`${uid}-aura`} color={GLOW.star} /> : undefined,
      behind: (
        <>
          <Cape color={FAMILY_TONES.bowA.shade} shade="#1f4d43" trim={grand ? METAL.gold.base : undefined} length={grand ? 'long' : 'short'} />
          <Quiver fletch={grand ? GLOW.star : ACCENT.feather} />
        </>
      ),
      torsoOver: (
        <>
          <HoodMantle tone={tone} trim={grand ? METAL.gold.base : undefined} />
          {strap}
        </>
      ),
      headOver: <Hood tone={tone} ornament={grand ? 'wing' : 'feather'} />,
      handItem: (
        <Held at={FRONT_HAND.grip} angle={0}>
          <Bow shape="long" wood={grand ? METAL.gold : WOOD} arrow gem={grand ? GLOW.star : undefined} />
        </Held>
      ),
      front: grand ? (
        <>
          <Sparkle x={58} y={24} size={3} color={GLOW.star} />
          <Sparkle x={9} y={50} size={2.4} color={GLOW.star} />
          <Sparkle x={60} y={66} size={2} color={GLOW.star} />
        </>
      ) : undefined,
    };
  }
  const hood: Tone = { base: ACCENT.fur, shade: ACCENT.furShade, light: ACCENT.furLight };
  return {
    outfit: { top: FAMILY_TONES.bowB, legs: '#4a3a28', boots: LEATHER, belt: LEATHER.shade, hair: HAIR.ginger },
    cut: 'tunic',
    hair: 'short',
    mood: grand ? 'fierce' : 'smile',
    frontHand: 'grip',
    backHand: 'low',
    hideEar: true,
    aura: grand ? <Aura id={`${uid}-aura`} color={GLOW.beast} /> : undefined,
    behind: (
      <>
        {grand ? <Cape color={ACCENT.furShade} shade="#7c5a32" length="long" /> : null}
        <Quiver fletch={ACCENT.plume} />
      </>
    ),
    torsoOver: (
      <>
        <FurMantle grand={grand} />
        <HuntingHorn />
      </>
    ),
    headOver: <Hood tone={hood} ornament={grand ? 'horns' : 'ears'} />,
    handItem: (
      <Held at={FRONT_HAND.grip} angle={0}>
        <Bow shape="recurve" wood={grand ? { base: '#6a4a2a', shade: '#4a321a', light: '#8c6a44' } : WOOD} arrow={grand} gem={grand ? GLOW.beast : undefined} />
      </Held>
    ),
    front: grand ? (
      <>
        <Sparkle x={58} y={26} size={2.8} color={GLOW.beast} />
        <Sparkle x={8} y={46} size={2.2} color={GLOW.beast} />
      </>
    ) : undefined,
  };
}
