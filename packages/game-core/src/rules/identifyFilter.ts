import type { ContentCatalog, QualityId } from '@qiwu/content';
import type { GameState, IdentifySettings, ItemInstance } from '../model/types.ts';
import type { DeepReadonly } from '../util/clone.ts';
import { isEquipLegal, readLoadout } from './equipment.ts';

export type IdentifyDisposition = 'keep' | 'autoSell' | 'bag';

export interface IdentifyClassification {
  readonly disposition: IdentifyDisposition;
  readonly reasons: readonly string[];
  readonly settingsVersion: number;
}

/** 自動出售可設定的最高品質，來自 catalog.tuning（N）。 */
export function autoSellMaxAllowedQuality(catalog: ContentCatalog): QualityId {
  return catalog.tuning.identify.autoSellMaxAllowedQuality;
}

export function qualityRank(catalog: ContentCatalog, qualityId: QualityId): number {
  return catalog.qualities.get(qualityId)?.rank ?? 0;
}

/**
 * 自動鑑定篩選：先保護再處理（規格 07）。
 * 保護順序：首次取得傳說基底 → 符合玩家保留條件 → 其他；同時符合保留與出售時保留優先。
 * 新鑑定物品不可能已穿戴或鎖定，因此不需檢查那兩項。篩選只決定處理方式，不影響生成機率。
 */
export function classifyIdentified(
  state: DeepReadonly<GameState> | GameState,
  catalog: ContentCatalog,
  item: DeepReadonly<ItemInstance>,
  settings: DeepReadonly<IdentifySettings>,
  isFirstLegendBase: boolean,
): IdentifyClassification {
  const reasons: string[] = [];
  const rank = qualityRank(catalog, item.qualityId);
  if (isFirstLegendBase) reasons.push('首次取得的傳說基底');
  if (rank >= qualityRank(catalog, settings.keep.minQuality)) {
    reasons.push(`品質達${catalog.qualities.get(settings.keep.minQuality)?.name ?? ''}以上`);
  }
  // 舊存檔沒有 slots 欄位時視為未設定。
  if ((settings.keep.slots ?? []).includes(item.slot)) reasons.push('指定保留部位');
  const matchedAffix = item.affixes.find((affix) => settings.keep.affixStats.includes(affix.stat));
  if (matchedAffix) reasons.push('含指定保留詞條');
  if (settings.keep.upgradesOverEquipped && isUpgradeOverFarmLoadout(state, catalog, item)) {
    reasons.push('主屬性高於目前清怪配置');
  }
  if (reasons.length > 0) return { disposition: 'keep', reasons, settingsVersion: settings.version };

  const sellable =
    settings.autoSell.enabled &&
    rank <= Math.min(qualityRank(catalog, settings.autoSell.maxQuality), qualityRank(catalog, autoSellMaxAllowedQuality(catalog))) &&
    settings.autoSell.slots.includes(item.slot);
  return { disposition: sellable ? 'autoSell' : 'bag', reasons: [], settingsVersion: settings.version };
}

/**
 * 自動出售範圍是否擴大（會讓更多裝備被自動賣掉）：首次開啟、提高品質上限、增加部位，
 * 或在開啟狀態下放寬保留條件。範圍擴大時必須再次確認（規格 07：自動出售須由玩家確認條件）。
 */
export function autoSellScopeWidened(
  catalog: ContentCatalog,
  previous: DeepReadonly<IdentifySettings> | IdentifySettings,
  next: { keep: DeepReadonly<IdentifySettings['keep']>; autoSell: DeepReadonly<IdentifySettings['autoSell']> },
): boolean {
  if (!next.autoSell.enabled) return false;
  if (!previous.autoSell.enabled) return true;
  if (qualityRank(catalog, next.autoSell.maxQuality) > qualityRank(catalog, previous.autoSell.maxQuality)) return true;
  if (next.autoSell.slots.some((slot) => !previous.autoSell.slots.includes(slot))) return true;
  if (qualityRank(catalog, next.keep.minQuality) > qualityRank(catalog, previous.keep.minQuality)) return true;
  const previousSlots = previous.keep.slots ?? [];
  if (previousSlots.some((slot) => !next.keep.slots.includes(slot))) return true;
  if (previous.keep.affixStats.some((stat) => !next.keep.affixStats.includes(stat))) return true;
  return previous.keep.upgradesOverEquipped && !next.keep.upgradesOverEquipped;
}

function isUpgradeOverFarmLoadout(
  state: DeepReadonly<GameState> | GameState,
  catalog: ContentCatalog,
  item: DeepReadonly<ItemInstance>,
): boolean {
  const jobId = state.player.currentJobId;
  if (!isEquipLegal(state, catalog, item, jobId)) return false;
  const equippedId = readLoadout(state, catalog, jobId, 'farm').items[item.slot];
  const equipped = equippedId ? state.items[equippedId] : undefined;
  if (!equipped) return true;
  return equipped.mainStat.stat === item.mainStat.stat && item.mainStat.value > equipped.mainStat.value;
}
