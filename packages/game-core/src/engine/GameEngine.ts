import { fnv1a32Hex, getStageAt, stableStringify, bossStageLocalNumber, type ContentCatalog } from '@qiwu/content';
import { BattleSim } from '../battle/BattleSim.ts';
import type { BattleEvent, BattleView, Encounter } from '../battle/types.ts';
import { createInitialState } from '../model/initialState.ts';
import type { BossAttempt, GameState, LoadoutPurpose, OperationRecord } from '../model/types.ts';
import { buildHeroSnapshot, type HeroSnapshot } from '../rules/heroSnapshot.ts';
import { abortBossAttempt, resolveBossAttempt, startBossAttempt } from '../services/bossServices.ts';
import { CommandSchemas, isCommandType, type Command, type CommandEnvelope, type CommandType } from '../services/commands.ts';
import type { ServiceContext } from '../services/context.ts';
import { identifyOnce, lockItem, sellItems, upgradeBench } from '../services/economy.ts';
import { CommandRejection, type CommandErrorInfo, type ErrorCode } from '../services/errors.ts';
import { appendLedger } from '../services/ledger.ts';
import {
  copyLoadout,
  equipItem,
  saveLoadoutSkills,
  switchJob,
  unequipSlot,
  unlockJob,
} from '../services/loadoutServices.ts';
import { setAutoIdentify, updateGameSettings, updateIdentifySettings } from '../services/settingsServices.ts';
import { cloneJson, type DeepReadonly } from '../util/clone.ts';
import { deriveSeed } from '../util/rng.ts';

export type CommandResponse =
  | {
      readonly status: 'succeeded';
      readonly operationId: string;
      readonly commandType: CommandType;
      readonly revision: number;
      readonly result: unknown;
      readonly replayed?: boolean;
    }
  | {
      readonly status: 'rejected';
      readonly operationId: string;
      readonly commandType: CommandType | 'unknown';
      readonly error: CommandErrorInfo;
      readonly replayed?: boolean;
    };

export type EngineEvent =
  | { readonly type: 'battle'; readonly event: BattleEvent }
  | { readonly type: 'relicGranted'; readonly count: number; readonly relicsAfter: number }
  | { readonly type: 'stageAdvanced'; readonly mapNumber: number; readonly localStage: number; readonly mode: GameState['progress']['mode'] }
  | { readonly type: 'bossStarted'; readonly attemptId: string; readonly autoTriggered: boolean }
  | {
      readonly type: 'bossResolved';
      readonly attempt: BossAttempt;
      readonly mapAfter: number;
      readonly endgame: boolean;
    };

interface FarmSession {
  readonly sessionId: string;
  readonly sim: BattleSim;
  /** 唯一 (session, enemy) 阻止重播再次獲利（規格 09 普通刷怪的提交點）。 */
  readonly rewardedUids: Set<number>;
  clockMs: number;
}

interface BossSession {
  readonly attemptId: string;
  readonly sim: BattleSim;
}

type ServiceFn = (draft: GameState, payload: never, ctx: ServiceContext) => unknown;

const SERVICES: Record<CommandType, ServiceFn> = {
  identify: identifyOnce as ServiceFn,
  sellItems: sellItems as ServiceFn,
  lockItem: lockItem as ServiceFn,
  equipItem: equipItem as ServiceFn,
  unequipSlot: unequipSlot as ServiceFn,
  upgradeBench: upgradeBench as ServiceFn,
  unlockJob: unlockJob as ServiceFn,
  switchJob: switchJob as ServiceFn,
  saveLoadoutSkills: saveLoadoutSkills as ServiceFn,
  copyLoadout: copyLoadout as ServiceFn,
  updateIdentifySettings: updateIdentifySettings as ServiceFn,
  setAutoIdentify: setAutoIdentify as ServiceFn,
  updateGameSettings: updateGameSettings as ServiceFn,
  startBossAttempt: startBossAttempt as ServiceFn,
  abortBossAttempt: abortBossAttempt as ServiceFn,
};

/** 會改變普通戰鬥屬性或配置的命令；成功後於下一個安全刻套用新快照。 */
const FARM_REFRESH_COMMANDS: ReadonlySet<CommandType> = new Set([
  'identify',
  'equipItem',
  'unequipSlot',
  'switchJob',
  'saveLoadoutSkills',
  'copyLoadout',
]);

const RETRYABLE_CODES: ReadonlySet<ErrorCode> = new Set(['NO_RELIC', 'BAG_FULL', 'INSUFFICIENT_GOLD', 'BOSS_LOCKED']);

export interface GameEngineOptions {
  readonly catalog: ContentCatalog;
  readonly nowMs: number;
  readonly state?: GameState;
  /** 新存檔的亂數種子；正式服務由伺服器安全亂數提供。 */
  readonly seed?: number;
}

/**
 * 權威遊戲引擎（原型中扮演伺服器 + 戰鬥 worker）。
 * 介面只能透過 execute() 送命令、透過 advance() 推進時間；不能直接改金幣、裝備或戰鬥結算。
 */
export class GameEngine {
  readonly catalog: ContentCatalog;
  private state: GameState;
  private farm: FarmSession | null = null;
  private bossSession: BossSession | null = null;
  private suspended = false;
  private events: EngineEvent[] = [];

  constructor(options: GameEngineOptions) {
    this.catalog = options.catalog;
    this.state = options.state ? cloneJson(options.state) : createInitialState(options.catalog, options.seed ?? 1);
    if (this.state.boss.active?.result === 'pending') this.ensureBossSession();
    else this.startFarmSession(options.nowMs);
  }

  // ───────────── 讀取 ─────────────

  /**
   * 唯讀的即時狀態（不複製，供宿主每 50ms 讀取）。呼叫端不得修改；需要保存或交給介面時改用 exportState()。
   */
  getState(): DeepReadonly<GameState> {
    return this.state;
  }

  exportState(): GameState {
    return cloneJson(this.state);
  }

  getBattleView(): BattleView | null {
    return (this.bossSession?.sim ?? this.farm?.sim)?.view() ?? null;
  }

  isSuspended(): boolean {
    return this.suspended;
  }

  getHeroSnapshot(purpose: LoadoutPurpose): HeroSnapshot {
    return buildHeroSnapshot(this.state, this.catalog, purpose);
  }

  /** 結果查詢：傳輸逾時先查原 ID，不能直接新建 ID 重做（規格 09）。 */
  queryOperation(operationId: string): DeepReadonly<OperationRecord> | null {
    return this.state.operations.records[operationId] ?? null;
  }

  drainEvents(): EngineEvent[] {
    const drained = this.events;
    this.events = [];
    return drained;
  }

  // ───────────── 時間推進 ─────────────

  /** 切到手機背景或主動暫停：普通刷怪停止，不補算離線收益；已開始的 BOSS 仍依截止時間結算。 */
  suspend(): void {
    this.suspended = true;
  }

  resume(nowMs: number): void {
    this.suspended = false;
    if (this.farm) this.farm.clockMs = nowMs;
  }

  advance(nowMs: number): void {
    if (this.state.boss.active?.result === 'pending') {
      this.advanceBoss(nowMs);
      return;
    }
    const farm = this.farm;
    if (!farm || this.suspended) return;
    const { tickMs } = this.catalog.globals;
    const maxCatchUp = this.catalog.tuning.battle.maxCatchUpMs;
    // 超過容忍時間的空白直接丟棄：普通刷怪只在有效線上會話運作。
    if (nowMs - farm.clockMs > maxCatchUp) farm.clockMs = nowMs - maxCatchUp;
    while (farm.clockMs + tickMs <= nowMs && this.farm === farm) {
      farm.clockMs += tickMs;
      this.handleFarmEvents(farm, farm.sim.tick(), farm.clockMs);
    }
  }

  private advanceBoss(nowMs: number): void {
    const session = this.ensureBossSession();
    const attempt = this.state.boss.active!;
    const { tickMs } = this.catalog.globals;
    const maxTicks = Math.floor(attempt.durationMs / tickMs);
    const dueTicks = Math.min(maxTicks, Math.max(0, Math.floor((nowMs - attempt.startedAtMs) / tickMs)));
    for (const event of session.sim.runUntilTick(dueTicks)) this.events.push({ type: 'battle', event });
    const result = session.sim.bossResult;
    if (!result) return;
    const resolvedAtMs = attempt.startedAtMs + session.sim.currentTimeMs;
    const remaining = session.sim.view().boss;
    const remainingBp = remaining && remaining.maxHp > 0 ? Math.ceil((remaining.hp * 10000) / remaining.maxHp) : 0;
    const resolution = resolveBossAttempt(this.state, { catalog: this.catalog }, attempt.attemptId, result, resolvedAtMs, remainingBp);
    this.bossSession = null;
    if (!resolution) return;
    const finished = this.state.boss.history.at(-1)!;
    this.events.push({ type: 'bossResolved', attempt: cloneJson(finished), mapAfter: resolution.mapAfter, endgame: resolution.endgame });
    this.startFarmSession(nowMs);
    this.events.push({
      type: 'stageAdvanced',
      mapNumber: this.state.progress.mapNumber,
      localStage: this.state.progress.localStage,
      mode: this.state.progress.mode,
    });
  }

  private ensureBossSession(): BossSession {
    const attempt = this.state.boss.active;
    if (!attempt || attempt.result !== 'pending') throw new Error('沒有進行中的 BOSS 挑戰');
    if (this.bossSession?.attemptId === attempt.attemptId) return this.bossSession;
    const stage = this.catalog.stages.get(attempt.stageId);
    if (!stage) throw new Error(`BOSS 關卡不存在：${attempt.stageId}`);
    // 重連或重啟：以同一份快照、版本、種子從第 0 刻重播，不會重開滿 60 秒（規格 09）。
    this.farm = null;
    this.bossSession = {
      attemptId: attempt.attemptId,
      sim: new BattleSim({
        catalog: this.catalog,
        seed: attempt.seed,
        stats: attempt.stats,
        hero: attempt.hero,
        encounter: { kind: 'boss', stage, durationMs: attempt.durationMs },
      }),
    };
    return this.bossSession;
  }

  private farmEncounter(): Encounter {
    const { mapNumber, localStage, mode } = this.state.progress;
    const stage = getStageAt(this.catalog, mapNumber, localStage);
    if (mode === 'PROGRESS' && stage.type !== 'boss') return { kind: 'stage', stage };
    return { kind: 'loop', stage };
  }

  private startFarmSession(nowMs: number): void {
    this.state.counters.sessionSerial += 1;
    const snapshot = buildHeroSnapshot(this.state, this.catalog, 'farm');
    const sessionId = `farm${this.state.counters.sessionSerial}`;
    this.farm = {
      sessionId,
      sim: new BattleSim({
        catalog: this.catalog,
        seed: deriveSeed(this.state.rng.battleSeedState, this.state.counters.sessionSerial),
        stats: snapshot.stats,
        hero: snapshot.hero,
        encounter: this.farmEncounter(),
      }),
      rewardedUids: new Set(),
      clockMs: nowMs,
    };
  }

  private refreshFarmHero(): void {
    if (!this.farm) return;
    const snapshot = buildHeroSnapshot(this.state, this.catalog, 'farm');
    this.farm.sim.updateStats(snapshot.stats);
    this.farm.sim.updateHero(snapshot.hero);
  }

  private handleFarmEvents(farm: FarmSession, battleEvents: readonly BattleEvent[], nowMs: number): void {
    for (const event of battleEvents) {
      this.events.push({ type: 'battle', event });
      // 新波次只會在上一波全滅後出現，舊 uid 不可能再死亡；清空避免集合無限成長。
      if (event.type === 'waveSpawned') farm.rewardedUids.clear();
      if (event.type === 'enemyDefeated') this.grantKillReward(farm, event, nowMs);
    }
    if (farm.sim.isStageCleared) this.advanceStage(farm, nowMs);
  }

  /**
   * 擊殺只累積古物產出點：不寫經驗、不寫金幣（C-06、C-08、T-01）。
   * 滿 100 點發 1 古物，餘數保留。
   */
  private grantKillReward(farm: FarmSession, event: Extract<BattleEvent, { type: 'enemyDefeated' }>, nowMs: number): void {
    if (farm.rewardedUids.has(event.uid)) return;
    farm.rewardedUids.add(event.uid);
    const { state } = this;
    state.totals.kills += 1;
    if (!state.discovered.monsterIds.includes(event.monsterId)) state.discovered.monsterIds.push(event.monsterId);
    if (event.rewardPoints <= 0) return;
    const { pointsPerRelic } = this.catalog.tuning.relic;
    state.wallet.relicProgress += event.rewardPoints;
    let granted = 0;
    while (state.wallet.relicProgress >= pointsPerRelic) {
      state.wallet.relicProgress -= pointsPerRelic;
      state.wallet.relics += 1;
      granted += 1;
      appendLedger(
        state,
        {
          operationId: null,
          eventType: 'RELIC_GRANTED',
          resource: 'RELIC',
          delta: 1,
          balanceAfter: state.wallet.relics,
          entityRef: `${farm.sessionId}:${event.uid}`,
          atMs: nowMs,
        },
        this.catalog.tuning.persistence.maxLedgerEntries,
      );
    }
    if (granted > 0) {
      state.totals.relicsGranted += granted;
      this.events.push({ type: 'relicGranted', count: granted, relicsAfter: state.wallet.relics });
    }
  }

  private advanceStage(farm: FarmSession, nowMs: number): void {
    const progress = this.state.progress;
    if (progress.mode !== 'PROGRESS') return;
    const bossLocal = bossStageLocalNumber(this.catalog, progress.mapNumber);
    progress.localStage = Math.min(bossLocal, progress.localStage + 1);
    if (progress.localStage === bossLocal) progress.mode = 'BOSS_READY';
    farm.sim.enterEncounter(this.farmEncounter());
    this.events.push({ type: 'stageAdvanced', mapNumber: progress.mapNumber, localStage: progress.localStage, mode: progress.mode });
    if (progress.mode === 'BOSS_READY') this.maybeFirstAutoChallenge(nowMs);
  }

  /** 首次自動挑戰（P，可關閉）：每張地圖最多一次，失敗或重新登入都不再自動召喚。 */
  private maybeFirstAutoChallenge(nowMs: number): void {
    const { state } = this;
    if (!state.settings.firstBossAuto || state.progress.firstAutoTriedMaps.includes(state.progress.mapNumber)) return;
    state.progress.firstAutoTriedMaps.push(state.progress.mapNumber);
    const stage = getStageAt(this.catalog, state.progress.mapNumber, state.progress.localStage);
    const draft = cloneJson(state);
    try {
      const { attempt } = startBossAttempt(
        draft,
        { stageId: stage.id },
        { catalog: this.catalog, nowMs, operationId: `system-first-auto-${state.progress.mapNumber}` },
        { autoTriggered: true },
      );
      draft.revision += 1;
      this.state = draft;
      this.ensureBossSession();
      this.events.push({ type: 'bossStarted', attemptId: attempt.attemptId, autoTriggered: true });
    } catch (error) {
      if (!(error instanceof CommandRejection)) throw error;
    }
  }

  // ───────────── 命令 ─────────────

  execute(envelope: CommandEnvelope, nowMs: number): CommandResponse {
    const operationId = typeof envelope?.operationId === 'string' ? envelope.operationId : '';
    const rawType = (envelope?.command as { type?: unknown } | undefined)?.type;
    if (operationId.length < 8 || operationId.length > 80) {
      return this.rejection(operationId, 'unknown', 'INVALID_PAYLOAD', '操作 ID 格式錯誤。', false);
    }
    if (typeof rawType !== 'string' || !isCommandType(rawType)) {
      return this.rejection(operationId, 'unknown', 'INVALID_PAYLOAD', '未知的命令。', false);
    }
    const commandType = rawType;
    const requestHash = fnv1a32Hex(stableStringify(envelope.command));
    // 先依伺服器時間結算到 nowMs：例如 BOSS 已在截止前被擊敗，之後送達的退出／鑑定不能改寫既定結果。
    this.advance(nowMs);

    const existing = this.state.operations.records[operationId];
    if (existing) {
      // 重送回傳深拷貝：呼叫端修改回應不能影響權威狀態或下一次重送結果。
      if (existing.requestHash === requestHash) return cloneJson({ ...(existing.response as CommandResponse), replayed: true });
      // 同 ID 不同 payload：拒絕且不覆寫原紀錄（T-05）。
      return this.rejection(operationId, commandType, 'OPERATION_REUSED', '同一操作 ID 不能用於不同請求；請重新整理後再試。', false);
    }

    const parsed = CommandSchemas[commandType].safeParse((envelope.command as Command).payload);
    if (!parsed.success) {
      const fieldErrors = Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join('.') || 'payload', issue.message]));
      return this.recordRejection(operationId, commandType, requestHash, nowMs, {
        code: 'INVALID_PAYLOAD',
        message: '請求格式不正確，未執行。',
        retryable: false,
        currentRevision: this.state.revision,
        fieldErrors,
      });
    }
    if (envelope.contentVersion !== undefined && envelope.contentVersion !== this.catalog.contentVersion) {
      return this.recordRejection(operationId, commandType, requestHash, nowMs, {
        code: 'CONTENT_VERSION_MISMATCH',
        message: '內容版本已更新，請重新載入。',
        retryable: false,
        currentRevision: this.state.revision,
      });
    }
    if (envelope.expectedRevision !== undefined && envelope.expectedRevision !== this.state.revision) {
      return this.recordRejection(operationId, commandType, requestHash, nowMs, {
        code: 'REVISION_MISMATCH',
        message: '狀態已更新，請確認最新資料後再操作。',
        retryable: false,
        currentRevision: this.state.revision,
      });
    }

    const draft = cloneJson(this.state);
    const ctx: ServiceContext = { catalog: this.catalog, nowMs, operationId };
    let result: unknown;
    try {
      result = SERVICES[commandType](draft, parsed.data as never, ctx);
    } catch (error) {
      if (!(error instanceof CommandRejection)) throw error;
      return this.recordRejection(operationId, commandType, requestHash, nowMs, {
        code: error.code,
        message: error.message,
        retryable: error.retryable || RETRYABLE_CODES.has(error.code),
        currentRevision: this.state.revision,
        ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
        ...(error.details ? { details: error.details } : {}),
      });
    }

    draft.revision += 1;
    const response: CommandResponse = cloneJson({ status: 'succeeded', operationId, commandType, revision: draft.revision, result });
    this.storeOperation(draft, { operationId, commandType, requestHash, status: 'succeeded', response: cloneJson(response), createdAtMs: nowMs });
    this.state = draft;
    this.afterCommit(commandType, result, nowMs);
    return cloneJson(response);
  }

  private afterCommit(commandType: CommandType, result: unknown, nowMs: number): void {
    if (commandType === 'startBossAttempt') {
      this.farm = null;
      this.ensureBossSession();
      const attempt = (result as { attempt: BossAttempt }).attempt;
      this.events.push({ type: 'bossStarted', attemptId: attempt.attemptId, autoTriggered: false });
      return;
    }
    if (commandType === 'abortBossAttempt') {
      this.bossSession = null;
      const finished = this.state.boss.history.at(-1)!;
      this.events.push({ type: 'bossResolved', attempt: cloneJson(finished), mapAfter: this.state.progress.mapNumber, endgame: false });
      this.startFarmSession(nowMs);
      return;
    }
    if (FARM_REFRESH_COMMANDS.has(commandType)) this.refreshFarmHero();
  }

  private storeOperation(target: GameState, record: OperationRecord): void {
    target.operations.records[record.operationId] = record;
    target.operations.order.push(record.operationId);
    const max = this.catalog.tuning.persistence.maxOperationRecords;
    while (target.operations.order.length > max) {
      const dropped = target.operations.order.shift();
      if (dropped) delete target.operations.records[dropped];
    }
  }

  private recordRejection(
    operationId: string,
    commandType: CommandType,
    requestHash: string,
    nowMs: number,
    error: CommandErrorInfo,
  ): CommandResponse {
    const response: CommandResponse = { status: 'rejected', operationId, commandType, error };
    // 可重試的拒絕（古物不足、滿包、金幣不足、BOSS 中）不封存，讓同一操作 ID 稍後可以重試成功（規格 09 錯誤碼）。
    if (!error.retryable) {
      this.storeOperation(this.state, { operationId, commandType, requestHash, status: 'rejected', response: cloneJson(response), createdAtMs: nowMs });
    }
    return cloneJson(response);
  }

  private rejection(
    operationId: string,
    commandType: CommandType | 'unknown',
    code: ErrorCode,
    message: string,
    retryable: boolean,
  ): CommandResponse {
    return { status: 'rejected', operationId, commandType, error: { code, message, retryable, currentRevision: this.state.revision } };
  }
}
