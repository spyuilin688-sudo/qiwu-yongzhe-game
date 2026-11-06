import type { ReactNode } from 'react';
import { BLUSH, EYE_SHINE, GROUND_SHADOW, INK, SKIN, type Tone } from './palette.ts';
import { capsulePath, circlesPath, ellipsePath } from './shapes.ts';

/**
 * 角色共用骨架（viewBox 0 0 64 80，面向右）。
 * 所有職業共用同一副 Q 版身形，差異全部來自服裝色、髮型與分層道具；
 * 這樣轉職前後的角色比例一致，只換「行頭」，也讓各職業圖層容易替換成正式美術。
 */

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** 頭部圓：大頭身比例，48px 顯示時臉仍看得清。 */
export const HEAD = { cx: 32, cy: 27, r: 13.5 } as const;

const SHOULDER_FRONT: Point = { x: 39.5, y: 44.5 };
const SHOULDER_BACK: Point = { x: 24.5, y: 44.5 };

/** 前手（右側、面向敵人）的姿勢終點；道具座標以這些點為基準對齊。 */
export const FRONT_HAND = {
  grip: { x: 46.5, y: 51.5 },
  raise: { x: 46.5, y: 42.5 },
  low: { x: 44, y: 57.5 },
  reach: { x: 49, y: 47.5 },
  chest: { x: 42, y: 50 },
} as const satisfies Record<string, Point>;

/** 後手（左側、在身體後方）。 */
export const BACK_HAND = {
  low: { x: 20, y: 55 },
  raise: { x: 18.5, y: 42 },
  hip: { x: 21, y: 52.5 },
} as const satisfies Record<string, Point>;

export type FrontHandPose = keyof typeof FRONT_HAND;
export type BackHandPose = keyof typeof BACK_HAND;
export type HairStyle = 'short' | 'tuft' | 'spiky' | 'long' | 'bun' | 'swept';
export type FaceMood = 'smile' | 'fierce' | 'calm' | 'sly' | 'focus';
export type BodyCut = 'tunic' | 'robe';

export interface Outfit {
  readonly top: Tone;
  /** 省略時袖子與上衣同色。 */
  readonly sleeve?: Tone;
  readonly legs: string;
  readonly boots: Tone;
  /** null 表示不畫腰帶（例如長袍改由飾帶表現）。 */
  readonly belt: string | null;
  readonly hair: Tone;
}

/** 一個職業階段的完整外觀：骨架參數＋依繪製順序的道具圖層。 */
export interface HeroDesign {
  readonly outfit: Outfit;
  readonly cut: BodyCut;
  readonly hair: HairStyle;
  readonly mood: FaceMood;
  readonly frontHand: FrontHandPose;
  readonly backHand: BackHandPose;
  /** 戴兜帽、頭盔時耳朵被遮住。 */
  readonly hideEar?: boolean;
  /** 最底層：三轉光暈等。 */
  readonly aura?: ReactNode;
  /** 身體後方：披風、箭袋、背負物。 */
  readonly behind?: ReactNode;
  /** 後手握持物（畫在後手之下，手指會蓋住握柄）。 */
  readonly backItem?: ReactNode;
  /** 軀幹上的護甲、飾帶、腰間小物。 */
  readonly torsoOver?: ReactNode;
  /** 臉上的配件（面具、護目鏡），畫在頭髮之前。 */
  readonly faceOver?: ReactNode;
  /** 帽子、兜帽、頭盔、光環。 */
  readonly headOver?: ReactNode;
  /** 前手握持物（畫在前手之下）。 */
  readonly handItem?: ReactNode;
  /** 最上層：盾牌、浮游物、特效。 */
  readonly front?: ReactNode;
}

const BOOT_BACK_X = 24.8;
const BOOT_FRONT_X = 32.4;

function bootPath(x: number): string {
  // 鞋尖朝右，呼應角色面向敵人。
  return `M${x} 76.5V71.5Q${x} 69.5 ${x + 2} 69.5H${x + 5}Q${x + 7} 69.5 ${x + 7} 71.5V72.3H${x + 8.3}Q${x + 10} 72.3 ${x + 10} 74.4V76.5Z`;
}

const TUNIC = 'M23.2 41.5Q23.4 39.6 25.5 39.6H38.5Q40.6 39.6 40.8 41.5L42.8 61.2Q43 63.4 40.8 63.4H23.2Q21 63.4 21.2 61.2Z';
const TUNIC_SHADE = 'M23.2 41.5L21.2 61.2Q21 63.4 23.2 63.4H28.4Q26.4 55 27.2 39.8H25.5Q23.4 39.6 23.2 41.5Z';
const ROBE = 'M23.2 41.5Q23.4 39.6 25.5 39.6H38.5Q40.6 39.6 40.8 41.5L44.6 70.4Q44.8 72.8 42.5 72.8H21.5Q19.2 72.8 19.4 70.4Z';
const ROBE_SHADE = 'M23.2 41.5L19.4 70.4Q19.2 72.8 21.5 72.8H28.6Q26.2 60 27.2 39.8H25.5Q23.4 39.6 23.2 41.5Z';
const TOP_LIGHT = 'M37.4 42.2Q39.6 42 39.8 44.2L40.7 52.5Q38.4 48.4 37.4 42.2Z';

export function GroundShadow() {
  return <ellipse cx="33" cy="76.6" rx="15" ry="2.4" fill={GROUND_SHADOW} opacity="0.32" stroke="none" />;
}

function Legs({ outfit, cut }: { outfit: Outfit; cut: BodyCut }) {
  return (
    <>
      {cut === 'tunic' ? (
        <path d="M27.6 59H29.2Q31.2 59 31.2 61V70Q31.2 72 29.2 72H27.6Q25.6 72 25.6 70V61Q25.6 59 27.6 59ZM35.2 59H36.8Q38.8 59 38.8 61V70Q38.8 72 36.8 72H35.2Q33.2 72 33.2 70V61Q33.2 59 35.2 59Z" fill={outfit.legs} />
      ) : null}
      <path d={bootPath(BOOT_BACK_X)} fill={outfit.boots.shade} />
      <path d={bootPath(BOOT_FRONT_X)} fill={outfit.boots.base} />
    </>
  );
}

function Torso({ outfit, cut }: { outfit: Outfit; cut: BodyCut }) {
  const isRobe = cut === 'robe';
  return (
    <>
      <path d={isRobe ? ROBE : TUNIC} fill={outfit.top.base} />
      <path d={isRobe ? ROBE_SHADE : TUNIC_SHADE} fill={outfit.top.shade} stroke="none" />
      <path d={TOP_LIGHT} fill={outfit.top.light} stroke="none" opacity="0.7" />
      {outfit.belt && !isRobe ? <rect x="22" y="52.2" width="20" height="3.2" rx="0.8" fill={outfit.belt} strokeWidth="1.6" /> : null}
    </>
  );
}

const ARM_RADIUS = 2.9;
const HAND_RADIUS = 2.7;

/** 手臂是單一膠囊路徑（自帶描邊），任意角度都不必另算旋轉。 */
function Arm({ from, to, sleeve }: { from: Point; to: Point; sleeve: string }) {
  return (
    <>
      <path d={capsulePath(from, to, ARM_RADIUS)} fill={sleeve} strokeWidth="1.8" />
      <circle cx={to.x} cy={to.y} r={HAND_RADIUS} fill={SKIN.base} strokeWidth="1.8" />
    </>
  );
}

const HAIR_CAP: Record<HairStyle, string> = {
  short:
    'M18.3 31C17.2 19.5 23.5 12.6 32.5 12.6C41.5 12.6 46.6 18.5 46 25.5C44.2 23.2 41.6 22.2 38.8 22.8C37.6 21 35 20.6 33 21.8C31 23 30 24.6 29.8 26.6C27.6 26.6 26 28.4 25.8 31C23.8 33.6 20 34 18.3 31Z',
  tuft:
    'M18.3 31C17.2 19.5 23.5 12.6 32.5 12.6C33.5 10 36 8.8 38.4 9.6C36.4 10.4 35.4 11.6 35.2 12.9C42.6 13.8 46.6 19 46 25.5C44.2 23.2 41.6 22.2 38.8 22.8C37.6 21 35 20.6 33 21.8C31 23 30 24.6 29.8 26.6C27.6 26.6 26 28.4 25.8 31C23.8 33.6 20 34 18.3 31Z',
  spiky:
    'M18.6 32C15.4 28 14.6 23 16.6 19.4L19.6 20.2C19.8 15.6 22.6 12 26.4 10.6L27.4 13C29.6 9.6 34 8.4 37.4 9.8L36.4 12.6C40.6 12.6 44.6 15.6 45.6 19.6L47.8 19.4C47.6 22.2 47 24.4 46.2 26C44.2 23.4 41.6 22.4 38.8 23C37.6 21.2 35 20.8 33 22C31 23.2 30 24.8 29.8 26.8C27.6 26.8 26 28.6 25.8 31.2C23.8 33.8 20.4 34.4 18.6 32Z',
  long:
    'M18.3 32C17.2 19.5 23.5 12.6 32.5 12.6C41.5 12.6 46.6 18.5 46 25.5C44.4 23.4 42 22.4 39.2 22.6C37.2 22.4 34.6 22.6 32.4 23.8C30.6 24.8 29.8 26.6 29.8 28.4C27.6 28.4 26 30 25.8 32.8C23.6 35 20 35 18.3 32Z',
  bun:
    'M18.6 30C18 21 23.8 14.6 32 14.6C39.8 14.6 45 19.4 45.4 25C43.4 23 40.8 22.2 38.2 22.8C36 21.6 33 21.8 31 23.4C29.6 24.6 29.4 26 29.6 27.4C27.4 27.6 26 29 25.8 31C23.6 33 20 33 18.6 30Z',
  swept:
    'M18.3 31C17.2 19.5 23.5 12.6 32.5 12.6C40 12.6 45 16.6 46.4 21.8C43.2 21.2 40.4 21.8 38.2 23.6C36.8 22.4 34.6 22.2 32.6 23.2C30.6 24.2 29.8 25.6 29.8 27.4C27.6 27.4 26 29 25.8 31.4C23.8 33.8 20 34 18.3 31Z',
};

const HAIR_LIGHT = 'M21.6 21.6Q24.4 15.6 30.4 14.8Q26.2 17.6 24.4 22.4Z';
/** 長髮在頭部後方垂到肩下。 */
const HAIR_BACK_LONG = 'M19.4 24C15.8 32 16 40.8 19.6 46.6Q23.8 48.2 26.6 44.6L27.6 30Z';
const BUN = { cx: 20.6, cy: 17.4, r: 4.4 } as const;

function Hair({ style, tone, layer }: { style: HairStyle; tone: Tone; layer: 'back' | 'front' }) {
  if (layer === 'back') {
    if (style === 'long') return <path d={HAIR_BACK_LONG} fill={tone.shade} />;
    if (style === 'bun') return <circle cx={BUN.cx} cy={BUN.cy} r={BUN.r} fill={tone.base} />;
    return null;
  }
  return (
    <>
      <path d={HAIR_CAP[style]} fill={tone.base} />
      <path d={HAIR_LIGHT} fill={tone.light} stroke="none" opacity="0.8" />
    </>
  );
}

const EYE_NEAR: Point = { x: 36, y: 29.2 };
const EYE_FAR: Point = { x: 41.6, y: 29.2 };

function Eyes({ mood }: { mood: FaceMood }) {
  if (mood === 'calm') {
    // 閉眼微笑：祭司系的安詳感。
    return (
      <path
        d={`M${EYE_NEAR.x - 1.7} ${EYE_NEAR.y}Q${EYE_NEAR.x} ${EYE_NEAR.y + 1.6} ${EYE_NEAR.x + 1.7} ${EYE_NEAR.y}M${EYE_FAR.x - 1.5} ${EYE_FAR.y}Q${EYE_FAR.x} ${EYE_FAR.y + 1.5} ${EYE_FAR.x + 1.5} ${EYE_FAR.y}`}
        fill="none"
        strokeWidth="1.4"
      />
    );
  }
  const ry = mood === 'sly' || mood === 'focus' ? 1.5 : 2.1;
  return (
    <>
      <path d={ellipsePath(EYE_NEAR.x, EYE_NEAR.y, 1.5, ry) + ellipsePath(EYE_FAR.x, EYE_FAR.y, 1.35, ry)} fill={INK} stroke="none" />
      <path
        d={circlesPath([
          { cx: EYE_NEAR.x + 0.5, cy: EYE_NEAR.y - 0.7, r: 0.6 },
          { cx: EYE_FAR.x + 0.45, cy: EYE_FAR.y - 0.7, r: 0.55 },
        ])}
        fill={EYE_SHINE}
        stroke="none"
      />
    </>
  );
}

const BROWS: Partial<Record<FaceMood, string>> = {
  fierce: 'M33.8 25.4L37.6 26.6M39.8 26.6L43.2 25.2',
  sly: 'M34 26.4L37.8 26.2M39.8 26.2L43.2 26.6',
  focus: 'M34 26L37.8 26.6M39.8 26.6L43.2 26',
};

const MOUTH: Record<FaceMood, string> = {
  smile: 'M37.8 33.8Q39 35.1 40.2 33.8',
  calm: 'M38 34Q39 34.9 40 34',
  fierce: 'M37.4 33.6H40.8Q40.4 35.8 39.1 35.8Q37.8 35.8 37.4 33.6Z',
  sly: 'M37.6 34Q39.2 34.8 40.6 33.4',
  focus: 'M38 34.2H40.2',
};

const BLUSH_PATH = ellipsePath(33.8, 33.1, 2, 1.1) + ellipsePath(42.8, 32.8, 1.5, 1);

function Face({ mood }: { mood: FaceMood }) {
  const brows = BROWS[mood];
  return (
    <>
      <path d={BLUSH_PATH} fill={BLUSH} stroke="none" opacity="0.55" />
      <Eyes mood={mood} />
      {brows ? <path d={brows} fill="none" strokeWidth="1.3" /> : null}
      <path d={MOUTH[mood]} fill={mood === 'fierce' ? INK : 'none'} strokeWidth="1.2" />
    </>
  );
}

/** 依固定圖層順序組合角色；各職業只提供 HeroDesign，不直接碰骨架。 */
export function HeroRig({ design }: { design: HeroDesign }) {
  const { outfit, cut } = design;
  const sleeve = outfit.sleeve ?? outfit.top;
  return (
    <g stroke={INK} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      {design.aura}
      <GroundShadow />
      {design.behind}
      {design.backItem}
      <Arm from={SHOULDER_BACK} to={BACK_HAND[design.backHand]} sleeve={sleeve.shade} />
      <Legs outfit={outfit} cut={cut} />
      <Torso outfit={outfit} cut={cut} />
      {design.torsoOver}
      <Hair style={design.hair} tone={outfit.hair} layer="back" />
      <circle cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} fill={SKIN.base} />
      <path d="M22.6 35.6Q27.4 40.6 35 40.2Q28.4 38.6 22.6 35.6Z" fill={SKIN.shade} stroke="none" opacity="0.8" />
      <Face mood={design.mood} />
      {design.faceOver}
      <Hair style={design.hair} tone={outfit.hair} layer="front" />
      {design.hideEar ? null : <ellipse cx="26.4" cy="30.6" rx="2.1" ry="2.7" fill={SKIN.base} strokeWidth="1.7" />}
      {design.headOver}
      {design.handItem}
      <Arm from={SHOULDER_FRONT} to={FRONT_HAND[design.frontHand]} sleeve={sleeve.base} />
      {design.front}
    </g>
  );
}
