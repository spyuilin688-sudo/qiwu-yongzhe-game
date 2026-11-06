import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadDefaultCatalog, type ContentCatalog, type JobDef } from '@qiwu/content';
import {
  GameEngine,
  benchUpgradeCost,
  computeStatBreakdown,
  createInitialState,
  equippedItems,
  isEquipLegal,
  planJobSwitch,
  roughPower,
  type Command,
  type CommandResponse,
  type DeepReadonly,
  type GameState,
  type IdentifyResult,
  type ItemInstance,
} from '@qiwu/game-core';

/**
 * 真實進度模擬：用正式 GameEngine 與正式命令（鑑定、穿戴、出售、升台、轉職、召喚 BOSS）從 Lv1 玩到通關。
 * 回答規格 02 要的「首次過王時間」與換圖前後產出，取代報告裡「等級 = 10 × 地圖」的假設。
 *
 * 玩家模型（N，只用來比較曲線，不代表真實玩家）：
 *  - 有古物就鑑定；鑑定目標設為目前職業。
 *  - 新裝備能穿、且讓粗略戰力（與介面排序同一個 roughPower）變高就同時換上清怪與打王配置，其餘立刻出售。
 *  - 金幣夠就升鑑定台；到轉職等級就沿路線解鎖並轉職，技能用預設配置。
 *  - 走到 BOSS 關立刻召喚；輸了就刷怪，每 BOSS_RETRY_MS 手動再召喚一次（不使用首次自動挑戰）。
 */

/** 輸王後多久再手動召喚一次（玩家回來看一眼的節奏）。 */
export const BOSS_RETRY_MS = 5 * 60_000;
/** 模擬推進步長：必須小於引擎的 maxCatchUpMs，否則刷怪時間會被丟棄。 */
const STEP_MS = 1_000;
/** 同一張圖卡王超過這麼久就判定為「牆」並停止這條路線。 */
export const WALL_LIMIT_MS = 4 * 60 * 60_000;
type SucceededResponse = Extract<CommandResponse, { status: 'succeeded' }>;

/** 量測換圖前後產出的視窗。 */
const RATE_WINDOW_MS = 3 * 60_000;
/** 操作 ID：引擎要求至少 8 個字元，補零讓每個 ID 長度固定。 */
const OPERATION_ID_PREFIX = 'sim-op-';
const OPERATION_ID_DIGITS = 7;

export interface MapProgress {
  readonly mapNumber: number;
  /** 第一次走到 BOSS 關的時間（分鐘，自開局起算）。 */
  readonly reachedBossAtMin: number | null;
  readonly clearedAtMin: number | null;
  readonly attempts: number;
  readonly levelAtClear: number | null;
  readonly benchAtClear: number | null;
  /** 第一次走到 BOSS 關之前 RATE_WINDOW_MS 的每分鐘古物（本圖最後幾關）。 */
  readonly preBossRelicsPerMin: number | null;
  /** 卡在 BOSS 關刷怪時的每分鐘古物（輸王後）。 */
  readonly blockedRelicsPerMin: number | null;
  /** 進入這張圖後前 RATE_WINDOW_MS 的每分鐘古物（換圖後）。 */
  readonly enteringRelicsPerMin: number | null;
}

export interface RouteProgress {
  readonly routeJobId: string;
  readonly routeName: string;
  readonly maps: readonly MapProgress[];
  /** 卡王超過 WALL_LIMIT_MS 的地圖；null 代表通關。 */
  readonly wallAtMap: number | null;
  readonly totalMin: number;
  readonly finalLevel: number;
}

interface MapTracker {
  reachedBossAt: number | null;
  clearedAt: number | null;
  attempts: number;
  levelAtClear: number | null;
  benchAtClear: number | null;
  preBossPoints: number | null;
  blockedMs: number;
  blockedPoints: number;
  enteredAt: number | null;
  pointsAtEntry: number | null;
  enteringPoints: number | null;
}

/** 路線上的職業鏈：一轉 → 二轉 → 三轉。 */
export function routeChain(catalog: ContentCatalog, tier3JobId: string): JobDef[] {
  const chain: JobDef[] = [];
  let job = catalog.jobs.get(tier3JobId);
  while (job && job.tier > 0) {
    chain.unshift(job);
    job = job.parentId ? catalog.jobs.get(job.parentId) : undefined;
  }
  return chain;
}

class ProgressionBot {
  private readonly catalog: ContentCatalog;
  private readonly engine: GameEngine;
  private readonly chain: readonly JobDef[];
  private readonly trackers = new Map<number, MapTracker>();
  private now = 0;
  private serial = 0;
  private nextRetryAt = 0;
  /** 已鑑定件數：古物只會因鑑定而減少，加回來就是開局至今累積產出。 */
  private identified = 0;
  /** 最近 RATE_WINDOW_MS 每一步的累積產出點，用來量「走到 BOSS 關前」的產出。 */
  private readonly recentPoints: { readonly mapNumber: number; readonly points: number }[] = [];

  constructor(catalog: ContentCatalog, routeJobId: string, seed: number) {
    this.catalog = catalog;
    this.engine = new GameEngine({ catalog, nowMs: 0, state: createInitialState(catalog, seed) });
    this.chain = routeChain(catalog, routeJobId);
  }

  private get state(): DeepReadonly<GameState> {
    return this.engine.getState();
  }

  /**
   * 送出正式命令。玩家模型送出前都已檢查條件，所以任何拒絕都代表模擬本身有錯：直接中止，
   * 不能默默略過（曾因操作 ID 太短被拒，前 17 分鐘都無法鑑定，報告數字因此失真）。
   */
  private send(command: Command): SucceededResponse {
    this.serial += 1;
    const operationId = `${OPERATION_ID_PREFIX}${String(this.serial).padStart(OPERATION_ID_DIGITS, '0')}`;
    const response = this.engine.execute({ operationId, command }, this.now);
    if (response.status !== 'succeeded') {
      throw new Error(`模擬命令被拒（${command.type}，${operationId}，${Math.round(this.now / 1000)} 秒）：${response.error.code} ${response.error.message}`);
    }
    return response;
  }

  private tracker(mapNumber: number): MapTracker {
    let tracker = this.trackers.get(mapNumber);
    if (!tracker) {
      tracker = {
        reachedBossAt: null,
        clearedAt: null,
        attempts: 0,
        levelAtClear: null,
        benchAtClear: null,
        preBossPoints: null,
        blockedMs: 0,
        blockedPoints: 0,
        enteredAt: null,
        pointsAtEntry: null,
        enteringPoints: null,
      };
      this.trackers.set(mapNumber, tracker);
    }
    return tracker;
  }

  /** 開局至今累積的內部產出點（古物 × 100 + 未滿 100 的餘數）。 */
  private earnedPoints(): number {
    const { wallet } = this.state;
    return (wallet.relics + this.identified) * this.catalog.tuning.relic.pointsPerRelic + wallet.relicProgress;
  }

  run(limitMs: number): RouteProgress {
    this.enterMap(1);
    let wallAtMap: number | null = null;
    while (this.now < limitMs) {
      const mapBefore = this.state.progress.mapNumber;
      const blockedBefore = this.state.progress.mode === 'FARM_BLOCKED';
      const pointsBefore = this.earnedPoints();
      this.now += STEP_MS;
      this.engine.advance(this.now);
      for (const event of this.engine.drainEvents()) {
        if (event.type !== 'bossResolved' || event.attempt.result !== 'success') continue;
        const tracker = this.tracker(event.attempt.mapNumber);
        tracker.clearedAt = this.now;
        tracker.levelAtClear = this.state.player.level;
        tracker.benchAtClear = this.state.wallet.benchLevel;
        if (event.attempt.mapNumber < this.catalog.mapCount) this.enterMap(event.attempt.mapNumber + 1);
      }
      const stillBlocked = this.state.progress.mode === 'FARM_BLOCKED' && this.state.progress.mapNumber === mapBefore;
      if (blockedBefore && stillBlocked) {
        const tracker = this.tracker(mapBefore);
        tracker.blockedMs += STEP_MS;
        tracker.blockedPoints += this.earnedPoints() - pointsBefore;
      }
      this.measureEntering();
      this.recentPoints.push({ mapNumber: this.state.progress.mapNumber, points: this.earnedPoints() });
      if (this.recentPoints.length > RATE_WINDOW_MS / STEP_MS + 1) this.recentPoints.shift();
      if (this.state.progress.mode === 'ENDGAME_FARM') break;

      this.spendRelics();
      this.advanceJob();
      this.upgradeBench();
      this.challengeBoss();

      const reached = this.tracker(this.state.progress.mapNumber).reachedBossAt;
      if (reached !== null && this.now - reached > WALL_LIMIT_MS) {
        wallAtMap = this.state.progress.mapNumber;
        break;
      }
    }
    return this.report(wallAtMap);
  }

  private enterMap(mapNumber: number): void {
    const tracker = this.tracker(mapNumber);
    tracker.enteredAt = this.now;
    tracker.pointsAtEntry = this.earnedPoints();
  }

  private measureEntering(): void {
    const tracker = this.tracker(this.state.progress.mapNumber);
    if (tracker.enteredAt === null || tracker.pointsAtEntry === null || tracker.enteringPoints !== null) return;
    if (this.now - tracker.enteredAt >= RATE_WINDOW_MS) tracker.enteringPoints = this.earnedPoints() - tracker.pointsAtEntry;
  }

  private spendRelics(): void {
    if (this.state.progress.mode === 'BOSS_FIGHT') return;
    while (this.state.wallet.relics > 0) {
      const response = this.send({ type: 'identify', payload: {} });
      this.identified += 1;
      this.handleNewItem((response.result as IdentifyResult).item);
    }
  }

  private farmPower(replace?: DeepReadonly<ItemInstance>): number {
    const state = this.state;
    const jobId = state.player.currentJobId;
    const current = equippedItems(state, this.catalog, jobId, 'farm');
    const items = replace ? [...current.filter((item) => item.slot !== replace.slot), replace] : current;
    return roughPower(computeStatBreakdown(this.catalog, state.player.level, items, () => '').combat);
  }

  private handleNewItem(item: ItemInstance): void {
    const state = this.state;
    const owned = state.items[item.id];
    if (!owned) return;
    const legal = isEquipLegal(state, this.catalog, owned, state.player.currentJobId);
    if (legal && this.farmPower(owned) > this.farmPower()) {
      const replaced: string[] = [];
      for (const purpose of ['farm', 'boss'] as const) {
        const response = this.send({ type: 'equipItem', payload: { itemId: item.id, purpose } });
        const previous = (response.result as { replacedItemId: string | null }).replacedItemId;
        if (previous) replaced.push(previous);
      }
      this.sellIfFree([...new Set(replaced)]);
      return;
    }
    this.sellIfFree([item.id]);
  }

  private sellIfFree(itemIds: readonly string[]): void {
    const state = this.state;
    const free = itemIds.filter((id) => {
      if (!state.items[id]) return false;
      return !Object.values(state.loadouts).some((loadout) => Object.values(loadout.items).includes(id));
    });
    if (free.length > 0) this.send({ type: 'sellItems', payload: { itemIds: free, origin: 'manual' } });
  }

  private upgradeBench(): void {
    while (this.state.progress.mode !== 'BOSS_FIGHT') {
      const cost = benchUpgradeCost(this.state, { catalog: this.catalog });
      if (cost === null || this.state.wallet.gold < cost) return;
      this.send({ type: 'upgradeBench', payload: { expectedBenchLevel: this.state.wallet.benchLevel } });
    }
  }

  private advanceJob(): void {
    const state = this.state;
    if (state.progress.mode === 'BOSS_FIGHT') return;
    const next = this.chain.find((job) => !state.player.unlockedJobIds.includes(job.id));
    if (!next || state.player.level < next.unlockLevel) return;
    this.send({ type: 'unlockJob', payload: { jobId: next.id } });
    const plan = planJobSwitch(this.state, this.catalog, next.id);
    this.send({ type: 'switchJob', payload: { jobId: next.id, ackUnequipItemIds: [...plan.unequippedItemIds].sort() } });
    const settings = this.state.identifySettings;
    this.send({
      type: 'updateIdentifySettings',
      payload: {
        targetJobId: next.id,
        keep: { ...settings.keep, slots: [...settings.keep.slots], affixStats: [...settings.keep.affixStats] },
        autoSell: { ...settings.autoSell, slots: [...settings.autoSell.slots] },
        confirmAutoSell: settings.autoSell.enabled,
      },
    });
    this.sellIfFree(plan.unequippedItemIds);
  }

  private challengeBoss(): void {
    const { progress } = this.state;
    if (progress.mode !== 'BOSS_READY' && progress.mode !== 'FARM_BLOCKED') return;
    const tracker = this.tracker(progress.mapNumber);
    if (tracker.reachedBossAt === null) {
      tracker.reachedBossAt = this.now;
      const oldest = this.recentPoints[0];
      const windowFull = this.recentPoints.length > RATE_WINDOW_MS / STEP_MS;
      if (oldest && windowFull && oldest.mapNumber === progress.mapNumber) tracker.preBossPoints = this.earnedPoints() - oldest.points;
    }
    if (progress.mode === 'FARM_BLOCKED' && this.now < this.nextRetryAt) return;
    const map = this.catalog.maps.get(progress.mapNumber)!;
    const stageId = map.stageIds[map.stageIds.length - 1]!;
    this.send({ type: 'startBossAttempt', payload: { stageId } });
    tracker.attempts += 1;
    this.nextRetryAt = this.now + this.catalog.globals.bossDurationMs + BOSS_RETRY_MS;
  }

  private report(wallAtMap: number | null): RouteProgress {
    const minutes = (ms: number | null) => (ms === null ? null : ms / 60_000);
    const maps: MapProgress[] = [];
    for (let mapNumber = 1; mapNumber <= this.catalog.mapCount; mapNumber += 1) {
      const tracker = this.trackers.get(mapNumber);
      if (!tracker) continue;
      const perMin = (points: number, ms: number) => (ms > 0 ? points / this.catalog.tuning.relic.pointsPerRelic / (ms / 60_000) : null);
      maps.push({
        mapNumber,
        reachedBossAtMin: minutes(tracker.reachedBossAt),
        clearedAtMin: minutes(tracker.clearedAt),
        attempts: tracker.attempts,
        levelAtClear: tracker.levelAtClear,
        benchAtClear: tracker.benchAtClear,
        preBossRelicsPerMin: tracker.preBossPoints === null ? null : perMin(tracker.preBossPoints, RATE_WINDOW_MS),
        blockedRelicsPerMin: perMin(tracker.blockedPoints, tracker.blockedMs),
        enteringRelicsPerMin: tracker.enteringPoints === null ? null : perMin(tracker.enteringPoints, RATE_WINDOW_MS),
      });
    }
    const route = this.chain.at(-1)!;
    return { routeJobId: route.id, routeName: route.name, maps, wallAtMap, totalMin: this.now / 60_000, finalLevel: this.state.player.level };
  }
}

export function simulateProgression(catalog: ContentCatalog, routeJobId: string, seed: number, limitMs = 24 * 60 * 60_000): RouteProgress {
  return new ProgressionBot(catalog, routeJobId, seed).run(limitMs);
}

/** 實驗用：把部分原型數值覆寫到目錄副本上（例如 {"enemies":{"hpGrowthPerStage":1.0141}}），不改原始檔。 */
export function withTuningOverrides(catalog: ContentCatalog, overrides: Record<string, Record<string, unknown>>): ContentCatalog {
  const tuning = { ...catalog.tuning } as Record<string, unknown>;
  for (const [group, values] of Object.entries(overrides)) tuning[group] = { ...(tuning[group] as object), ...values };
  return { ...catalog, tuning: tuning as ContentCatalog['tuning'] };
}

/** 直接執行：node tools/balance/progression.ts JOB03 [seed] [覆寫 JSON] [--json] */
// 路徑含空白、中文或經過符號連結時，import.meta.url 是編碼後的實際路徑，必須用同樣方式轉換才比得起來。
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const [routeJobId = 'JOB03', seedText = '1', overridesText = '{}'] = process.argv.slice(2).filter((arg) => arg !== '--json');
  const catalog = withTuningOverrides(loadDefaultCatalog(), JSON.parse(overridesText) as Record<string, Record<string, unknown>>);
  const started = performance.now();
  const result = simulateProgression(catalog, routeJobId, Number(seedText));
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result));
  } else {
    console.log(`${result.routeName} 用時 ${((performance.now() - started) / 1000).toFixed(1)}s，遊戲時間 ${result.totalMin.toFixed(0)} 分，最終 Lv${result.finalLevel}，牆 ${result.wallAtMap ?? '無'}`);
    for (const map of result.maps) console.log(JSON.stringify(map));
  }
}
