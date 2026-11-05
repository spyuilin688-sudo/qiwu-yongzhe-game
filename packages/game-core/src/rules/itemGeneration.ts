import {
  NOVICE_JOB_ID,
  SHARED_SLOT_IDS,
  SLOT_IDS,
  affixPoolForJob,
  identifyBasePool,
  type ContentCatalog,
  type QualityId,
  type SlotId,
  type StatKey,
} from '@qiwu/content';
import type { ItemInstance, StatValue } from '../model/types.ts';
import type { RandomSource } from '../util/rng.ts';
import { affixValue, mainStatValue } from './formulas.ts';

export interface RollItemInput {
  readonly catalog: ContentCatalog;
  readonly rng: RandomSource;
  readonly targetJobId: string;
  /** 物品等級 = 鑑定前角色等級。 */
  readonly itemLevel: number;
  readonly benchLevel: number;
  readonly itemId: string;
  readonly serial: number;
  readonly operationId: string;
}

/**
 * 依固定順序抽選：品質 → 部位 → 基底 → 詞條（規格 02「裝備產出規則」）。
 * 品質分布只由鑑定台等級決定（C-09），地圖不會偷偷提高品質。
 */
export function rollItem(input: RollItemInput): ItemInstance {
  const { catalog, rng, targetJobId, itemLevel, benchLevel } = input;
  const benchRow = catalog.bench[benchLevel - 1];
  if (!benchRow) throw new Error(`鑑定台等級不存在：${benchLevel}`);

  const qualityIndex = rng.pickWeightedIndex(benchRow.weights);
  const qualityId = catalog.qualityOrder[qualityIndex] as QualityId;
  const quality = catalog.qualities.get(qualityId)!;

  // Lv1～9 尚未一轉：只從六個共用部位等權抽取；完成一轉後八部位等權。
  const slotPool: readonly SlotId[] = targetJobId === NOVICE_JOB_ID ? SHARED_SLOT_IDS : SLOT_IDS;
  const slot = slotPool[rng.nextInt(slotPool.length)]!;

  const basePool = identifyBasePool(catalog, targetJobId, slot, itemLevel);
  if (basePool.length === 0) throw new Error(`目標路線 ${targetJobId} 的 ${slot} 沒有可產出基底`);
  const base = basePool[rng.nextInt(basePool.length)]!;

  const affixPool: StatKey[] = [...affixPoolForJob(catalog, targetJobId)];
  const affixes: StatValue[] = [];
  for (let index = 0; index < quality.affixCount && affixPool.length > 0; index += 1) {
    const [stat] = affixPool.splice(rng.nextInt(affixPool.length), 1);
    const range = catalog.tuning.affixRanges.ranges[stat as keyof typeof catalog.tuning.affixRanges.ranges];
    if (!stat || !range) continue;
    const rolled = rng.nextIntInclusive(range.minBp, range.maxBp);
    affixes.push({ stat, value: affixValue(catalog, rolled, qualityId) });
  }

  return {
    id: input.itemId,
    baseId: base.id,
    slot,
    level: itemLevel,
    qualityId,
    mainStat: { stat: base.mainStat, value: mainStatValue(catalog, base, itemLevel, qualityId) },
    affixes,
    hasLegendEffect: quality.hasLegendEffect,
    locked: false,
    status: 'owned',
    createdByOperation: input.operationId,
    contentVersion: catalog.contentVersion,
    serial: input.serial,
    targetJobId,
  };
}
