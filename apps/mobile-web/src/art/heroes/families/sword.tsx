import { ACCENT, FAMILY_TONES, GLOW, HAIR, INK, LEATHER, METAL } from '../palette.ts';
import { Aura, Cape, Held, Sparkle } from '../props.tsx';
import { BACK_HAND, FRONT_HAND, type HeroDesign } from '../rig.tsx';
import type { HeroStage } from '../stage.ts';

/**
 * 劍士系：劍＋披風。
 * A 線（狂劍士→劍聖）：雙手巨劍、刺蝟頭與毛領，三轉加金邊長披風與金光。
 * B 線（破陣騎士→符文騎士）：大盾＋頭盔羽飾，三轉盾面浮現符文光。
 */

function ShortSword() {
  return (
    <>
      <path d="M-2 -2.6V-19L0 -22.6L2 -19V-2.6Z" fill={METAL.steel.base} />
      <path d="M0 -21V-3H2V-19Z" fill={METAL.steel.shade} stroke="none" />
      <rect x="-1.2" y="-1" width="2.4" height="5.2" rx="0.8" fill={LEATHER.shade} />
      <rect x="-4.4" y="-3.4" width="8.8" height="2.4" rx="1" fill={METAL.gold.base} />
      <circle cx="0" cy="5" r="1.6" fill={METAL.gold.base} strokeWidth="1.5" />
    </>
  );
}

function GreatSword({ saint }: { saint: boolean }) {
  // 劍聖的巨劍加金色刃線與護手寶石：同一把劍「升級」而不是換武器。
  // 刃寬約為一轉短劍的兩倍、柄更長：48px 下靠「厚度」而非長度分辨出雙手巨劍。
  return (
    <>
      <path d="M-4.4 -3V-30.4L0 -37.4L4.4 -30.4V-15L2.4 -12.8L4.4 -10.6V-3Z" fill={METAL.steel.base} />
      <path d="M0 -35.6V-3.6H4.4V-10.6L2.4 -12.8L4.4 -15V-30.4Z" fill={METAL.steel.shade} stroke="none" />
      <path d="M-2 -6V-29.6" stroke={saint ? GLOW.gold : METAL.steel.light} strokeWidth={saint ? 1.8 : 1.2} />
      <rect x="-1.5" y="-1" width="3" height="7.4" rx="1" fill={LEATHER.shade} />
      <path d={saint ? 'M-8.6 -5.4Q-4.4 -2 0 -3.6Q4.4 -2 8.6 -5.4L7.6 -1.6Q0 0.6 -7.6 -1.6Z' : 'M-7.2 -4.6H7.2V-1.4H-7.2Z'} fill={METAL.gold.base} />
      {saint ? <circle cx="0" cy="-2.4" r="1.6" fill={ACCENT.plume} strokeWidth="1.4" /> : null}
      <circle cx="0" cy="7.4" r="1.8" fill={METAL.gold.base} strokeWidth="1.5" />
    </>
  );
}

function KiteShield({ rune }: { rune: boolean }) {
  const rim = rune ? METAL.gold : METAL.steel;
  return (
    <>
      <path d="M35.4 45H53Q53.6 45 53.6 45.6V53Q53.6 62.6 44.5 67.4Q35.4 62.6 35.4 53V45.6Q35.4 45 36 45Z" fill={rim.base} />
      <path d="M37.8 47.4H51.2V53Q51.2 60.8 44.5 64.6Q37.8 60.8 37.8 53Z" fill={FAMILY_TONES.swordB.base} strokeWidth="1.4" />
      <path d="M44.5 47.4H51.2V53Q51.2 60.8 44.5 64.6Z" fill={FAMILY_TONES.swordB.shade} stroke="none" />
      {rune ? (
        <g fill="none" stroke={GLOW.rune} strokeWidth="1.6">
          <path d="M44.5 49.6V61M40.8 52.4L44.5 55.4L48.2 52.4M41.6 58L44.5 56.2L47.4 58" />
        </g>
      ) : (
        <path d="M40.6 51.6L44.5 55.4L48.4 51.6" fill="none" stroke={METAL.gold.base} strokeWidth="2" />
      )}
      <path d="M37 46.6H44" stroke={rim.light} strokeWidth="1" />
    </>
  );
}

function KnightHelm({ rune }: { rune: boolean }) {
  const shell = rune ? METAL.steel : METAL.iron;
  return (
    <>
      <path d="M31.4 11.8C29.6 5.6 21.8 3.6 15.6 7.6C20.4 7.8 23.6 10 25.2 13.2Z" fill={ACCENT.plume} />
      {rune ? <path d="M33 11.6C33.6 6.4 38.6 4.4 42.6 6.2C39.4 7.2 37.4 9.4 36.8 12.4Z" fill={METAL.gold.base} /> : null}
      <path d="M17.6 33C16.4 19 23.4 11.2 32.4 11.2C41.6 11.2 47.4 17.6 46.8 25L30.4 24.4Q28.4 24.6 28.2 27L28 33.6Q22 36.2 17.6 33Z" fill={shell.base} />
      <path d="M17.6 33C16.6 22 20.4 15 26.6 12.6Q21.6 19 23.4 34.6Q19.8 34.6 17.6 33Z" fill={shell.shade} stroke="none" />
      <path d="M29.6 22.4L46.9 23" stroke={rune ? METAL.gold.base : METAL.steel.base} strokeWidth="2.4" />
      <path d="M27 15.6Q31 13.4 36 13.6" fill="none" stroke={shell.light} strokeWidth="1.2" />
    </>
  );
}

function SpikyBand({ long }: { long: boolean }) {
  return (
    <>
      <path d={long ? 'M20 25.4L8.6 31.6L11 34.4L21 28.2Z' : 'M20 25.4L12.4 30L14.2 32.2L21 28.2Z'} fill={ACCENT.plume} />
      <path d={long ? 'M20.4 24.4L9.6 21.4L9.4 25L20.6 27.4Z' : 'M20.4 24.4L13.4 22.8L13.4 25.6L20.6 27.4Z'} fill={FAMILY_TONES.swordA.shade} />
      <path d="M19 25.6Q31.6 17.6 46.4 23.6" fill="none" stroke={INK} strokeWidth="4.6" />
      <path d="M19 25.6Q31.6 17.6 46.4 23.6" fill="none" stroke={ACCENT.plume} strokeWidth="2.2" />
    </>
  );
}

/** 狂劍士系的毛皮肩領：鋸齒下緣是一眼可辨的「野性」剪影。 */
function FurCollar() {
  return (
    <path
      d="M22.6 40.4Q22 46 24.8 46.6L26.4 48.6L28.4 46.8L30.6 49L32.6 46.8L34.8 48.8L36.6 46.6L38.8 48.2Q41.6 46.4 41.2 40.4Z"
      fill={ACCENT.furLight}
    />
  );
}

function Pauldron({ gold }: { gold: boolean }) {
  const tone = gold ? METAL.gold : METAL.steel;
  return (
    <>
      <path d="M35 45.2Q35.2 40.2 40 40.2Q44.6 40.4 44.6 45.6Q40 43.6 35 45.2Z" fill={tone.base} />
      <path d="M37 42.2Q39.6 41 42 42" fill="none" stroke={tone.light} strokeWidth="1" />
    </>
  );
}

export function swordDesign({ tier, branch, uid }: HeroStage): HeroDesign {
  if (tier === 1) {
    return {
      outfit: { top: FAMILY_TONES.sword, legs: '#4a3f52', boots: LEATHER, belt: LEATHER.shade, hair: HAIR.chestnut },
      cut: 'tunic',
      hair: 'short',
      mood: 'smile',
      frontHand: 'grip',
      backHand: 'low',
      behind: <Cape color={ACCENT.plume} shade="#a3332b" length="short" />,
      handItem: (
        <Held at={FRONT_HAND.grip} angle={24}>
          <ShortSword />
        </Held>
      ),
      front: <Pauldron gold={false} />,
    };
  }
  const saint = tier === 3;
  if (branch === 'A') {
    return {
      outfit: { top: FAMILY_TONES.swordA, legs: '#3b2a2a', boots: LEATHER, belt: saint ? METAL.gold.shade : LEATHER.shade, hair: HAIR.crimson },
      cut: 'tunic',
      hair: 'spiky',
      mood: 'fierce',
      frontHand: 'grip',
      backHand: 'low',
      aura: saint ? <Aura id={`${uid}-aura`} color={GLOW.gold} /> : undefined,
      behind: saint ? <Cape color="#7a2a22" shade="#5a1d17" trim={METAL.gold.base} length="long" /> : <Cape color="#7a2a22" shade="#5a1d17" length="short" />,
      torsoOver: (
        <>
          <FurCollar />
          {saint ? <path d="M21.6 60.6H42.4" stroke={METAL.gold.base} strokeWidth="2" /> : null}
        </>
      ),
      headOver: <SpikyBand long={saint} />,
      handItem: (
        <Held at={FRONT_HAND.grip} angle={18}>
          <GreatSword saint={saint} />
        </Held>
      ),
      front: saint ? (
        <>
          <Pauldron gold />
          <Sparkle x={58} y={12} size={3.4} color={GLOW.gold} />
          <Sparkle x={8} y={48} size={2.4} color={GLOW.gold} />
        </>
      ) : undefined,
    };
  }
  return {
    outfit: { top: FAMILY_TONES.swordB, legs: '#2f3448', boots: { base: METAL.iron.base, shade: METAL.iron.shade, light: METAL.iron.light }, belt: LEATHER.shade, hair: HAIR.chestnut },
    cut: 'tunic',
    hair: 'short',
    mood: 'focus',
    frontHand: 'chest',
    backHand: 'raise',
    hideEar: true,
    aura: saint ? <Aura id={`${uid}-aura`} color={GLOW.rune} /> : undefined,
    behind: saint ? <Cape color={FAMILY_TONES.swordB.base} shade={FAMILY_TONES.swordB.shade} trim={METAL.gold.base} length="long" /> : undefined,
    backItem: (
      <Held at={BACK_HAND.raise} angle={-14}>
        <ShortSword />
        {saint ? <path d="M-0.6 -5V-18" stroke={GLOW.rune} strokeWidth="1.4" /> : null}
      </Held>
    ),
    torsoOver: (
      <>
        <path d="M24 41.6H40L41 50.4Q32 53.6 23 50.4Z" fill={METAL.steel.base} />
        <path d="M24 41.6H29L28.4 52.2Q25.4 51.6 23 50.4Z" fill={METAL.steel.shade} stroke="none" />
        {saint ? <path d="M23.6 46.2Q32 48.6 40.4 46.2" fill="none" stroke={METAL.gold.base} strokeWidth="1.6" /> : null}
      </>
    ),
    headOver: <KnightHelm rune={saint} />,
    front: (
      <>
        <KiteShield rune={saint} />
        {saint ? (
          <>
            <Sparkle x={57} y={44} size={3} color={GLOW.rune} />
            <Sparkle x={9} y={20} size={2.4} color={GLOW.rune} />
          </>
        ) : null}
      </>
    ),
  };
}
