import { BOSS_OUTLINE, INK, ROYAL } from './palette.ts';
import { f } from './shapes.ts';

/**
 * BOSS 共用部件。部件只接受已決定好的填色字串，不自行登記漸層，
 * 讓 <defs> 一律由設計函式透過 BossKit 產生，不會漏掉或重複。
 * BOSS 一律面向左（朝向勇者），瞳孔、嘴、鼻都偏左。
 */

/** 128 格畫布的接地線：比例與 64 格小怪的 y=60 相同，並排時站在同一條地平線。 */
export const BOSS_GROUND = 120;

export function Shadow({ x = 64, w = 88, float = false }: { readonly x?: number; readonly w?: number; readonly float?: boolean }) {
  return <ellipse cx={x} cy={BOSS_GROUND + 1} rx={w / 2} ry={float ? 3.2 : 4.6} fill={INK} opacity={float ? 0.22 : 0.34} stroke="none" />;
}

/**
 * 聯集外框：先用加倍線寬描出整組形狀，再無描邊填色蓋上去。
 * 多個圓疊成的樹冠、雲、鬃毛因此只有外圍一圈線，內部不會出現交錯弧線。
 */
export function Blob({ d, fill, width = BOSS_OUTLINE, opacity }: { readonly d: string; readonly fill: string; readonly width?: number; readonly opacity?: number }) {
  return (
    <g opacity={opacity}>
      <path d={d} fill={INK} strokeWidth={width * 2} />
      <path d={d} fill={fill} stroke="none" />
    </g>
  );
}

/** 細部紋路（樹皮、羽紋、裂縫）：只描線、不填色，顏色用同材質的暗色才不會搶輪廓。 */
export function Detail({ d, color = INK, w = 1.6, opacity }: { readonly d: string; readonly color?: string; readonly w?: number; readonly opacity?: number }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={w} opacity={opacity} />;
}

/** 左上高光：同一個光源方向，讓所有 BOSS 的體積感一致。 */
export function Shine({ x, y, rx, ry, rotate = -25, opacity = 0.5 }: { readonly x: number; readonly y: number; readonly rx: number; readonly ry: number; readonly rotate?: number; readonly opacity?: number }) {
  return <ellipse cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${rotate} ${x} ${y})`} fill={ROYAL.white} opacity={opacity} stroke="none" />;
}

interface BossEyeProps {
  readonly x: number;
  readonly y: number;
  readonly r?: number;
  readonly iris?: string;
  /** 眉頭（內眼角）在哪一側：兩眼的眉頭都朝臉中央下壓，才讀得出「發怒」。 */
  readonly inner: 'left' | 'right';
  /** 怒目斜切的深度（0～1）；大型溫和的 BOSS 用淺一點，避免可愛感消失。 */
  readonly anger?: number;
}

/**
 * BOSS 怒目：上緣斜切成眉、發光瞳孔、左上反光。和小首領同一語彙但更大、更亮，
 * 戰場縮圖時仍看得出「這隻在瞪勇者」。
 */
export function BossEye({ x, y, r = 6, iris = ROYAL.eye, inner, anger = 0.7 }: BossEyeProps) {
  const high = f(y - r * 0.85);
  const low = f(y - r * (0.85 - anger));
  const [leftY, rightY] = inner === 'right' ? [high, low] : [low, high];
  return (
    <>
      <path d={`M${f(x - r)} ${leftY}L${f(x + r)} ${rightY}A${r} ${r} 0 0 1 ${f(x - r)} ${leftY}Z`} fill={iris} strokeWidth={2} />
      <ellipse cx={f(x - r * 0.28)} cy={f(y + r * 0.2)} rx={f(r * 0.32)} ry={f(r * 0.46)} fill={INK} stroke="none" />
      <circle cx={f(x - r * 0.48)} cy={f(y - r * 0.02)} r={f(r * 0.16)} fill={ROYAL.white} stroke="none" />
    </>
  );
}

/** 張口與兩顆小尖牙：BOSS 的嘴一律帶牙，但牙小而圓鈍，保持繪本式的可愛。 */
export function FangMouth({ x, y, w = 14, h = 6 }: { readonly x: number; readonly y: number; readonly w?: number; readonly h?: number }) {
  const left = f(x - w / 2);
  const right = f(x + w / 2);
  const tooth = f(w * 0.16);
  return (
    <>
      <path d={`M${left} ${y}Q${x} ${f(y + h * 2)} ${right} ${y}Q${x} ${f(y + h * 0.5)} ${left} ${y}Z`} fill={ROYAL.mouth} strokeWidth={2} />
      <path
        d={`M${f(left + w * 0.16)} ${f(y + h * 0.18)}l${tooth / 2} ${f(h * 0.62)}l${tooth / 2} ${f(-h * 0.56)}ZM${f(right - w * 0.32)} ${f(y + h * 0.26)}l${tooth / 2} ${f(h * 0.56)}l${tooth / 2} ${f(-h * 0.62)}Z`}
        fill={ROYAL.tooth}
        strokeWidth={1.2}
      />
    </>
  );
}

/**
 * 王冠：points 個尖頂＋寶石。所有 BOSS 都以冠飾（真冠、葉冠、羽冠、齒輪冠）標示王者身分，
 * 讓「這是地圖 BOSS」不必靠名稱也能辨識。
 */
export function Crown({ x, y, w, h, points = 3, fill, gem = ROYAL.ruby, tilt = -8 }: { readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly points?: number; readonly fill: string; readonly gem?: string; readonly tilt?: number }) {
  const left = x - w / 2;
  // 兩端各一個尖頂，中間每個尖頂之間夾一個凹口。
  const segments = Math.max(1, points - 1) * 2;
  const step = w / segments;
  const tips = Array.from({ length: segments + 1 }, (_, index) => `${f(left + index * step)} ${f(index % 2 === 0 ? y - h : y - h * 0.45)}`);
  const d = `M${f(left)} ${y}L${tips.join('L')}L${f(left + w)} ${y}Z`;
  return (
    <g transform={`rotate(${tilt} ${x} ${y})`}>
      <path d={d} fill={fill} />
      <rect x={f(left - 1)} y={f(y - h * 0.26)} width={f(w + 2)} height={f(h * 0.34)} rx={1.5} fill={fill} strokeWidth={2} />
      <circle cx={x} cy={f(y - h * 0.1)} r={f(h * 0.17)} fill={gem} strokeWidth={1.4} />
    </g>
  );
}
