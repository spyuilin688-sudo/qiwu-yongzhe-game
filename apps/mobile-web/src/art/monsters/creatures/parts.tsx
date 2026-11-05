import { COMMON, INK } from './palette.ts';
import { f } from './shapes.ts';

/**
 * 共用部件。原則：部件只接受「已決定好的填色字串」，不自行呼叫 Kit，
 * 這樣漸層一律在設計函式內登記，渲染 <defs> 時不會漏掉。
 * 怪物一律面向左（朝向勇者），所以眼神、嘴、鼻子都偏左。
 */

/** 腳底接地線：所有怪物共用，戰場上才會站在同一條地平線。 */
export const GROUND_Y = 60;

export function Shadow({ x = 32, w = 36, float = false }: { readonly x?: number; readonly w?: number; readonly float?: boolean }) {
  return <ellipse cx={x} cy={GROUND_Y + 0.6} rx={w / 2} ry={float ? 1.8 : 2.6} fill={INK} opacity={float ? 0.22 : 0.34} stroke="none" />;
}

interface EyeProps {
  readonly x: number;
  readonly y: number;
  readonly r?: number;
}

/** 普通怪的豆豆眼：大黑橢圓＋左上反光，48px 以下仍看得出「可愛」。 */
export function Eye({ x, y, r = 2.8 }: EyeProps) {
  return (
    <>
      <ellipse cx={x} cy={y} rx={f(r * 0.8)} ry={r} fill={INK} stroke="none" />
      <circle cx={f(x - r * 0.3)} cy={f(y - r * 0.42)} r={f(r * 0.38)} fill={COMMON.white} stroke="none" />
    </>
  );
}

/** 有眼白的圓眼（煤球、墨水等深色身體需要白底才看得到眼神）。 */
export function RoundEye({ x, y, r = 3.4, pupil = INK }: EyeProps & { readonly pupil?: string }) {
  return (
    <>
      <circle cx={x} cy={y} r={r} fill={COMMON.white} strokeWidth={1.5} />
      <circle cx={f(x - r * 0.32)} cy={f(y + r * 0.08)} r={f(r * 0.52)} fill={pupil} stroke="none" />
    </>
  );
}

/**
 * 小首領的怒目：上緣斜切成眉、瞳孔發光。inner 為眉頭朝向（'right'＝內眼角在右）。
 * 用同一種眼型標示「這隻比較兇」，玩家在戰場上不必讀名字也能分辨小首領。
 */
export function AngryEye({ x, y, r = 3.2, iris = COMMON.eliteGold, inner = 'right' }: EyeProps & { readonly iris?: string; readonly inner?: 'left' | 'right' }) {
  const high = f(y - r * 0.75);
  const low = f(y - r * 0.05);
  const [leftY, rightY] = inner === 'right' ? [high, low] : [low, high];
  return (
    <>
      <path d={`M${f(x - r)} ${leftY}L${f(x + r)} ${rightY}A${r} ${r} 0 0 1 ${f(x - r)} ${leftY}Z`} fill={iris} strokeWidth={1.6} />
      <ellipse cx={f(x - r * 0.25)} cy={f(y + r * 0.22)} rx={f(r * 0.3)} ry={f(r * 0.42)} fill={INK} stroke="none" />
    </>
  );
}

export function Smile({ x, y, w = 4, depth = 1.6 }: { readonly x: number; readonly y: number; readonly w?: number; readonly depth?: number }) {
  return <path d={`M${f(x - w / 2)} ${y}Q${x} ${f(y + depth * 2)} ${f(x + w / 2)} ${y}`} fill="none" strokeWidth={1.6} />;
}

/** 張開的嘴（含舌頭）；teeth 時上緣加兩顆小尖牙。 */
export function Mouth({ x, y, w = 5, h = 3.2, teeth = false }: { readonly x: number; readonly y: number; readonly w?: number; readonly h?: number; readonly teeth?: boolean }) {
  const left = f(x - w / 2);
  const right = f(x + w / 2);
  return (
    <>
      <path d={`M${left} ${y}Q${x} ${f(y + h * 2)} ${right} ${y}Z`} fill={COMMON.mouth} strokeWidth={1.5} />
      {teeth ? (
        <path
          d={`M${f(left + w * 0.12)} ${f(y + 0.4)}l${f(w * 0.12)} ${f(h * 0.6)}l${f(w * 0.12)} ${f(-h * 0.6)}ZM${f(right - w * 0.36)} ${f(y + 0.4)}l${f(w * 0.12)} ${f(h * 0.6)}l${f(w * 0.12)} ${f(-h * 0.6)}Z`}
          fill={COMMON.tooth}
          strokeWidth={0.8}
        />
      ) : (
        <ellipse cx={f(x + w * 0.08)} cy={f(y + h * 0.62)} rx={f(w * 0.24)} ry={f(h * 0.3)} fill={COMMON.tongue} stroke="none" />
      )}
    </>
  );
}

export function Blush({ x, y, rx = 2.4 }: { readonly x: number; readonly y: number; readonly rx?: number }) {
  return <ellipse cx={x} cy={y} rx={rx} ry={f(rx * 0.55)} fill={COMMON.blush} opacity={0.7} stroke="none" />;
}

/** 圓角短腿：底端落在地平線。 */
export function Leg({ x, top, w = 6, bottom = GROUND_Y, fill }: { readonly x: number; readonly top: number; readonly w?: number; readonly bottom?: number; readonly fill: string }) {
  return <rect x={f(x - w / 2)} y={top} width={w} height={f(bottom - top)} rx={f(Math.min(w / 2, (bottom - top) / 2))} fill={fill} />;
}

/** 左上高光：只用在主體材質，給「圓滾滾」的體積感。 */
export function Shine({ x, y, rx = 3, ry = 1.7, rotate = -30, color = COMMON.white, opacity = 0.7 }: { readonly x: number; readonly y: number; readonly rx?: number; readonly ry?: number; readonly rotate?: number; readonly color?: string; readonly opacity?: number }) {
  return <ellipse cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${rotate} ${x} ${y})`} fill={color} opacity={opacity} stroke="none" />;
}

/** 內部紋路（不填色的描線）：裂痕、葉脈、木紋、縫線。 */
export function Detail({ d, color = INK, w = 1.4, opacity }: { readonly d: string; readonly color?: string; readonly w?: number; readonly opacity?: number }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={w} opacity={opacity} />;
}

/** 王冠：x 為中心、y 為冠底。小首領裡「王」「長」字輩共用。 */
export function Crown({ x, y, w = 14, h = 8, fill = COMMON.gold, gem = COMMON.ruby, rotate = 0 }: { readonly x: number; readonly y: number; readonly w?: number; readonly h?: number; readonly fill?: string; readonly gem?: string; readonly rotate?: number }) {
  const l = f(x - w / 2);
  const r = f(x + w / 2);
  const points = `${l},${y} ${l},${f(y - h)} ${f(x - w / 4)},${f(y - h * 0.45)} ${x},${f(y - h * 1.15)} ${f(x + w / 4)},${f(y - h * 0.45)} ${r},${f(y - h)} ${r},${y}`;
  return (
    <g transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}>
      <polygon points={points} fill={fill} strokeWidth={1.6} />
      <circle cx={x} cy={f(y - h * 0.32)} r={f(Math.max(1.2, w * 0.1))} fill={gem} strokeWidth={1} />
    </g>
  );
}

/** 發條鑰匙：從背部往右伸出。x、y 為插入點。 */
export function WindKey({ x, y, scale = 1, fill = COMMON.gold }: { readonly x: number; readonly y: number; readonly scale?: number; readonly fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="0" y="-1.3" width="6" height="2.6" rx="1" fill={fill} strokeWidth={1.6} />
      <path d="M6 0C5 -6 11 -7.5 11.5 -3.5C11.8 -1.3 9 -0.6 6 0C9 0.6 11.8 1.3 11.5 3.5C11 7.5 5 6 6 0Z" fill={fill} strokeWidth={1.6} />
    </g>
  );
}

/** 疤痕：粉色斜線＋縫線，代表身經百戰的小首領。 */
export function Scar({ x1, y1, x2, y2 }: { readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number }) {
  const mx = f((x1 + x2) / 2);
  const my = f((y1 + y2) / 2);
  const nx = f((y2 - y1) * 0.18);
  const ny = f((x1 - x2) * 0.18);
  return (
    <path
      d={`M${x1} ${y1}L${x2} ${y2}M${f(mx - nx)} ${f(my - ny)}L${f(mx + nx)} ${f(my + ny)}`}
      fill="none"
      stroke={COMMON.scar}
      strokeWidth={1.6}
    />
  );
}

/**
 * 描邊粗線肢體（木偶四肢、蟲腳、鳥腳、細桿）：深色粗線墊底再疊上色線，
 * 一組路徑可含多段，兩個元素就畫完全部細肢。
 */
export function Limbs({ d, color, w = 3.2 }: { readonly d: string; readonly color: string; readonly w?: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={f(w + 2.4)} />
      <path d={d} fill="none" stroke={color} strokeWidth={w} />
    </>
  );
}
