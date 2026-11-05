import {
  RESOURCE_IDS,
  defaultSkillIds,
  getStageAt,
  isBaseLegalForJob,
  loadDefaultCatalog,
  passiveIdsForJob,
  skillSelectionRule,
  type JobDef,
} from '@qiwu/content';
import { describe, expect, it } from 'vitest';
import { BattleSim, type BattleEvent, type CombatStatsSnapshot, type HeroLoadoutSnapshot } from '../src/index.ts';

/**
 * 35 個職業節點的不變量壓力測試：同一套引擎跑每條路線的刷怪與打王，並掛上該路線全部傳說，
 * 檢查不會崩潰、不會無限追加、資源與層數不超上限、召喚上限成立、配置中的每個技能都實際出手。
 * 這不是平衡測試；數值是否合理由平衡報告負責。
 */

const catalog = loadDefaultCatalog();
const TICK_MS = catalog.globals.tickMs;
const FARM_TICKS = 90_000 / TICK_MS;
const BOSS_DURATION_MS = catalog.globals.bossDurationMs;
/** 單刻命中數的寬鬆上限：3 名敵人 × 多段技能 × 追加，遠大於正常值；超過代表追加遞迴。 */
const MAX_HITS_PER_TICK = 60;
/** 每秒本體＋追加命中的寬鬆上限（防止「一層追加鏈」被破壞後指數成長）。 */
const MAX_HITS_PER_SECOND = 120;

function stats(): CombatStatsSnapshot {
  return {
    attack: 400,
    basicIntervalMs: 1000,
    critRateBp: 1500,
    critMultBp: 15000,
    cdrBp: 0,
    bonusBp: { BASIC_DMG: 0, SKILL_DMG: 0, DOT_DMG: 0, SUMMON_DMG: 0, FOLLOWUP_DMG: 0, MARK_DMG: 0, SHATTER_DMG: 0, EXECUTE_DMG: 0 },
  };
}

/** 路線上所有合法基底的傳說（壓力測試用；正式遊戲一個部位只能裝一件）。 */
function routeLegends(jobId: string): string[] {
  return [...catalog.equipment.values()].filter((base) => base.legend && isBaseLegalForJob(catalog, base, jobId)).map((base) => base.id);
}

function heroFor(job: JobDef, purpose: 'farm' | 'boss'): HeroLoadoutSnapshot {
  const rule = skillSelectionRule(catalog, job.id);
  return {
    jobId: job.id,
    skillIds: [...defaultSkillIds(catalog, job.id, purpose)],
    ultimateId: rule.ultimate?.id ?? null,
    conditions: {},
    targetPolicy: 'default',
    passiveIds: [...passiveIdsForJob(catalog, job.id)],
    legendBaseIds: routeLegends(job.id),
  };
}

interface RunSummary {
  readonly casts: ReadonlySet<string>;
  readonly totalDamage: number;
  readonly maxHitsPerTick: number;
  readonly maxHitsPerSecond: number;
}

function run(sim: BattleSim, ticks: number, onTick: (sim: BattleSim) => void): RunSummary {
  const casts = new Set<string>();
  let totalDamage = 0;
  let maxHitsPerTick = 0;
  let maxHitsPerSecond = 0;
  let secondHits = 0;
  for (let tick = 1; tick <= ticks; tick += 1) {
    const events: BattleEvent[] = sim.tick();
    let hits = 0;
    for (const event of events) {
      if (event.type === 'skillCast') casts.add(event.skillId);
      if (event.type === 'hit') {
        hits += 1;
        totalDamage += event.amount;
      }
    }
    maxHitsPerTick = Math.max(maxHitsPerTick, hits);
    secondHits += hits;
    if ((tick * TICK_MS) % 1000 === 0) {
      maxHitsPerSecond = Math.max(maxHitsPerSecond, secondHits);
      secondHits = 0;
    }
    onTick(sim);
    if (sim.bossResult) break;
  }
  return { casts, totalDamage, maxHitsPerTick, maxHitsPerSecond };
}

function checkInvariants(sim: BattleSim, job: JobDef): void {
  const view = sim.view();
  for (const resource of RESOURCE_IDS) {
    const value = view.hero.resources[resource] ?? 0;
    expect(value, `${job.id} ${resource}`).toBeGreaterThanOrEqual(0);
    expect(value, `${job.id} ${resource}`).toBeLessThanOrEqual(5);
  }
  for (const enemy of view.enemies) {
    for (const status of enemy.statuses) expect(status.stacks, `${job.id} ${status.statusId}`).toBeLessThanOrEqual(5);
  }
  const counts = new Map<string, number>();
  for (const unit of view.hero.units) counts.set(unit.kind, (counts.get(unit.kind) ?? 0) + 1);
  expect((counts.get('turret') ?? 0), `${job.id} 砲台上限`).toBeLessThanOrEqual(2);
  expect((counts.get('mech') ?? 0), `${job.id} 機甲上限`).toBeLessThanOrEqual(1);
  expect((counts.get('beast') ?? 0), `${job.id} 戰獸只有一隻`).toBeLessThanOrEqual(1);
  expect((counts.get('phantom') ?? 0) + (counts.get('decoy') ?? 0), `${job.id} 幻影＋替身上限`).toBeLessThanOrEqual(2);
}

const playableJobs = [...catalog.jobs.values()].filter((job) => job.tier > 0);

describe('35 職業：刷怪壓力測試', () => {
  it.each(playableJobs.map((job) => [job.id, job.name, job] as const))('%s %s 刷怪 90 秒', (_id, _name, job) => {
    const stage = getStageAt(catalog, 3, 12);
    const hero = heroFor(job, 'farm');
    const sim = new BattleSim({ catalog, seed: 11, stats: stats(), hero, encounter: { kind: 'loop', stage } });
    const summary = run(sim, FARM_TICKS, (current) => checkInvariants(current, job));
    expect(summary.totalDamage).toBeGreaterThan(0);
    expect(summary.maxHitsPerTick).toBeLessThan(MAX_HITS_PER_TICK);
    expect(summary.maxHitsPerSecond).toBeLessThan(MAX_HITS_PER_SECOND);
    const equipped = [...hero.skillIds, ...(hero.ultimateId ? [hero.ultimateId] : [])];
    expect(equipped.filter((skillId) => !summary.casts.has(skillId)), `${job.id} 未出手技能`).toEqual([]);
  });
});

describe('35 職業：打王壓力測試', () => {
  it.each(playableJobs.map((job) => [job.id, job.name, job] as const))('%s %s 打王（限時、可重播）', (_id, _name, job) => {
    const stage = getStageAt(catalog, 4, 30);
    const hero = heroFor(job, 'boss');
    const setup = { catalog, seed: 29, stats: stats(), hero, encounter: { kind: 'boss' as const, stage, durationMs: BOSS_DURATION_MS } };
    const first = new BattleSim(setup);
    const summary = run(first, BOSS_DURATION_MS / TICK_MS + 1, (current) => checkInvariants(current, job));
    expect(first.bossResult).not.toBeNull();
    expect(summary.maxHitsPerTick).toBeLessThan(MAX_HITS_PER_TICK);
    // 同快照同種子重播必須得到相同結果（BOSS 斷線重播依賴這點）。
    const replay = new BattleSim(setup);
    const replaySummary = run(replay, BOSS_DURATION_MS / TICK_MS + 1, () => undefined);
    expect(replay.bossResult).toBe(first.bossResult);
    expect(replaySummary.totalDamage).toBe(summary.totalDamage);
  });
});
