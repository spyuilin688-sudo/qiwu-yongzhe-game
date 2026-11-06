import type { ContentCatalog, JobDef } from '@qiwu/content';
import type { FamilyKey, JobTier, RouteBranch } from './types.ts';

/** 職業系 → 美術家族（依設計資料的職業系名稱，不依 ID 順序）。 */
const FAMILY_BY_NAME: Readonly<Record<string, FamilyKey>> = {
  劍士系: 'sword',
  弓手系: 'bow',
  法師系: 'mage',
  盜賊系: 'rogue',
  祭司系: 'priest',
  小丑系: 'jester',
  工匠系: 'artisan',
};

export interface HeroLook {
  readonly family: FamilyKey;
  readonly tier: JobTier;
  readonly branch: RouteBranch;
}

/** 由職業節點推導角色外觀：家族、轉職階段、分支（同一系第一個二轉為 A，第二個為 B）。 */
export function heroLookFor(catalog: ContentCatalog, jobId: string): HeroLook {
  const job = catalog.jobs.get(jobId);
  if (!job || job.tier === 0) return { family: 'novice', tier: 0, branch: null };
  const family = FAMILY_BY_NAME[job.familyName ?? ''] ?? 'novice';
  return { family, tier: job.tier, branch: branchOf(catalog, job) };
}

function branchOf(catalog: ContentCatalog, job: JobDef): RouteBranch {
  if (job.tier < 2) return null;
  const tier2 = job.tier === 2 ? job : catalog.jobs.get(job.parentId ?? '');
  if (!tier2) return null;
  const siblings = [...catalog.jobs.values()].filter((candidate) => candidate.tier === 2 && candidate.parentId === tier2.parentId);
  return siblings[0]?.id === tier2.id ? 'A' : 'B';
}

export function familyKeyOfName(familyName: string | null): FamilyKey {
  return FAMILY_BY_NAME[familyName ?? ''] ?? 'novice';
}
