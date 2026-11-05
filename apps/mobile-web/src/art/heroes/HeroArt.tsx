import { Svg } from '../Svg.tsx';
import type { ArtProps, FamilyKey, JobTier, RouteBranch } from '../types.ts';
import { artisanDesign } from './families/artisan.tsx';
import { bowDesign } from './families/bow.tsx';
import { jesterDesign } from './families/jester.tsx';
import { mageDesign } from './families/mage.tsx';
import { noviceDesign } from './families/novice.tsx';
import { priestDesign } from './families/priest.tsx';
import { rogueDesign } from './families/rogue.tsx';
import { swordDesign } from './families/sword.tsx';
import { HeroRig, type HeroDesign } from './rig.tsx';
import type { FamilyDesigner, HeroStage } from './stage.ts';
import { useSvgId } from './svgId.ts';

export interface HeroArtProps extends ArtProps {
  readonly family: FamilyKey;
  readonly tier: JobTier;
  readonly branch: RouteBranch;
}

const DESIGNERS: Record<Exclude<FamilyKey, 'novice'>, FamilyDesigner> = {
  sword: swordDesign,
  bow: bowDesign,
  mage: mageDesign,
  rogue: rogueDesign,
  priest: priestDesign,
  jester: jesterDesign,
  artisan: artisanDesign,
};

function designFor(family: FamilyKey, tier: JobTier, branch: RouteBranch, uid: string): HeroDesign {
  if (family === 'novice' || tier === 0) return noviceDesign();
  const designer = DESIGNERS[family];
  // 資料異常（二轉以上卻沒有分支）時退回 A 線外觀，而不是畫成錯誤的空白圖。
  const stage: HeroStage = { tier, branch: branch ?? 'A', uid };
  return designer(stage);
}

/** 角色立繪（viewBox 0 0 64 80，面向右、腳踩底部中央）。 */
export function HeroArt({ family, tier, branch, ...rest }: HeroArtProps) {
  const uid = useSvgId('hero');
  return (
    <Svg viewBox="0 0 64 80" {...rest}>
      <HeroRig design={designFor(family, tier, branch, uid)} />
    </Svg>
  );
}
