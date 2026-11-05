import type { StatusSpec } from '@qiwu/content';
import type { CombatStatsSnapshot } from '../model/types.ts';
import type { DamageSource, DotTicker, EnemyState, StatusInstance } from './types.ts';

/**
 * 敵人狀態的純資料操作（不發事件、不觸發效果），讓 BattleSim 只負責「何時」套用，
 * 狀態規則（疊層上限、獨立毒層、刷新取高）集中在這裡並可單獨測試。
 */

export interface ApplyOutcome {
  /** 是否為持續傷害類狀態（燃燒、熔痕、毒層）。 */
  readonly isDot: boolean;
  readonly isArmorBreak: boolean;
}

function newTicker(spec: { coefPerTickBp: number; ticks: number; intervalMs: number }, stats: CombatStatsSnapshot, now: number): DotTicker {
  return {
    coefPerTickBp: spec.coefPerTickBp,
    ticksLeft: spec.ticks,
    intervalMs: spec.intervalMs,
    nextTickAtMs: now + spec.intervalMs,
    attack: stats.attack,
    dotBonusBp: stats.bonusBp.DOT_DMG,
  };
}

export function tickerEndsAtMs(ticker: DotTicker): number {
  return ticker.ticksLeft <= 0 ? ticker.nextTickAtMs - ticker.intervalMs : ticker.nextTickAtMs + (ticker.ticksLeft - 1) * ticker.intervalMs;
}

function blankInstance(spec: StatusSpec, expiresAtMs: number): StatusInstance {
  return {
    statusId: spec.statusId,
    kind: spec.kind,
    label: spec.label,
    expiresAtMs,
    pctBp: 0,
    unitKinds: [],
    stacks: 0,
    maxStacks: 0,
    dot: null,
    poison: [],
    sources: [],
    skillTags: [],
  };
}

function poisonExpiry(status: StatusInstance): number {
  return status.poison.reduce((latest, ticker) => Math.max(latest, tickerEndsAtMs(ticker)), 0);
}

/** 把一層毒加到目標；滿層時以新快照取代最早到期的一層（未跳的傷害不另結算）。 */
export function addPoisonTicker(status: StatusInstance, ticker: DotTicker): void {
  if (status.poison.length < status.maxStacks) {
    status.poison.push(ticker);
  } else {
    let earliest = 0;
    for (let index = 1; index < status.poison.length; index += 1) {
      if (tickerEndsAtMs(status.poison[index]!) < tickerEndsAtMs(status.poison[earliest]!)) earliest = index;
    }
    status.poison[earliest] = ticker;
  }
  status.expiresAtMs = poisonExpiry(status);
}

export function applyStatusSpec(target: EnemyState, spec: StatusSpec, stats: CombatStatsSnapshot, now: number): ApplyOutcome {
  const existing = target.statuses.find((status) => status.statusId === spec.statusId);
  switch (spec.kind) {
    case 'armorBreak':
    case 'summonDamageTaken':
    case 'damageTakenFor':
    case 'mark': {
      const pctBp = spec.kind === 'mark' ? 0 : spec.pctBp;
      // 同名狀態只刷新／取較高值，不疊層。
      if (existing) {
        existing.expiresAtMs = Math.max(existing.expiresAtMs, now + spec.durationMs);
        existing.pctBp = Math.max(existing.pctBp, pctBp);
      } else {
        const instance = blankInstance(spec, now + spec.durationMs);
        instance.pctBp = pctBp;
        if (spec.kind === 'summonDamageTaken') instance.unitKinds = [...spec.unitKinds];
        if (spec.kind === 'damageTakenFor') {
          instance.sources = [...(spec.sources ?? [])] as DamageSource[];
          instance.skillTags = [...(spec.skillTags ?? [])];
        }
        target.statuses.push(instance);
      }
      return { isDot: false, isArmorBreak: spec.kind === 'armorBreak' };
    }
    case 'stack': {
      const status = existing ?? blankInstance(spec, now + spec.durationMs);
      if (!existing) target.statuses.push(status);
      status.maxStacks = spec.max;
      status.stacks = Math.min(spec.max, status.stacks + spec.add);
      status.expiresAtMs = now + spec.durationMs;
      return { isDot: false, isArmorBreak: false };
    }
    case 'dot': {
      const ticker = newTicker(spec, stats, now);
      const expiresAtMs = tickerEndsAtMs(ticker);
      if (existing) {
        existing.dot = ticker;
        existing.expiresAtMs = expiresAtMs;
      } else {
        const instance = blankInstance(spec, expiresAtMs);
        instance.dot = ticker;
        target.statuses.push(instance);
      }
      return { isDot: true, isArmorBreak: false };
    }
    case 'dotStack': {
      const status = existing ?? blankInstance(spec, now);
      if (!existing) target.statuses.push(status);
      status.maxStacks = spec.maxStacks;
      for (let count = 0; count < spec.add; count += 1) addPoisonTicker(status, newTicker(spec, stats, now));
      return { isDot: true, isArmorBreak: false };
    }
  }
}

export function findStatus(enemy: EnemyState, statusId: string): StatusInstance | undefined {
  return enemy.statuses.find((status) => status.statusId === statusId);
}

/** 疊層數，或獨立毒層中剩餘時間 ≥ minRemainingMs 的層數。 */
export function stackCount(enemy: EnemyState | null, statusId: string, now: number, minRemainingMs = 0): number {
  if (!enemy) return 0;
  const status = findStatus(enemy, statusId);
  if (!status) return 0;
  if (status.kind === 'dotStack') return status.poison.filter((ticker) => tickerEndsAtMs(ticker) - now >= minRemainingMs).length;
  return status.stacks;
}

export function removeStatus(enemy: EnemyState, statusId: string): void {
  enemy.statuses = enemy.statuses.filter((status) => status.statusId !== statusId);
}

/** 移除指定層數；歸零時整個狀態移除。回傳實際移除數。 */
export function removeStacks(enemy: EnemyState, statusId: string, amount: number): number {
  const status = findStatus(enemy, statusId);
  if (!status || amount <= 0) return 0;
  const removed = Math.min(amount, status.stacks);
  status.stacks -= removed;
  if (status.stacks <= 0) removeStatus(enemy, statusId);
  return removed;
}

/**
 * 依剩餘時間由短到長取出 count 層毒並從目標移除（保留最長者）。
 * 回傳被移除的計時器，呼叫端用來結算剩餘傷害。
 */
export function takeShortestPoison(enemy: EnemyState, statusId: string, count: number): DotTicker[] {
  const status = findStatus(enemy, statusId);
  if (!status || count <= 0) return [];
  const ordered = [...status.poison].sort((a, b) => tickerEndsAtMs(a) - tickerEndsAtMs(b));
  const taken = ordered.slice(0, count);
  status.poison = status.poison.filter((ticker) => !taken.includes(ticker));
  if (status.poison.length === 0) removeStatus(enemy, statusId);
  else status.expiresAtMs = poisonExpiry(status);
  return taken;
}

/** 剩餘時間最長的一層毒（複製與傳播用）。 */
export function longestPoison(enemy: EnemyState, statusId: string): { status: StatusInstance; ticker: DotTicker } | null {
  const status = findStatus(enemy, statusId);
  if (!status || status.poison.length === 0) return null;
  let best = status.poison[0]!;
  for (const ticker of status.poison) if (tickerEndsAtMs(ticker) > tickerEndsAtMs(best)) best = ticker;
  return { status, ticker: best };
}

/** 複製一層毒到另一目標，沿用剩餘次數與跳傷時間。回傳該目標是否原本沒有任何持續傷害。 */
export function copyPoisonTo(target: EnemyState, source: StatusInstance, ticker: DotTicker): void {
  let status = findStatus(target, source.statusId);
  if (!status) {
    status = { ...source, poison: [], expiresAtMs: 0, unitKinds: [], sources: [], skillTags: [] };
    target.statuses.push(status);
  }
  status.maxStacks = source.maxStacks;
  addPoisonTicker(status, { ...ticker });
}

/** 把狀態轉移到下一個目標（死亡轉移）：沿用或縮短剩餘時間；疊層狀態只轉移 stackAmount 層。 */
export function transferStatus(
  from: StatusInstance,
  to: EnemyState,
  now: number,
  stackAmount: number,
  durationFactorBp: number,
): void {
  const remaining = Math.max(0, from.expiresAtMs - now);
  const expiresAtMs = now + Math.floor((remaining * durationFactorBp) / 10000);
  if (expiresAtMs <= now) return;
  const existing = findStatus(to, from.statusId);
  if (from.kind === 'stack') {
    const amount = Math.min(stackAmount, from.stacks);
    if (amount <= 0) return;
    if (existing) {
      existing.stacks = Math.min(existing.maxStacks, existing.stacks + amount);
      existing.expiresAtMs = Math.max(existing.expiresAtMs, expiresAtMs);
    } else {
      to.statuses.push({ ...from, stacks: amount, expiresAtMs, poison: [], unitKinds: [...from.unitKinds], sources: [...from.sources], skillTags: [...from.skillTags] });
    }
    return;
  }
  if (from.kind === 'dot' || from.kind === 'dotStack') return;
  if (existing) {
    existing.expiresAtMs = Math.max(existing.expiresAtMs, expiresAtMs);
    existing.pctBp = Math.max(existing.pctBp, from.pctBp);
  } else {
    to.statuses.push({ ...from, expiresAtMs, poison: [], unitKinds: [...from.unitKinds], sources: [...from.sources], skillTags: [...from.skillTags] });
  }
}
