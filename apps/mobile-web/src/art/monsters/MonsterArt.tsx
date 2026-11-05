import type { ArtProps } from '../types.ts';
import { BossArt } from './BossArt.tsx';
import { CreatureArt } from './CreatureArt.tsx';

/** 怪物圖分派：BOSS-xx → BossArt，其餘（MON／ELT）→ CreatureArt。 */
export function MonsterArt({ monsterId, ...rest }: ArtProps & { readonly monsterId: string }) {
  if (monsterId.startsWith('BOSS-')) return <BossArt monsterId={monsterId} {...rest} />;
  return <CreatureArt monsterId={monsterId} {...rest} />;
}
