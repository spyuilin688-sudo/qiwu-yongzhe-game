import { circle, crescent, dots, polar, sparkle, star, strokes } from './geometry.ts';
import { Beam, Dagger, Glint, Place, TEMPLATE, at, type SkillGlyph } from './kit.tsx';
import { FX } from './palette.ts';

const CLOUD =
  'M9.6 36.6Q5.4 36.6 6 32.2Q6.6 28 11 28.6Q11.4 22.6 17.4 22.6Q20.6 17.6 26.6 19.4Q31.6 17 34.6 22Q40.6 22 40.6 27.6Q43.6 30.4 41.4 34.4Q39.8 37.4 35.6 36.6Z';
const FLASK = 'M-2 -6H2V-2.6Q5.6 -1 5.6 2.6Q5.6 7 0 7Q-5.6 7 -5.6 2.6Q-5.6 -1 -2 -2.6Z';
const GLASS = '#dcefee';

/** 苦無（尖端朝上，長約 19）：投刃散射用。 */
function Kunai() {
  return (
    <>
      <path d="M0 -9L2.6 -1.4L0 1.4L-2.6 -1.4Z" fill={FX.steel.base} />
      <path d="M-1 1.4H1V6H-1Z" fill={FX.shadow.shade} />
      <circle cx="0" cy="8" r="1.8" fill="none" strokeWidth={1.2} />
    </>
  );
}

/** 三枚苦無的位置與朝向（角度 0 朝上、順時針）。 */
const KUNAI_FAN = [
  { x: 19, y: 14, angle: 42 },
  { x: 30.6, y: 22.4, angle: 78 },
  { x: 28.6, y: 35.6, angle: 112 },
] as const;

/** 盜賊系（暗紫底）：影刃刺客走刀與影，毒刃獵手一線全以毒綠表現。 */
export const ROGUE_GLYPHS: Readonly<Record<string, SkillGlyph>> = {
  /** 迅影刺：短刀向右急刺，身後拖著紫色殘影與速度線。 */
  SK031: () => (
    <>
      <Beam d={strokes([[5, 17.6, 11, 17.6], [4, 24, 9, 24], [5, 30.4, 11, 30.4]])} color={FX.shadow.light} width={1.2} />
      <Place x={18} y={24} angle={90} scale={1.05} opacity={0.5}>
        <Dagger ghost={FX.shadow.base} />
      </Place>
      <Place x={28} y={24} angle={90} scale={1.1}>
        <Dagger />
      </Place>
      <path d={[sparkle(40.4, 16.4, 2.8), sparkle(41, 31.6, 2.2)].join('')} fill={FX.white} stroke="none" />
    </>
  ),

  /** 投刃散射：三枚苦無扇形飛出，各自拖著殘影線。 */
  SK032: () => (
    <>
      <Glint
        d={strokes(
          KUNAI_FAN.map(({ x, y, angle }) => {
            const [bx, by] = polar(x, y, 13, angle + 90);
            const [sx, sy] = polar(x, y, 6, angle + 90);
            return [sx, sy, bx, by] as const;
          }),
        )}
        color={FX.shadow.light}
        width={1.6}
      />
      {KUNAI_FAN.map(({ x, y, angle }) => (
        <Place key={angle} x={x} y={y} angle={angle} scale={1.05}>
          <Kunai />
        </Place>
      ))}
    </>
  ),

  /** 影襲：三道紫色暗影爪斬劃過，下方三枚連擊點。 */
  SK033: () => (
    <>
      <path d={[crescent(27, 5.6, 9, 31, 3.6, 3.2), crescent(33, 8, 15, 35, 3.8, 3.4), crescent(39, 11, 21, 38, 3.6, 3.2)].join('')} fill={FX.shadow.base} />
      <Glint d="M24 10Q16 19 13 27M30.4 12.6Q22 22 19 31" color={FX.shadow.light} />
      <path d={[at(TEMPLATE.diamond, 9.6, 38.4, 2.8), at(TEMPLATE.diamond, 15, 38.4, 2.8), at(TEMPLATE.diamond, 20.4, 38.4, 2.8)].join('')} fill={FX.gold.base} strokeWidth={1.2} />
    </>
  ),

  /** 破綻標記：碎裂的紅色獵圈，一把短刀指向裂縫。 */
  SK034: () => (
    <>
      <Beam d={circle(22, 27, 11)} color={FX.mark} width={2.4} dash="14 3.4" />
      <Beam d="M22 16.4L19.6 23L24 27L20.6 32.4L22.6 37.6" color={FX.white} width={1.4} />
      <Place x={36} y={12} angle={225} scale={0.8}>
        <Dagger />
      </Place>
    </>
  ),

  /** 疾影連殺：一道之字形影跡在敵人間穿梭，轉折處迸出斬擊。 */
  SK035: () => {
    const trail = 'M7.6 38L16.6 14.6L26 33.4L35 12';
    return (
      <>
        <path d={trail} fill="none" strokeWidth={7.2} />
        <path d={trail} fill="none" stroke={FX.shadow.base} strokeWidth={4.4} />
        <path d={trail} fill="none" stroke={FX.white} strokeWidth={1.2} />
        <path d={[sparkle(16.6, 14.6, 4), sparkle(26, 33.4, 4)].join('')} fill={FX.white} strokeWidth={1} />
        <Place x={37.4} y={10.4} angle={30} scale={0.62}>
          <Dagger />
        </Place>
      </>
    );
  },

  /** 無聲處決：月牙下一把短刀垂直落下，旁邊的連擊點被消耗殆盡。 */
  SK036: () => (
    <>
      <path d="M31 6Q12 8 12 24Q12.6 40 31 41.4Q19 35 19 24Q19 12.6 31 6Z" fill={FX.holy.base} />
      <Place x={29} y={24} angle={196} scale={1.25}>
        <Dagger />
      </Place>
      <path d={dots([[39, 13.6, 1.8], [40.4, 20.4, 1.8], [40.4, 27.2, 1.8]])} fill="none" stroke={FX.shadow.light} strokeWidth={1.4} />
    </>
  ),

  /** 淬毒：刀身塗滿毒液往下滴落，右上的上升箭頭代表強化普攻。 */
  SK037: () => (
    <>
      <Place x={21} y={20} angle={32} scale={1.15}>
        <Dagger blade={FX.venom} />
      </Place>
      <path d={[at(TEMPLATE.drop, 28.6, 33.6, 3.2), at(TEMPLATE.drop, 21.4, 38.4, 2.4)].join('')} fill={FX.venom.base} strokeWidth={1.4} />
      <path d={[at(TEMPLATE.chevron, 37.6, 12.4, 3.8), at(TEMPLATE.chevron, 37.6, 18.4, 3.8)].join('')} fill={FX.venom.light} strokeWidth={1.2} />
    </>
  ),

  /** 毒霧投擲：毒瓶劃出拋物線，落地炸成一團毒雲。 */
  SK038: () => (
    <>
      <path d={CLOUD} fill={FX.venom.base} />
      <Glint d="M12 29Q13.4 25.6 17 25.6M21 21.6Q24.6 20.4 27 22" color={FX.venom.light} width={1.6} />
      <path d={dots([[18, 31, 1.7], [28, 29, 1.3], [33.4, 32.6, 1.5]])} fill={FX.venom.shade} stroke="none" />
      <Beam d="M18 10Q28 5.6 33 14" color={FX.cream} width={1.2} dash="2.4 2" />
      <Place x={12.6} y={12} angle={-28}>
        <path d={FLASK} fill={GLASS} />
        <path d="M-5.4 2Q0 0.6 5.4 2Q5.4 6.6 0 6.6Q-5.4 6.6 -5.4 2Z" fill={FX.venom.base} stroke="none" />
        <path d={FLASK} fill="none" />
      </Place>
    </>
  ),

  /** 蔓毒之刃：刀刃上長出毒藤，把毒滴傳到另外兩個目標。 */
  SK039: () => (
    <>
      <Beam d="M23 21Q29 13 36.4 12.6M25 27Q33 28.6 36.4 36" color={FX.venom.base} width={2} />
      <path d={[at(TEMPLATE.diamond, 30.6, 14.6, 2.6, 30, 1), at(TEMPLATE.diamond, 31.4, 30.6, 2.6, -40, 1)].join('')} fill={FX.venom.light} strokeWidth={1.2} />
      <path d={[at(TEMPLATE.drop, 39, 11.4, 2.8), at(TEMPLATE.drop, 38.6, 38.4, 2.8)].join('')} fill={FX.venom.base} strokeWidth={1.4} />
      <Place x={16.6} y={30} angle={45} scale={1.05}>
        <Dagger />
      </Place>
    </>
  ),

  /** 終末毒爆：毒囊爆開成綠色爆光，毒滴往四角飛散。 */
  SK040: () => (
    <>
      <path d={star(24, 24, 10, 16.6, 10)} fill={FX.venom.base} strokeWidth={1.6} />
      <path d={star(24, 24, 10, 11, 7, -72)} fill={FX.venom.light} stroke="none" />
      <path d={at(TEMPLATE.drop, 24, 25, 6.4)} fill={FX.venom.shade} strokeWidth={1.4} />
      <path
        d={[at(TEMPLATE.drop, 8.4, 8.4, 2.6, -45), at(TEMPLATE.drop, 39.6, 8.4, 2.6, 45), at(TEMPLATE.drop, 8.4, 39.6, 2.6, -135), at(TEMPLATE.drop, 39.6, 39.6, 2.6, 135)].join('')}
        fill={FX.venom.base}
        strokeWidth={1.2}
      />
    </>
  ),
};
