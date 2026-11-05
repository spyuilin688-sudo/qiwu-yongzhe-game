import type { GameState, LedgerEventType, LedgerResource } from '../model/types.ts';
import { assertSafeNonNegativeInt } from '../util/math.ts';

/**
 * 帳本不變式（規格 08 economy_ledger）：GOLD 正向只允許 ITEM_SOLD；XP 正向只允許 IDENTIFIED。
 * 違反時直接拋出程式錯誤（不是玩家錯誤），讓測試立即發現不合法的獎勵來源。
 */
const POSITIVE_SOURCE: Partial<Record<LedgerResource, LedgerEventType>> = {
  GOLD: 'ITEM_SOLD',
  XP: 'IDENTIFIED',
};

export class LedgerInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LedgerInvariantError';
  }
}

export interface LedgerWrite {
  readonly operationId: string | null;
  readonly eventType: LedgerEventType;
  readonly resource: LedgerResource;
  readonly delta: number;
  readonly balanceAfter: number;
  readonly entityRef: string | null;
  readonly atMs: number;
}

export function appendLedger(state: GameState, write: LedgerWrite, maxEntries: number): void {
  if (!Number.isSafeInteger(write.delta) || write.delta === 0) {
    throw new LedgerInvariantError(`帳本增量必須是非零整數：${write.delta}`);
  }
  assertSafeNonNegativeInt(write.balanceAfter, `${write.resource} 餘額`);
  const requiredSource = POSITIVE_SOURCE[write.resource];
  if (write.delta > 0 && requiredSource && write.eventType !== requiredSource) {
    throw new LedgerInvariantError(`${write.resource} 只能由 ${requiredSource} 增加，收到 ${write.eventType}`);
  }
  state.counters.ledgerSerial += 1;
  state.ledger.push({ ledgerId: `L${state.counters.ledgerSerial}`, ...write });
  if (state.ledger.length > maxEntries) state.ledger.splice(0, state.ledger.length - maxEntries);
}
