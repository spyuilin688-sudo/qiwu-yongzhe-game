import { BG01, BG02, BG03, BG04 } from '../palette.ts';
import { HORIZON, ZoneTint, ground, sky, topShade, circles, cloud, hills, sparkles, strokes, type SceneDesign } from '../parts.tsx';

const f = (value: number): number => Math.round(value * 10) / 10;

/** 風車葉片：四片長方形繞軸心，rotation 讓每個區域的葉片角度不同，像是一直在轉。 */
function blades(cx: number, cy: number, length: number, width: number, rotation: number): string {
  return [0, 90, 180, 270]
    .map((offset) => {
      const a = ((offset + rotation) * Math.PI) / 180;
      const ux = Math.cos(a);
      const uy = Math.sin(a);
      const px = -uy * (width / 2);
      const py = ux * (width / 2);
      const near = 3;
      const corners = [
        [cx + ux * near + px, cy + uy * near + py],
        [cx + ux * length + px, cy + uy * length + py],
        [cx + ux * length - px, cy + uy * length - py],
        [cx + ux * near - px, cy + uy * near - py],
      ];
      return `M${corners.map(([x, y]) => `${f(x ?? 0)} ${f(y ?? 0)}`).join('L')}Z`;
    })
    .join('');
}

/** 草叢：每叢三根短葉，只放在角色腳下以外的前景。 */
function tufts(list: readonly (readonly [number, number, number])[]): string {
  return list
    .map(([x, y, s]) => `M${f(x - s)} ${y}L${f(x - s * 1.6)} ${f(y - s * 1.8)}M${x} ${y}L${f(x + s * 0.2)} ${f(y - s * 2.4)}M${f(x + s)} ${y}L${f(x + s * 1.7)} ${f(y - s * 1.7)}`)
    .join('');
}

/** 二次貝茲上的點：沿著吊繩掛風鈴時用。 */
function onCurve(t: number, p0: readonly [number, number], c: readonly [number, number], p1: readonly [number, number]): readonly [number, number] {
  const u = 1 - t;
  return [f(u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0]), f(u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1])];
}

/** 第 1～4 圖：原野、林地、礦山、古鎮。 */
export const EARLY_SCENES: readonly (readonly [number, SceneDesign])[] = [
  /** 蘆風原野：遠丘、風車、蘆葦與一條泥土小徑；第 6 區古樹廣場有一棵老樹。 */
  [
    1,
    (k, zone) => {
      const P = BG01;
      const s = zone.shift;
      const mill = 44;
      return (
        <>
          {sky(k, [[0, P.skyTop], [0.7, P.skyMid], [1, P.skyLow]])}
          <circle cx={306} cy={46} r={90} fill={k.glow(P.sun, 0.5)} />
          <circle cx={306} cy={46} r={14} fill={P.sun} opacity={0.85} />
          <path d={`${cloud(24 + s * 0.3, 58, 24)}${cloud(176 - s * 0.2, 30, 17)}${cloud(318 + s * 0.2, 100, 14)}`} fill={P.cloud} opacity={0.5} />
          <path d="M112 74q18 -6 36 0t36 0M228 60q14 -5 28 0t28 0" fill="none" stroke={P.cloud} strokeWidth={1.6} strokeLinecap="round" opacity={0.4} />
          <path d={hills(146, 12, 2.2, zone.index * 0.9)} fill={P.farHill} />
          <g stroke={P.line} strokeWidth={1.5} strokeLinejoin="round">
            <path d={`M${mill - 12} 168L${mill - 6} 118L${mill + 6} 118L${mill + 12} 168Z`} fill={P.millWall} />
            <path d={`M${mill - 9} 120L${mill} 104L${mill + 9} 120Z`} fill={P.millRoof} />
            <rect x={mill - 3} y={150} width={6} height={12} rx={3} fill={P.trunk} />
            <path d={blades(mill, 113, 30, 7, 20 + zone.index * 14)} fill={P.millSail} />
            <circle cx={mill} cy={113} r={2.6} fill={P.millRoof} />
          </g>
          <path d={hills(164, 7, 3, 1.3 + zone.index * 0.7)} fill={P.nearHill} />
          <path d={strokes([[262 + s * 0.4, 158, 262 + s * 0.4, 166], [350, 160, 350, 168], [302 + s * 0.3, 160, 302 + s * 0.3, 167]])} stroke={P.trunk} strokeWidth={3} />
          <path d={circles([[250 + s * 0.4, 156, 8], [263 + s * 0.4, 150, 11], [302 + s * 0.3, 154, 8], [350, 153, 10]])} fill={P.tree} />
          {zone.index === 1 ? <path d={circles([[258 + s * 0.4, 147, 1.8], [268 + s * 0.4, 152, 1.8], [298 + s * 0.3, 152, 1.6], [346, 150, 1.8], [354, 156, 1.6]])} fill={P.apple} /> : null}
          {zone.index === 4 ? (
            <>
              <path d={circles([[120, 160, 5], [126, 158, 5.5], [210, 163, 4.5], [215, 161, 5]])} fill={P.wool} opacity={0.9} />
              <path d={circles([[115, 160, 2.2], [205, 163, 2]])} fill={P.trunk} />
            </>
          ) : null}
          {zone.isCourt ? (
            <>
              <path d="M356 172Q362 140 358 112L374 112Q370 140 378 172Z" fill={P.trunk} />
              <path d={circles([[352, 98, 22], [374, 84, 24], [392, 104, 20], [366, 112, 16]])} fill={P.treeDeep} />
              <path d={circles([[346, 92, 2], [372, 76, 2.2], [386, 98, 2]])} fill={P.flowerA} opacity={0.8} />
            </>
          ) : null}
          {ground(k, P.groundTop, P.groundLow, P.lip)}
          {zone.index === 3 ? (
            <path d="M-10 177Q100 173 200 178T400 176L400 184Q300 187 200 185T-10 184Z" fill={P.river} opacity={0.75} />
          ) : null}
          <path d={`M168 ${HORIZON}L222 ${HORIZON}L300 272L90 272Z`} fill={P.path} opacity={0.26} />
          {zone.index === 2 ? (
            <path d={`${strokes([[12, 228, 12, 248], [44, 222, 44, 242], [76, 216, 76, 236]])}M6 234L82 222M6 242L82 230`} fill="none" stroke={P.trunk} strokeWidth={3} strokeLinecap="round" />
          ) : null}
          <path
            d={tufts([[30, 252, 3], [64, 236, 2.6], [128, 262, 3.2], [196, 244, 2.4], [262, 258, 3], [330, 238, 2.8], [358, 262, 3.2], [228, 222, 2], [150, 226, 2]])}
            fill="none"
            stroke={P.tuft}
            strokeWidth={1.6}
            strokeLinecap="round"
            opacity={0.75}
          />
          <path d={circles([[52, 246, 1.8], [182, 258, 1.6], [312, 250, 1.8], [100, 224, 1.4]])} fill={P.flowerA} />
          <path d={circles([[86, 258, 1.6], [244, 236, 1.4], [372, 246, 1.8]])} fill={P.flowerB} />
          <path
            d="M6 272Q4 236 10 206M14 272Q16 240 24 214M376 272Q378 236 372 204M384 272Q388 246 386 220"
            fill="none"
            stroke={P.reed}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <path d={strokes([[10.6, 204, 11.6, 196], [24.6, 212, 26.2, 204], [371.6, 202, 371, 194], [386, 218, 386.2, 210]])} stroke={P.reedHead} strokeWidth={4.6} strokeLinecap="round" />
          {topShade(k)}
          <ZoneTint zone={zone} color={P.dusk} />
        </>
      );
    },
  ],

  /** 蜜糖林地：琥珀色光從林子深處透出，兩側大樹幹掛著蜂窩，地上有莓果叢與蜜灘。 */
  [
    2,
    (k, zone) => {
      const P = BG02;
      const s = zone.shift;
      const farTrunks = ([[60, 10], [118, 14], [170, 9], [236, 16], [296, 11], [324, 12]] as const)
        .map(([x, w]) => `M${f(x + s * 0.5)} 0h${w}v${HORIZON + 2}h${-w}Z`)
        .join('');
      return (
        <>
          {sky(k, [[0, P.skyTop], [0.5, P.skyMid], [1, P.skyLow]])}
          <circle cx={200} cy={132} r={180} fill={k.glow(P.light, 0.5)} />
          <path d={farTrunks} fill={P.farTrunk} opacity={0.42} />
          <path d={`M${150 + s * 0.3} 0L${188 + s * 0.3} 0L240 176L182 176ZM${262 + s * 0.3} 0L${280 + s * 0.3} 0L318 176L290 176Z`} fill={P.shaft} opacity={0.13} />
          {zone.isCourt ? (
            <path
              d={[0, 1, 2, 3, 4, 5].map((index) => {
                const cx = 168 + (index % 3) * 26;
                const cy = 96 + Math.floor(index / 3) * 22 + (index % 2) * 11;
                return `M${cx - 12} ${cy}L${cx - 6} ${cy - 10}L${cx + 6} ${cy - 10}L${cx + 12} ${cy}L${cx + 6} ${cy + 10}L${cx - 6} ${cy + 10}Z`;
              }).join('')}
              fill={P.comb}
              stroke={P.hiveBand}
              strokeWidth={2}
              opacity={0.45}
            />
          ) : null}
          <path d={hills(166, 6, 2.6, zone.index * 1.1)} fill={P.bush} opacity={0.55} />
          <path d={circles([[0, 8, 42], [52, -2, 34], [102, 12, 30], [152, -4, 36], [206, 6, 30], [256, -6, 38], [312, 8, 32], [368, -2, 42]])} fill={P.canopy} />
          <path d={circles([[30, 30, 14], [124, 34, 12], [230, 30, 14], [334, 36, 13]])} fill={P.canopyLight} opacity={0.8} />
          <path d="M-6 0L30 0Q26 90 34 158Q40 172 56 178L-6 178Z" fill={P.trunk} />
          <path d="M396 0L360 0Q366 90 356 158Q350 172 334 178L396 178Z" fill={P.trunk} />
          <path d="M12 40Q8 80 16 130M20 100Q22 130 30 160M376 50Q382 90 372 140M368 110Q364 140 356 164" fill="none" stroke={P.bark} strokeWidth={2} strokeLinecap="round" />
          <path d="M26 54Q48 50 70 60" fill="none" stroke={P.trunk} strokeWidth={6} strokeLinecap="round" />
          <g stroke={P.bark} strokeWidth={1.5}>
            <path d="M58 60Q72 64 72 80Q72 94 60 96Q48 94 48 80Q48 64 58 60Z" fill={P.hive} />
            <path d="M50 72Q60 69 70 72M49 82Q60 79 71 82" fill="none" stroke={P.hiveBand} />
            <ellipse cx={60} cy={89} rx={3.4} ry={2.6} fill={P.bark} />
          </g>
          <path d="M58 96Q57 104 59.5 106Q62 104 61 96Z" fill={P.honey} />
          <path d={circles([[78, 170, 12], [98, 166, 14], [120, 172, 10], [300, 168, 13], [322, 172, 10]])} fill={P.bush} />
          <path d={circles([[90, 162, 2], [104, 160, 2], [112, 168, 1.8], [298, 162, 2], [314, 166, 1.8]])} fill={P.berry} />
          {ground(k, P.groundTop, P.groundLow, P.lip)}
          {zone.index === 2 ? <path d="M-10 180Q120 176 200 182T400 180L400 188Q280 192 200 190T-10 188Z" fill={P.honey} opacity={0.55} /> : null}
          {zone.index === 4 ? <path d="M232 182L330 176L334 186L236 190Z" fill={P.bark} opacity={0.8} /> : null}
          <ellipse cx={70} cy={248} rx={28} ry={6} fill={P.honey} opacity={0.42} />
          <ellipse cx={318} cy={256} rx={22} ry={5} fill={P.honey} opacity={0.38} />
          <g stroke={P.bark} strokeWidth={1.4}>
            <path d="M18 244L16 262L24 262L22 244Z" fill={P.stem} />
            <path d="M6 246Q8 230 20 230Q32 230 34 246Z" fill={P.cap} />
            <path d="M366 236L365 250L371 250L370 236Z" fill={P.stem} />
            <path d="M357 238Q359 226 368 226Q377 226 379 238Z" fill={P.cap} />
          </g>
          <path d={circles([[14, 238, 1.8], [24, 236, 1.6], [364, 232, 1.4]])} fill={P.stem} />
          {zone.index === 3 ? <path d={circles([[110, 252, 3], [160, 262, 2.6], [250, 246, 3], [290, 262, 2.6], [200, 230, 2.2]])} fill={P.petal} /> : null}
          <path d={sparkles([[140, 90, 3], [220, 64, 2.4], [92, 120, 2.2], [284, 110, 2.6], [190, 140, 2]])} fill={P.pollen} opacity={0.7} />
          {topShade(k)}
          <ZoneTint zone={zone} color={P.dusk} />
        </>
      );
    },
  ],

  /** 銅鈴礦山：坑道內部，木支架掛著油燈，鐵軌伸向深處的隧道口，岩壁嵌著銅礦。 */
  [
    3,
    (k, zone) => {
      const P = BG03;
      const s = zone.shift * 0.4;
      const ceiling = [[0, 30], [18, 40], [30, 24], [52, 46], [70, 22], [96, 34], [118, 18], [146, 42], [166, 22], [196, 30], [214, 16], [240, 40], [262, 20], [290, 34], [312, 18], [338, 44], [356, 24], [376, 36], [390, 26]] as const;
      const sleepers = [182, 192, 206, 224, 248].map((y) => {
        const t = (y - HORIZON) / (272 - HORIZON);
        const left = 180 - 62 * t;
        const right = 204 + 62 * t;
        return [left - 6, y, right + 6, y] as const;
      });
      return (
        <>
          {sky(k, [[0, P.skyTop], [0.6, P.skyMid], [1, P.skyLow]])}
          <path d={hills(140, 16, 1.8, zone.index * 1.3)} fill={P.farRock} />
          <path d={`M${152 + s} ${HORIZON + 2}V130Q${152 + s} 98 ${192 + s} 98Q${232 + s} 98 ${232 + s} 130V${HORIZON + 2}Z`} fill={P.tunnel} />
          <circle cx={192 + s} cy={150} r={22} fill={k.glow(P.lamp, 0.35)} />
          <path d={`M-10 -2L400 -2L${ceiling.map(([x, y]) => `${x} ${y}`).reverse().join('L')}L-10 30Z`} fill={P.ceiling} />
          <path d="M96 64L104 58L108 68L100 72ZM284 96L292 90L296 100ZM132 120L140 116L138 126ZM250 60L258 56L258 66Z" fill={P.ore} opacity={0.75} />
          <path d={sparkles([[103, 62, 3], [292, 94, 2.6], [256, 60, 2.4], [138, 120, 2]])} fill={P.glint} opacity={0.85} />
          {zone.index === 2 || zone.isCourt ? (
            <>
              <circle cx={300} cy={128} r={zone.isCourt ? 56 : 34} fill={k.glow(P.crystal, 0.5)} />
              <path d="M284 170L290 120L300 104L308 122L304 170ZM304 170L312 134L322 126L326 140L318 170ZM272 170L276 146L284 140L288 170Z" fill={P.crystal} stroke={P.ore} strokeWidth={1.5} opacity={0.85} />
            </>
          ) : null}
          {zone.index === 3 ? (
            <g stroke={P.chain} strokeWidth={2}>
              <path d="M262 0V96M290 0V96" fill="none" />
              <rect x={254} y={96} width={44} height={8} rx={2} fill={P.timberDeep} />
            </g>
          ) : null}
          <g stroke={P.timberDeep} strokeWidth={1.5}>
            <rect x={6} y={52} width={10} height={126} fill={P.timber} />
            <rect x={50} y={52} width={10} height={126} fill={P.timber} />
            <rect x={-4} y={44} width={72} height={10} rx={2} fill={P.timber} />
            <rect x={332} y={52} width={10} height={126} fill={P.timber} />
            <rect x={374} y={52} width={10} height={126} fill={P.timber} />
            <rect x={322} y={44} width={72} height={10} rx={2} fill={P.timber} />
          </g>
          <path d="M33 54V72M357 54V72" stroke={P.chain} strokeWidth={1.5} />
          <circle cx={33} cy={82} r={36} fill={k.glow(P.lamp, 0.5)} />
          <circle cx={357} cy={82} r={36} fill={k.glow(P.lamp, 0.5)} />
          <g stroke={P.timberDeep} strokeWidth={1.5}>
            <rect x={27} y={72} width={12} height={16} rx={3} fill={P.lampBody} />
            <rect x={351} y={72} width={12} height={16} rx={3} fill={P.lampBody} />
          </g>
          <path d={circles([[33, 80, 3.4], [357, 80, 3.4]])} fill={P.lamp} />
          {ground(k, P.groundTop, P.groundLow, P.lip)}
          {zone.index === 4 ? <ellipse cx={60} cy={196} rx={60} ry={10} fill={k.glow(P.slag, 0.55)} /> : null}
          <path d={strokes(sleepers)} stroke={P.sleeper} strokeWidth={4} strokeLinecap="round" />
          <path d={zone.index === 1 ? 'M180 176L148 236M204 176L236 236' : 'M180 176L118 272M204 176L266 272'} fill="none" stroke={P.rail} strokeWidth={2.4} strokeLinecap="round" />
          <path d={circles([[8, 262, 16], [30, 268, 12], [372, 264, 18], [350, 270, 10], [100, 210, 4], [300, 216, 5]])} fill={P.rubble} />
          {topShade(k)}
          <ZoneTint zone={zone} color={P.dusk} />
        </>
      );
    },
  ],

  /** 霧鐘古鎮：暮色屋頂與鐘樓剪影、街燈與吊著風鈴的繩索，地面是濕潤的石板路。 */
  [
    4,
    (k, zone) => {
      const P = BG04;
      const s = zone.shift * 0.5;
      const roofs = ([[60, 30, 50, 18], [96, 26, 64, 14], [148, 34, 44, 16], [186, 28, 56, 20], [222, 40, 46, 14], [266, 30, 60, 18], [300, 36, 42, 16]] as const)
        .map(([x, w, h, roof]) => `M${f(x + s)} ${HORIZON + 2}V${HORIZON - h}L${f(x + s + w / 2)} ${HORIZON - h - roof}L${f(x + s + w)} ${HORIZON - h}V${HORIZON + 2}Z`)
        .join('');
      const tower = 126 + s;
      const p0 = [-4, 26] as const;
      const c = [195, 74] as const;
      const p1 = [394, 22] as const;
      const bells = [0.12, 0.27, 0.42, 0.58, 0.73, 0.88].map((t) => onCurve(t, p0, c, p1));
      return (
        <>
          {sky(k, [[0, P.skyTop], [0.6, P.skyMid], [1, P.skyLow]])}
          <circle cx={304} cy={44} r={zone.index === 4 ? 86 : 66} fill={k.glow(P.moon, 0.45)} />
          <circle cx={304} cy={44} r={zone.index === 4 ? 16 : 12} fill={P.moon} opacity={0.9} />
          {zone.index === 3 ? (
            <circle cx={250} cy={96} r={34} fill="none" stroke={P.farRoofDeep} strokeWidth={10} strokeDasharray="8 6" opacity={0.7} />
          ) : null}
          <path d={roofs} fill={P.farRoof} />
          <path d={([[70, 140], [84, 150], [108, 136], [160, 144], [200, 132], [232, 146], [280, 138], [312, 150]] as const).map(([x, y]) => `M${f(x + s)} ${y}h4v5h-4Z`).join('')} fill={P.window} opacity={0.55} />
          <path d={`M${tower} ${HORIZON + 2}V78L${tower + 13} 52L${tower + 26} 78V${HORIZON + 2}Z`} fill={P.farRoofDeep} />
          <circle cx={tower + 13} cy={96} r={7} fill={P.clock} opacity={zone.index === 4 ? 0.95 : 0.6} />
          <path d={`M${tower + 13} 96L${tower + 13} 91.5M${tower + 13} 96L${tower + 16} 97.5`} stroke={P.farRoofDeep} strokeWidth={1.4} strokeLinecap="round" />
          <ellipse cx={195} cy={150} rx={260} ry={16} fill={P.mist} opacity={0.16} />
          <ellipse cx={195} cy={168} rx={240} ry={10} fill={P.mist} opacity={0.2} />
          <g stroke={P.lampPost} strokeWidth={1.5} strokeLinejoin="round">
            <rect x={-6} y={98} width={58} height={80} fill={P.wall} />
            <path d="M-12 100L23 66L58 100Z" fill={P.roof} />
            <rect x={338} y={104} width={58} height={74} fill={P.wall} />
            <path d="M332 106L367 72L402 106Z" fill={P.roof} />
          </g>
          <circle cx={22} cy={132} r={26} fill={k.glow(P.window, 0.4)} />
          <circle cx={362} cy={136} r={26} fill={k.glow(P.window, 0.4)} />
          <path d="M14 122h16v18h-16ZM354 126h16v18h-16Z" fill={P.window} stroke={P.lampPost} strokeWidth={1.5} />
          <path d="M22 122v18M362 126v18" stroke={P.lampPost} strokeWidth={1.2} />
          <path d={`M${p0[0]} ${p0[1]}Q${c[0]} ${c[1]} ${p1[0]} ${p1[1]}`} fill="none" stroke={P.string} strokeWidth={1.4} />
          <path
            d={bells.map(([x, y]) => `M${f(x - 3.4)} ${f(y + 9)}Q${f(x - 3.4)} ${f(y + 2)} ${x} ${f(y + 2)}Q${f(x + 3.4)} ${f(y + 2)} ${f(x + 3.4)} ${f(y + 9)}Z`).join('')}
            fill={P.bell}
            stroke={P.lampPost}
            strokeWidth={1}
          />
          <path d="M64 178V112M58 112h12" stroke={P.lampPost} strokeWidth={2.4} strokeLinecap="round" />
          <circle cx={64} cy={106} r={20} fill={k.glow(P.window, 0.55)} />
          <path d="M60 100h8l-1 10h-6Z" fill={P.window} stroke={P.lampPost} strokeWidth={1.4} />
          {ground(k, P.groundTop, P.groundLow, P.lip)}
          <path
            d="M0 214q12 -6 24 0t24 0t24 0M300 220q12 -6 24 0t24 0t24 0t24 0M20 244q14 -6 28 0t28 0t28 0M250 250q14 -6 28 0t28 0t28 0t28 0M120 262q14 -5 28 0t28 0t28 0"
            fill="none"
            stroke={P.cobble}
            strokeWidth={1.6}
            opacity={0.8}
          />
          <ellipse cx={64} cy={232} rx={22} ry={4} fill={P.window} opacity={0.18} />
          {zone.isCourt ? (
            <>
              <path d="M-4 -2H96Q70 30 62 90Q40 60 -4 70Z" fill={P.curtain} />
              <path d="M394 -2H294Q320 30 328 90Q350 60 394 70Z" fill={P.curtain} />
              <path d="M150 0L120 176H270L240 0Z" fill={P.mist} opacity={0.08} />
            </>
          ) : null}
          {topShade(k)}
          <ZoneTint zone={zone} color={P.dusk} />
        </>
      );
    },
  ],
];
