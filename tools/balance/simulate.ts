import {
  SLOT_IDS,
  defaultSkillIds,
  getStageAt,
  identifyBasePool,
  passiveIdsForJob,
  skillSelectionRule,
  type ContentCatalog,
  type JobDef,
  type QualityId,
} from '@qiwu/content';
import {
  BattleSim,
  computeStatBreakdown,
  mainStatValue,
  type CombatStatsSnapshot,
  type HeroLoadoutSnapshot,
  type ItemInstance,
} from '@qiwu/game-core';

/**
 * 平衡模擬的共用工具（只在本機離線執行，規格 §891：不能每次比較都觸發雲端 CI）。
 * 「同投入」定義：相同角色等級、相同裝備等級與品質、只計主屬性（不含隨機詞條與傳說）。
 * 主武／副手主屬性皆為固定攻擊、共用部位每格只有一種主屬性，因此各路線屬性完全相同，只比較職業機制。
 */

export interface Investment {
  readonly level: number;
  readonly itemLevel: number;
  readonly quality: QualityId;
}

/** 依「同投入」產生 8 件只有主屬性的裝備並計算戰鬥屬性。 */
export function investmentStats(catalog: ContentCatalog, jobId: string, investment: Investment): CombatStatsSnapshot {
  const items: ItemInstance[] = [];
  for (const slot of SLOT_IDS) {
    const base = identifyBasePool(catalog, jobId, slot, investment.level)[0];
    if (!base) continue;
    items.push({
      id: `sim-${slot}`,
      baseId: base.id,
      slot,
      level: investment.itemLevel,
      qualityId: investment.quality,
      mainStat: { stat: base.mainStat, value: mainStatValue(catalog, base, investment.itemLevel, investment.quality) },
      affixes: [],
      hasLegendEffect: false,
      locked: false,
      status: 'owned',
      createdByOperation: 'balance-sim',
      contentVersion: catalog.contentVersion,
      serial: items.length,
      targetJobId: jobId,
    });
  }
  return computeStatBreakdown(catalog, investment.level, items, () => '').combat;
}

export function heroFor(catalog: ContentCatalog, job: JobDef, purpose: 'farm' | 'boss'): HeroLoadoutSnapshot {
  return {
    jobId: job.id,
    skillIds: [...defaultSkillIds(catalog, job.id, purpose)],
    ultimateId: skillSelectionRule(catalog, job.id).ultimate?.id ?? null,
    conditions: {},
    targetPolicy: 'default',
    passiveIds: [...passiveIdsForJob(catalog, job.id)],
    legendBaseIds: [],
  };
}

export interface FarmResult {
  readonly relicsPerMinute: number;
  readonly killsPerMinute: number;
}

/** 在指定關卡循環刷普通怪（與 BOSS 前卡關相同的一波 3 隻），量測每分鐘古物。 */
export function simulateFarm(
  catalog: ContentCatalog,
  job: JobDef,
  stats: CombatStatsSnapshot,
  mapNumber: number,
  localNumber: number,
  durationMs: number,
  seed: number,
): FarmResult {
  const stage = getStageAt(catalog, mapNumber, localNumber);
  const sim = new BattleSim({ catalog, seed, stats, hero: heroFor(catalog, job, 'farm'), encounter: { kind: 'loop', stage } });
  let points = 0;
  let kills = 0;
  const ticks = durationMs / catalog.globals.tickMs;
  for (let tick = 0; tick < ticks; tick += 1) {
    for (const event of sim.tick()) {
      if (event.type !== 'enemyDefeated') continue;
      points += event.rewardPoints;
      kills += 1;
    }
  }
  const minutes = durationMs / 60_000;
  return { relicsPerMinute: points / catalog.tuning.relic.pointsPerRelic / minutes, killsPerMinute: kills / minutes };
}

export interface BossResult {
  readonly successRate: number;
  /** 失敗場次的平均剩餘血量比例（0～1）；全部成功時為 0。 */
  readonly avgRemaining: number;
  /** 成功場次的平均擊殺秒數；沒有成功時為 null。 */
  readonly avgClearSeconds: number | null;
}

export function simulateBoss(catalog: ContentCatalog, job: JobDef, stats: CombatStatsSnapshot, mapNumber: number, seeds: readonly number[]): BossResult {
  const stage = getStageAt(catalog, mapNumber, 30);
  const durationMs = catalog.globals.bossDurationMs;
  let wins = 0;
  let remainingSum = 0;
  let losses = 0;
  let clearMsSum = 0;
  for (const seed of seeds) {
    const sim = new BattleSim({ catalog, seed, stats, hero: heroFor(catalog, job, 'boss'), encounter: { kind: 'boss', stage, durationMs } });
    let remainingBp = 0;
    while (!sim.bossResult) {
      for (const event of sim.tick()) if (event.type === 'bossResolved') remainingBp = event.bossHpRemainingBp;
    }
    if (sim.bossResult === 'success') {
      wins += 1;
      clearMsSum += sim.currentTimeMs;
    } else {
      losses += 1;
      remainingSum += remainingBp / 10000;
    }
  }
  return {
    successRate: wins / seeds.length,
    avgRemaining: losses > 0 ? remainingSum / losses : 0,
    avgClearSeconds: wins > 0 ? clearMsSum / wins / 1000 : null,
  };
}

export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
}
