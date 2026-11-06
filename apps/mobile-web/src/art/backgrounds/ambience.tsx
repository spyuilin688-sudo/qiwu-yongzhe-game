import { memo, type CSSProperties, type ReactNode } from 'react';
import styles from './ambience.module.css';
import { BG01, BG02, BG03, BG04, BG05, BG06, BG07, BG08, BG09, BG10, BG11, BG12 } from './palette.ts';
import { H, W, circles, cloud, sparkles, type Circle } from './parts.tsx';

/**
 * 背景環境動態（審查 bf-17）：疊在戰場背景（MapBackdrop fit="width"）上的極少量動態，
 * 例如飄動的霧、閃爍的星、跳動的燈火。每張圖最多 AMBIENCE_MAX_ITEMS 個，全部是加上去的小圖，
 * 不改動背景本身；只動 transform／opacity，減少動態效果時由全域規則停用並停在靜止樣式。
 * 不使用漸層 id，同頁多個實例也不會衝突。以下皆為程式繪製的原創佔位美術，不是最終美術。
 */

export const AMBIENCE_MOTIONS = ['drift', 'rise', 'pulse', 'twinkle', 'fall'] as const;
export type AmbienceMotion = (typeof AMBIENCE_MOTIONS)[number];

/** 每張圖的動態上限：環境只是陪襯，多了會和戰鬥特效搶注意力，也多佔合成圖層。 */
export const AMBIENCE_MAX_ITEMS = 2;

export interface AmbienceItem {
  readonly motion: AmbienceMotion;
  /** 在背景 viewBox（390×272）內的框：x、y、寬、高。fall 的圖形要在框下方再畫一份（見 SNOW）。 */
  readonly box: readonly [x: number, y: number, width: number, height: number];
  /** 位移量（viewBox 單位）：drift 往右為正、rise 往上為負；其他動態不用。 */
  readonly travel?: number;
  /** 起始延遲（毫秒）：同一張圖兩個動態錯開，不會同時亮暗。 */
  readonly delayMs?: number;
  /** 框內圖形，座標以框左上角為原點。 */
  readonly draw: () => ReactNode;
}

/** 平移一組圓（星點、雪花）到框內座標。 */
const offset = (list: readonly Circle[], dx: number, dy: number): Circle[] => list.map(([x, y, r]) => [x + dx, y + dy, r]);

/** 落雪圖層的雪花（框內座標，框 390×120）；fall 會在下方再畫一份接續。 */
const SNOW: readonly Circle[] = [
  [20, 10, 1.4], [70, 44, 1.2], [118, 18, 1.5], [160, 80, 1.2], [204, 36, 1.4], [246, 96, 1.3],
  [290, 22, 1.5], [332, 64, 1.2], [372, 30, 1.4], [44, 92, 1.3], [138, 108, 1.2], [356, 104, 1.4],
];
const SNOW_BOX_HEIGHT = 120;

export const AMBIENCE: ReadonlyMap<number, readonly AmbienceItem[]> = new Map<number, readonly AmbienceItem[]>([
  // 蘆風原野：天上一縷風痕慢慢飄。
  [1, [{ motion: 'drift', box: [150, 84, 84, 14], travel: 14, draw: () => <path d="M4 9q18 -6 36 0t36 0" fill="none" stroke={BG01.cloud} strokeWidth={1.6} strokeLinecap="round" opacity={0.45} /> }]],
  // 蜜糖林地：林間花粉往上飄。
  [2, [{ motion: 'rise', box: [100, 80, 200, 80], travel: -16, draw: () => <path d={sparkles([[20, 70, 2.2], [76, 52, 1.8], [130, 74, 2], [180, 60, 1.8]])} fill={BG02.pollen} opacity={0.8} /> }]],
  // 銅鈴礦山：兩盞油燈的光暈一明一暗。
  [3, [{ motion: 'pulse', box: [13, 62, 364, 40], draw: () => <path d={circles([[20, 20, 13], [344, 20, 13]])} fill={BG03.lamp} opacity={0.28} /> }]],
  // 霧鐘古鎮：街上的薄霧左右飄移。
  [4, [{ motion: 'drift', box: [0, 150, W, 30], travel: 12, draw: () => <ellipse cx={W / 2} cy={15} rx={W * 0.58} ry={9} fill={BG04.mist} opacity={0.16} /> }]],
  // 砂海商路：烈日的光暈脈動。
  [5, [{ motion: 'pulse', box: [42, 14, 72, 72], draw: () => <circle cx={36} cy={36} r={30} fill={BG05.sun} opacity={0.3} /> }]],
  // 碧潮港灣：海面的反光閃爍。
  [6, [
    { motion: 'twinkle', box: [80, 130, 240, 40], draw: () => <path d={sparkles([[10, 12, 2.4], [130, 26, 2]])} fill={BG06.foam} /> },
    { motion: 'twinkle', box: [80, 130, 240, 40], delayMs: 950, draw: () => <path d={sparkles([[64, 30, 2], [212, 8, 2.4]])} fill={BG06.foam} /> },
  ]],
  // 霜羽雪嶺：細雪落下。
  [7, [{ motion: 'fall', box: [0, 0, W, SNOW_BOX_HEIGHT], draw: () => <path d={circles([...SNOW, ...offset(SNOW, 0, SNOW_BOX_HEIGHT)])} fill={BG07.flake} opacity={0.8} /> }]],
  // 赤爐火山：地上的熔岩裂縫忽明忽暗（疊在靜態裂縫上的亮芯）。
  [8, [{ motion: 'pulse', box: [20, 216, 360, 46], draw: () => <path d="M100 14L130 22L152 16L176 30M240 6L262 14L280 10M10 38L36 32L50 42M300 42L326 34L352 40" fill="none" stroke={BG08.lavaCore} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" /> }]],
  // 發條王城：銅管冒出的蒸汽往上飄散。
  [9, [{ motion: 'rise', box: [40, 56, 310, 56], travel: -14, draw: () => <path d={circles([[22, 40, 6], [34, 32, 7], [282, 22, 6], [272, 14, 5]])} fill={BG09.steam} opacity={0.45} /> }]],
  // 星墜花園：夜空的星一閃一閃（兩組錯開）。
  [10, [
    { motion: 'twinkle', box: [20, 10, 350, 120], draw: () => <path d={sparkles([[32, 20, 3.4], [216, 90, 2.4], [310, 50, 3]])} fill={BG10.star} /> },
    { motion: 'twinkle', box: [20, 10, 350, 120], delayMs: 950, draw: () => <path d={sparkles([[160, 34, 2.6], [108, 110, 2.2]])} fill={BG10.star} /> },
  ]],
  // 空島聖域：雲海的一朵雲慢慢飄。
  [11, [{ motion: 'drift', box: [96, 140, 150, 40], travel: 16, draw: () => <path d={cloud(30, 26, 22)} fill={BG11.cloud} opacity={0.32} /> }]],
  // 終焉書庫：燭光搖曳。
  [12, [{ motion: 'pulse', box: [18, 0, 354, 28], draw: () => <path d={circles([[12, 12, 9], [342, 12, 9]])} fill={BG12.candle} opacity={0.3} /> }]],
]);

const pct = (value: number): string => `${Math.round(value * 10000) / 100}%`;

/** 框的位置與大小（相對於背景框的百分比）。 */
function boxStyle([x, y, width, height]: AmbienceItem['box']): CSSProperties {
  return { left: pct(x / W), top: pct(y / H), width: pct(width / W), height: pct(height / H) };
}

/** 動態參數：位移量換算成自身寬或高的百分比，CSS 以 translate 的百分比移動。 */
function motionStyle(item: AmbienceItem): CSSProperties {
  const [, , width, height] = item.box;
  const base = item.motion === 'drift' ? width : height;
  return {
    ...(item.travel ? { '--ambience-travel': pct(item.travel / base) } : {}),
    ...(item.delayMs ? { animationDelay: `${item.delayMs}ms` } : {}),
  } as CSSProperties;
}

function AmbienceShape({ item }: { readonly item: AmbienceItem }) {
  const [, , width, height] = item.box;
  if (item.motion === 'fall') {
    // 落雪：外框裁切，裡面是上下兩份雪花的雙倍高圖層，由上往下捲動。
    return (
      <div className={styles.clip} style={boxStyle(item.box)}>
        <svg className={`${styles.fallLayer ?? ''} ${styles.fall ?? ''}`} style={motionStyle(item)} viewBox={`0 0 ${width} ${height * 2}`} xmlns="http://www.w3.org/2000/svg" focusable={false}>
          {item.draw()}
        </svg>
      </div>
    );
  }
  return (
    <svg
      className={`${styles.item ?? ''} ${styles[item.motion] ?? ''}`}
      style={{ ...boxStyle(item.box), ...motionStyle(item) }}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      focusable={false}
    >
      {item.draw()}
    </svg>
  );
}

/**
 * 背景環境動態疊層：放在戰場背景容器內、背景 SVG 之後。容器框與寬度貼齊、底部對齊的背景同大
 * （寬 100%、比例 390:272、貼齊底部），子項以百分比定位，所以任何寬度都對得上背景的位置。
 */
export const BackdropAmbience = memo(function BackdropAmbience({ mapNumber }: { readonly mapNumber: number }) {
  const items = AMBIENCE.get(mapNumber);
  if (!items || items.length === 0) return null;
  return (
    <div className={styles.ambience} style={{ aspectRatio: `${W} / ${H}` }} aria-hidden="true" data-testid="backdrop-ambience">
      {items.map((item, index) => (
        <AmbienceShape key={index} item={item} />
      ))}
    </div>
  );
});
