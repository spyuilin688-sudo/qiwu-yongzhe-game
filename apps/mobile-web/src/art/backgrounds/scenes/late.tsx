import { BG09, BG10, BG11, BG12 } from '../palette.ts';
import { HORIZON, ZoneTint, circles, cloud, ground, hills, sky, sparkles, strokes, topShade, type SceneDesign } from '../parts.tsx';

const f = (value: number): number => Math.round(value * 10) / 10;

/** 齒輪剪影（遠景大齒輪、王城中樞）。 */
function gear(cx: number, cy: number, radius: number, teeth: number, depth: number, rotation = 0): string {
  const step = (Math.PI * 2) / teeth;
  const at = (r: number, a: number): string => `${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}`;
  let d = '';
  for (let index = 0; index < teeth; index += 1) {
    const a = rotation + index * step;
    d += `${index === 0 ? 'M' : 'L'}${at(radius, a - step * 0.28)}L${at(radius + depth, a - step * 0.16)}L${at(radius + depth, a + step * 0.16)}L${at(radius, a + step * 0.28)}`;
  }
  return `${d}Z`;
}

/** 地面磚縫：橫線越近越疏、直線往消失點收攏，做出透視的地板。 */
function tiles(rows: readonly number[], columns: readonly number[], vanishX: number): string {
  const horizontal = strokes(rows.map((y) => [-10, y, 400, y] as const));
  const vertical = columns.map((x) => `M${f(vanishX + (x - vanishX) * 0.18)} ${HORIZON}L${x} 272`).join('');
  return horizontal + vertical;
}

/** 一層書架上的書背：寬度用固定序列輪替（不用亂數，每次渲染都一樣）。 */
function spines(x0: number, x1: number, shelfY: number, height: number, phase: number, pick: number): string {
  const widths = [5, 4, 6, 3.5, 5, 4.5, 6.5, 4] as const;
  let d = '';
  let x = x0;
  let index = phase;
  while (x < x1 - 3) {
    const w = widths[index % widths.length] ?? 4;
    const h = height - ((index * 7) % 5);
    if (index % 3 === pick) d += `M${f(x)} ${shelfY}V${f(shelfY - h)}h${f(Math.min(w, x1 - x))}V${shelfY}Z`;
    x += w + 0.8;
    index += 1;
  }
  return d;
}

function shelfBooks(x0: number, x1: number, rows: readonly number[], pick: number): string {
  return rows.map((y, row) => spines(x0, x1, y, 26, row * 3, pick)).join('');
}

/** 漂浮書頁：小矩形繞中心旋轉。 */
function pages(list: readonly (readonly [number, number, number])[]): string {
  return list
    .map(([cx, cy, degrees]) => {
      const a = (degrees * Math.PI) / 180;
      const corner = (dx: number, dy: number): string => `${f(cx + dx * Math.cos(a) - dy * Math.sin(a))} ${f(cy + dx * Math.sin(a) + dy * Math.cos(a))}`;
      return `M${corner(-5, -6.5)}L${corner(5, -6.5)}L${corner(5, 6.5)}L${corner(-5, 6.5)}Z`;
    })
    .join('');
}

/** 第 9～12 圖：王城、花園、空島、書庫。 */
export const LATE_SCENES: readonly (readonly [number, SceneDesign])[] = [
  /** 發條王城：蒸汽霧中的鐘塔與圓頂天際線、遠方大齒輪，兩側銅管冒蒸汽，地面是黃銅磚。 */
  [
    9,
    (k, zone) => {
      const P = BG09;
      const s = zone.shift * 0.4;
      const skyline = ([[40, 26, 60], [70, 20, 44], [160, 30, 52], [196, 22, 70], [226, 34, 46], [262, 24, 58], [292, 30, 40]] as const)
        .map(([x, w, h]) => `M${f(x + s)} ${HORIZON + 2}V${HORIZON - h}Q${f(x + s + w / 2)} ${HORIZON - h - w * 0.6} ${f(x + s + w)} ${HORIZON - h}V${HORIZON + 2}Z`)
        .join('');
      const tower = 118 + s;
      return (
        <>
          {sky(k, [[0, P.skyTop], [0.6, P.skyMid], [1, P.skyLow]])}
          <path d={gear(320 - s, 92, 40, 12, 9, zone.index * 0.2)} fill={P.gear} opacity={0.5} />
          <circle cx={320 - s} cy={92} r={14} fill={P.skyMid} opacity={0.6} />
          {zone.isCourt ? (
            <>
              <circle cx={196} cy={110} r={62} fill={k.glow(P.teal, 0.4)} />
              <path d={gear(196, 110, 34, 14, 7, 0.1)} fill="none" stroke={P.teal} strokeWidth={4} opacity={0.55} />
            </>
          ) : null}
          {zone.index === 4 ? (
            <g fill="none" stroke={P.trim} strokeWidth={2.4} opacity={0.5}>
              <ellipse cx={210} cy={96} rx={44} ry={14} transform="rotate(-18 210 96)" />
              <ellipse cx={210} cy={96} rx={44} ry={14} transform="rotate(30 210 96)" />
            </g>
          ) : null}
          <path d={skyline} fill={P.tower} />
          <path d={`M${tower} ${HORIZON + 2}V64L${tower + 15} 40L${tower + 30} 64V${HORIZON + 2}Z`} fill={P.towerDeep} />
          <circle cx={tower + 15} cy={82} r={10} fill={P.clock} opacity={0.75} />
          <path d={`M${tower + 15} 82V75M${tower + 15} 82L${tower + 20} 85`} stroke={P.towerDeep} strokeWidth={1.6} strokeLinecap="round" />
          <path d={circles([[90 + s, 100, 12], [104 + s, 92, 14], [120 + s, 98, 10], [280, 120, 12], [296, 112, 14]])} fill={P.steam} opacity={0.35} />
          <g stroke={P.pipeDeep} strokeWidth={1.5} strokeLinejoin="round">
            <path d="M-10 112H40Q52 112 52 124V178H40V126Q40 124 38 124H-10Z" fill={P.pipe} />
            <path d="M400 92H350Q338 92 338 104V178H350V106Q350 104 352 104H400Z" fill={P.pipe} />
            <rect x={44} y={140} width={16} height={8} rx={2} fill={P.pipeDeep} />
            <rect x={330} y={130} width={28} height={8} rx={2} fill={P.pipeDeep} />
          </g>
          <path d={circles([[60, 104, 9], [70, 94, 11], [84, 86, 8], [330, 82, 9], [318, 72, 11]])} fill={P.steam} opacity={0.55} />
          <g stroke={P.trim} strokeWidth={1.5}>
            <path d="M8 -2H34V58L21 50L8 58Z" fill={P.banner} />
            <path d="M356 -2H382V58L369 50L356 58Z" fill={P.banner} />
          </g>
          <path d={`${gear(21, 22, 5, 8, 2)}${gear(369, 22, 5, 8, 2)}`} fill={P.trim} />
          {ground(k, P.tileTop, P.tileLow, P.lip)}
          {zone.index === 2 ? <rect y={178} width={390} height={10} fill={P.water} opacity={0.8} /> : null}
          {zone.isCourt ? <path d="M180 174H210L250 272H140Z" fill={P.banner} opacity={0.55} /> : null}
          <path d={tiles([186, 202, 224, 254], [-40, 40, 120, 200, 280, 360, 440], 195)} fill="none" stroke={P.tileLine} strokeWidth={1.4} opacity={0.6} />
          {topShade(k)}
          <ZoneTint zone={zone} color={P.dusk} />
        </>
      );
    },
  ],

  /** 星墜花園：夜空星點與流星、彎月，樹籬與浮石，兩側與前景是會發光的花。 */
  [
    10,
    (k, zone) => {
      const P = BG10;
      const s = zone.shift * 0.4;
      const flowers = [[20, 200, 182, 'cyan'], [40, 210, 192, 'pink'], [364, 196, 180, 'pink'], [380, 214, 196, 'cyan'], [120, 240, 228, 'cyan'], [280, 250, 236, 'pink']] as const;
      return (
        <>
          {sky(k, [[0, P.skyTop], [0.6, P.skyMid], [1, P.skyLow]])}
          <path d={circles([[24, 20, 0.9], [70, 46, 1], [118, 14, 0.8], [150, 60, 1], [214, 22, 0.9], [250, 64, 0.8], [282, 18, 1], [350, 92, 0.9], [176, 96, 0.8], [96, 90, 0.9], [370, 30, 0.8], [30, 110, 0.8]])} fill={P.star} opacity={0.8} />
          <path d={sparkles([[52, 30, 3.4], [180, 44, 2.6], [236, 100, 2.2], [372, 60, 3], [128, 120, 2], [330, 130, 2.4]])} fill={P.star} />
          <circle cx={308} cy={46} r={56} fill={k.glow(P.moon, 0.4)} />
          <path d="M318 30A18 18 0 1 0 322 62A14 14 0 1 1 318 30Z" fill={P.moon} />
          <path d={`M${250 + s} 20L${206 + s} 50M${128 - s} 30L${96 - s} 52`} stroke={P.star} strokeWidth={1.6} strokeLinecap="round" opacity={0.6} />
          <path d={sparkles([[206 + s, 50, 3], [96 - s, 52, 2.6]])} fill={P.star} />
          {zone.index === 3 ? <path d="M150 178V142Q150 112 196 112Q242 112 242 142V178ZM172 116V178M196 112V178M220 116V178M150 142H242" fill={P.hedgeLight} stroke={P.flowerCyan} strokeWidth={1.2} opacity={0.45} /> : null}
          <path d={hills(152, 8, 3, zone.index * 1.2)} fill={P.hedge} />
          <path d={`M${82 + s} 178V150M${300 - s} 178V146`} stroke={P.hedgeLight} strokeWidth={3} />
          <path d={circles([[82 + s, 140, 14], [300 - s, 136, 16]])} fill={P.hedgeLight} />
          <g stroke={P.hedge} strokeWidth={1.4} strokeLinejoin="round">
            <path d={`M${150 - s} 100L${172 - s} 96L${168 - s} 108L${156 - s} 112ZM${244 + s} 82L${262 + s} 80L${258 + s} 90L${248 + s} 92Z`} fill={P.stone} />
          </g>
          <path d={`M${152 - s} 99Q${161 - s} 95 ${171 - s} 97M${246 + s} 81Q${254 + s} 79 ${261 + s} 81`} stroke={P.moss} strokeWidth={2} strokeLinecap="round" opacity={0.8} />
          {zone.isCourt ? (
            <>
              <circle cx={360} cy={110} r={40} fill={k.glow(P.star, 0.3)} />
              <path d="M340 178V150H384V178ZM352 150L362 110L370 112L362 150ZM360 108L384 92L386 98L366 114Z" fill={P.stone} stroke={P.brass} strokeWidth={1.5} />
              <circle cx={360} cy={110} r={30} fill="none" stroke={P.brass} strokeWidth={1.4} strokeDasharray="3 5" opacity={0.7} />
            </>
          ) : null}
          {ground(k, P.groundTop, P.groundLow, P.lip)}
          {zone.index === 4 ? (
            <>
              <ellipse cx={196} cy={186} rx={120} ry={8} fill={P.pool} opacity={0.45} />
              <ellipse cx={210} cy={186} rx={12} ry={3} fill={P.moon} opacity={0.6} />
            </>
          ) : null}
          <path d={flowers.map(([x, top, base]) => `M${x} 272V${top}M${x} ${base + 30}V${base}`).join('')} stroke={P.stem} strokeWidth={2} strokeLinecap="round" />
          <path d={circles(flowers.map(([x, top]) => [x, top, 16] as const))} fill={k.glow(P.flowerCyan, 0.35)} />
          <path d={circles(flowers.filter(([, , , c]) => c === 'cyan').map(([x, top]) => [x, top, 4.2] as const))} fill={P.flowerCyan} />
          <path d={circles(flowers.filter(([, , , c]) => c === 'pink').map(([x, top]) => [x, top, 4.2] as const))} fill={P.flowerPink} />
          <path d={circles([[70, 230, 1.6], [168, 256, 1.4], [230, 228, 1.6], [330, 244, 1.4], [200, 264, 1.2]])} fill={P.moss} opacity={0.8} />
          {topShade(k)}
          <ZoneTint zone={zone} color={P.dusk} />
        </>
      );
    },
  ],

  /** 空島聖域：陽光、遠方浮島與瀑布、雲海，兩側白石圓柱，地面是大理石磚。 */
  [
    11,
    (k, zone) => {
      const P = BG11;
      const s = zone.shift * 0.4;
      const island = (x: number, y: number, w: number): string =>
        `M${f(x)} ${y}Q${f(x + w / 2)} ${f(y - w * 0.12)} ${f(x + w)} ${y}L${f(x + w * 0.7)} ${f(y + w * 0.3)}L${f(x + w * 0.5)} ${f(y + w * 0.55)}L${f(x + w * 0.32)} ${f(y + w * 0.28)}Z`;
      return (
        <>
          {sky(k, [[0, P.skyTop], [0.65, P.skyMid], [1, P.skyLow]])}
          <circle cx={196} cy={16} r={150} fill={k.glow(P.sun, 0.35)} />
          <path d={`M196 -10L150 176H170ZM196 -10L230 176H250Z`} fill={P.sun} opacity={0.1} />
          <path d={`${island(70 + s, 82, 64)}${island(258 - s, 64, 82)}${island(178 + s * 0.5, 108, 38)}`} fill={P.island} />
          <path d={`M${f(72 + s)} 82Q${102 + s} 74 ${134 + s} 82M${260 - s} 64Q${299 - s} 54 ${340 - s} 64M${179 + s * 0.5} 108Q${197 + s * 0.5} 103 ${216 + s * 0.5} 108`} fill="none" stroke={P.islandTop} strokeWidth={4} strokeLinecap="round" />
          <path d={`M${120 + s} 84V128M${322 - s} 66V118`} stroke={P.fall} strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />
          {zone.isCourt ? (
            <>
              <circle cx={196} cy={116} r={58} fill={k.glow(P.gold, 0.4)} />
              <path d="M160 178V120Q160 88 196 88Q232 88 232 120V178H222V122Q222 100 196 100Q170 100 170 122V178Z" fill={P.gold} opacity={0.75} />
            </>
          ) : null}
          <path d={`${cloud(-6, 160, 30)}${cloud(80 + s, 168, 22)}${cloud(160, 164, 26)}${cloud(250 - s, 168, 22)}${cloud(330, 160, 30)}`} fill={P.cloud} opacity={0.5} />
          <g stroke={P.columnLine} strokeWidth={1.5} strokeLinejoin="round">
            <rect x={12} y={46} width={24} height={132} fill={P.column} />
            <path d="M6 46H42V36H6ZM6 178H42V170H6Z" fill={P.column} />
            <rect x={354} y={62} width={24} height={116} fill={P.column} />
            <path d="M348 62H384V52H348ZM348 178H384V170H348Z" fill={P.column} />
          </g>
          <path d={strokes([[20, 50, 20, 168], [28, 50, 28, 168], [362, 66, 362, 168], [370, 66, 370, 168]])} stroke={P.columnLine} strokeWidth={1.2} opacity={0.7} />
          <path d="M8 34Q24 26 40 34M350 50Q366 42 382 50" fill="none" stroke={P.gold} strokeWidth={2.4} strokeLinecap="round" />
          {ground(k, P.tileTop, P.tileLow, P.lip)}
          <path d={tiles([186, 204, 228, 258], [-60, 30, 120, 210, 300, 390, 480], 195)} fill="none" stroke={P.tileLine} strokeWidth={1.4} opacity={0.7} />
          {zone.index === 3 || zone.isCourt ? <path d="M176 174H214L246 272H144Z" fill={P.gold} opacity={0.2} /> : null}
          <path d="M140 60q3 -6 8 -5q-3 4 -8 5ZM290 120q4 -5 8 -3q-4 3 -8 3ZM60 140q3 -5 7 -4q-3 3 -7 4Z" fill={P.feather} opacity={0.8} />
          {topShade(k)}
          <ZoneTint zone={zone} color={P.dusk} />
        </>
      );
    },
  ],

  /** 終焉書庫：高聳書架夾著月光拱窗、漂浮書頁與燭光，地面鋪著紅地毯。 */
  [
    12,
    (k, zone) => {
      const P = BG12;
      const s = zone.shift * 0.3;
      const rows = [54, 90, 126, 162];
      // 第 5 區「無字殿堂」多飛幾張空白書頁。
      const floating: readonly (readonly [number, number, number])[] = [[110 + s, 60, -20], [282 - s, 44, 16], [150, 120, 30], [244, 110, -12], [96, 140, 10], [320, 150, -26]];
      const books = (pick: number): string => shelfBooks(2, 58, rows, pick) + shelfBooks(334, 388, rows, pick);
      return (
        <>
          {sky(k, [[0, P.skyTop], [0.6, P.skyMid], [1, P.skyLow]])}
          <path d={`M${80 + s} ${HORIZON + 2}V40H${140 + s}V${HORIZON + 2}ZM${250 - s} ${HORIZON + 2}V30H${312 - s}V${HORIZON + 2}Z`} fill={P.farShelf} />
          <path d={`${shelfBooks(84 + s, 136 + s, [70, 104, 138, 172], 0)}${shelfBooks(254 - s, 308 - s, [60, 96, 132, 168], 1)}`} fill={P.farSpine} />
          {zone.isCourt ? (
            <>
              <circle cx={196} cy={112} r={70} fill={k.glow(P.candle, 0.4)} />
              <path d="M158 176V56H234V176Z" fill={P.cover} stroke={P.carpetTrim} strokeWidth={3} />
              <path d="M166 64H226V168H166Z" fill="none" stroke={P.carpetTrim} strokeWidth={1.4} />
              <circle cx={196} cy={116} r={12} fill={P.carpetTrim} />
            </>
          ) : (
            <>
              <circle cx={196} cy={84} r={60} fill={k.glow(P.window, 0.45)} />
              <path d="M164 150V80Q164 46 196 46Q228 46 228 80V150Z" fill={P.window} opacity={0.4} />
              <path d="M164 150V80Q164 46 196 46Q228 46 228 80V150ZM196 46V150M164 98H228" fill="none" stroke={P.windowFrame} strokeWidth={3} />
              <path d="M164 150H228L270 272H122Z" fill={P.window} opacity={0.07} />
            </>
          )}
          {zone.index === 3 ? <path d="M110 -2H280V8H260V18H240V28H150V18H130V8H110Z" fill={P.farShelf} opacity={0.9} /> : null}
          <g stroke={P.shelfDeep} strokeWidth={2}>
            <rect x={-4} y={18} width={66} height={160} fill={P.shelf} />
            <rect x={328} y={18} width={66} height={160} fill={P.shelf} />
          </g>
          <path d={books(0)} fill={P.spineA} />
          <path d={books(1)} fill={P.spineB} />
          <path d={books(2)} fill={P.spineC} />
          <path d={strokes(rows.flatMap((y) => [[-4, y + 1, 62, y + 1], [328, y + 1, 394, y + 1]] as const))} stroke={P.shelfDeep} strokeWidth={3} />
          <circle cx={30} cy={14} r={18} fill={k.glow(P.candle, 0.55)} />
          <circle cx={360} cy={14} r={18} fill={k.glow(P.candle, 0.55)} />
          <path d="M27 18V10h6v8ZM357 18V10h6v8Z" fill={P.page} />
          <path d="M30 9Q28 5 30 2Q32 5 30 9ZM360 9Q358 5 360 2Q362 5 360 9Z" fill={P.candle} />
          <path d={pages(floating.slice(0, zone.index === 4 ? floating.length : 4))} fill={P.page} opacity={0.8} />
          {ground(k, P.floorTop, P.floorLow, P.lip)}
          <path d="M170 174H222L292 272H100Z" fill={P.carpet} />
          <path d="M175 174L108 272M217 174L284 272" stroke={P.carpetTrim} strokeWidth={2} opacity={0.8} />
          <path d={strokes([[0, 196, 150, 196], [244, 196, 390, 196], [0, 228, 124, 228], [270, 228, 390, 228]])} stroke={P.shelfDeep} strokeWidth={1.4} opacity={0.6} />
          {topShade(k)}
          <ZoneTint zone={zone} color={P.dusk} />
        </>
      );
    },
  ],
];
