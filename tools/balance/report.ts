import { writeFileSync } from 'node:fs';
import { QUALITY_IDS, loadDefaultCatalog, type JobDef } from '@qiwu/content';
import { identifyXp, sellPrice } from '@qiwu/game-core';
import { investmentStats, median, simulateBoss, simulateFarm, type Investment } from './simulate.ts';

/**
 * 原型平衡報告（規格第 10 章「至少列四張表」）。執行：npm run balance（Node 22.12～22.17 需 --experimental-strip-types，指令已帶）
 * 只在本機跑；結果寫成 Markdown，數字全部來自實際模擬，不是推估。
 *
 * 假設（N，記錄在報告開頭）：
 *  - 地圖 m 的參考角色等級 L(m) = 10m；裝備等級 = L、品質稀有（Q3）、只計主屬性。
 *  - 三轉路線（14 條）在 Lv80 以上（第 8～12 圖）比較；較早的地圖用該等級可用的轉職階段中位數。
 */

const catalog = loadDefaultCatalog();
const FARM_MS = 300_000;
const FARM_SEEDS = [101, 202, 303];
const BOSS_SEEDS = Array.from({ length: 16 }, (_, index) => 7001 + index * 13);
const TOLERANCE = 0.15;
const COMPARE_MAPS = [8, 9, 10, 11, 12];
const PRE_BOSS_LOCAL = 29;
const BOSS_COMPARE_MAP = 9;
const TIER2_MAPS = [4, 5, 6, 7];

const levelForMap = (mapNumber: number): number => 10 * mapNumber;
const investmentFor = (mapNumber: number): Investment => ({ level: levelForMap(mapNumber), itemLevel: levelForMap(mapNumber), quality: 'Q3' });

function jobsOfTier(tier: number): JobDef[] {
  return [...catalog.jobs.values()].filter((job) => job.tier === tier);
}

function tierForLevel(level: number): number {
  const unlocks = [...catalog.jobs.values()].filter((job) => job.tier > 0);
  return Math.max(0, ...unlocks.filter((job) => job.unlockLevel <= level).map((job) => job.tier));
}

function farmRelics(job: JobDef, mapNumber: number, localNumber: number, investment: Investment): number {
  const stats = investmentStats(catalog, job.id, investment);
  const results = FARM_SEEDS.map((seed) => simulateFarm(catalog, job, stats, mapNumber, localNumber, FARM_MS, seed).relicsPerMinute);
  return results.reduce((sum, value) => sum + value, 0) / results.length;
}

const pct = (value: number): string => `${(value * 100).toFixed(1)}%`;
const fixed = (value: number, digits = 2): string => value.toFixed(digits);

const lines: string[] = [];
const out = (line = ''): void => {
  lines.push(line);
};

out('# 原型平衡報告（自動產生）');
out();
out(`內容版本：${catalog.contentVersion}。產生指令：\`node tools/balance/report.ts\`（本機離線，不使用 CI）。`);
out();
out('> 這是原型模擬結果，不是正式平衡結論；規格要求「真實測試結果出現前不標註已平衡」。');
out();
out('## 假設');
out();
out('- 同投入：相同角色等級、裝備等級＝角色等級、全身稀有（Q3）、只計主屬性；不含隨機詞條與傳說特效。各路線屬性因此完全相同，只比較職業機制。');
out('- 地圖 m 的參考等級 L(m)=10m（N）。三轉路線比較用第 8～12 圖（Lv80～120）。');
out(`- 刷怪：在第 ${PRE_BOSS_LOCAL} 關循環（與 BOSS 前卡關相同的一波 3 隻），每條路線 ${FARM_MS / 60_000} 分鐘 × ${FARM_SEEDS.length} 個種子取平均。`);
out(`- 打王：60 秒限時，${BOSS_SEEDS.length} 個種子；使用預設打王配置。驗收門檻：清怪產出在中位數 ±${TOLERANCE * 100}% 內。`);
out();

// ── 表一：14 路線同投入清怪產量 ──
const tier3 = jobsOfTier(3);
out('## 表一：14 路線同投入清怪產量（每分鐘古物）');
out();
out(`| 路線 | ${COMPARE_MAPS.map((m) => `第${m}圖 Lv${levelForMap(m)}`).join(' | ')} | 對中位數最大偏差 |`);
out(`| --- | ${COMPARE_MAPS.map(() => '---:').join(' | ')} | ---: |`);
const farmTable = new Map<string, number[]>();
for (const job of tier3) farmTable.set(job.id, COMPARE_MAPS.map((m) => farmRelics(job, m, PRE_BOSS_LOCAL, investmentFor(m))));
const farmMedians = COMPARE_MAPS.map((_m, index) => median(tier3.map((job) => farmTable.get(job.id)![index]!)));
const outliers: string[] = [];
for (const job of tier3) {
  const values = farmTable.get(job.id)!;
  const deviations = values.map((value, index) => value / farmMedians[index]! - 1);
  const worst = deviations.reduce((best, value) => (Math.abs(value) > Math.abs(best) ? value : best), 0);
  if (Math.abs(worst) > TOLERANCE) outliers.push(`${job.name}（${pct(worst)}）`);
  const cells = values.map((value, index) => `${fixed(value)}${Math.abs(deviations[index]!) > TOLERANCE ? ' ⚠' : ''}`);
  out(`| ${job.name} | ${cells.join(' | ')} | ${worst >= 0 ? '+' : ''}${pct(worst)} |`);
}
out(`| **中位數** | ${farmMedians.map((value) => `**${fixed(value)}**`).join(' | ')} | |`);
out();
out(outliers.length === 0 ? `結果：14 條路線全部落在中位數 ±${TOLERANCE * 100}% 內。` : `超出 ±${TOLERANCE * 100}%：${outliers.join('、')}。`);
out();

// ── 表二：14 路線 BOSS 成功率與剩餘血量 ──
out('## 表二：14 路線同投入 BOSS 成功率／失敗時平均剩餘血量／成功平均秒數');
out();
out(`最後一欄：第 ${BOSS_COMPARE_MAP} 圖王（同投入下全部路線都打不贏，剩餘血量可直接比較打王輸出）造成的傷害比例對中位數的偏差。`);
out();
out(`| 路線 | ${COMPARE_MAPS.map((m) => `第${m}圖王`).join(' | ')} | 第${BOSS_COMPARE_MAP}圖王輸出對中位數 |`);
out(`| --- | ${COMPARE_MAPS.map(() => '---').join(' | ')} | ---: |`);
const bossRows = tier3.map((job) => {
  const results = COMPARE_MAPS.map((m) => simulateBoss(catalog, job, investmentStats(catalog, job.id, investmentFor(m)), m, BOSS_SEEDS));
  const compare = results[COMPARE_MAPS.indexOf(BOSS_COMPARE_MAP)]!;
  // 全部成功時以 1 計；失敗時輸出＝1 − 剩餘血量（成功率 0% 的地圖才用來比較）。
  const dealt = compare.successRate === 1 ? 1 : 1 - compare.avgRemaining;
  return { job, results, dealt };
});
const bossMedian = median(bossRows.map((row) => row.dealt));
const bossOutliers: string[] = [];
for (const row of bossRows) {
  const cells = row.results.map((result) => {
    const clear = result.avgClearSeconds === null ? '—' : `${fixed(result.avgClearSeconds, 1)}s`;
    return `${pct(result.successRate)}／${result.successRate === 1 ? '—' : pct(result.avgRemaining)}／${clear}`;
  });
  const deviation = row.dealt / bossMedian - 1;
  if (Math.abs(deviation) > TOLERANCE) bossOutliers.push(`${row.job.name}（${pct(deviation)}）`);
  out(`| ${row.job.name} | ${cells.join(' | ')} | ${deviation >= 0 ? '+' : ''}${pct(deviation)}${Math.abs(deviation) > TOLERANCE ? ' ⚠' : ''} |`);
}
out();
out(bossOutliers.length === 0 ? `打王輸出全部在中位數 ±${TOLERANCE * 100}% 內。` : `打王輸出超出 ±${TOLERANCE * 100}%：${bossOutliers.join('、')}（規格只要求清怪 ±15%，打王列為比較）。`);
out();

// ── 補充：二轉 14 路線同投入清怪（觀察一、二轉共用招調整的影響）──
const tier2 = jobsOfTier(2);
out(`## 補充：二轉 14 路線同投入清怪（第 ${TIER2_MAPS.join('、')} 圖）`);
out();
out(`| 路線 | ${TIER2_MAPS.map((m) => `第${m}圖 Lv${levelForMap(m)}`).join(' | ')} | 對中位數最大偏差 |`);
out(`| --- | ${TIER2_MAPS.map(() => '---:').join(' | ')} | ---: |`);
const tier2Table = new Map(tier2.map((job) => [job.id, TIER2_MAPS.map((m) => farmRelics(job, m, PRE_BOSS_LOCAL, investmentFor(m)))]));
const tier2Medians = TIER2_MAPS.map((_m, index) => median(tier2.map((job) => tier2Table.get(job.id)![index]!)));
const tier2Outliers: string[] = [];
for (const job of tier2) {
  const values = tier2Table.get(job.id)!;
  const deviations = values.map((value, index) => value / tier2Medians[index]! - 1);
  const worst = deviations.reduce((best, value) => (Math.abs(value) > Math.abs(best) ? value : best), 0);
  if (Math.abs(worst) > TOLERANCE) tier2Outliers.push(`${job.name}（${pct(worst)}）`);
  out(`| ${job.name} | ${values.map((value, index) => `${fixed(value)}${Math.abs(deviations[index]!) > TOLERANCE ? ' ⚠' : ''}`).join(' | ')} | ${worst >= 0 ? '+' : ''}${pct(worst)} |`);
}
out(`| **中位數** | ${tier2Medians.map((value) => `**${fixed(value)}**`).join(' | ')} | |`);
out();
out(tier2Outliers.length === 0 ? `二轉 14 條路線全部在中位數 ±${TOLERANCE * 100}% 內。` : `二轉超出 ±${TOLERANCE * 100}%：${tier2Outliers.join('、')}（規格驗收只針對 14 條三轉路線，列出供下一輪調整）。`);
out();

// ── 表三：各台等平均售價與升級時間 ──
out('## 表三：各台等平均鑑定售價與升級時間');
out();
out('售價期望值＝Σ 品質權重 × 售價(裝備等級, 品質)。升級時間假設：台等 b 時角色在第 b 圖（Lv10b）刷第 29 關，全部裝備出售，每分鐘古物取該等級可用轉職階段所有路線的中位數。');
out();
out('| 台等 | 參考等級 | 平均售價 | 每次鑑定經驗 | 每分鐘古物（中位數） | 每分鐘金幣 | 升下一級費用 | 升級所需分鐘 |');
out('| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
const benchMinutes: number[] = [];
for (const bench of catalog.bench) {
  const level = levelForMap(bench.level);
  const totalWeight = bench.weights.reduce((sum, weight) => sum + weight, 0);
  const avgSell = QUALITY_IDS.reduce((sum, qualityId, index) => sum + ((bench.weights[index] ?? 0) / totalWeight) * sellPrice(catalog, level, qualityId), 0);
  const tier = tierForLevel(level);
  const routes = tier === 0 ? [catalog.jobs.get('NOVICE')!] : jobsOfTier(tier);
  const relics = median(routes.map((job) => farmRelics(job, Math.min(12, bench.level), PRE_BOSS_LOCAL, investmentFor(bench.level))));
  const goldPerMinute = relics * avgSell;
  const minutes = bench.nextCost === null ? null : bench.nextCost / goldPerMinute;
  if (minutes !== null) benchMinutes.push(minutes);
  out(
    `| ${bench.level} | Lv${level} | ${fixed(avgSell, 1)} | ${identifyXp(catalog, level)} | ${fixed(relics)} | ${fixed(goldPerMinute, 1)} | ${bench.nextCost ?? '上限'} | ${minutes === null ? '—' : fixed(minutes, 1)} |`,
  );
}
out();

// ── 表四：相鄰換圖前後每分鐘古物 ──
out('## 表四：相鄰換圖前後每分鐘古物差異');
out();
out('同一角色（換圖前的等級與裝備）打贏 BOSS 進入下一圖第 1 關，比較換圖前（第 29 關）與換圖後的每分鐘古物；取該等級可用轉職階段路線的中位數。');
out();
out('| 換圖 | 參考等級 | 換圖前 | 換圖後 | 差異 |');
out('| --- | ---: | ---: | ---: | ---: |');
const transitionGains: number[] = [];
for (let mapNumber = 1; mapNumber < 12; mapNumber += 1) {
  const investment = investmentFor(mapNumber);
  const tier = tierForLevel(investment.level);
  const routes = tier === 0 ? [catalog.jobs.get('NOVICE')!] : jobsOfTier(tier);
  const before = median(routes.map((job) => farmRelics(job, mapNumber, PRE_BOSS_LOCAL, investment)));
  const after = median(routes.map((job) => farmRelics(job, mapNumber + 1, 1, investment)));
  transitionGains.push(after / before - 1);
  out(`| ${mapNumber}→${mapNumber + 1} | Lv${investment.level} | ${fixed(before)} | ${fixed(after)} | ${after >= before ? '+' : ''}${pct(after / before - 1)} |`);
}
out();

// ── 觀察與待決策（由上面的結果計算，不是推估）──
const allFailMaps = COMPARE_MAPS.filter((m) => bossRows.every((row) => row.results[COMPARE_MAPS.indexOf(m)]!.successRate === 0));
out('## 觀察與待決策');
out();
out(`1. 清怪驗收：14 條三轉路線 ${outliers.length === 0 ? `全部在中位數 ±${TOLERANCE * 100}% 內` : `仍有 ${outliers.length} 條超出`}（共 ${COMPARE_MAPS.length} 個檢查點）。調整清單見 packages/content/src/effects/balanceAdjustments.ts。`);
out(`2. 打王比較：${bossOutliers.length === 0 ? '全部在 ±15% 內' : `${bossOutliers.join('、')} 超出 ±15%`}。牌術與幻影路線的打王輸出偏低是結構性（單體牌、功能性花色、低係數召喚），只調係數效益遞減，建議下一輪改機制而不是再加倍率。`);
out(`3. 成長曲線：同投入（Q3 主屬性、L=10m）在第 ${allFailMaps.length > 0 ? allFailMaps.join('、') : '—'} 圖所有路線都打不贏王；BOSS 血量每圖 ×1.5，而本模型的投入只隨等級線性成長。需要決定：參考等級曲線、或後期依賴的品質／詞條／傳說強度（規格原文未提及目標過王等級）。`);
out(`4. 換圖收益：打贏 BOSS 進入下一圖後，每分鐘古物增加 ${pct(Math.min(...transitionGains))}～${pct(Math.max(...transitionGains))}。原因是下一圖第 1 關血量約為本圖第 29 關的一半、每隻產出 ×1.4；這是規格公式的直接結果，若要平滑需調整 HP(m,n) 或 w(m)。`);
out(`5. 二轉：${tier2Outliers.length === 0 ? '全部在 ±15% 內' : `${tier2Outliers.join('、')} 超出 ±15%`}；一轉共用範圍招（橫掃斬）讓劍士系二轉偏強。規格驗收只針對三轉，列為下一輪。`);
out(`6. 鑑定台：以本模型推算每升一級只需 ${fixed(Math.min(...benchMinutes), 1)}～${fixed(Math.max(...benchMinutes), 1)} 分鐘（全部出售），代表參考等級下金幣產出偏快；與第 3 點一起取決於實際成長曲線，暫不調整費用。`);
out();

const target = process.argv[2] ?? 'docs/BALANCE_REPORT.md';
writeFileSync(target, `${lines.join('\n')}\n`);
console.log(`已寫入 ${target}`);
if (outliers.length > 0) console.log(`清怪偏差超出門檻：${outliers.join('、')}`);
