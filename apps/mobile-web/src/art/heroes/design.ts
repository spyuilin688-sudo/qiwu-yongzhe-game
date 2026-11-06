import type { FamilyKey, JobTier, RouteBranch } from '../types.ts';
import { artisanDesign } from './families/artisan.tsx';
import { bowDesign } from './families/bow.tsx';
import { jesterDesign } from './families/jester.tsx';
import { mageDesign } from './families/mage.tsx';
import { noviceDesign } from './families/novice.tsx';
import { priestDesign } from './families/priest.tsx';
import { rogueDesign } from './families/rogue.tsx';
import { swordDesign } from './families/sword.tsx';
import type { HeroDesign } from './rig.tsx';
import type { FamilyDesigner, HeroStage } from './stage.ts';

const DESIGNERS: Record<Exclude<FamilyKey, 'novice'>, FamilyDesigner> = {
  sword: swordDesign,
  bow: bowDesign,
  mage: mageDesign,
  rogue: rogueDesign,
  priest: priestDesign,
  jester: jesterDesign,
  artisan: artisanDesign,
};

/**
 * 職業外觀 → 骨架參數與圖層。獨立成模組，HeroArt 與「換行頭是否明顯」的測試共用同一份對照。
 * uid 是本實例的 SVG id 前綴（漸層用）。
 */
export function heroDesignFor(family: FamilyKey, tier: JobTier, branch: RouteBranch, uid: string): HeroDesign {
  if (family === 'novice' || tier === 0) return noviceDesign();
  const designer = DESIGNERS[family];
  // 資料異常（二轉以上卻沒有分支）時退回 A 線外觀，而不是畫成錯誤的空白圖。
  const stage: HeroStage = { tier, branch: branch ?? 'A', uid };
  return designer(stage);
}
