import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { TIER3_DEFAULT_SKILLS, loadDefaultCatalog } from '@qiwu/content';
import { BOSS_RETRY_MS, WALL_LIMIT_MS, type RouteProgress } from './progression.ts';
import { median } from './simulate.ts';

/**
 * 真實進度報告：14 條三轉路線各從 Lv1 玩到通關（或卡牆），每條路線一個子行程平行執行。
 * 執行：npm run balance:progression（本機離線，不使用 CI）。
 */

const catalog = loadDefaultCatalog();
const SEEDS = [1];
const PROGRESSION_SCRIPT = fileURLToPath(new URL('./progression.ts', import.meta.url));
const ROUTES = Object.keys(TIER3_DEFAULT_SKILLS);
const CONCURRENCY = Math.max(1, Math.min(4, cpus().length));

function runRoute(routeJobId: string, seed: number): Promise<RouteProgress> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [...process.execArgv, PROGRESSION_SCRIPT, routeJobId, String(seed), '{}', '--json'], { stdio: ['ignore', 'pipe', 'inherit'] });
    let output = '';
    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${routeJobId} 結束碼 ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(output) as RouteProgress);
      } catch {
        reject(new Error(`${routeJobId} 沒有輸出可解析的結果（收到 ${output.length} 字元）`));
      }
    });
  });
}

async function runAll(): Promise<RouteProgress[]> {
  const jobs = ROUTES.flatMap((routeJobId) => SEEDS.map((seed) => ({ routeJobId, seed })));
  const results: RouteProgress[] = [];
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const job = jobs[next]!;
      next += 1;
      results.push(await runRoute(job.routeJobId, job.seed));
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return ROUTES.flatMap((routeJobId) => results.filter((result) => result.routeJobId === routeJobId));
}

const fixed = (value: number | null, digits = 1): string => (value === null || Number.isNaN(value) ? '—' : value.toFixed(digits));
const signedPct = (value: number): string => `${value >= 0 ? '+' : ''}${(value * 100).toFixed(0)}%`;
const medianOf = (values: readonly (number | null)[]): number | null => {
  const present = values.filter((value): value is number => value !== null);
  return present.length > 0 ? median(present) : null;
};

const results = await runAll();
const lines: string[] = [];
const out = (line = ''): void => {
  lines.push(line);
};

out('# 真實進度模擬報告（自動產生）');
out();
out(`內容版本：${catalog.contentVersion}。產生指令：\`npm run balance:progression\`（本機離線，不使用 CI）。`);
out();
out('> 原型模擬，不是正式平衡結論，也不代表真實玩家需要的時間（規格：不能據此宣稱保證多久能三轉）。');
out();
out('## 玩家模型（N）');
out();
out('- 用正式遊戲引擎與正式命令從 Lv1、0 金幣開始玩：有古物就鑑定（目標＝目前職業），能穿且粗略戰力變高就同時換上清怪與打王配置，其餘立即出售。');
out('- 金幣夠就升鑑定台；到轉職等級就沿路線轉職（技能用預設配置）。');
out(`- 走到 BOSS 關立刻手動召喚；輸了就刷怪，每 ${BOSS_RETRY_MS / 60_000} 分鐘再手動召喚一次（不使用首次自動挑戰）。`);
out(`- 同一張圖卡王超過 ${WALL_LIMIT_MS / 3_600_000} 小時判定為「牆」並停止該路線。每條路線 ${SEEDS.length} 個種子。`);
out();

out('## 表一：各路線通關時間');
out();
out('| 路線 | 通關（分鐘） | 最終等級 | 總挑戰次數 | 卡最久的圖（卡王分鐘） | 牆 |');
out('| --- | ---: | ---: | ---: | --- | --- |');
for (const result of results) {
  const stuck = result.maps
    .filter((map) => map.reachedBossAtMin !== null)
    .map((map) => ({ map: map.mapNumber, minutes: (map.clearedAtMin ?? result.totalMin) - map.reachedBossAtMin! }))
    .sort((a, b) => b.minutes - a.minutes)[0];
  const attempts = result.maps.reduce((sum, map) => sum + map.attempts, 0);
  const cleared = result.wallAtMap === null ? fixed(result.totalMin, 0) : '—';
  out(`| ${result.routeName} | ${cleared} | ${result.finalLevel} | ${attempts} | ${stuck ? `第${stuck.map}圖（${fixed(stuck.minutes)}）` : '—'} | ${result.wallAtMap === null ? '無' : `第${result.wallAtMap}圖`} |`);
}
out();

out('## 表二：各圖中位數（14 條路線）');
out();
out('「本圖用時」從進圖到打贏 BOSS；「卡王」從第一次走到 BOSS 關到打贏。換圖產出：本圖走到 BOSS 關前 3 分鐘 → 下一圖進圖後 3 分鐘的每分鐘古物。');
out();
out('| 地圖 | 本圖用時 | 卡王 | 挑戰次數 | 過王等級 | 過王台等 | 王前每分鐘古物 | 下一圖進圖每分鐘古物 | 換圖差異 |');
out('| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
/** 第 1 圖的「王前」產出是轉職前（只有普攻）的速度，換圖差異主要來自轉職，另外列。 */
const jumps: { mapNumber: number; jump: number }[] = [];
const mapDurations = new Map<number, number>();
const mapStuck = new Map<number, number[]>();
for (let mapNumber = 1; mapNumber <= catalog.mapCount; mapNumber += 1) {
  const rows = results.map((result) => ({
    current: result.maps.find((map) => map.mapNumber === mapNumber),
    previous: result.maps.find((map) => map.mapNumber === mapNumber - 1),
    next: result.maps.find((map) => map.mapNumber === mapNumber + 1),
  }));
  const cleared = rows.filter((row) => row.current?.clearedAtMin != null);
  if (cleared.length === 0) continue;
  const duration = medianOf(cleared.map((row) => row.current!.clearedAtMin! - (mapNumber === 1 ? 0 : (row.previous?.clearedAtMin ?? 0))));
  const stuck = medianOf(cleared.map((row) => row.current!.clearedAtMin! - row.current!.reachedBossAtMin!));
  const attempts = medianOf(cleared.map((row) => row.current!.attempts));
  const level = medianOf(cleared.map((row) => row.current!.levelAtClear));
  const bench = medianOf(cleared.map((row) => row.current!.benchAtClear));
  const before = medianOf(rows.map((row) => row.current?.preBossRelicsPerMin ?? null));
  const after = medianOf(rows.map((row) => row.next?.enteringRelicsPerMin ?? null));
  const routeJumps = rows
    .filter((row) => row.current?.preBossRelicsPerMin && row.next?.enteringRelicsPerMin)
    .map((row) => row.next!.enteringRelicsPerMin! / row.current!.preBossRelicsPerMin! - 1);
  const jump = routeJumps.length > 0 ? median(routeJumps) : null;
  if (jump !== null) jumps.push({ mapNumber, jump });
  if (duration !== null) mapDurations.set(mapNumber, duration);
  mapStuck.set(mapNumber, cleared.map((row) => row.current!.clearedAtMin! - row.current!.reachedBossAtMin!));
  out(
    `| ${mapNumber} | ${fixed(duration)} | ${fixed(stuck)} | ${fixed(attempts, 0)} | ${fixed(level, 0)} | ${fixed(bench, 0)} | ${fixed(before)} | ${mapNumber < catalog.mapCount ? fixed(after) : '—'} | ${jump === null ? '—' : signedPct(jump)} |`,
  );
}
out();

const walls = results.filter((result) => result.wallAtMap !== null);
const totals = results.filter((result) => result.wallAtMap === null).map((result) => result.totalMin);
out('## 觀察');
out();
out(`1. 牆：${walls.length === 0 ? '14 條路線都能通關，沒有卡超過上限的圖' : `${walls.map((result) => `${result.routeName}（第${result.wallAtMap}圖）`).join('、')} 卡牆`}。`);
if (totals.length > 0) out(`2. 通關時間：${fixed(Math.min(...totals), 0)}～${fixed(Math.max(...totals), 0)} 分鐘（中位數 ${fixed(median(totals), 0)}）。`);
const laterJumps = jumps.filter((entry) => entry.mapNumber > 1).map((entry) => entry.jump);
const firstJump = jumps.find((entry) => entry.mapNumber === 1)?.jump;
if (laterJumps.length > 0) {
  out(
    `3. 換圖產出差異（各圖中位數）：第 2～${catalog.mapCount - 1} 圖 ${signedPct(Math.min(...laterJumps))}～${signedPct(Math.max(...laterJumps))}，其中 +40% 是規格的每圖產出 ×1.4。${firstJump === undefined ? '' : `第 1 圖 ${signedPct(firstJump)} 主要是 Lv10 轉職前只有普攻，不是換圖本身。`}`,
  );
}
const firstMap = mapDurations.get(1);
if (firstMap !== undefined && totals.length > 0) {
  out(`4. 第 1 圖用時中位數 ${fixed(firstMap)} 分鐘，約佔通關中位數的 ${((firstMap / median(totals)) * 100).toFixed(0)}%（見習者在 Lv10 轉職前只有普攻）；規格沒有開局節奏目標，列為待決策。`);
}
const lastStuck = mapStuck.get(catalog.mapCount) ?? [];
if (lastStuck.length > 0) {
  out(`5. 最後一張圖卡王 ${fixed(Math.min(...lastStuck))}～${fixed(Math.max(...lastStuck))} 分鐘，是各路線差距最大的地方（打王輸出差異直接變成等待時間）。`);
}
out();

const target = process.argv[2] ?? 'docs/PROGRESSION_REPORT.md';
writeFileSync(target, `${lines.join('\n')}\n`);
console.log(`已寫入 ${target}`);
