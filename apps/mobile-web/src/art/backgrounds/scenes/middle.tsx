import { BG05, BG06, BG07, BG08 } from '../palette.ts';
import { BOSS_STAND_X, COURT_FRAME_X, HORIZON, SKY_TOP, circles, cloud, courtSpot, ground, hills, ridge, sky, sparkles, strokes, zoneTint, type SceneEntry } from '../parts.tsx';

const f = (value: number): number => Math.round(value * 10) / 10;

/** 葉片／羽葉：基點、長度、寬度、角度（度）。棕櫚葉、海鷗翅膀都用它。 */
function frond(x: number, y: number, length: number, width: number, degrees: number): string {
  const a = (degrees * Math.PI) / 180;
  const tx = x + Math.cos(a) * length;
  const ty = y + Math.sin(a) * length;
  const mx = x + Math.cos(a) * length * 0.5;
  const my = y + Math.sin(a) * length * 0.5;
  const px = -Math.sin(a) * width;
  const py = Math.cos(a) * width;
  return `M${f(x)} ${f(y)}Q${f(mx + px)} ${f(my + py)} ${f(tx)} ${f(ty)}Q${f(mx - px * 0.4)} ${f(my - py * 0.4)} ${f(x)} ${f(y)}Z`;
}

/** 遠方駱駝商隊的小剪影（約 14px），只求輪廓可辨。 */
function camel(x: number, y: number): string {
  return `M${x} ${y}q2 -7 6 -6q2 -4 5 0q2 -1 3 -4l2 -3l3 1l-2 4q-1 4 -3 7v5h-1.4v-4h-9v4h-1.4Z`;
}

/** 三層三角疊成的松樹；雪頂另外疊白色小三角。 */
function pine(x: number, base: number, height: number): string {
  const w = height * 0.42;
  return [0, 1, 2]
    .map((tier) => {
      const top = base - height + tier * height * 0.26;
      const bottom = top + height * 0.42;
      const half = w * (0.55 + tier * 0.22);
      return `M${f(x)} ${f(top)}L${f(x + half)} ${f(bottom)}L${f(x - half)} ${f(bottom)}Z`;
    })
    .join('') + `M${f(x - 1.6)} ${base}V${f(base - height * 0.2)}h3.2V${base}Z`;
}

function pineSnow(x: number, base: number, height: number): string {
  const top = base - height;
  return `M${f(x)} ${f(top)}L${f(x + height * 0.12)} ${f(top + height * 0.16)}L${f(x - height * 0.12)} ${f(top + height * 0.16)}Z`;
}

/** 山峰雪冠：沿兩側稜線往下取一小段，形狀自然貼合山形。 */
function snowCaps(peaks: readonly (readonly [number, number])[], depth: number): string {
  return peaks
    .map(([x, y], index) => {
      const prev = peaks[index - 1];
      const next = peaks[index + 1];
      if (!prev || !next || y > prev[1] || y > next[1]) return '';
      const lx = x + (prev[0] - x) * (depth / Math.max(1, prev[1] - y));
      const rx = x + (next[0] - x) * (depth / Math.max(1, next[1] - y));
      return `M${f(x)} ${f(y)}L${f(rx)} ${f(y + depth)}L${f((x + rx) / 2)} ${f(y + depth * 0.7)}L${f(x)} ${f(y + depth)}L${f((x + lx) / 2)} ${f(y + depth * 0.7)}L${f(lx)} ${f(y + depth)}Z`;
    })
    .join('');
}

/** 熔殿石柱的中心 x：左柱貼著 BOSS 左側，右柱沿用原本貼著右側岩塔的位置。 */
const COURT_PILLARS = [COURT_FRAME_X[0], 376] as const;

/**
 * 黃金砂宮：底座、主圓頂與左右兩座洋蔥頂尖塔合成一條路徑。
 * 主圓頂對準 BOSS（cx），尖塔立在 frame 的兩個 x，框住 BOSS。
 */
function sandPalace(cx: number, frame: readonly [number, number]): string {
  const [left, right] = frame;
  const towers = [left, right]
    .map((x) => `M${x - 5} ${HORIZON + 2}V104H${x + 5}V${HORIZON + 2}ZM${x - 8} 104Q${x - 8} 93 ${x} 86Q${x + 8} 93 ${x + 8} 104Z`)
    .join('');
  return `M${cx - 58} ${HORIZON + 2}V146H${cx + 58}V${HORIZON + 2}ZM${cx - 24} 146Q${cx - 24} 110 ${cx} 100Q${cx + 24} 110 ${cx + 24} 146ZM${cx} 100V86${towers}`;
}

/** 扇貝王座的放射肋紋：從底部中心往弧邊畫 7 條。 */
function shellRibs(cx: number, cy: number, radius: number): string {
  const ribs = 7;
  return Array.from({ length: ribs }, (_, index) => {
    const a = Math.PI + (Math.PI * (index + 1)) / (ribs + 1);
    return `M${cx} ${cy}L${f(cx + Math.cos(a) * radius * 0.92)} ${f(cy + Math.sin(a) * radius * 0.92)}`;
  }).join('');
}

/** 分枝珊瑚（約 40 寬）：主幹加兩對分枝，以 x 為主幹位置。 */
function coral(x: number): string {
  return `M${x} 178V154M${x} 162L${x - 12} 148L${x - 15} 138M${x - 12} 148L${x - 5} 139M${x} 158L${x + 12} 144L${x + 9} 136M${x + 12} 144L${x + 19} 139`;
}

/** 第 5～8 圖：砂海、港灣、雪嶺、火山。 */
export const MIDDLE_SCENES: readonly SceneEntry[] = [
  /** 砂海商路：烈日下的沙丘與平頂岩、遠方駱駝商隊，左邊棕櫚、右邊商路遺跡。 */
  {
    mapNumber: 5,
    light: { tone: 'light', rim: BG05.rim },
    draw: (k, zone) => {
      const P = BG05;
      const s = zone.shift * 0.5;
      return (
        <>
          {sky(k, [[0, P.skyTop], [0.62, P.skyMid], [1, P.skyLow]])}
          <circle cx={78} cy={50} r={104} fill={k.glow(P.sun, 0.55)} />
          <circle cx={78} cy={50} r={16} fill={P.sun} opacity={0.9} />
          <path d={`M${238 + s} 178L${246 + s} 132L${262 + s} 126L${296 + s} 126L${304 + s} 136L${318 + s} 136L${326 + s} 124L${356 + s} 124L${364 + s} 140L400 140L400 178Z`} fill={P.mesa} opacity={0.7} />
          {zone.isCourt ? (
            <>
              {/* 黃金砂宮：宮殿立在 BOSS 身後，主圓頂從 BOSS 頭頂露出，兩座尖塔一左一右框住 BOSS。 */}
              <circle cx={BOSS_STAND_X} cy={118} r={78} fill={k.glow(P.dome, 0.42)} />
              <path d={sandPalace(BOSS_STAND_X, COURT_FRAME_X)} fill={P.dome} stroke={P.ruinLine} strokeWidth={1.4} strokeLinejoin="round" opacity={0.8} />
            </>
          ) : null}
          <path d={hills(152, 10, 1.4, zone.index * 0.8)} fill={P.farDune} />
          <path d={`${camel(140 + s, 146)}${camel(160 + s, 145)}${camel(180 + s, 147)}`} fill={P.camel} opacity={0.8} />
          <path d={hills(166, 8, 2.2, 1.1 + zone.index)} fill={P.nearDune} />
          {zone.index === 4 ? <ellipse cx={290} cy={182} rx={56} ry={6} fill={P.water} opacity={0.75} /> : null}
          <g stroke={P.ruinLine} strokeWidth={1.5} strokeLinejoin="round">
            <rect x={344} y={110} width={14} height={68} fill={P.ruin} />
            <rect x={376} y={124} width={14} height={54} fill={P.ruin} />
            <path d="M338 104H364V112H338ZM370 118H396V126H370Z" fill={P.ruin} />
            <path d="M358 120Q368 110 376 122" fill="none" />
          </g>
          {/* 王庭的宮殿底座就在 BOSS 腳下，商隊帳篷收起來，避免擠在 BOSS 身後。 */}
          {zone.isCourt ? null : (
            <g stroke={P.ruinLine} strokeWidth={1.3} strokeLinejoin="round" opacity={0.9}>
              <path d={`M${292 + s * 0.3} 178V160L${310 + s * 0.3} 146L${328 + s * 0.3} 160V178Z`} fill={P.tent} />
              <path d={`M${298 + s * 0.3} 156L${304 + s * 0.3} 151V178H${298 + s * 0.3}ZM${316 + s * 0.3} 151L${322 + s * 0.3} 156V178H${316 + s * 0.3}Z`} fill={P.tentStripe} />
            </g>
          )}
          <path d="M22 178Q24 130 36 98M48 178Q46 150 54 128" fill="none" stroke={P.palm} strokeWidth={5} strokeLinecap="round" />
          <path
            d={`${frond(36, 98, 30, 7, 200)}${frond(36, 98, 30, 7, 240)}${frond(36, 98, 32, 7, 300)}${frond(36, 98, 28, 7, 340)}${frond(36, 98, 24, 6, 20)}${frond(54, 128, 20, 5, 210)}${frond(54, 128, 20, 5, 320)}${frond(54, 128, 16, 4, 10)}`}
            fill={P.frond}
          />
          {ground(k, P.groundTop, P.groundLow, P.lip)}
          <path d="M8 222q20 -5 40 0t40 0M250 228q20 -5 40 0t40 0t40 0M110 252q22 -6 44 0t44 0t44 0M20 262q18 -4 36 0" fill="none" stroke={P.ripple} strokeWidth={1.6} strokeLinecap="round" opacity={0.75} />
          <path d={circles([[150, 236, 4], [176, 246, 5], [210, 240, 4], [238, 252, 5], [130, 258, 4]])} fill={P.stone} opacity={0.55} />
          {zone.index === 0 ? (
            <path d="M62 236V204M50 206H76L80 211L76 216H50ZM52 218H72L68 223H52Z" fill={P.sign} stroke={P.ruinLine} strokeWidth={1.5} />
          ) : null}
          {zone.index === 2 ? <path d={sparkles([[90, 230, 2.4], [200, 222, 2], [300, 246, 2.6], [340, 222, 2]])} fill={P.water} /> : null}
          {zone.isCourt ? courtSpot(k, P.dome) : null}
          {zoneTint(k, zone, P.dusk)}
        </>
      );
    },
  },

  /** 碧潮港灣：燈塔崖、海面帆船與海鷗；地面依區域換成貝殼沙灘或木棧碼頭。 */
  {
    mapNumber: 6,
    light: { tone: 'light', rim: BG06.rim },
    draw: (k, zone) => {
      const P = BG06;
      const s = zone.shift * 0.5;
      const beach = zone.index === 0 || zone.index === 3;
      const seams = [186, 200, 218, 242];
      return (
        <>
          {sky(k, [[0, P.skyTop], [0.7, P.skyMid], [1, P.skyLow]])}
          <circle cx={318} cy={40} r={84} fill={k.glow(P.sun, 0.5)} />
          <circle cx={318} cy={40} r={13} fill={P.sun} opacity={0.85} />
          <path d={`${cloud(140 - s, 40, 20)}${cloud(250 + s * 0.4, 76, 14)}`} fill={P.foam} opacity={0.5} />
          <rect y={128} width={390} height={50} fill={k.vertical([[0, P.seaTop], [1, P.seaLow]])} />
          <path d="M80 140q8 -3 16 0M170 150q10 -3 20 0M260 138q8 -3 16 0M320 156q10 -3 20 0M120 164q10 -3 20 0M220 168q12 -3 24 0" fill="none" stroke={P.foam} strokeWidth={1.4} strokeLinecap="round" opacity={0.55} />
          {zone.index === 3 ? (
            <path d="M246 140L284 132L292 140L250 146ZM262 136L258 98M258 106L276 112" fill={P.hull} stroke={P.post} strokeWidth={2} opacity={0.75} />
          ) : zone.isCourt ? null : (
            <g stroke={P.post} strokeWidth={1.3} strokeLinejoin="round">
              <path d={`M${206 + s} 136h22l-4 6h-14ZM${296 - s * 0.5} 146h14l-3 4h-9Z`} fill={P.hull} />
              <path d={`M${217 + s} 134V112L${230 + s} 132ZM${303 - s * 0.5} 144V130L${311 - s * 0.5} 143Z`} fill={P.sail} />
            </g>
          )}
          {zone.isCourt ? (
            <>
              {/* 潮汐王座：BOSS 身後豎起一面扇貝王座，上緣從 BOSS 頭頂露出；兩側珊瑚框住 BOSS。 */}
              <path d={`M${BOSS_STAND_X - 58} 176L${BOSS_STAND_X - 58} 150A58 58 0 0 1 ${BOSS_STAND_X + 58} 150L${BOSS_STAND_X + 58} 176Z`} fill={P.shell} stroke={P.post} strokeWidth={1.4} opacity={0.42} />
              <path d={shellRibs(BOSS_STAND_X, 150, 58)} fill="none" stroke={P.coral} strokeWidth={1.4} strokeLinecap="round" opacity={0.45} />
              {/* 分枝珊瑚剪影：圓頭粗線一筆畫完，比尖刺多邊形更像珊瑚，也不會在勇者與 BOSS 之間形成高對比的紅色尖塊。 */}
              <path
                d={COURT_FRAME_X.map((x) => coral(x)).join('')}
                fill="none"
                stroke={P.coral}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.6}
              />
            </>
          ) : null}
          <path d="M-10 178L-10 112Q20 102 46 114Q64 124 72 178Z" fill={P.cliff} />
          <g stroke={P.post} strokeWidth={1.4} strokeLinejoin="round">
            <path d="M24 112L27 74H37L40 112Z" fill={P.lighthouse} />
            <path d="M25.5 100H38.5L39 106H25ZM26.5 86H37.5L38 92H26Z" fill={P.stripe} />
            <rect x={25} y={64} width={14} height={10} rx={2} fill={P.lighthouse} />
            <path d="M23 64L32 56L41 64Z" fill={P.stripe} />
          </g>
          <circle cx={32} cy={69} r={20} fill={k.glow(P.sun, 0.7)} />
          <path d={`${frond(150, 76, 7, 2.4, 200)}${frond(150, 76, 7, 2.4, 340)}${frond(186, 60, 6, 2, 200)}${frond(186, 60, 6, 2, 340)}`} fill={P.gull} />
          {ground(k, beach ? P.sandTop : P.plankTop, beach ? P.sandLow : P.plankLow, beach ? P.foam : P.seam)}
          {beach ? (
            <>
              <path d="M-10 178Q60 186 130 180T260 182T400 178L400 174L-10 174Z" fill={P.foam} opacity={0.7} />
              <path d={circles([[60, 236, 3], [190, 252, 2.6], [300, 232, 3.2], [350, 258, 2.6]])} fill={P.shell} />
            </>
          ) : (
            <path
              d={`${strokes(seams.map((y) => [0, y, 390, y] as const))}${strokes(seams.map((y, index) => [60 + index * 70, y, 60 + index * 70, y + 14 + index * 6] as const))}`}
              fill="none"
              stroke={P.seam}
              strokeWidth={1.6}
              opacity={0.75}
            />
          )}
          <g stroke={P.post} strokeWidth={1.5}>
            <rect x={8} y={206} width={12} height={40} rx={3} fill={P.hull} />
            <path d="M6 214Q14 222 22 214" fill="none" stroke={P.rope} strokeWidth={3} />
            <rect x={356} y={222} width={26} height={34} rx={8} fill={P.barrel} />
            <path d="M356 232H382M356 246H382" fill="none" />
          </g>
          {zone.isCourt ? courtSpot(k, P.foam) : null}
          {zoneTint(k, zone, P.dusk)}
        </>
      );
    },
  },

  /** 霜羽雪嶺：雪冠群峰、兩側覆雪松林、細雪飄落，地面是厚雪與冰面。 */
  {
    mapNumber: 7,
    light: { tone: 'light', rim: BG07.rim },
    draw: (k, zone) => {
      const P = BG07;
      const s = zone.shift * 0.4;
      const far = ([[-10, 126], [36, 96], [70, 114], [112, 72], [150, 106], [190, 86], [230, 112], [272, 62], [312, 98], [350, 80], [400, 110]] as const).map(([x, y]) => [x + s, y] as const);
      // 最遠一層山只移動一半距離，做出視差。
      const back = ([[-10, 110], [60, 80], [120, 98], [200, 64], [250, 90], [330, 56], [400, 90]] as const).map(([x, y]) => [x - s * 0.5, y] as const);
      const pines = [[18, 180, 56], [40, 182, 44], [356, 180, 52], [378, 184, 60]] as const;
      const farPines = [[140, 160, 16], [152, 162, 20], [248, 158, 18], [262, 162, 14]] as const;
      return (
        <>
          {sky(k, [[0, P.skyTop], [0.65, P.skyMid], [1, P.skyLow]])}
          {/* 天光放在左上：敵人頭頂（x 240～350、y≈100）是傷害飄字的位置，不能有亮斑。 */}
          <circle cx={110} cy={28} r={64} fill={k.glow(P.flake, 0.22)} />
          <path d={ridge(back)} fill={P.midMount} opacity={0.45} />
          <path d={ridge(far)} fill={P.farMount} />
          <path d={snowCaps(far, 16)} fill={P.snowCap} opacity={0.8} />
          {zone.isCourt ? (
            <>
              <circle cx={272 + s} cy={60} r={34} fill={k.glow(P.ice, 0.5)} />
              {/*
                王庭：主峰尖長出一頂冰冠（呼應「白冠」霜鵬）。冠底比山尖寬一點、壓在稜線上，
                看得出是長在山上；之前放鳥巢，遠山太尖撐不住，縮小後像小船飄在天上。
              */}
              <path
                d={`M${256 + s} 82L${259 + s} 60L${265 + s} 70L${272 + s} 42L${279 + s} 70L${285 + s} 58L${289 + s} 82Q${272 + s} 76 ${256 + s} 82Z`}
                fill={P.ice}
                stroke={P.pineDeep}
                strokeWidth={1.2}
                strokeLinejoin="round"
              />
              <path d={`M${272 + s} 48L${271 + s} 72M${259.5 + s} 64L${260 + s} 77`} stroke={P.flake} strokeWidth={1.4} strokeLinecap="round" opacity={0.8} />
              {/* 左側一根冰柱框住 BOSS（右側由前景松林框住）。 */}
              <path d={`M${COURT_FRAME_X[0] - 9} ${HORIZON}L${COURT_FRAME_X[0] - 4} 112L${COURT_FRAME_X[0] + 1} 96L${COURT_FRAME_X[0] + 6} 118L${COURT_FRAME_X[0] + 9} ${HORIZON}Z`} fill={P.ice} stroke={P.pineDeep} strokeWidth={1.2} strokeLinejoin="round" opacity={0.6} />
            </>
          ) : null}
          <path d={hills(152, 12, 2.4, 0.6 + zone.index * 0.9)} fill={P.midMount} />
          <path d={farPines.map(([x, base, h]) => pine(x - s, base, h)).join('')} fill={P.pine} opacity={0.55} />
          <g stroke={P.pineDeep} strokeWidth={1.2} strokeLinejoin="round" opacity={0.8}>
            <path d={`M${296 + s} 162V150H${318 + s}V162ZM${293 + s} 151L${307 + s} 140L${321 + s} 151Z`} fill={P.twig} />
            <path d={`M${293 + s} 151L${307 + s} 140L${321 + s} 151L${318 + s} 148L${307 + s} 142L${296 + s} 148Z`} fill={P.snowCap} />
          </g>
          <rect x={302 + s} y={153} width={5} height={5} fill={P.cabinLight} />
          <path d={circles([[316 + s, 134, 3], [320 + s, 126, 4], [326 + s, 118, 4.6]])} fill={P.flake} opacity={0.45} />
          {zone.index === 4 ? (
            <>
              <ellipse cx={195} cy={140} rx={260} ry={18} fill={P.flake} opacity={0.28} />
              <ellipse cx={195} cy={164} rx={230} ry={12} fill={P.flake} opacity={0.3} />
            </>
          ) : null}
          {ground(k, P.snowTop, P.snowLow, P.lip)}
          {zone.index === 3 ? (
            <>
              <path d="M-10 178Q100 174 200 180T400 177L400 190Q300 194 200 191T-10 190Z" fill={P.ice} opacity={0.8} />
              <path d={strokes([[60, 176, 60, 192], [120, 177, 120, 194], [270, 178, 270, 194], [330, 176, 330, 192]])} stroke={P.twig} strokeWidth={3} strokeLinecap="round" />
            </>
          ) : null}
          <path d="M-10 236Q40 222 90 236T190 240T290 238T400 236L400 272L-10 272Z" fill={P.drift} opacity={0.55} />
          <path d={circles([[120, 262, 10], [136, 266, 7], [262, 258, 9], [276, 264, 6]])} fill={P.rock} />
          <path d="M111 258Q120 250 129 256Q124 254 120 255Q115 255 111 258ZM254 254Q262 247 270 252Q266 250 262 251Q258 251 254 254Z" fill={P.snowCap} />
          <path d={pines.map(([x, base, h]) => pine(x, base, h)).join('')} fill={P.pine} stroke={P.pineDeep} strokeWidth={1.4} strokeLinejoin="round" />
          <path d={pines.map(([x, base, h]) => pineSnow(x, base, h)).join('')} fill={P.snowCap} />
          {zone.index === 2 ? (
            // 冰牙峽谷：兩側冰壁往上越來越寬，內緣參差，寬度貼齊的高螢幕看起來像身在峽谷底部。
            <path
              d={`M-4 ${SKY_TOP}H156L146 -150L150 -96L132 -52L126 -20L120 -2L112 8L106 30L100 8L92 20L86 6L78 26L70 6L60 18L52 4L44 34L36 6L26 22L18 4L8 28L0 6ZM394 ${SKY_TOP}H244L250 -140L246 -88L264 -46L270 -18L280 -2L288 8L294 26L300 8L310 22L316 6L326 32L334 6L344 20L352 4L360 28L370 6L380 24L388 6Z`}
              fill={P.ice}
              stroke={P.pineDeep}
              strokeWidth={1.2}
              strokeLinejoin="round"
              opacity={0.85}
            />
          ) : null}
          <path
            d={circles([[30, 40, 1.6], [86, 72, 1.3], [140, 30, 1.5], [196, 58, 1.2], [232, 24, 1.6], [262, 96, 1.2], [330, 40, 1.4], [372, 80, 1.6], [110, 118, 1.2], [300, 130, 1.3], [60, 150, 1.4], [210, 112, 1.2]])}
            fill={P.flake}
            opacity={0.85}
          />
          {zone.isCourt ? courtSpot(k, P.ice) : null}
          {zoneTint(k, zone, P.dusk)}
        </>
      );
    },
  },

  /** 赤爐火山：冒煙的火山口與熔岩流、兩側玄武岩柱，左邊石造熔爐，地面有發光裂縫。 */
  {
    mapNumber: 8,
    light: { tone: 'dark', rim: BG08.rim },
    draw: (k, zone) => {
      const P = BG08;
      const s = zone.shift * 0.4;
      return (
        <>
          {sky(k, [[0, P.skyTop], [0.6, P.skyMid], [1, P.skyLow]])}
          <path d={circles([[244 + s, 40, 16], [262 + s, 26, 20], [286 + s, 14, 22], [314 + s, 6, 18]])} fill={P.smoke} opacity={0.55} />
          <path d={ridge([[-10, 150], [40, 128], [80, 142], [120, 120], [160, 140]])} fill={P.volcanoFar} opacity={0.8} />
          <circle cx={246 + s} cy={66} r={56} fill={k.glow(P.crater, 0.6)} />
          <path d={`M${150 + s} 178L${230 + s} 70Q${246 + s} 62 ${262 + s} 66L${348 + s} 178Z`} fill={P.volcanoFar} />
          <path d={`M${244 + s} 70Q${236 + s} 110 ${250 + s} 140Q${256 + s} 160 ${248 + s} 178M${256 + s} 70Q${268 + s} 100 ${282 + s} 128Q${290 + s} 146 ${300 + s} 178`} fill="none" stroke={P.lava} strokeWidth={3.4} strokeLinecap="round" opacity={0.85} />
          <path d="M396 178L388 102L374 92L362 128L356 178Z" fill={P.spire} />
          <path d="M380 112L372 136L378 156" fill="none" stroke={P.lava} strokeWidth={1.8} strokeLinecap="round" opacity={0.7} />
          {zone.index === 4 ? <path d="M176 176L180 156H212L216 176ZM170 156H222L218 148H174Z" fill={P.obsidian} stroke={P.forgeLine} strokeWidth={1.4} /> : null}
          <g stroke={P.forgeLine} strokeWidth={1.5} strokeLinejoin="round">
            <path d="M-4 178V128Q-4 116 8 116H32Q44 116 44 128V178Z" fill={P.forge} />
            <rect x={22} y={92} width={14} height={26} fill={P.forge} />
            <path d="M6 178V150Q6 140 19 140Q32 140 32 150V178Z" fill={P.crater} />
          </g>
          <circle cx={19} cy={160} r={30} fill={k.glow(P.lavaCore, 0.5)} />
          <path d={circles([[30, 84, 7], [36, 72, 9], [46, 58, 10]])} fill={P.smoke} opacity={0.5} />
          {ground(k, P.groundTop, P.groundLow, P.lip)}
          {zone.index === 2 ? <path d="M-10 180Q90 176 200 182T400 180L400 190Q300 194 200 191T-10 190Z" fill={P.lava} opacity={0.8} /> : null}
          <ellipse cx={196} cy={246} rx={60} ry={8} fill={k.glow(P.lava, 0.4)} />
          <path d="M120 230L150 238L172 232L196 246M260 222L282 230L300 226M30 254L56 248L70 258M320 258L346 250L372 256" fill="none" stroke={P.lava} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          {zone.isCourt ? (
            <>
              {/* 地心熔殿：兩根黑曜石柱一左一右框住 BOSS，柱頂火盆與 BOSS 身後的熔光呼應。 */}
              <circle cx={BOSS_STAND_X} cy={122} r={80} fill={k.glow(P.lava, 0.35)} />
              <path d={COURT_PILLARS.map((x) => `M${x - 12} 178L${x - 7} 70H${x + 7}L${x + 12} 178Z`).join('')} fill={P.obsidian} opacity={0.85} />
              <path d={COURT_PILLARS.map((x) => `M${x - 10} 70H${x + 10}V62H${x - 10}Z`).join('')} fill={P.lava} opacity={0.8} />
            </>
          ) : null}
          <path d={sparkles([[120, 80, 2.6], [190, 110, 2], [300, 90, 2.4], [340, 140, 2], [150, 150, 1.8], [220, 40, 2.2]])} fill={P.ember} opacity={0.9} />
          {zone.isCourt ? courtSpot(k, P.lavaCore) : null}
          {zoneTint(k, zone, P.dusk)}
        </>
      );
    },
  },
];
