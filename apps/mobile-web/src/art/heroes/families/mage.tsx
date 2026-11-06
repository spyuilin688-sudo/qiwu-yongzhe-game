import { ACCENT, CLOTH_WHITE, FAMILY_TONES, GLOW, HAIR, LEATHER, LINE, METAL, WOOD, type Tone } from '../palette.ts';
import { Aura, Cape, Held, InkedLine, Sparkles } from '../props.tsx';
import { FRONT_HAND, type HeroDesign } from '../rig.tsx';
import { circlesPath } from '../shapes.ts';
import type { HeroStage } from '../stage.ts';

/**
 * 法師系：尖帽＋長袍＋法杖。
 * A 線（元素術士→星界賢者）：洋紅紫袍、短披風、帽帶三色元素寶石、杖頂三色元素球與浮游小球；
 *   三轉換星夜長袍、金邊長披風、月牙帽飾與軌道環。
 * B 線（冰咒師→永冬魔導士）：冰藍袍、白毛滾邊、杖頂冰晶，三轉加帽簷冰錐與冰晶簇。
 */

/** 元素線披風：二轉短、三轉長＋金邊，沿用劍士、弓手、小丑的升級語彙。 */
const ELEMENT_CAPE: Tone = { base: FAMILY_TONES.mageA.shade, shade: '#241c52', light: FAMILY_TONES.mageA.base };

/** 帽帶上的三色元素寶石（火、水、木）；三種顏色各一顆，只給二轉元素術士。 */
const HAT_GEMS = [
  { cx: 27.4, cy: 16.6, color: ACCENT.fire },
  { cx: 32, cy: 15.9, color: ACCENT.water },
  { cx: 36.6, cy: 16.3, color: ACCENT.leaf },
] as const;

function WizardHat({ tone, band, icicles, moon, gems = false }: { tone: Tone; band: string; icicles: boolean; moon: boolean; gems?: boolean }) {
  return (
    <>
      <path d="M19.6 19.8L27.2 7.2Q28.4 4.6 25.8 4L17.6 5Q29.4 -0.6 33.2 5.2L44.4 19.8Z" fill={tone.base} />
      <path d="M19.6 19.8L27.2 7.2Q28.4 4.6 25.8 4L17.6 5Q22 2.8 26.4 2.6Q31 4.6 30.4 8L25.8 19.4Z" fill={tone.shade} stroke="none" />
      <path d="M13.6 22Q31 14.2 50.4 19.6Q52.2 21.4 49.8 22.6Q31 18.6 14.4 24.6Q12 23.8 13.6 22Z" fill={tone.base} />
      <path d="M20.8 17.8Q32 14.4 43.2 17.4" fill="none" stroke={band} strokeWidth="2.6" />
      <path d="M31 8.8L33.6 13.4" stroke={tone.light} strokeWidth={LINE.detail} />
      {moon ? <path d="M34 8.2A3.6 3.6 0 1 0 37.8 13.8A2.8 2.8 0 1 1 34 8.2Z" fill={GLOW.star} strokeWidth={LINE.part} /> : null}
      {gems ? HAT_GEMS.map((gem) => <circle key={gem.color} cx={gem.cx} cy={gem.cy} r="1.5" fill={gem.color} strokeWidth={LINE.detail} />) : null}
      {icicles ? <path d="M16 23.4L16.8 28.4L18.6 22.8ZM44.6 20.6L46.2 25.8L47.6 21.2ZM30.6 16.2L32.4 21L34.2 16Z" fill={ACCENT.crystal} strokeWidth={LINE.detail} /> : null}
    </>
  );
}

type StaffTop = 'gem' | 'elements' | 'astral' | 'ice' | 'winter';

/** 高光在右上（面向主光那側），和衣服、頭髮的明暗方向一致。 */
function Orb({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={color} strokeWidth={LINE.part} />
      <circle cx={cx + r * 0.35} cy={cy - r * 0.35} r={r * 0.3} fill={CLOTH_WHITE.light} stroke="none" opacity="0.85" />
    </>
  );
}

/** 冰晶的暗面在 -x（背光側）。 */
function Crystal({ x, y, h, w }: { x: number; y: number; h: number; w: number }) {
  return (
    <>
      <path d={`M${x} ${y - h}L${x + w} ${y - h * 0.55}L${x + w * 0.7} ${y}H${x - w * 0.7}L${x - w} ${y - h * 0.55}Z`} fill={ACCENT.crystal} strokeWidth={LINE.part} />
      <path d={`M${x} ${y - h}L${x - w} ${y - h * 0.55}L${x - w * 0.7} ${y}H${x}Z`} fill={ACCENT.crystalShade} stroke="none" />
    </>
  );
}

function Staff({ top }: { top: StaffTop }) {
  const shaft = top === 'astral' || top === 'winter' ? METAL.gold : WOOD;
  return (
    <>
      <InkedLine d="M0 -21V22" color={shaft.base} width={2.2} />
      {top === 'gem' ? (
        <>
          <path d="M-3.6 -21Q-4.6 -28.6 0 -29Q4.6 -28.6 3.6 -21Z" fill={WOOD.base} strokeWidth={LINE.part} />
          <Orb cx={0} cy={-25} r={2.6} color={ACCENT.water} />
        </>
      ) : null}
      {top === 'elements' || top === 'astral' ? (
        <>
          {top === 'astral' ? <ellipse cx="0" cy="-26" rx="8.4" ry="2.8" fill="none" stroke={METAL.gold.base} strokeWidth={LINE.part} transform="rotate(-18 0 -26)" /> : null}
          <circle cx="0" cy="-26" r="5" fill={ACCENT.water} />
          <path d="M0 -31A5 5 0 0 1 4.6 -24.2Q1.6 -26 0 -31Z" fill={ACCENT.fire} stroke="none" />
          <path d="M-4.4 -23.6A5 5 0 0 0 3.6 -22.6Q-0.6 -24.6 -4.4 -23.6Z" fill={ACCENT.leaf} stroke="none" />
          <circle cx="1.8" cy="-27.8" r="1.4" fill={CLOTH_WHITE.light} stroke="none" />
          <path d="M-3.4 -21.4H3.4" stroke={METAL.gold.base} strokeWidth={LINE.silhouette} />
        </>
      ) : null}
      {top === 'ice' ? <Crystal x={0} y={-20} h={11} w={3.6} /> : null}
      {top === 'winter' ? (
        <>
          <Crystal x={-3.6} y={-19.4} h={7.4} w={2.4} />
          <Crystal x={3.8} y={-19.4} h={8} w={2.4} />
          <Crystal x={0} y={-20} h={14} w={3.8} />
        </>
      ) : null}
    </>
  );
}

/** 冰系的白毛滾邊：與元素系的金邊做出 A／B 對比。 */
function FurHem() {
  return <path d="M19.7 68.2H44.3L44.6 70.4Q44.8 72.8 42.5 72.8H21.5Q19.2 72.8 19.4 70.4Z" fill={CLOTH_WHITE.base} strokeWidth={LINE.part} />;
}

/** 星夜長袍上的星點：同色小點合成一條路徑。 */
const ROBE_STARS = circlesPath([
  { cx: 27, cy: 60, r: 0.9 },
  { cx: 36.6, cy: 63.6, r: 0.9 },
  { cx: 31.4, cy: 46, r: 0.8 },
  { cx: 38.8, cy: 58, r: 0.7 },
]);

export function mageDesign({ tier, branch, uid }: HeroStage): HeroDesign {
  const sash = <rect x="22.4" y="52" width="19.4" height="3" rx="1" fill={METAL.gold.base} strokeWidth={LINE.part} />;
  if (tier === 1) {
    return {
      outfit: { top: FAMILY_TONES.mage, legs: '#3a2f48', boots: LEATHER, belt: null, hair: HAIR.silver },
      cut: 'robe',
      hair: 'long',
      mood: 'smile',
      frontHand: 'grip',
      backHand: 'low',
      coversCrown: true,
      torsoOver: sash,
      headOver: <WizardHat tone={FAMILY_TONES.mage} band={METAL.gold.base} icicles={false} moon={false} />,
      handItem: (
        <Held at={FRONT_HAND.grip} angle={4}>
          <Staff top="gem" />
        </Held>
      ),
    };
  }
  const grand = tier === 3;
  if (branch === 'A') {
    const tone = grand ? FAMILY_TONES.mageA : FAMILY_TONES.mageElement;
    return {
      outfit: { top: tone, legs: '#2b2440', boots: LEATHER, belt: null, hair: HAIR.silver },
      cut: 'robe',
      hair: 'long',
      mood: grand ? 'serene' : 'smile',
      frontHand: 'grip',
      backHand: 'raise',
      coversCrown: true,
      aura: grand ? <Aura id={`${uid}-aura`} color={GLOW.star} /> : undefined,
      behind: <Cape color={ELEMENT_CAPE.base} shade={ELEMENT_CAPE.shade} trim={grand ? METAL.gold.base : undefined} length={grand ? 'long' : 'short'} />,
      torsoOver: (
        <>
          {sash}
          <path d="M21 68.6H43.4" stroke={METAL.gold.base} strokeWidth={LINE.silhouette} />
          {grand ? <path d={ROBE_STARS} fill={GLOW.star} stroke="none" /> : null}
        </>
      ),
      headOver: <WizardHat tone={tone} band={METAL.gold.base} icicles={false} moon={grand} gems={!grand} />,
      handItem: (
        <Held at={FRONT_HAND.grip} angle={4}>
          <Staff top={grand ? 'astral' : 'elements'} />
        </Held>
      ),
      front: (
        <>
          <Orb cx={13} cy={36} r={2.4} color={ACCENT.fire} />
          <Orb cx={57.6} cy={40} r={2.2} color={ACCENT.leaf} />
          {grand ? (
            <>
              <Orb cx={11} cy={56} r={2} color={ACCENT.water} />
              <Sparkles spots={[{ x: 57, y: 10, size: 3.8 }]} color={GLOW.star} />
            </>
          ) : null}
        </>
      ),
    };
  }
  const tone = grand ? FAMILY_TONES.mageWinter : FAMILY_TONES.mageB;
  return {
    outfit: { top: tone, legs: '#2a3a52', boots: { base: '#e8eef4', shade: '#b6c4d2', light: '#ffffff' }, belt: null, hair: HAIR.silver },
    cut: 'robe',
    hair: 'long',
    mood: grand ? 'serene' : 'focus',
    frontHand: 'grip',
    backHand: 'low',
    coversCrown: true,
    aura: grand ? <Aura id={`${uid}-aura`} color={GLOW.ice} /> : undefined,
    torsoOver: (
      <>
        <FurHem />
        <rect x="22.4" y="52" width="19.4" height="3" rx="1" fill={grand ? METAL.steel.base : CLOTH_WHITE.base} strokeWidth={LINE.part} />
        {grand ? (
          <path
            d="M23 40.4Q20.6 47.6 22.6 50.4L25 49.4L27 51.4L29.4 49.8L31.8 51.8L34.2 49.8L36.6 51.4L38.8 49.4L41.2 50.4Q43 47.6 41 40.4Z"
            fill={CLOTH_WHITE.base}
            strokeWidth={LINE.part}
          />
        ) : null}
      </>
    ),
    faceOver: <path d="M24.4 38.4Q32 42.6 40.2 38.4L40.8 41.2Q32 45.4 23.8 41.2Z" fill={CLOTH_WHITE.base} strokeWidth={LINE.part} />,
    headOver: <WizardHat tone={tone} band={grand ? ACCENT.crystal : CLOTH_WHITE.base} icicles={grand} moon={false} />,
    handItem: (
      <Held at={FRONT_HAND.grip} angle={4}>
        <Staff top={grand ? 'winter' : 'ice'} />
      </Held>
    ),
    front: grand ? (
      <Sparkles
        spots={[
          { x: 57, y: 14, size: 3.8 },
          { x: 10, y: 40, size: 3.4 },
          { x: 58, y: 62, size: 3.2 },
        ]}
        color={GLOW.ice}
      />
    ) : (
      <Sparkles spots={[{ x: 57, y: 20, size: 3.2 }]} color={GLOW.ice} />
    ),
  };
}
