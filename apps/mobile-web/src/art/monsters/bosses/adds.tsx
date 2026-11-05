import type { BossDesign } from './kit.tsx';
import { ADD_OUTLINE, B01, B02, B03, B04, B05, B06, B07, B08, B09, B10, B11, B12, INK, ROYAL } from './palette.ts';
import { Blob } from './parts.tsx';
import { circles, gear, leaves, regular, sparkles, star, strokes } from './shapes.ts';

/** 48 格畫布的接地線（比例同 128 格 BOSS 的 y=120）。 */
const GROUND = 45;

function AddShadow({ x = 24, w = 26, float = false }: { readonly x?: number; readonly w?: number; readonly float?: boolean }) {
  return <ellipse cx={x} cy={GROUND + 0.5} rx={w / 2} ry={float ? 1.4 : 2} fill={INK} opacity={float ? 0.22 : 0.34} stroke="none" />;
}

/** 副目標的小豆眼＋斜眉：比 BOSS 怒目簡單，40px 顯示時仍看得出牠在瞪勇者。 */
function MiniEyes({ x, y, gap = 6, r = 1.8, brow = true }: { readonly x: number; readonly y: number; readonly gap?: number; readonly r?: number; readonly brow?: boolean }) {
  const right = x + gap;
  return (
    <>
      <path d={circles([[x, y, r], [right, y, r]])} fill={INK} stroke="none" />
      <path d={circles([[x - r * 0.35, y - r * 0.4, r * 0.4], [right - r * 0.35, y - r * 0.4, r * 0.4]])} fill={ROYAL.white} stroke="none" />
      {brow ? <path d={strokes([[x - r * 1.6, y - r * 2.6, x + r * 1.2, y - r * 1.5], [right + r * 1.6, y - r * 2.6, right - r * 1.2, y - r * 1.5]])} fill="none" strokeWidth={1.4} /> : null}
    </>
  );
}

/** 帶描邊的粗線（莖、觸腕、彈簧）。 */
function Rod({ d, color, width }: { readonly d: string; readonly color: string; readonly width: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={width + ADD_OUTLINE * 2} />
      <path d={d} fill="none" stroke={color} strokeWidth={width} />
    </>
  );
}

/**
 * 每張地圖的 BOSS 副目標，依 boss_mechanic_prototype：
 * 有召喚物的地圖畫召喚物本體；沒有召喚物的地圖畫該 BOSS 機制的象徵小物（碎岩、核心、冰殼、火星、聖印）。
 */
const DESIGNS: readonly (readonly [number, BossDesign])[] = [
  /** 枝芽：樹王灑下的種子冒出嫩芽，頂著兩片葉子瞪人。 */
  [
    1,
    (k) => (
      <>
        <AddShadow w={22} />
        <path d="M17 44L15 46M24 44L24 46.5M31 44L33 46" fill="none" stroke={B01.barkDeep} strokeWidth={2.2} />
        <Rod d="M24 28Q23 22 25 15" color={B01.leafDeep} width={2.6} />
        <path d={leaves([[25, 16, 15, 6, -24], [25, 17, 13, 5.5, -158]])} fill={k.paint(B01.leaf)} />
        <path d="M13 38Q13 26 24 26Q35 26 35 38Q35 45 24 45Q13 45 13 38Z" fill={k.paint(B01.bark)} />
        <path d="M15 33Q24 29 33 33" fill="none" stroke={B01.moss} strokeWidth={2.4} />
        <MiniEyes x={19.5} y={37} gap={7} />
        <ellipse cx={18} cy={20} rx={3} ry={1.4} transform="rotate(-20 18 20)" fill={ROYAL.white} opacity={0.4} stroke="none" />
      </>
    ),
  ],
  /** 蜂巢：草編蜂窩，正面一塊六角蜂巢片、入口滴著蜂蜜。 */
  [
    2,
    (k) => (
      <>
        <AddShadow w={30} />
        <path d="M8 44Q6 22 24 8Q42 22 40 44Z" fill={k.paint(B02.amber)} />
        <path d="M24 5L24 9" strokeWidth={2.4} />
        <path d="M11 34Q24 30 37 34M9 40Q24 36 39 40M14 24Q24 20 34 24M19 15Q24 13 29 15" fill="none" stroke={B02.amberDeep} strokeWidth={1.6} />
        <path d={`${regular(18, 28, 4, 6, 0)}${regular(25, 24, 4, 6, 0)}${regular(25, 32, 4, 6, 0)}`} fill={k.paint(B02.honey)} strokeWidth={1.4} />
        <ellipse cx={31} cy={39} rx={4.4} ry={3.6} fill={B02.stripe} strokeWidth={1.6} />
        <path d="M30 42Q29 46 31 47Q33 46 32 42Z" fill={B02.honey} strokeWidth={1.2} />
        <ellipse cx={15} cy={20} rx={3} ry={1.6} transform="rotate(-40 15 20)" fill={ROYAL.white} opacity={0.45} stroke="none" />
      </>
    ),
  ],
  /** 鑽王掘出的碎岩：銅礦岩塊上插著斷掉的鑽頭（此 BOSS 無召喚物，作為圖鑑象徵）。 */
  [
    3,
    (k) => (
      <>
        <AddShadow w={32} />
        <Blob d={circles([[34, 41, 3], [40, 43, 2.2], [9, 42, 2.4]])} fill="#c8b8a8" width={1.6} opacity={0.8} />
        <path d="M27 18L36 6L38 22Z" fill={k.paint(B03.steel)} />
        <path d="M31 13L35 15M33 9L36 10" fill="none" stroke="#5a626e" strokeWidth={1.4} />
        <path d="M8 44L10 28L20 20L34 22L40 34L38 44Z" fill={k.paint('#8a8078')} />
        <path d="M14 32L20 28L22 34ZM28 30L33 28L32 36L27 35ZM18 39L23 37L22 42Z" fill={k.paint(B03.copper)} strokeWidth={1.4} />
        <path d="M12 30L18 23" fill="none" stroke={ROYAL.white} strokeWidth={1.6} opacity={0.4} />
      </>
    ),
  ],
  /** 幻影：無面鐘匠的半透明分身，霧裙下擺飄散、鐘面指針同樣是怒眉。 */
  [
    4,
    (k) => (
      <>
        <AddShadow w={22} float />
        <g opacity={0.82}>
          <path d="M14 22Q24 16 34 22L38 40Q34 44 31 41Q28 45 24 41Q20 45 17 41Q14 44 10 40Z" fill={k.fade(B04.mist, B04.cloak)} />
          <circle cx={24} cy={16} r={9} fill={k.paint(B04.brass)} />
          <circle cx={24} cy={16} r={6.5} fill={B04.dial} strokeWidth={1.4} />
          <path d="M24 17L19 13M24 17L29.5 13.5" fill="none" strokeWidth={2} />
        </g>
        <path d={circles([[21, 20, 1.2], [27, 20, 1.2]])} fill={ROYAL.eyeViolet} stroke="none" />
        <path d={sparkles([[39, 12, 2.6], [8, 26, 2]])} fill={B04.mist} strokeWidth={1} />
      </>
    ),
  ],
  /** 蠍皇的綠松石核心碎片（此 BOSS 以「核心顯露」狀態取代召喚物）。 */
  [
    5,
    (k) => (
      <>
        <AddShadow w={20} float />
        <circle cx={24} cy={22} r={17} fill={k.glow(B05.gem)} stroke="none" />
        <path d="M24 6L34 18L28 38L20 38L14 18Z" fill={k.paint(B05.gem)} />
        <path d="M14 18L34 18M24 6L22 18L24 38M24 6L27 18L28 38" fill="none" stroke={B05.gemDeep} strokeWidth={1.2} />
        <path d="M12 20Q24 26 36 20L34 24Q24 30 14 24Z" fill={k.paint(B05.gold)} strokeWidth={1.6} />
        <path d="M18 12L22 8L20 16Z" fill={ROYAL.white} opacity={0.75} stroke="none" />
      </>
    ),
  ],
  /** 觸腕：章王的觸手從浪花裡冒出，末端捲起、內側一排吸盤。 */
  [
    6,
    (k) => (
      <>
        <AddShadow w={30} />
        <Rod d="M20 44C14 34 16 22 24 14C30 8 38 12 36 18C34 22 30 20 31 17" color={B06.body} width={7} />
        <path d={circles([[19.5, 34, 1.4], [19, 27, 1.4], [22, 20, 1.3], [27, 14.5, 1.2]])} fill={B06.sucker} strokeWidth={0.9} />
        <Blob d={circles([[12, 43, 5], [20, 44, 5.5], [28, 43.5, 4.6], [35, 44, 3.6]])} fill={k.paint(B06.foam)} width={1.6} />
        <path d="M14 18Q16 12 21 10" fill="none" stroke={ROYAL.white} strokeWidth={1.6} opacity={0.45} />
      </>
    ),
  ],
  /** 霜鵬的冰殼碎片（此 BOSS 以開場冰殼取代召喚物）：雪堆上的三根冰晶。 */
  [
    7,
    (k) => {
      const ice = k.fade(B07.ice, B07.iceDeep);
      return (
        <>
          <AddShadow w={30} />
          <path d="M18 40L14 18L20 6L26 18L24 40Z" fill={ice} />
          <path d="M26 40L29 22L35 16L38 24L34 40Z" fill={ice} />
          <path d="M10 40L9 28L13 24L17 32L16 40Z" fill={ice} />
          <path d="M20 9L19 34M33 20L31 36" fill="none" stroke={ROYAL.white} strokeWidth={1.4} opacity={0.75} />
          <Blob d={circles([[12, 43, 5], [22, 42, 6], [33, 43, 5.5]])} fill={k.paint(B07.feather)} width={1.6} />
          <path d={sparkles([[39, 9, 2.8]])} fill={ROYAL.white} strokeWidth={1} />
        </>
      );
    },
  ],
  /** 熔爐火星（此 BOSS 以升溫／弱點暴露取代召喚物）：包著熔岩核的飄浮火團。 */
  [
    8,
    (k) => (
      <>
        <AddShadow w={18} float />
        <circle cx={24} cy={26} r={18} fill={k.glow(B08.magma)} stroke="none" />
        <path d="M24 4C28 12 36 14 36 26C36 34 30 40 24 40C18 40 12 34 12 26C12 20 16 18 16 12C19 16 21 16 22 12Q23 8 24 4Z" fill={k.paint(B08.flame)} />
        <path d="M24 16C27 21 31 24 30 30C30 34 27 36 24 36C21 36 18 34 18 30C18 26 21 24 24 16Z" fill={B08.core} strokeWidth={1.4} />
        <path d="M21 32L24 28L28 31L26 35L22 35Z" fill={k.paint(B08.basalt)} strokeWidth={1.4} />
        <path d={sparkles([[9, 12, 2.2], [39, 16, 2], [36, 6, 1.6]])} fill={B08.core} strokeWidth={0.9} />
      </>
    ),
  ],
  /** 機芯：機械王放出的發條核心，黃銅齒輪中央亮著青色玻璃、底下拖著彈簧。 */
  [
    9,
    (k) => (
      <>
        <AddShadow w={18} float />
        <Rod d="M24 34Q30 36 24 38Q18 40 24 42" color={B09.steel} width={2} />
        <circle cx={24} cy={20} r={16} fill={k.glow(B09.teal)} stroke="none" />
        <path d={gear(24, 20, 11.5, 10, 3.2)} fill={k.paint(B09.brass)} />
        <circle cx={24} cy={20} r={6.5} fill={k.paint(B09.glass)} strokeWidth={1.6} />
        <path d={gear(24, 20, 3, 6, 1.4, 15)} fill={B09.teal} strokeWidth={1} />
        <path d={circles([[16, 14, 1], [32, 26, 1], [32, 14, 1], [16, 26, 1]])} fill={B09.brassDeep} stroke="none" />
      </>
    ),
  ],
  /** 星晶：巨鹿召來的五角星形水晶，飄在空中閃著光。 */
  [
    10,
    (k) => (
      <>
        <AddShadow w={18} float />
        <circle cx={24} cy={21} r={18} fill={k.glow(B10.crystal)} stroke="none" />
        <path d={star(24, 22, 15, 6.6)} fill={k.paint(B10.star)} />
        <path d="M24 7L24 22L38.3 17.4M24 22L32.8 34.1M24 22L15.2 34.1M24 22L9.7 17.4" fill="none" stroke="#d8a830" strokeWidth={1.1} />
        <path d={sparkles([[39, 6, 2.6], [8, 34, 2.2], [40, 32, 1.6]])} fill={ROYAL.white} strokeWidth={0.9} />
      </>
    ),
  ],
  /** 審判官的聖印（此 BOSS 以亮印易傷取代召喚物）：金環包著發光球、刻著幾何印紋。 */
  [
    11,
    (k) => (
      <>
        <AddShadow w={18} float />
        <circle cx={24} cy={22} r={19} fill={k.glow(B11.halo)} stroke="none" />
        <circle cx={24} cy={22} r={13} fill={k.paint(B11.robe)} />
        <circle cx={24} cy={22} r={13} fill="none" stroke={B11.gold} strokeWidth={2.4} />
        <path d={`${regular(24, 22, 8.5, 4, 0)}${regular(24, 22, 8.5, 4, 45)}`} fill="none" stroke={B11.halo} strokeWidth={1.4} />
        <path d={star(24, 22, 4.6, 1.8, 4)} fill={ROYAL.white} strokeWidth={1} />
        <ellipse cx={18} cy={14} rx={3.4} ry={1.6} transform="rotate(-35 18 14)" fill={ROYAL.white} opacity={0.5} stroke="none" />
      </>
    ),
  ],
  /** 書頁：從龍王嘴邊飛出的書頁，兩角摺成翅膀拍動，紙面寫滿墨線。 */
  [
    12,
    (k) => {
      const page = k.paint(B12.page);
      return (
        <>
          <AddShadow w={20} float />
          <path d="M12 18L2 10L6 22Z" fill={page} strokeWidth={1.6} />
          <path d="M36 18L46 8L42 22Z" fill={page} strokeWidth={1.6} />
          <path d="M12 12L36 10L38 36L14 38Z" fill={page} />
          <path d="M31 10.4L36 10L36.4 15Z" fill={k.paint(B12.belly)} strokeWidth={1.4} />
          <path d={strokes([[17, 27, 33, 25.5], [17.5, 31, 33.5, 29.5], [16.5, 17, 27, 16]])} fill="none" stroke={B12.ink} strokeWidth={1.2} />
          <MiniEyes x={20} y={21.5} gap={8} r={1.7} />
          <path d="M26 36L27 44L29 40L31 44L30 35.6Z" fill={B12.ribbon} strokeWidth={1.2} />
        </>
      );
    },
  ],
];

export const ADD_DESIGNS: ReadonlyMap<number, BossDesign> = new Map(DESIGNS);

/** 新地圖尚未交付美術時的佔位：通用小光球，不留空白。 */
export const fallbackAdd: BossDesign = (k) => (
  <>
    <AddShadow w={18} float />
    <circle cx={24} cy={22} r={16} fill={k.glow(ROYAL.gold)} stroke="none" />
    <circle cx={24} cy={22} r={9} fill={k.paint(ROYAL.gold)} />
    <MiniEyes x={21} y={21} gap={6} r={1.4} brow={false} />
  </>
);
