import { passiveIdsForJob, skillSelectionRule, type ContentCatalog } from '@qiwu/content';
import type { CombatStatsSnapshot, GameState, HeroLoadoutSnapshot, LoadoutPurpose } from '../model/types.ts';
import { cloneJson, type DeepReadonly } from '../util/clone.ts';
import { equippedItems, getBase, readLoadout } from './equipment.ts';
import { computeStatBreakdown, type StatBreakdown } from './stats.ts';

export interface HeroSnapshot {
  readonly stats: CombatStatsSnapshot;
  readonly hero: HeroLoadoutSnapshot;
  readonly breakdown: StatBreakdown;
}

/**
 * 由目前職業與指定配置建立戰鬥用快照。普通戰鬥每次行動使用最新快照；
 * BOSS 整場使用開戰快照（規格 02「命中快照」）。
 */
export function buildHeroSnapshot(
  state: DeepReadonly<GameState> | GameState,
  catalog: ContentCatalog,
  purpose: LoadoutPurpose,
): HeroSnapshot {
  const jobId = state.player.currentJobId;
  const loadout = readLoadout(state, catalog, jobId, purpose);
  const items = equippedItems(state, catalog, jobId, purpose);
  const breakdown = computeStatBreakdown(catalog, state.player.level, items, (item) => getBase(catalog, item.baseId).name);
  const legal = new Set(skillSelectionRule(catalog, jobId).regularPool.map((skill) => skill.id));
  const legendBaseIds = items
    .filter((item) => item.hasLegendEffect && getBase(catalog, item.baseId).legend)
    .map((item) => item.baseId);
  return {
    breakdown,
    stats: cloneJson(breakdown.combat),
    hero: {
      jobId,
      skillIds: loadout.skillIds.filter((id) => legal.has(id)),
      ultimateId: loadout.ultimateId,
      conditions: { ...loadout.conditions },
      targetPolicy: loadout.targetPolicy,
      passiveIds: [...passiveIdsForJob(catalog, jobId)],
      legendBaseIds,
    },
  };
}
