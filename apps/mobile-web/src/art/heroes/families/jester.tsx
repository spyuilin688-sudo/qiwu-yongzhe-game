import { ACCENT, FAMILY_TONES, GLOW, HAIR, INK, LEATHER, METAL, type Tone } from '../palette.ts';
import { Aura, Cape, Held, Sparkle } from '../props.tsx';
import { FRONT_HAND, type HeroDesign } from '../rig.tsx';
import { circlesPath, ellipsePath } from '../shapes.ts';
import type { HeroStage } from '../stage.ts';

/**
 * 小丑系：多角小丑帽＋鈴鐺＋拼色衣與白色皺領。
 * A 線（牌術師→命運魔術師）：扇形紙牌與飛牌，三轉紙牌環繞、金鈴與短披風。
 * B 線（幻戲師→千面幻術師）：手鏡與半臉面具，三轉多張浮游面具與半透明殘影。
 */

interface Motley {
  readonly left: Tone;
  readonly right: Tone;
  readonly bell: string;
}

const MOTLEY_A: Motley = { left: FAMILY_TONES.jesterA, right: { base: '#2f9e98', shade: '#217470', light: '#62cbc4' }, bell: ACCENT.bell };
const MOTLEY_B: Motley = { left: FAMILY_TONES.jesterB, right: { base: '#2f9e98', shade: '#217470', light: '#62cbc4' }, bell: '#e8ecf4' };
const MOTLEY_T1: Motley = { left: FAMILY_TONES.jester, right: { base: '#2f9e98', shade: '#217470', light: '#62cbc4' }, bell: ACCENT.bell };

/**
 * 魔術師披風：二轉短、三轉長＋金邊，讓一轉→二轉→三轉多一層「行頭升級」。
 * 用靛紫而非近黑色，壓在深棕 UI 上剪影才不會被吃掉。
 */
const MAGICIAN_CAPE: Tone = { base: '#3d3470', shade: '#2a2452', light: '#5e54a0' };

function JesterHat({ motley, points, goldBells }: { motley: Motley; points: 2 | 3; goldBells: boolean }) {
  const bell = goldBells ? METAL.gold.base : motley.bell;
  return (
    <>
      <path d="M20.4 22.4C14.6 13.4 7.6 13.6 4.2 20.2C8.8 18.6 12.8 21.4 15.6 27.4Z" fill={motley.left.base} />
      <path d="M37.6 13.8C43.8 7.8 52 7.4 56.6 13C51.6 12 47.4 13.8 45.2 18.8Z" fill={motley.right.base} />
      {points === 3 ? <path d="M26.8 13.6C25.2 7.4 27.8 3.2 33.4 2.6C31 5 30.6 8.6 33.8 12.8Z" fill={METAL.gold.base} /> : null}
      <path d="M17.8 30C16.6 18.6 23.6 12 32.4 12C41.4 12 46.8 17.4 46.6 23.4Q31.6 19.4 19.8 31Z" fill={motley.left.base} />
      <path d="M32.4 12C41.4 12 46.8 17.4 46.6 23.4Q39.6 21.4 33 22.6Q34.8 17 32.4 12Z" fill={motley.right.base} />
      <path d="M19.4 30.4Q31.6 18.8 46.8 23.4" fill="none" stroke={INK} strokeWidth="4.8" />
      <path d="M19.4 30.4Q31.6 18.8 46.8 23.4" fill="none" stroke={METAL.gold.base} strokeWidth="2.4" />
      <path
        d={circlesPath([{ cx: 4.6, cy: 21.6, r: 2.2 }, { cx: 56.6, cy: 14.6, r: 2.2 }, ...(points === 3 ? [{ cx: 33.6, cy: 3.4, r: 2 }] : [])])}
        fill={bell}
        strokeWidth="1.5"
      />
    </>
  );
}

/** 拼色上衣：右半換色＋中線菱形，是小丑系的身體辨識。 */
function MotleyTunic({ motley }: { motley: Motley }) {
  return (
    <>
      <path d="M32 39.8H38.5Q40.6 39.6 40.8 41.5L42.8 61.2Q43 63.4 40.8 63.4H32Z" fill={motley.right.base} />
      <path d="M32 45.4L34 48L32 50.6L30 48ZM32 56L34 58.6L32 61.2L30 58.6Z" fill={METAL.gold.base} strokeWidth="1.4" />
    </>
  );
}

function Ruff() {
  return (
    <path
      d="M23.6 38.4L25.4 41.6L27.6 39.6L29.4 42.6L31.6 40.2L33.6 42.8L35.6 40.2L37.6 42.4L39.2 39.6L41 41.4L40.4 37.6Q32 41.4 23.6 38.4Z"
      fill={ACCENT.card}
    />
  );
}

type Suit = 'heart' | 'diamond' | 'spade';

const SUIT_PATH: Record<Suit, string> = {
  heart: 'M0 1.8C-2.8 -0.4 -2.4 -2.8 -1 -2.8C-0.4 -2.8 0 -2.2 0 -1.8C0 -2.2 0.4 -2.8 1 -2.8C2.4 -2.8 2.8 -0.4 0 1.8Z',
  diamond: 'M0 -2.6L1.7 0L0 2.6L-1.7 0Z',
  spade: 'M0 -2.8C2.8 -0.6 2.4 1.6 1 1.6C0.5 1.6 0.2 1.2 0 0.9L0.6 2.6H-0.6L0 0.9C-0.2 1.2 -0.5 1.6 -1 1.6C-2.4 1.6 -2.8 -0.6 0 -2.8Z',
};

/** 紙牌以握點為軸心往上展開；花色用路徑畫，不放文字。transform 直接套在兩個元素上，省掉群組。 */
function Card({ transform, suit, gold }: { transform: string; suit: Suit; gold: boolean }) {
  return (
    <>
      <rect x="-2.8" y="-11" width="5.6" height="8" rx="1" transform={transform} fill={ACCENT.card} stroke={gold ? METAL.gold.shade : INK} strokeWidth="1.5" />
      <path d={SUIT_PATH[suit]} transform={`${transform} translate(0 -7)`} fill={suit === 'spade' ? ACCENT.cardInk : ACCENT.cardRed} stroke="none" />
    </>
  );
}

function CardFan({ count, gold }: { count: 3 | 4; gold: boolean }) {
  const angles = count === 3 ? [-26, 0, 26] : [-36, -12, 12, 36];
  const suits: Suit[] = ['spade', 'heart', 'diamond', 'heart'];
  return (
    <>
      {angles.map((angle, index) => (
        <Card key={angle} transform={`rotate(${angle})`} suit={suits[index] ?? 'heart'} gold={gold} />
      ))}
    </>
  );
}

function FlyingCard({ x, y, angle, suit }: { x: number; y: number; angle: number; suit: Suit }) {
  return <Card transform={`translate(${x} ${y + 7}) rotate(${angle})`} suit={suit} gold />;
}

function HandMirror({ glow }: { glow: boolean }) {
  return (
    <>
      <rect x="-1.2" y="-2" width="2.4" height="6.6" rx="1" fill={METAL.gold.shade} strokeWidth="1.5" />
      <ellipse cx="0" cy="-8" rx="5" ry="6.2" fill={METAL.gold.base} />
      <ellipse cx="0" cy="-8" rx="3.3" ry="4.5" fill={glow ? GLOW.phantom : ACCENT.mirror} strokeWidth="1.3" />
      <path d="M-1.6 -10.6L0.4 -12.2M-1.8 -7.6L1.6 -10.6" fill="none" stroke="#ffffff" strokeWidth="1" />
    </>
  );
}

/** 小面具：笑臉弧線全用路徑，三轉時多張浮在身邊代表「千面」。 */
function Mask({ x, y, scale, tint }: { x: number; y: number; scale: number; tint: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-4.4 -3.6Q0 -5.8 4.4 -3.6Q4.8 2.8 0 4.8Q-4.8 2.8 -4.4 -3.6Z" fill={tint} strokeWidth={1.6 / scale} />
      <path d="M-3 -1.4Q-1.8 -2.6 -0.8 -1.4M0.8 -1.4Q1.8 -2.6 3 -1.4M-1.8 1.6Q0 3.2 1.8 1.6" fill="none" strokeWidth={1.1 / scale} />
    </g>
  );
}

/** 半透明殘影：只保留帽尖與頭的剪影，表現幻術分身，不增加太多節點。 */
function Afterimage() {
  return (
    <path
      d={`${ellipsePath(20, 31, 12, 12)}M8.6 24C5.4 16.6 2.2 16.4 1.6 21.6Q5.4 21.6 6.8 28.6ZM17 19C18 10 23 7 28 8Q24 12 26 19ZM10 42H30L32 66H8Z`}
      opacity="0.38"
      fill={GLOW.phantom}
      stroke="none"
    />
  );
}

export function jesterDesign({ tier, branch, uid }: HeroStage): HeroDesign {
  if (tier === 1) {
    return {
      outfit: { top: MOTLEY_T1.left, legs: '#3a2f48', boots: LEATHER, belt: null, hair: HAIR.rose },
      cut: 'tunic',
      hair: 'short',
      mood: 'smile',
      frontHand: 'grip',
      backHand: 'low',
      torsoOver: <MotleyTunic motley={MOTLEY_T1} />,
      faceOver: <Ruff />,
      headOver: <JesterHat motley={MOTLEY_T1} points={2} goldBells={false} />,
      handItem: (
        <Held at={FRONT_HAND.grip} angle={14}>
          <CardFan count={3} gold={false} />
        </Held>
      ),
    };
  }
  const grand = tier === 3;
  if (branch === 'A') {
    return {
      outfit: { top: MOTLEY_A.left, legs: '#2a2232', boots: { base: '#3a3046', shade: '#2a2234', light: '#5a4c6a' }, belt: null, hair: HAIR.rose },
      cut: 'tunic',
      hair: 'short',
      mood: 'sly',
      frontHand: 'raise',
      backHand: 'low',
      aura: grand ? <Aura id={`${uid}-aura`} color={GLOW.fate} /> : undefined,
      behind: <Cape color={MAGICIAN_CAPE.base} shade={MAGICIAN_CAPE.shade} trim={grand ? METAL.gold.base : undefined} length={grand ? 'long' : 'short'} />,
      torsoOver: <MotleyTunic motley={MOTLEY_A} />,
      faceOver: <Ruff />,
      headOver: <JesterHat motley={MOTLEY_A} points={3} goldBells={grand} />,
      handItem: (
        <Held at={FRONT_HAND.raise} angle={18}>
          <CardFan count={4} gold={grand} />
        </Held>
      ),
      front: (
        <>
          <FlyingCard x={54} y={54} angle={24} suit="diamond" />
          {grand ? (
            <>
              <FlyingCard x={9} y={42} angle={-24} suit="spade" />
              <FlyingCard x={56} y={30} angle={-14} suit="heart" />
              <Sparkle x={9} y={60} size={2.6} color={GLOW.fate} />
            </>
          ) : null}
        </>
      ),
    };
  }
  return {
    outfit: { top: MOTLEY_B.left, legs: '#2a2232', boots: LEATHER, belt: null, hair: grand ? HAIR.silver : HAIR.rose },
    cut: 'tunic',
    hair: 'short',
    mood: 'smile',
    frontHand: 'grip',
    backHand: 'low',
    aura: grand ? <Aura id={`${uid}-aura`} color={GLOW.phantom} /> : undefined,
    behind: grand ? <Afterimage /> : undefined,
    torsoOver: <MotleyTunic motley={MOTLEY_B} />,
    faceOver: <Ruff />,
    headOver: (
      <>
        <JesterHat motley={MOTLEY_B} points={3} goldBells={grand} />
        <Mask x={22} y={22.8} scale={0.9} tint={ACCENT.card} />
      </>
    ),
    handItem: (
      <Held at={FRONT_HAND.grip} angle={10}>
        <HandMirror glow={grand} />
      </Held>
    ),
    front: grand ? (
      <>
        <Mask x={56} y={30} scale={1.15} tint={GLOW.phantom} />
        <Mask x={9} y={48} scale={1.05} tint={ACCENT.mirror} />
        <Sparkle x={57} y={62} size={2.4} color={GLOW.phantom} />
      </>
    ) : undefined,
  };
}
