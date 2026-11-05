import { bossStageLocalNumber, getStageAt } from '@qiwu/content';
import { loadoutKey, type BossAttempt, type BossResult, type GameState } from '../model/types.ts';
import { buildHeroSnapshot } from '../rules/heroSnapshot.ts';
import { deriveSeed, SeededRandom } from '../util/rng.ts';
import type { CommandPayload } from './commands.ts';
import type { ReadState, ServiceContext } from './context.ts';
import { reject } from './errors.ts';

export interface StartBossResult {
  attempt: BossAttempt;
}

export function assertCanStartBoss(state: ReadState, ctx: Pick<ServiceContext, 'catalog'>, stageId?: string): void {
  if (state.boss.active?.result === 'pending' || state.progress.mode === 'BOSS_FIGHT') {
    reject('BOSS_ALREADY_ACTIVE', 'BOSS 挑戰進行中。');
  }
  if (state.progress.mode !== 'BOSS_READY' && state.progress.mode !== 'FARM_BLOCKED') {
    reject('NOT_AT_BOSS_STAGE', state.progress.mode === 'ENDGAME_FARM' ? '本版內容已全部完成。' : `抵達第 ${bossStageLocalNumber(ctx.catalog, state.progress.mapNumber)} 關後才能召喚 BOSS。`);
  }
  const stage = getStageAt(ctx.catalog, state.progress.mapNumber, state.progress.localStage);
  if (stage.type !== 'boss') reject('NOT_AT_BOSS_STAGE', '目前關卡不是 BOSS 關。');
  if (stageId !== undefined && stageId !== stage.id) reject('STAGE_MISMATCH', '關卡已變更，請重新確認。');
}

/**
 * StartBossAttempt（規格 09）：檢查第 30 關與無進行中挑戰；選定打王配置，
 * 產生不可變的屬性／技能快照與亂數種子，寫 attempt 並切為 BOSS_FIGHT。
 * 挑戰本身不消耗任何資源，失敗也沒有死亡扣費。
 */
export function startBossAttempt(
  draft: GameState,
  payload: CommandPayload<'startBossAttempt'>,
  ctx: ServiceContext,
  options: { autoTriggered: boolean } = { autoTriggered: false },
): StartBossResult {
  assertCanStartBoss(draft, ctx, payload.stageId);
  const snapshot = buildHeroSnapshot(draft, ctx.catalog, 'boss');
  const seedSource = new SeededRandom(draft.rng.battleSeedState);
  const seed = deriveSeed(seedSource.nextUint32(), draft.counters.attemptSerial + 1);
  draft.rng.battleSeedState = seedSource.getState();
  draft.counters.attemptSerial += 1;
  const durationMs = ctx.catalog.globals.bossDurationMs;
  const attempt: BossAttempt = {
    attemptId: `boss${draft.counters.attemptSerial}-${seed.toString(36)}`,
    operationId: ctx.operationId,
    mapNumber: draft.progress.mapNumber,
    stageId: payload.stageId,
    startedAtMs: ctx.nowMs,
    deadlineAtMs: ctx.nowMs + durationMs,
    durationMs,
    loadoutKey: loadoutKey(draft.player.currentJobId, 'boss'),
    stats: snapshot.stats,
    hero: snapshot.hero,
    seed,
    contentVersion: ctx.catalog.contentVersion,
    result: 'pending',
    resolvedAtMs: null,
    bossHpRemainingBp: null,
    autoTriggered: options.autoTriggered,
  };
  draft.boss.active = attempt;
  draft.progress.mode = 'BOSS_FIGHT';
  draft.totals.bossAttempts += 1;
  return { attempt };
}

export interface AbortBossResult {
  attemptId: string;
  result: BossResult;
}

/** 玩家主動退出：標記 aborted，回當關刷怪；沒有額外資源，也不自動再召喚。 */
export function abortBossAttempt(draft: GameState, payload: CommandPayload<'abortBossAttempt'>, ctx: ServiceContext): AbortBossResult {
  const active = draft.boss.active;
  if (!active || active.result !== 'pending') reject('BOSS_NOT_ACTIVE', '目前沒有進行中的 BOSS 挑戰。');
  if (active.attemptId !== payload.attemptId) reject('STAGE_MISMATCH', '挑戰編號不符，請重新整理。');
  finishAttempt(draft, ctx, 'aborted', ctx.nowMs, null);
  return { attemptId: payload.attemptId, result: 'aborted' };
}

/**
 * 內容改版讀檔時作廢進行中的挑戰：記為 aborted（沒有獎勵），停在本圖 BOSS 關刷怪，
 * 下一次必須手動召喚；回傳被作廢的挑戰編號，沒有進行中的挑戰則回傳 null。
 */
export function voidActiveBossAttempt(draft: GameState, catalog: ServiceContext['catalog'], atMs: number): string | null {
  const active = draft.boss.active;
  if (!active || active.result !== 'pending') return null;
  finishAttempt(draft, { catalog }, 'aborted', atMs, null);
  return active.attemptId;
}

export interface BossResolution {
  attemptId: string;
  result: Exclude<BossResult, 'pending'>;
  mapBefore: number;
  mapAfter: number;
  endgame: boolean;
}

/**
 * ResolveBossAttempt：結果只能由 pending 轉一次；重複通知回傳 null（不重複進位地圖，T-14）。
 * 成功只解鎖新圖，不直接給經驗／金幣；第 12 圖成功改 ENDGAME_FARM，不生成第 361 關。
 */
export function resolveBossAttempt(
  draft: GameState,
  ctx: Pick<ServiceContext, 'catalog'>,
  attemptId: string,
  result: 'success' | 'timeout',
  resolvedAtMs: number,
  bossHpRemainingBp: number,
): BossResolution | null {
  const active = draft.boss.active;
  if (!active || active.attemptId !== attemptId || active.result !== 'pending') return null;
  const mapBefore = draft.progress.mapNumber;
  finishAttempt(draft, ctx, result, resolvedAtMs, bossHpRemainingBp);
  return {
    attemptId,
    result,
    mapBefore,
    mapAfter: draft.progress.mapNumber,
    endgame: draft.progress.mode === 'ENDGAME_FARM',
  };
}

function finishAttempt(
  draft: GameState,
  ctx: Pick<ServiceContext, 'catalog'>,
  result: Exclude<BossResult, 'pending'>,
  resolvedAtMs: number,
  bossHpRemainingBp: number | null,
): void {
  const active = draft.boss.active!;
  const finished: BossAttempt = { ...active, result, resolvedAtMs, bossHpRemainingBp };
  draft.boss.active = null;
  draft.boss.history.push(finished);
  const maxHistory = ctx.catalog.tuning.persistence.maxBossHistory;
  if (draft.boss.history.length > maxHistory) draft.boss.history.splice(0, draft.boss.history.length - maxHistory);

  if (result === 'success') {
    draft.progress.highestClearedMap = Math.max(draft.progress.highestClearedMap, active.mapNumber);
    if (active.mapNumber < ctx.catalog.mapCount) {
      draft.progress.mapNumber = active.mapNumber + 1;
      draft.progress.localStage = 1;
      draft.progress.mode = 'PROGRESS';
    } else {
      draft.progress.mode = 'ENDGAME_FARM';
    }
  } else {
    // 失敗不退關、不自動重試：停在本圖 BOSS 關刷普通怪，下一次必須手動召喚（C-04）。
    draft.progress.mode = 'FARM_BLOCKED';
  }
}
