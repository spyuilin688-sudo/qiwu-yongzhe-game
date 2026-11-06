import type { ContentCatalog, EquipmentBaseDef, QualityId } from '@qiwu/content';
import { assertSafeNonNegativeInt, ceilSafe, floorSafe, powInt, roundHalfUp } from '../util/math.ts';

/** 規格 02「成長曲線與產出」與 04「公式 W／O／S／C」的原型公式（N），全部讀 catalog.tuning。 */

export function baseAttackAt(catalog: ContentCatalog, level: number): number {
  const { baseAttackAtLevel1, baseAttackPerLevel } = catalog.tuning.hero;
  return baseAttackAtLevel1 + baseAttackPerLevel * (level - 1);
}

/** 從 L 升至 L+1 所需經驗。 */
export function nextLevelXp(catalog: ContentCatalog, level: number): number {
  const { base, linear, quadratic } = catalog.tuning.progression.nextXp;
  const n = level - 1;
  return base + linear * n + quadratic * n * n;
}

export function identifyXp(catalog: ContentCatalog, levelBefore: number): number {
  const { base, perLevel } = catalog.tuning.progression.identifyXp;
  return base + perLevel * levelBefore;
}

export interface XpResult {
  level: number;
  xp: number;
  levelsGained: number;
}

/** 連續升級逐級扣除門檻並保留餘額；角色等級只由經驗結算導出。 */
export function applyXpGain(catalog: ContentCatalog, level: number, xp: number, gain: number): XpResult {
  assertSafeNonNegativeInt(gain, '經驗增量');
  let currentLevel = level;
  let remaining = xp + gain;
  let levelsGained = 0;
  while (remaining >= nextLevelXp(catalog, currentLevel)) {
    remaining -= nextLevelXp(catalog, currentLevel);
    currentLevel += 1;
    levelsGained += 1;
  }
  return { level: currentLevel, xp: assertSafeNonNegativeInt(remaining, '經驗'), levelsGained };
}

export function sellPrice(catalog: ContentCatalog, itemLevel: number, qualityId: QualityId): number {
  const { sellBase, sellPerLevel, sellMultiplierByQuality } = catalog.tuning.economy;
  return floorSafe((sellBase + sellPerLevel * itemLevel) * sellMultiplierByQuality[qualityId]);
}

/** HP(m,n) = ceil[60 × 1.5^(m−1) × 1.04^(n−1)]。 */
export function normalMonsterHp(catalog: ContentCatalog, mapNumber: number, localStage: number): number {
  const { normalHpBase, hpGrowthPerMap, hpGrowthPerStage } = catalog.tuning.enemies;
  return ceilSafe(normalHpBase * powInt(hpGrowthPerMap, mapNumber - 1) * powInt(hpGrowthPerStage, localStage - 1));
}

/** 敵方護甲 = round(5 × 1.25^(m−1) + 2 × (n−1))。 */
export function monsterArmor(catalog: ContentCatalog, mapNumber: number, localStage: number): number {
  const { armorBase, armorGrowthPerMap, armorPerStage } = catalog.tuning.enemies;
  return roundHalfUp(armorBase * powInt(armorGrowthPerMap, mapNumber - 1) + armorPerStage * (localStage - 1));
}

export function eliteHp(catalog: ContentCatalog, mapNumber: number, localStage: number): number {
  return normalMonsterHp(catalog, mapNumber, localStage) * catalog.tuning.enemies.eliteHpMultiplier;
}

export function bossHp(catalog: ContentCatalog, mapNumber: number, localStage: number): number {
  return normalMonsterHp(catalog, mapNumber, localStage) * catalog.tuning.enemies.bossHpMultiplier;
}

/** w(m) = round(20 × 1.4^(m−1))：普通怪每隻內部產出點。 */
export function normalRelicPoints(catalog: ContentCatalog, mapNumber: number): number {
  const { normalBasePoints, normalGrowthPerMap } = catalog.tuning.relic;
  return roundHalfUp(normalBasePoints * powInt(normalGrowthPerMap, mapNumber - 1));
}

export function eliteRelicPoints(catalog: ContentCatalog, mapNumber: number): number {
  return normalRelicPoints(catalog, mapNumber) * catalog.tuning.relic.eliteMultiplier;
}

function qualityMultiplier(catalog: ContentCatalog, qualityId: QualityId): number {
  const quality = catalog.qualities.get(qualityId);
  if (!quality) throw new Error(`未知品質 ${qualityId}`);
  return quality.multiplier;
}

/** 裝備主屬性：W／O 為固定攻擊點數，S／C 為萬分位並受上限。 */
export function mainStatValue(catalog: ContentCatalog, base: EquipmentBaseDef, itemLevel: number, qualityId: QualityId): number {
  const q = qualityMultiplier(catalog, qualityId);
  const { weapon, offhand, percentS, percentC } = catalog.tuning.itemStats;
  switch (base.mainStatFormula) {
    case 'W':
      return roundHalfUp((weapon.base + weapon.perLevel * itemLevel) * q);
    case 'O':
      return roundHalfUp((offhand.base + offhand.perLevel * itemLevel) * q);
    case 'S':
      return Math.min(percentS.capBp, roundHalfUp((percentS.baseBp + percentS.perLevelBp * itemLevel) * q));
    case 'C':
      return Math.min(percentC.capBp, roundHalfUp((percentC.baseBp + percentC.perLevelBp * itemLevel) * q));
  }
}

export function affixValue(catalog: ContentCatalog, rolledBaseBp: number, qualityId: QualityId): number {
  return roundHalfUp(rolledBaseBp * qualityMultiplier(catalog, qualityId));
}
