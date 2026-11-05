import { getStageAt, loadDefaultCatalog } from '@qiwu/content';
import { BattleSim } from '@qiwu/game-core';
import { heroFor, investmentStats } from './simulate.ts';

/**
 * 單一路線的傷害來源拆解（平衡調整用）。執行：node tools/balance/breakdown.ts JOB03 JOB28 …
 * 固定第 10 圖第 29 關、Lv100 同投入、刷怪配置 3 分鐘；輸出各技能／來源占總傷害比例與擊殺數。
 */
const catalog = loadDefaultCatalog();
const MAP = 10;
const LEVEL = 100;
const TICKS = 180_000 / catalog.globals.tickMs;

for (const jobId of process.argv.slice(2)) {
  const job = catalog.jobs.get(jobId);
  if (!job) throw new Error(`未知職業 ${jobId}`);
  const stats = investmentStats(catalog, jobId, { level: LEVEL, itemLevel: LEVEL, quality: 'Q3' });
  const hero = heroFor(catalog, job, 'farm');
  const sim = new BattleSim({ catalog, seed: 101, stats, hero, encounter: { kind: 'loop', stage: getStageAt(catalog, MAP, 29) } });
  const bySource = new Map<string, number>();
  let total = 0;
  let kills = 0;
  for (let tick = 0; tick < TICKS; tick += 1) {
    for (const event of sim.tick()) {
      if (event.type === 'enemyDefeated') kills += 1;
      if (event.type !== 'hit') continue;
      const key = event.skillId ? `${catalog.skills.get(event.skillId)?.name ?? event.skillId}(${event.source})` : event.source;
      bySource.set(key, (bySource.get(key) ?? 0) + event.amount);
      total += event.amount;
    }
  }
  const shares = [...bySource.entries()].sort((a, b) => b[1] - a[1]).map(([key, value]) => `${key} ${((value / total) * 100).toFixed(0)}%`);
  console.log(`${job.name}｜擊殺 ${kills}｜${shares.join('、')}`);
}
