import type { ContentCatalog } from '@qiwu/content';
import {
  GameEngine,
  assertCanIdentify,
  availabilityOf,
  createInitialState,
  parseSave,
  serializeSave,
  type BattleView,
  type Command,
  type CommandResponse,
  type ContentMigrationReport,
  type DeepReadonly,
  type EngineEvent,
  type ErrorCode,
  type GameState,
  type HeroSnapshot,
  type IdentifyResult,
  type ItemInstance,
  type LoadoutPurpose,
} from '@qiwu/game-core';
import { STORAGE_KEYS, type KeyValueStorage } from './storage.ts';
import { LEASE_HEARTBEAT_MS, isHeldByOther, readLease, releaseLease, writeLease } from './tabLease.ts';

/**
 * 本機原型宿主：把 GameEngine（扮演伺服器 + 戰鬥 worker）接上瀏覽器的計時器、
 * 頁面可見度、localStorage 與分頁 lease。介面只透過 send() 送命令並訂閱快照，
 * 不能直接改金幣、裝備或戰鬥結算。正式服務時以 HTTP／WebSocket 版本替換此類別。
 */

export type HostStatus = 'booting' | 'running' | 'conflict' | 'readonly' | 'loadError';

export type AutoPhase = 'off' | 'running' | 'inFlight' | 'review' | 'noRelic' | 'bagFull' | 'bossLocked' | 'routeInvalid';

export interface AutoIdentifyStatus {
  readonly enabled: boolean;
  readonly phase: AutoPhase;
  readonly message: string;
  readonly reviewItemId: string | null;
}

export interface HostSnapshot {
  readonly status: HostStatus;
  readonly statusMessage: string | null;
  /** 舊內容版本存檔升級後給玩家的一次性說明；顯示後呼叫 dismissMigrationNotice。 */
  readonly migrationNotice: string | null;
  readonly storageAvailable: boolean;
  readonly suspended: boolean;
  readonly state: DeepReadonly<GameState>;
  readonly identifyPending: boolean;
  readonly pendingCount: number;
  readonly auto: AutoIdentifyStatus;
  readonly devSpeed: number;
}

export type HostEvent =
  | EngineEvent
  | { readonly type: 'autoIdentified'; readonly item: ItemInstance; readonly disposition: 'keep' | 'autoSell' | 'bag'; readonly reasons: readonly string[] }
  | { readonly type: 'autoSold'; readonly itemId: string; readonly gold: number }
  | { readonly type: 'reviewRequired'; readonly itemId: string }
  | { readonly type: 'commandRejected'; readonly commandType: string; readonly code: ErrorCode; readonly message: string };

export interface LocalGameHostOptions {
  readonly catalog: ContentCatalog;
  readonly storage: KeyValueStorage;
  /** 模擬伺服器往返延遲，讓「等待回覆」狀態可被看見與測試。 */
  readonly latencyMs?: number;
  /** 僅開發模式：以倍速推進時間（等同時間流逝），正式版固定 1。 */
  readonly devSpeed?: number;
  readonly now?: () => number;
  readonly randomSeed?: () => number;
}

const BATTLE_FRAME_MS = 100;
const LOOP_MS = 50;
const SAVE_THROTTLE_MS = 2000;

export class LocalGameHost {
  readonly catalog: ContentCatalog;
  readonly tabId: string;
  private readonly storage: KeyValueStorage;
  private readonly latencyMs: number;
  private readonly devSpeed: number;
  private readonly realNow: () => number;
  private readonly randomSeed: () => number;
  private readonly baseReal: number;
  /** 開發快轉累計的時間位移，讓快轉後的真實迴圈與引擎時間保持一致。 */
  private devOffsetMs = 0;

  private engine: GameEngine | null = null;
  private status: HostStatus = 'booting';
  private statusMessage: string | null = null;
  private migrationNotice: string | null = null;
  private snapshot: HostSnapshot;
  private stateSignature = '';
  private battleView: BattleView | null = null;
  private lastBattleFrameAt = 0;
  private lastSavedAt = 0;
  private dirty = false;
  private loopTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private pendingCount = 0;
  private identifyInFlight = 0;
  private autoReviewItemId: string | null = null;
  private autoInFlight = false;
  /** 本次開啟自動鑑定以來的自動出售累計，顯示在自動狀態列，取代逐筆提示。 */
  private autoSoldCount = 0;
  private autoSoldGold = 0;
  private autoLastSentAt = Number.NEGATIVE_INFINITY;
  private readonly stateListeners = new Set<() => void>();
  private readonly battleListeners = new Set<() => void>();
  private readonly eventListeners = new Set<(events: readonly HostEvent[]) => void>();
  private disposers: (() => void)[] = [];

  constructor(options: LocalGameHostOptions) {
    this.catalog = options.catalog;
    this.storage = options.storage;
    this.latencyMs = options.latencyMs ?? 60;
    this.devSpeed = Math.max(1, options.devSpeed ?? 1);
    this.realNow = options.now ?? (() => Date.now());
    this.randomSeed = options.randomSeed ?? (() => Math.floor(Math.random() * 0xffffffff));
    this.baseReal = this.realNow();
    this.tabId = `tab-${this.randomSeed().toString(36)}-${this.baseReal.toString(36)}`;
    this.snapshot = this.buildSnapshot(createInitialState(this.catalog, 1));
  }

  // ───────────── 生命週期 ─────────────

  start(): void {
    this.boot(false);
    if (typeof document !== 'undefined') {
      const onVisibility = () => this.onVisibilityChange(document.visibilityState === 'hidden');
      // 重新整理或關閉分頁時釋放 lease，否則重新載入的同一分頁會被誤判為「其他分頁」。
      const onPageHide = () => {
        this.persist(true);
        releaseLease(this.storage, this.tabId);
      };
      const onPageShow = (event: PageTransitionEvent) => {
        if (event.persisted && this.status === 'running') this.boot(false);
      };
      const onStorage = (event: StorageEvent) => {
        if (event.key === STORAGE_KEYS.lease) this.checkLease();
      };
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('pagehide', onPageHide);
      window.addEventListener('pageshow', onPageShow);
      window.addEventListener('storage', onStorage);
      this.disposers.push(
        () => document.removeEventListener('visibilitychange', onVisibility),
        () => window.removeEventListener('pagehide', onPageHide),
        () => window.removeEventListener('pageshow', onPageShow),
        () => window.removeEventListener('storage', onStorage),
      );
    }
  }

  stop(): void {
    this.persist(true);
    this.stopTimers();
    releaseLease(this.storage, this.tabId);
    for (const dispose of this.disposers) dispose();
    this.disposers = [];
  }

  /** 另一分頁持有 lease 時，玩家可主動接管；接管會重新讀取最新存檔。 */
  takeOver(): void {
    this.boot(true);
  }

  /** 清除本機存檔並以新角色重新開始（危險操作，介面需二次確認）。 */
  resetSave(): void {
    this.stopTimers();
    this.storage.remove(STORAGE_KEYS.save);
    this.engine = null;
    this.autoReviewItemId = null;
    this.boot(true);
  }

  private boot(force: boolean): void {
    this.stopTimers();
    const now = this.now();
    const lease = readLease(this.storage);
    if (!force && isHeldByOther(lease, this.tabId, this.realNow())) {
      this.setStatus('conflict', '遊戲已在其他分頁執行；接管後此分頁才會繼續推進。');
      return;
    }
    writeLease(this.storage, this.tabId, this.realNow());
    const loaded = parseSave(this.storage.get(STORAGE_KEYS.save), this.catalog);
    if (!loaded.ok && loaded.reason !== 'EMPTY') {
      this.setStatus('loadError', loaded.message);
      return;
    }
    this.migrationNotice = loaded.ok && loaded.migration ? migrationNoticeText(loaded.migration) : null;
    this.engine = new GameEngine({
      catalog: this.catalog,
      nowMs: now,
      ...(loaded.ok ? { state: loaded.state } : { seed: this.randomSeed() }),
    });
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') this.engine.suspend();
    this.setStatus('running', null);
    this.loopTimer = setInterval(() => this.loop(), LOOP_MS);
    this.heartbeatTimer = setInterval(() => {
      if (this.status === 'running') writeLease(this.storage, this.tabId, this.realNow());
    }, LEASE_HEARTBEAT_MS);
    this.persist(true);
    this.refreshSnapshots(true);
  }

  private stopTimers(): void {
    if (this.loopTimer) clearInterval(this.loopTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.loopTimer = null;
    this.heartbeatTimer = null;
  }

  private checkLease(): void {
    if (this.status !== 'running') return;
    const lease = readLease(this.storage);
    if (lease && lease.tabId !== this.tabId) {
      // 被其他分頁接管：立即停止推進與寫入，避免兩邊重複刷資源。
      this.stopTimers();
      this.setStatus('readonly', '此分頁已被其他分頁接管，畫面僅供檢視。');
    }
  }

  private onVisibilityChange(hidden: boolean): void {
    const engine = this.engine;
    if (!engine || this.status !== 'running') return;
    if (hidden) {
      engine.suspend();
      this.persist(true);
    } else {
      engine.resume(this.now());
    }
    this.refreshSnapshots(true);
  }

  private setStatus(status: HostStatus, message: string | null): void {
    this.status = status;
    this.statusMessage = message;
    this.refreshSnapshots(true);
  }

  // ───────────── 主迴圈 ─────────────

  private now(): number {
    return this.baseReal + (this.realNow() - this.baseReal) * this.devSpeed + this.devOffsetMs;
  }

  private loop(): void {
    const engine = this.engine;
    if (!engine || this.status !== 'running') return;
    engine.advance(this.now());
    this.dispatchEngineEvents();
    this.stepAutoIdentify();
    this.refreshSnapshots(false);
    this.persist(false);
  }

  /** 開發模式快轉：等同時間流逝，逐刻推進，不跳過任何結算。 */
  devFastForward(ms: number): void {
    const engine = this.engine;
    if (!engine || this.status !== 'running') return;
    const start = this.now();
    for (let elapsed = LOOP_MS; elapsed <= ms; elapsed += LOOP_MS) {
      engine.advance(start + elapsed);
      this.dispatchEngineEvents();
    }
    this.devOffsetMs += ms;
    this.refreshSnapshots(true);
    this.persist(true);
  }

  private dispatchEngineEvents(): void {
    const events = this.engine?.drainEvents() ?? [];
    if (events.length === 0) return;
    this.dirty = true;
    this.emit(events);
  }

  private emit(events: readonly HostEvent[]): void {
    if (events.length === 0) return;
    for (const listener of this.eventListeners) listener(events);
  }

  private persist(force: boolean): void {
    const engine = this.engine;
    if (!engine || this.status !== 'running') return;
    const realNow = this.realNow();
    if (!force && (!this.dirty || realNow - this.lastSavedAt < SAVE_THROTTLE_MS)) return;
    this.storage.set(STORAGE_KEYS.save, serializeSave(engine.exportState(), this.now()));
    this.lastSavedAt = realNow;
    this.dirty = false;
  }

  // ───────────── 命令 ─────────────

  send(command: Command): Promise<CommandResponse> {
    const operationId = this.newOperationId();
    const isIdentify = command.type === 'identify';
    this.pendingCount += 1;
    if (isIdentify) this.identifyInFlight += 1;
    this.refreshSnapshots(true);
    const run = async (): Promise<CommandResponse> => {
      if (this.latencyMs > 0) await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
      const engine = this.engine;
      let response: CommandResponse;
      if (!engine || this.status !== 'running') {
        response = {
          status: 'rejected',
          operationId,
          commandType: command.type,
          error: { code: 'LEASE_LOST', message: '此分頁目前不能寫入（已被接管或尚未啟動）。', retryable: false, currentRevision: 0 },
        };
      } else {
        response = engine.execute({ operationId, contentVersion: this.catalog.contentVersion, command }, this.now());
        this.dispatchEngineEvents();
        this.dirty = true;
        // 經濟操作提交後立即保存，避免重新整理造成重抽或遺失。
        this.persist(true);
      }
      if (response.status === 'rejected') {
        this.emit([{ type: 'commandRejected', commandType: command.type, code: response.error.code, message: response.error.message }]);
      }
      return response;
    };
    const result = this.queue.then(run, run);
    this.queue = result.catch(() => undefined);
    return result.finally(() => {
      this.pendingCount -= 1;
      if (isIdentify) this.identifyInFlight -= 1;
      this.refreshSnapshots(true);
    });
  }

  private newOperationId(): string {
    const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${this.randomSeed()}-${this.realNow()}`;
    return `op-${random}`;
  }

  // ───────────── 自動鑑定（客戶端逐筆送出同一條鑑定流程） ─────────────

  setAutoIdentify(enabled: boolean): Promise<CommandResponse> {
    if (!enabled) this.autoReviewItemId = null;
    if (enabled) {
      this.autoSoldCount = 0;
      this.autoSoldGold = 0;
    }
    return this.send({ type: 'setAutoIdentify', payload: { enabled } });
  }

  /** 玩家處理完暫停中的保留裝備（穿戴／出售／保留／關閉面板）後繼續下一筆。 */
  resolveReview(): void {
    if (this.autoReviewItemId === null) return;
    this.autoReviewItemId = null;
    this.refreshSnapshots(true);
  }

  private stepAutoIdentify(): void {
    const engine = this.engine;
    if (!engine) return;
    const state = engine.getState();
    // 暫停中的那件裝備已被玩家在背包出售時，不必再等待查看。
    if (this.autoReviewItemId && !state.items[this.autoReviewItemId]) {
      this.autoReviewItemId = null;
      this.refreshSnapshots(true);
    }
    if (!state.identifySettings.autoEnabled || this.autoInFlight || this.autoReviewItemId) return;
    if (this.identifyInFlight > 0 || this.autoBlocker(state) !== null) return;
    const realNow = this.realNow();
    if (realNow - this.autoLastSentAt < this.catalog.tuning.identify.autoMinIntervalMs) return;
    this.autoInFlight = true;
    this.autoLastSentAt = realNow;
    void this.send({ type: 'identify', payload: {} }).then((response) => this.onAutoIdentified(response));
  }

  private async onAutoIdentified(response: CommandResponse): Promise<void> {
    this.autoInFlight = false;
    if (response.status !== 'succeeded') return;
    const result = response.result as IdentifyResult;
    const { disposition, reasons } = result.classification;
    this.emit([{ type: 'autoIdentified', item: result.item, disposition, reasons }]);
    if (disposition === 'keep') {
      this.autoReviewItemId = result.item.id;
      this.emit([{ type: 'reviewRequired', itemId: result.item.id }]);
    } else if (disposition === 'autoSell') {
      // 自動出售是獨立的出售命令，以來源 operationId 關聯；不是鑑定直接送金幣。
      const sold = await this.send({
        type: 'sellItems',
        payload: { itemIds: [result.item.id], origin: 'auto', sourceOperationId: response.operationId },
      });
      if (sold.status === 'succeeded') {
        const gold = (sold.result as { goldGained: number }).goldGained;
        this.autoSoldCount += 1;
        this.autoSoldGold += gold;
        this.emit([{ type: 'autoSold', itemId: result.item.id, gold }]);
      }
    }
    this.refreshSnapshots(true);
  }

  /** 與手動鑑定共用核心驗證器，避免兩份規則不一致而重複送出必定失敗的命令。 */
  private autoBlocker(state: DeepReadonly<GameState>): AutoPhase | null {
    const availability = availabilityOf(() => assertCanIdentify(state, { catalog: this.catalog }));
    switch (availability.code) {
      case null:
        return null;
      case 'BOSS_LOCKED':
        return 'bossLocked';
      case 'BAG_FULL':
        return 'bagFull';
      case 'NO_RELIC':
        return 'noRelic';
      default:
        return 'routeInvalid';
    }
  }

  private autoStatus(state: DeepReadonly<GameState>): AutoIdentifyStatus {
    const enabled = state.identifySettings.autoEnabled;
    const base = { enabled, reviewItemId: this.autoReviewItemId };
    if (!enabled) return { ...base, phase: 'off', message: '自動鑑定關閉' };
    if (this.autoReviewItemId) return { ...base, phase: 'review', message: '已暫停：需查看保留裝備' };
    const blocker = this.autoBlocker(state);
    if (blocker === 'bossLocked') return { ...base, phase: blocker, message: 'BOSS 挑戰中，結束後自動繼續' };
    if (blocker === 'bagFull') return { ...base, phase: blocker, message: '背包已滿，請先出售' };
    if (blocker === 'noRelic') return { ...base, phase: blocker, message: '古物不足，清怪累積中' };
    if (blocker === 'routeInvalid') return { ...base, phase: blocker, message: '產出路線無效，請重新選擇' };
    const soldNote = this.autoSoldCount > 0 ? `・已自動出售 ${this.autoSoldCount} 件 +${this.autoSoldGold}` : '';
    if (this.autoInFlight) return { ...base, phase: 'inFlight', message: `自動中：鑑定中…${soldNote}` };
    return { ...base, phase: 'running', message: `自動中${soldNote}` };
  }

  // ───────────── 快照與訂閱 ─────────────

  /** 以箭頭函式固定參考，讓 useSyncExternalStore 不會每次重繪都重新訂閱。 */
  subscribe = (listener: () => void): (() => void) => {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  };

  subscribeBattle = (listener: () => void): (() => void) => {
    this.battleListeners.add(listener);
    return () => this.battleListeners.delete(listener);
  };

  dismissMigrationNotice(): void {
    if (this.migrationNotice === null) return;
    this.migrationNotice = null;
    this.refreshSnapshots(false);
  }

  onEvents(listener: (events: readonly HostEvent[]) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  getSnapshot = (): HostSnapshot => this.snapshot;

  getBattleView = (): BattleView | null => this.battleView;

  getHeroSnapshot(purpose: LoadoutPurpose): HeroSnapshot | null {
    return this.engine?.getHeroSnapshot(purpose) ?? null;
  }

  private signatureOf(state: DeepReadonly<GameState>): string {
    return [
      state.revision,
      state.wallet.gold,
      state.wallet.relics,
      state.wallet.relicProgress,
      state.wallet.benchLevel,
      state.player.level,
      state.player.xp,
      state.progress.mapNumber,
      state.progress.localStage,
      state.progress.mode,
      state.boss.active?.attemptId ?? '-',
      state.boss.history.length,
      state.totals.kills,
      state.discovered.monsterIds.length,
      this.status,
      this.engine?.isSuspended() ? 1 : 0,
      this.pendingCount,
      this.identifyInFlight,
      this.autoInFlight ? 1 : 0,
      this.autoReviewItemId ?? '-',
      this.autoSoldCount,
      this.migrationNotice ?? '-',
    ].join('|');
  }

  private buildSnapshot(state: DeepReadonly<GameState>): HostSnapshot {
    return {
      status: this.status,
      statusMessage: this.statusMessage,
      migrationNotice: this.migrationNotice,
      storageAvailable: this.storage.available,
      suspended: this.engine?.isSuspended() ?? false,
      state,
      identifyPending: this.identifyInFlight > 0,
      pendingCount: this.pendingCount,
      auto: this.autoStatus(state),
      devSpeed: this.devSpeed,
    };
  }

  private refreshSnapshots(forceBattle: boolean): void {
    const engine = this.engine;
    const liveState = engine?.getState() ?? this.snapshot.state;
    const signature = this.signatureOf(liveState);
    if (signature !== this.stateSignature || this.snapshot.status !== this.status) {
      this.stateSignature = signature;
      // 交給 React 的是不可變副本；引擎內部在戰鬥中會原地累積古物點數。
      this.snapshot = this.buildSnapshot(engine ? engine.exportState() : liveState);
      for (const listener of this.stateListeners) listener();
    }
    const realNow = this.realNow();
    if (forceBattle || realNow - this.lastBattleFrameAt >= BATTLE_FRAME_MS) {
      this.lastBattleFrameAt = realNow;
      this.battleView = engine?.getBattleView() ?? null;
      for (const listener of this.battleListeners) listener();
    }
  }
}

function migrationNoticeText(report: ContentMigrationReport): string {
  const voided = report.voidedBossAttemptId ? '進行中的 BOSS 挑戰因改版作廢（沒有獎勵），請手動重新召喚。' : '';
  return `存檔已從 ${report.from} 升級到 ${report.to}：${report.summaries.join('')}${voided}`;
}
