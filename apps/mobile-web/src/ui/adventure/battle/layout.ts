import type { CSSProperties } from 'react';
import { H, HORIZON, W } from '../../../art/backgrounds/parts.tsx';

/**
 * 戰場構圖（規格 07）：角色在寬 24%；敵人依 62%、76%、90% 排列，最多 3 敵。
 * BOSS 本體與單獨出場的小首領站中間欄（76%），副目標站兩側前排。
 */
export const HERO_X_PERCENT = 24;
export const ENEMY_SLOT_X = [62, 76, 90] as const;
export type EnemySlot = 0 | 1 | 2;
export const CENTER_SLOT: EnemySlot = 1;

/**
 * 地面線：背景以「寬度貼齊、底部對齊」鋪放（MapBackdrop fit="width"），
 * 所以地面帶高度與容器寬度成正比。腳點放在地面帶的某個深度（0＝地平線、1＝畫面底）：
 *  一般刷怪：40%（背景與戰場共同約定）；
 *  BOSS 戰、召喚台出現時（上下有資訊列，舞台較矮）：60%，讓出頭頂空間給 BOSS 與技能名稱。
 */
export const GROUND_FOOT_DEPTH = 0.4;
export const GROUND_FOOT_DEPTH_COMPACT = 0.6;

/** 腳點離容器底部的距離，以「容器寬度的比例」表示（CSS 端乘上 100cqw）。 */
export function groundFootRatio(depth: number): number {
  const footY = HORIZON + depth * (H - HORIZON);
  return (H - footY) / W;
}

/**
 * 各類美術的影子中心離圖底的距離（以圖寬為單位）。精靈框底邊往下推這段距離，
 * 影子中心（而不是 SVG 底邊）才會落在地面線上。數值對照各美術的 viewBox：
 *  角色 64×80，影子 cy=76.6（heroes/rig.tsx GroundShadow）；
 *  小怪／小首領 64×64，影子 cy=GROUND_Y+0.6=60.6（monsters/creatures/parts.tsx）；
 *  BOSS 128×128，影子 cy=BOSS_GROUND+1=121（monsters/bosses/parts.tsx）；
 *  副目標 48×48，影子 cy=45.5（monsters/bosses/adds.tsx）；
 *  召喚物與區域 40×40，影子 cy=37.2、區域陣心 cy=32（units/UnitArt.tsx）。
 */
export const ART_FOOT = {
  hero: { width: 64, height: 80, shadowY: 76.6 },
  creature: { width: 64, height: 64, shadowY: 60.6 },
  boss: { width: 128, height: 128, shadowY: 121 },
  add: { width: 48, height: 48, shadowY: 45.5 },
  unit: { width: 40, height: 40, shadowY: 37.2 },
  zone: { width: 40, height: 40, shadowY: 32 },
} as const;
export type ArtFootKind = keyof typeof ART_FOOT;

export function footInsetRatio(kind: ArtFootKind): number {
  const art = ART_FOOT[kind];
  return (art.height - art.shadowY) / art.width;
}

/** 傷害飄字存活時間；CSS 動畫時長由同一個值寫入 --duration-float。 */
export const FLOAT_LIFETIME_MS = 800;
/** 技能名稱顯示時間；減少動態效果時沒有淡出動畫，到時由程式移除。 */
export const SKILL_POP_MS = 900;

const PERCENT = 100;
const fixed = (value: number): string => value.toFixed(4);

/**
 * 舞台幾何自訂屬性：由背景座標與美術 viewBox 推導，寫在 .stage 上，
 * CSS 只引用變數名，不再散落 74%、76%、56px 等數字。物件只建立一次，不會每次重繪都換參考。
 */
export const STAGE_GEOMETRY_STYLE = {
  '--ground-ratio': fixed(groundFootRatio(GROUND_FOOT_DEPTH)),
  '--ground-ratio-compact': fixed(groundFootRatio(GROUND_FOOT_DEPTH_COMPACT)),
  '--hero-x': `${HERO_X_PERCENT}%`,
  '--hero-x-ratio': fixed(HERO_X_PERCENT / PERCENT),
  '--foot-inset-hero': fixed(footInsetRatio('hero')),
  '--foot-inset-creature': fixed(footInsetRatio('creature')),
  '--foot-inset-boss': fixed(footInsetRatio('boss')),
  '--foot-inset-add': fixed(footInsetRatio('add')),
  '--foot-inset-unit': fixed(footInsetRatio('unit')),
  '--foot-inset-zone': fixed(footInsetRatio('zone')),
  '--duration-float': `${FLOAT_LIFETIME_MS}ms`,
  '--duration-pop': `${SKILL_POP_MS}ms`,
} as CSSProperties;

export function enemySlotX(slot: EnemySlot): number {
  return ENEMY_SLOT_X[slot];
}
