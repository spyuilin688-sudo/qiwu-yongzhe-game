import { dots, ellipse, polar, shape, sparkle, star, strokes } from './geometry.ts';
import { Beam, Glint, TEMPLATE, at, type SkillGlyph } from './kit.tsx';
import { FX } from './palette.ts';

const KITE_HALF = 'M0 -1L0.36 0.45L0 1Z';
const STAR_PURPLE = '#d8c2ff';

/** 雪花六臂：三條直徑，每臂在 0.6 處長出一對 45° 小枝。 */
function snowflakeArms(cx: number, cy: number, r: number, branch: number): string {
  const parts: string[] = [];
  for (const deg of [-90, -30, 30, 90, 150, 210]) {
    const [ex, ey] = polar(cx, cy, r, deg);
    parts.push(strokes([[cx, cy, ex, ey]]));
    const [bx, by] = polar(cx, cy, r * 0.6, deg);
    for (const side of [-45, 45]) {
      const [tx, ty] = polar(bx, by, branch, deg + side);
      parts.push(strokes([[bx, by, tx, ty]]));
    }
  }
  return parts.join('');
}

/** 六片尖瓣（寒晶綻放）：rotate 為整朵花的起始角度。 */
function petals(r: number, size: number, length: number, angles: readonly number[]): string {
  return angles.map((deg) => {
    const [x, y] = polar(24, 24, r, deg);
    return shape(TEMPLATE.diamond, x, y, size, length, deg + 90);
  }).join('');
}

/** 法師系（紫底）：元素術士走火、冰、雷與引爆，冰咒師一線全以冰晶的不同形態區分。 */
export const MAGE_GLYPHS: Readonly<Record<string, SkillGlyph>> = {
  /** 火球術：三層火焰的火球往右上飛，尾焰拖向左下。 */
  SK021: () => (
    <>
      <path d={at(TEMPLATE.drop, 24.6, 23.4, 11.6, 225, 1.5)} fill={FX.fire.shade} />
      <path d={at(TEMPLATE.drop, 26.4, 21.6, 7.6, 225, 1.5)} fill={FX.fire.base} strokeWidth={1.4} />
      <circle cx="29.4" cy="18.6" r="4.4" fill={FX.fire.light} strokeWidth={1.2} />
      <path d={dots([[39, 30, 1.3], [34, 36.6, 1], [12.6, 11.6, 1.1]])} fill={FX.fire.light} stroke="none" />
    </>
  ),

  /** 冰錐術：一根稜角分明的冰錐射向右上，身後掉落冰屑。 */
  SK022: () => {
    const spike = at(TEMPLATE.kite, 26, 22, 12, 45, 1.55);
    return (
      <>
        <path d={spike} fill={FX.ice.base} stroke="none" />
        <path d={shape(KITE_HALF, 26, 22, 12, 18.6, 45)} fill={FX.ice.shade} stroke="none" />
        <path d={spike} fill="none" />
        <path d={[at(TEMPLATE.diamond, 11.6, 37, 2.8, 45, 1.4), at(TEMPLATE.diamond, 8.6, 30, 2, 45, 1.4)].join('')} fill={FX.ice.light} strokeWidth={1.2} />
        <path d={[sparkle(37, 33, 2.8), sparkle(13, 14, 2.2)].join('')} fill={FX.white} stroke="none" />
      </>
    );
  },

  /** 連鎖閃電：雷電在三個雷印之間來回跳躍。 */
  SK023: () => (
    <>
      <Beam d="M10 12L19.6 17.4L17.6 12.6L28 19.2L26 14.6L37 18.4" color={FX.bolt.base} width={2.2} />
      <Beam d="M37 18.4L31 26.4L34 27.4L24 32.4L26.4 34L17.4 38.6" color={FX.bolt.base} width={2.2} />
      <path d={dots([[10, 12, 3.4], [37, 18.4, 3.4], [17.4, 38.6, 3.4]])} fill={FX.bolt.light} strokeWidth={1.6} />
      <path d={dots([[10, 12, 1.2], [37, 18.4, 1.2], [17.4, 38.6, 1.2]])} fill={FX.bolt.shade} stroke="none" />
    </>
  ),

  /** 元素引爆：一團爆光中心，火、冰、雷三種元素印記被一起引爆。 */
  SK024: () => (
    <>
      <path d={star(24, 24, 10, 12.6, 7.4)} fill={FX.bolt.light} strokeWidth={1.4} />
      <circle cx="24" cy="24" r="4.2" fill={FX.white} strokeWidth={1.2} />
      <path d={at(TEMPLATE.flame, 24, 8.4, 4.6)} fill={FX.fire.base} strokeWidth={1.4} />
      <path d={at(TEMPLATE.diamond, 38, 32, 5, 0, 1)} fill={FX.ice.base} strokeWidth={1.4} />
      <path d={at(TEMPLATE.bolt, 10, 32, 5.4)} fill={FX.bolt.base} strokeWidth={1.4} />
    </>
  ),

  /** 流星刻陣：流星墜入地面的雙圈法陣，陣上四個節點代表四次傷害。 */
  SK025: () => (
    <>
      <Beam d={ellipse(24, 35, 16, 5.6)} color={STAR_PURPLE} width={1.8} />
      <path d={ellipse(24, 35, 10, 3.4)} fill="none" stroke={STAR_PURPLE} strokeWidth={1.2} />
      <path d={dots([[40, 35, 1.7], [24, 40.6, 1.7], [8, 35, 1.7], [24, 29.4, 1.7]])} fill={FX.gold.base} strokeWidth={1.1} />
      <path d={at(TEMPLATE.drop, 33, 14, 5.6, 45, 2)} fill={FX.fire.light} strokeWidth={1.4} />
      <circle cx="28.4" cy="19" r="4.6" fill={FX.fire.base} strokeWidth={1.6} />
      <circle cx="27.4" cy="18" r="1.6" fill={FX.fire.light} stroke="none" />
    </>
  ),

  /** 星界崩解：巨星裂開、碎片四散，外圈一道星軌。 */
  SK026: () => (
    <>
      <ellipse cx="24" cy="24" rx="19" ry="6.4" transform="rotate(-24 24 24)" fill="none" strokeWidth={3.8} />
      <ellipse cx="24" cy="24" rx="19" ry="6.4" transform="rotate(-24 24 24)" fill="none" stroke={STAR_PURPLE} strokeWidth={1.6} />
      <path d={star(24, 24, 5, 13.6, 6)} fill={FX.gold.base} />
      <path d="M24 11.4L22.4 19L26 23.4L22.4 28.4L24.4 35" fill="none" strokeWidth={1.4} />
      <path d="M36.6 7.6L40.2 9L37.6 11.8ZM9.6 36.4L6.6 38L8.8 33.6ZM38.6 34.4L41.4 37.2L37.6 36.8Z" fill={FX.gold.light} strokeWidth={1.2} />
    </>
  ),

  /** 霜環：冰環向外長出六根冰刺，一次凍住周圍敵人。 */
  SK027: () => (
    <>
      <path
        d={[-90, -30, 30, 90, 150, 210].map((deg) => {
          const [x, y] = polar(24, 24, 12.4, deg);
          return shape(TEMPLATE.kite, x, y, 4.2, 6.2, deg + 90);
        }).join('')}
        fill={FX.ice.light}
        strokeWidth={1.4}
      />
      <Beam d={ellipse(24, 24, 11, 11)} color={FX.ice.base} width={3} />
      <circle cx="24" cy="24" r="2.6" fill={FX.ice.base} strokeWidth={1.3} />
    </>
  ),

  /** 碎冰術：冰塊被敲出裂痕，碎片往外飛散。 */
  SK028: () => (
    <>
      <path d="M22 11L34 17.6L22 24.2L10 17.6Z" fill={FX.ice.light} />
      <path d="M10 17.6L22 24.2V38L10 31.4Z" fill={FX.ice.base} />
      <path d="M22 24.2L34 17.6V31.4L22 38Z" fill={FX.ice.shade} />
      <path d="M15 14.4L19.6 19L16.6 23.6L20.6 28.6L17.6 34M27 21L29.6 26.4L27.4 31" fill="none" strokeWidth={1.4} />
      <path d="M37 9.6L41 11.6L38 14.4ZM38 22L42 23.4L38.6 26.6ZM33.6 36L37.6 35.6L35.4 39.6Z" fill={FX.ice.base} strokeWidth={1.2} />
    </>
  ),

  /** 寒晶綻放：冰晶像花一樣綻開六片尖瓣。 */
  SK029: () => (
    <>
      <path d={petals(9, 4, 9.4, [-90, 30, 150])} fill={FX.ice.base} />
      <path d={petals(8.2, 3.4, 8, [-30, 90, 210])} fill={FX.ice.light} />
      <circle cx="24" cy="24" r="3.8" fill={FX.white} strokeWidth={1.4} />
      <path d={dots([[9, 12, 1.1], [39, 12, 1.1], [24, 42, 1.1]])} fill={FX.white} stroke="none" />
    </>
  ),

  /** 零度終章：巨大雪花帶著淡色寒氣光暈，中央六角冰核。 */
  SK030: () => (
    <>
      <path d={star(24, 24, 12, 19, 14.6)} fill={FX.ice.base} fillOpacity={0.35} stroke="none" />
      <Beam d={snowflakeArms(24, 24, 15.4, 4.6)} color={FX.white} width={2.4} />
      <path d={star(24, 24, 3, 5.4, 5.4)} fill={FX.ice.base} strokeWidth={1.4} />
      <Glint d="M22.6 22.4L24 21.6" color={FX.white} width={1.2} />
    </>
  ),
};
