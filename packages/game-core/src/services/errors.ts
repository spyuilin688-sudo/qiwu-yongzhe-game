/** 錯誤碼對應規格 09「錯誤碼」，另補原型需要的細分碼；每個錯誤都要說明原因與下一步。 */
export type ErrorCode =
  | 'INVALID_PAYLOAD'
  | 'OPERATION_REUSED'
  | 'REVISION_MISMATCH'
  | 'CONTENT_VERSION_MISMATCH'
  | 'LEASE_LOST'
  | 'BOSS_LOCKED'
  | 'ITEM_REFERENCED'
  | 'ITEM_LOCKED'
  | 'ITEM_NOT_FOUND'
  | 'ITEM_ALREADY_SOLD'
  | 'NO_RELIC'
  | 'BAG_FULL'
  | 'INSUFFICIENT_GOLD'
  | 'BENCH_MAX_LEVEL'
  | 'BENCH_LEVEL_MISMATCH'
  | 'LEVEL_TOO_LOW'
  | 'ROUTE_INVALID'
  | 'SLOT_UNAVAILABLE'
  | 'JOB_NOT_FOUND'
  | 'JOB_LOCKED'
  | 'JOB_ALREADY_UNLOCKED'
  | 'JOB_PREREQUISITE'
  | 'JOB_NOT_IMPLEMENTED'
  | 'SWITCH_CONFIRMATION_OUTDATED'
  | 'SKILL_INVALID'
  | 'AUTO_SELL_NOT_CONFIRMED'
  | 'NOT_AT_BOSS_STAGE'
  | 'STAGE_MISMATCH'
  | 'BOSS_ALREADY_ACTIVE'
  | 'BOSS_NOT_ACTIVE';

export interface CommandErrorInfo {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  currentRevision: number;
  fieldErrors?: Record<string, string>;
  details?: Record<string, number | string>;
}

/** 服務層用例外中止交易；引擎捕捉後丟棄副本，狀態完全不變。 */
export class CommandRejection extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly fieldErrors: Record<string, string> | undefined;
  readonly details: Record<string, number | string> | undefined;

  constructor(
    code: ErrorCode,
    message: string,
    options: { retryable?: boolean; fieldErrors?: Record<string, string>; details?: Record<string, number | string> } = {},
  ) {
    super(message);
    this.name = 'CommandRejection';
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.fieldErrors = options.fieldErrors;
    this.details = options.details;
  }
}

export function reject(
  code: ErrorCode,
  message: string,
  options?: { retryable?: boolean; fieldErrors?: Record<string, string>; details?: Record<string, number | string> },
): never {
  throw new CommandRejection(code, message, options);
}

export interface Availability {
  readonly enabled: boolean;
  readonly code: ErrorCode | null;
  readonly reason: string | null;
}

export const AVAILABLE: Availability = { enabled: true, code: null, reason: null };

export function unavailable(code: ErrorCode, reason: string): Availability {
  return { enabled: false, code, reason };
}

/** 把同一份驗證邏輯轉成介面可用的「停用原因」，避免 UI 與服務各寫一套規則。 */
export function availabilityOf(check: () => void): Availability {
  try {
    check();
    return AVAILABLE;
  } catch (error) {
    if (error instanceof CommandRejection) return unavailable(error.code, error.message);
    throw error;
  }
}
