import { Svg } from '../Svg.tsx';
import type { ArtProps, FamilyKey, JobTier, RouteBranch } from '../types.ts';
import { heroDesignFor } from './design.ts';
import { HeroRig } from './rig.tsx';
import { useSvgId } from './svgId.ts';

export interface HeroArtProps extends ArtProps {
  readonly family: FamilyKey;
  readonly tier: JobTier;
  readonly branch: RouteBranch;
}

/** 角色立繪（viewBox 0 0 64 80，面向右、腳踩底部中央）。 */
export function HeroArt({ family, tier, branch, ...rest }: HeroArtProps) {
  const uid = useSvgId('hero');
  return (
    <Svg viewBox="0 0 64 80" {...rest}>
      <HeroRig design={heroDesignFor(family, tier, branch, uid)} />
    </Svg>
  );
}
