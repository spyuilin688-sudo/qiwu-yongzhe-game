import type { ReactNode } from 'react';
import { circle, dots, polar, polygon, rays, shape, sparkle, strokes } from '../skills/geometry.ts';
import { Diagonal, Grow, Ink, Shine, Tube, type EquipDesign, type Paint } from './kit.tsx';
import { DETAIL, MAT } from './palette.ts';

const WHITE = DETAIL.white;

/** 水滴範本（尖端朝上、單位座標）：毒液滴落。 */
const DROP = 'M0 -1.9Q0.55 -0.9 0.95 -0.15Q1.25 1 0 1Q-1.25 1 -0.95 -0.15Q-0.55 -0.9 0 -1.9Z';

/** 苦無：菱形刃、纏布柄、柄尾圓環；直立繪製，圓環圓心 (24, 38.6) 作為揮動的軸心。 */
const KUNAI_PIVOT = { x: 24, y: 38.6 } as const;
/** 苦無剪影（刃＋柄一筆、不含圓環）：殘影只畫這個輪廓，不描邊，才讀成「拖影」而不是另外三把苦無。 */
const KUNAI_SILHOUETTE = 'M24 3L29.2 16.4L26.1 20.1V35.2H21.9V20.1L18.8 16.4Z';

/** 殘影苦無：主苦無斜 45°，殘影以小角距落後在逆時針方向，越遠越淡，連成一道揮動的扇形拖影。 */
const KUNAI_AFTERIMAGES = [
  { angle: 3, opacity: 0.3 },
  { angle: 17, opacity: 0.5 },
  { angle: 31, opacity: 0.75 },
] as const;
const KUNAI_ANGLE = 45;
/** 主苦無放大倍率：殘影維持原尺寸，主體才是小尺寸下第一眼看到的那把。 */
const KUNAI_MAIN_SCALE = 1.18;

/**
 * 三相星核：火、冰、雷三顆元素珠位於核心外 120° 三個方位（與「元素引爆」技能圖同一排法：火上、冰右下、雷左下），
 * 金框三邊向核心內凹成三芒形；直邊三角框配正中圓核容易讀成既有的知名符號，內凹邊才是自己的剪影。
 */
const TRIAD = { cx: 24, cy: 28.5, radius: 18, core: 9.6, orb: 4.8, pull: 0.4 } as const;
const triadPoint = (deg: number) => polar(TRIAD.cx, TRIAD.cy, TRIAD.radius, deg);
const TRIAD_ORBS = [
  { at: triadPoint(-90), tone: MAT.ruby },
  { at: triadPoint(30), tone: MAT.sapphire },
  { at: triadPoint(150), tone: MAT.amethyst },
] as const;

/** 兩顆元素珠之間的金框邊：控制點由邊中點往核心拉 pull 比例，邊就向內凹。 */
function concaveSide([ax, ay]: readonly [number, number], [bx, by]: readonly [number, number]): string {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const qx = mx + (TRIAD.cx - mx) * TRIAD.pull;
  const qy = my + (TRIAD.cy - my) * TRIAD.pull;
  return `M${ax.toFixed(2)} ${ay.toFixed(2)}Q${qx.toFixed(2)} ${qy.toFixed(2)} ${bx.toFixed(2)} ${by.toFixed(2)}`;
}
const TRIAD_FRAME = [
  concaveSide(TRIAD_ORBS[0].at, TRIAD_ORBS[1].at),
  concaveSide(TRIAD_ORBS[1].at, TRIAD_ORBS[2].at),
  concaveSide(TRIAD_ORBS[2].at, TRIAD_ORBS[0].at),
].join('');

/** 零度法典傾斜角：與寒霧法典的直立書本拉開剪影；冰柱仍垂直往下掛，所以另外在畫面座標畫。 */
const TOME_TILT = -12;

function kunai(paint: Paint): ReactNode {
  return (
    <>
      <path d="M24 3L29.2 16.4L24 22.6L18.8 16.4Z" fill={paint.split(MAT.steel)} />
      <rect x="21.9" y="22" width="4.2" height="13.2" rx="1.2" fill={MAT.night.base} />
      <Tube d={circle(KUNAI_PIVOT.x, KUNAI_PIVOT.y, 3.2)} width={2.6} color={MAT.gold.base} />
    </>
  );
}

/** 直刃短刀（無聲雙刃的單支）：斜切刃尖、暗夜色刃身配一道鋼色刃口（22px 才讀得出是刀而非木棍）、金色圓鍔、紫纏柄。 */
function silentBlade(paint: Paint): ReactNode {
  return (
    <>
      <path d="M20.6 31V7.6L27.4 2.2V31Z" fill={paint.split(MAT.night)} />
      <path d="M25.6 3.6L27.4 2.2V31H25.6Z" fill={MAT.steel.shade} stroke="none" />
      <Shine d="M22 9V29" color={MAT.amethyst.light} width={1.3} />
      <ellipse cx="24" cy="32.4" rx="5.4" ry="2.2" fill={paint.split(MAT.gold)} strokeWidth={1.6} />
      <rect x="21.6" y="34.4" width="4.8" height="9.6" rx="1.4" fill={MAT.purple.shade} />
      <Ink d={strokes([[21.9, 36.4, 26.1, 39.4], [26.1, 36.4, 21.9, 39.4], [21.9, 40, 26.1, 43], [26.1, 40, 21.9, 43]])} width={0.9} color={MAT.amethyst.light} />
      <circle cx="24" cy="45.8" r="2.2" fill={paint.ball(MAT.amethyst)} strokeWidth={1.4} />
    </>
  );
}

/**
 * 依「裝備基底 ID」的專屬圖（同種類的基底各自一張，避免同種裝備長得一樣）。
 * 未列在這裡的基底退回種類代表圖（registry.ts 的 equipDesignFor）。
 * 法師系、盜賊系三階武器與副手：一律加上金飾、寶石或光芒，與二階的種類代表圖拉開剪影與主色。
 */
export const ARCANE_SHADOW_BASE_DESIGNS: Readonly<Record<string, EquipDesign>> = {
  /** 星界長杖：星紫長杖的杖頭向內捲成星漩，漩心托著一顆發光的藍色星珠，金箍與金尖點綴；赤曜法杖是棕木直杖頂金月托紅寶石。 */
  EQ033: (p) => (
    <>
      {/* 捲頭往左上長，整支略縮並右移，杖頭與金尖才都留在框內。 */}
      <Grow by={0.95} cy={23.4} dx={4.75}>
        <Diagonal mid={20}>
          <Tube d="M24 47V12A8.4 8.4 0 1 0 9.66 17.94" width={5.4} color={MAT.purple.base} />
          <Shine d="M22.9 20V44" color={MAT.purple.light} width={1.1} />
          <circle cx="9.66" cy="17.94" r="2.5" fill={p.ball(MAT.gold)} strokeWidth={1.5} />
          <path d="M21.4 46.6H26.6L24 51.6Z" fill={p.split(MAT.gold)} />
          <rect x="20.6" y="19" width="6.8" height="4.2" rx="1.6" fill={p.split(MAT.gold)} />
          <rect x="20.8" y="31.4" width="6.4" height="3.4" rx="1.2" fill={MAT.gold.base} strokeWidth={1.5} />
          <circle cx="15.6" cy="12" r="6.3" fill={p.ball(MAT.sapphire)} strokeWidth={1.7} />
          <path d={sparkle(15.6, 12, 4.6)} fill={MAT.gold.light} stroke="none" />
          <path d={dots([[12.6, 8.8, 0.9], [19.2, 15.2, 0.7]])} fill={WHITE} stroke="none" />
        </Diagonal>
      </Grow>
      <path d={[sparkle(9.4, 11.6, 3), sparkle(39.6, 34.6, 2.5)].join('')} fill={MAT.gold.base} strokeWidth={1} />
    </>
  ),

  /**
   * 三相星核：內凹三芒金框的三個尖端各嵌火紅、冰藍、雷紫元素珠，中央星空核心放出四芒星光；雷紋法珠是單一星核繞一圈斜金環。
   * 核心刻意用四芒閃光而非六芒星：藍底白／金六芒星容易被看成宗教或國家標誌。
   */
  EQ034: (p) => (
    <>
      <Tube d={TRIAD_FRAME} width={3.4} color={MAT.gold.base} />
      <circle cx={TRIAD.cx} cy={TRIAD.cy} r={TRIAD.core} fill={p.ball(MAT.cosmos)} />
      <path d={sparkle(TRIAD.cx, TRIAD.cy, TRIAD.core * 0.82)} fill={MAT.gold.light} strokeWidth={1.2} />
      <circle cx={TRIAD.cx} cy={TRIAD.cy} r={1.4} fill={WHITE} stroke="none" />
      {TRIAD_ORBS.map(({ at: [x, y], tone }) => (
        <circle key={tone.base} cx={x} cy={y} r={TRIAD.orb} fill={p.ball(tone)} />
      ))}
      <path d={dots(TRIAD_ORBS.map(({ at: [x, y] }) => [x - 1.7, y - 1.7, 0.9] as const))} fill={WHITE} stroke="none" />
    </>
  ),

  /** 永冬權杖：較短的霜藍權杖，金冠托著一枚六角冰晶（不畫內部細線，22px 才不會糊成深色一團），金色球形柄頭；霜枝冰杖是銀杖頂三根冰柱。 */
  EQ037: (p) => (
    <g transform="translate(-1.8 1.2)">
      <Diagonal mid={24.6} angle={40}>
        <Tube d="M24 20V44" width={5.6} color={MAT.frost.base} />
        <Shine d="M22.9 24V41" color={MAT.frost.light} width={1.1} />
        <rect x="20.8" y="31.6" width="6.4" height="3.6" rx="1.2" fill={MAT.gold.base} strokeWidth={1.5} />
        <circle cx="24" cy="46.4" r="3.2" fill={p.ball(MAT.gold)} />
        <Grow by={1.14} cy={12}>
          {/* 用六角冰晶（六邊形）而非實心六芒星：六芒星容易被看成宗教標誌；尖刺版在 22px 只剩深色描邊。 */}
          <path d={polygon(24, 7.4, 7.8, 6)} fill={p.split(MAT.ice)} />
          <path d={polygon(24, 7.4, 2.8, 6)} fill={MAT.sapphire.base} strokeWidth={1.2} />
          <path d="M16.8 22.2L15.6 13.8L19.8 16.8L24 12.2L28.2 16.8L32.4 13.8L31.2 22.2Z" fill={p.split(MAT.gold)} />
          <circle cx="24" cy="18.6" r="1.6" fill={MAT.sapphire.base} strokeWidth={1.1} />
        </Grow>
        <path d={[sparkle(35, 10, 2.6), sparkle(12.4, 15, 2.2)].join('')} fill={WHITE} stroke="none" />
      </Diagonal>
    </g>
  ),

  /**
   * 零度法典：整本向左傾斜的冰白厚書，深藍書背、金色護角，封面中央一圈金色「零」環扣著藍寶冰晶，傾斜的下緣垂著冰柱；
   * 寒霧法典是直立的藍封面配白雪花、銀護角，22px 下靠傾斜剪影、淺色封面與金環三點區分。
   */
  EQ038: (p) => (
    <Grow by={0.96} dx={0.5}>
      <g transform={`rotate(${TOME_TILT} 24 24)`}>
        <rect x="13.4" y="7.6" width="24.6" height="33.6" rx="2.6" fill={MAT.sapphire.shade} />
        <rect x="12.4" y="6.4" width="23.6" height="33" rx="1.6" fill={MAT.paper.base} />
        <Ink d={strokes([[36.6, 11, 36.6, 37], [16, 40.6, 34, 40.6]])} width={0.9} color={MAT.paper.shade} />
        <rect x="9.6" y="4" width="24.4" height="34" rx="2.6" fill={p.split(MAT.ice)} />
        <rect x="9.6" y="4" width="4.6" height="34" rx="2" fill={MAT.sapphire.shade} />
        <path d="M27.4 4H31.4Q34 4 34 6.6V10.6ZM34 31.4V35.4Q34 38 31.4 38H27.4Z" fill={p.split(MAT.gold)} strokeWidth={1.4} />
        <Tube d={circle(23.6, 20.4, 6.2)} width={3.4} color={MAT.gold.base} />
        <path d="M23.6 15.8L26.6 20.4L23.6 25L20.6 20.4Z" fill={p.split(MAT.sapphire)} strokeWidth={1.2} />
        <rect x="31.6" y="17.6" width="5" height="6.4" rx="1.2" fill={p.split(MAT.gold)} />
      </g>
      {/* 冰柱上緣沿著傾斜後的封面下緣，尖端垂直朝下。 */}
      <path d="M17.4 39.2L19.1 45.9L20.8 38.5ZM23.3 38L25 42.6L26.6 37.3ZM29.2 36.7L30.8 44L32.5 36Z" fill={p.split(MAT.ice)} strokeWidth={1.4} />
    </Grow>
  ),

  /** 無聲雙刃：兩把斜切刃尖的暗夜直刃並排，金鍔紫柄，以紫布條綁成一對；月牙雙刃是兩把銀色彎刃交叉成 X。 */
  EQ041: (p) => (
    // 綁帶與柄頭在左下、重心偏低，整組上移才置中。
    <g transform="translate(0 -1.5)">
      <Diagonal mid={24} offset={-5.2}>{silentBlade(p)}</Diagonal>
      <Diagonal mid={24} offset={5.2}>{silentBlade(p)}</Diagonal>
      <Diagonal mid={24}>
        <rect x="15.6" y="38" width="16.8" height="3.6" rx="1.2" fill={p.split(MAT.purple)} strokeWidth={1.6} />
        <rect x="22" y="37" width="4" height="5.6" rx="1.2" fill={MAT.purple.shade} strokeWidth={1.4} />
      </Diagonal>
    </g>
  ),

  /**
   * 殘影忍具：一把金環苦無斜揮，身後拖著三道不描邊、越來越淡的暗紫灰殘影（亮紫色會讀成水晶），連成揮動的扇形拖影；夜行忍具是苦無壓著大手裏劍。
   * 軸心環在左下、刀尖往右上掃，整組左移才置中。
   */
  EQ042: (p) => (
    <g transform="translate(-12.1 -0.1)">
      {KUNAI_AFTERIMAGES.map(({ angle, opacity }) => (
        <path
          key={angle}
          d={KUNAI_SILHOUETTE}
          transform={`rotate(${angle} ${KUNAI_PIVOT.x} ${KUNAI_PIVOT.y})`}
          fill={MAT.night.light}
          stroke="none"
          opacity={opacity}
        />
      ))}
      <g transform={`rotate(${KUNAI_ANGLE} ${KUNAI_PIVOT.x} ${KUNAI_PIVOT.y})`}>
        <Grow by={KUNAI_MAIN_SCALE} cx={KUNAI_PIVOT.x} cy={KUNAI_PIVOT.y}>
          {kunai(p)}
          <Ink d="M24 6V20" width={1} color={MAT.steel.shade} />
          <Ink d={strokes([[22.2, 25, 25.8, 27.4], [22.2, 29, 25.8, 31.4]])} width={1} color={MAT.night.light} />
        </Grow>
      </g>
    </g>
  ),

  /** 蝕骨毒刃：蛇行波浪的暗鋼刃身流著毒綠紋、刃邊滴毒，骨節握柄、骨角護手、骷髏柄頭；蛇牙匕首是單彎鋼刃配木柄。 */
  EQ045: (p) => (
    <>
      <Diagonal mid={25.4}>
        <path d="M24 0.8Q28.6 6 27.4 9Q26.2 12 27.9 15Q29.6 18 28.3 21Q27 24 27.9 27.5L28.8 31H19.2L18.9 27.5Q18.6 24 20.1 21Q21.6 18 20.3 15Q19 12 20.8 9Q22.6 6 24 0.8Z" fill={p.split(MAT.darkIron)} />
        <Ink d="M24.6 5Q25.6 8 23.6 12Q22.2 15 24.6 18Q26 21 23.8 24.4Q22.8 27 24 29.4" width={2} color={MAT.venom.base} />
        <path d="M20.6 32.4Q14.4 31.8 12.6 25.4Q17 29 22 29.4ZM27.4 32.4Q33.6 31.8 35.4 25.4Q31 29 26 29.4Z" fill={p.split(MAT.bone)} strokeWidth={1.6} />
        <rect x="19.6" y="30.4" width="8.8" height="4" rx="1.6" fill={p.split(MAT.gold)} />
        <rect x="21.2" y="34.4" width="5.6" height="8.6" rx="1.6" fill={MAT.bone.base} />
        <Ink d={strokes([[21.5, 37.2, 26.5, 37.2], [21.5, 40.2, 26.5, 40.2]])} width={1.1} color={MAT.bone.shade} />
        <circle cx="24" cy="46" r="3.4" fill={p.ball(MAT.bone)} />
        <path d={dots([[22.7, 45.8, 0.8], [25.3, 45.8, 0.8]])} fill={DETAIL.hollow} stroke="none" />
      </Diagonal>
      <path d={[shape(DROP, 38.6, 21.4, 1.6), shape(DROP, 33.4, 28.6, 1.2)].join('')} fill={MAT.venom.base} strokeWidth={1.3} />
    </>
  ),

  /** 黑棘毒囊：束口的紫色皮囊，囊身零星長出黑鐵棘刺，縫線透出毒綠光、袋口冒毒氣，金繩束口、底部滴毒；陶製毒瓶是圓底透明玻璃瓶。 */
  EQ046: (p) => (
    <>
      <path d={dots([[20, 5.4, 2.4], [26.4, 3.8, 2], [30.4, 7, 1.6]])} fill={MAT.venom.light} strokeWidth={1.2} />
      <path d={rays(24, 30, 10, 18, [-18, 28, 56, 152, 206], 9)} fill={p.split(MAT.darkIron)} strokeWidth={1.6} />
      <path d="M14.6 14.2Q13.4 10 15.2 7.6Q18.4 9.8 20 8.2Q22 6.2 24 7.6Q26 6.2 28 8.2Q29.6 9.8 32.8 7.6Q34.6 10 33.4 14.2Z" fill={p.split(MAT.purple)} />
      <ellipse cx="24" cy="9.6" rx="5.4" ry="1.4" fill={DETAIL.hollow} strokeWidth={1.2} />
      <path d="M18.8 15Q9.6 19.6 10 30Q10.8 42.4 24 42.4Q37.2 42.4 38 30Q38.4 19.6 29.2 15Z" fill={p.ball(MAT.purple)} />
      <path d="M24 16.6Q20.4 24 24 30.6Q27.6 36.6 24 41" fill="none" stroke={MAT.venom.base} strokeWidth={1.8} strokeDasharray="2.2 1.6" />
      <path d={dots([[17.4, 27.4, 1.8], [30.6, 31.6, 1.4], [18.6, 35.6, 1.1]])} fill={MAT.venom.base} strokeWidth={1.1} />
      <rect x="16.6" y="12.4" width="14.8" height="3.6" rx="1.6" fill={p.split(MAT.gold)} />
      <Tube d="M30.4 15.4Q34.6 17.4 33.6 22" width={2} color={MAT.gold.base} />
      <path d={shape(DROP, 24, 45, 1.4)} fill={MAT.venom.base} strokeWidth={1.3} />
    </>
  ),
};
