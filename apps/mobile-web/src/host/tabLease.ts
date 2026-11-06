import { STORAGE_KEYS, type KeyValueStorage } from './storage.ts';

/**
 * 單一可寫會話（規格 08「多裝置與版本衝突」的本機對應）：
 * 同一瀏覽器同時開兩個分頁時，只有持有 lease 的分頁能推進戰鬥與送出命令，
 * 避免兩個分頁各自刷資源再互相覆蓋存檔（T-28）。
 */
export interface LeaseRecord {
  readonly tabId: string;
  readonly heartbeatAtMs: number;
}

export const LEASE_STALE_MS = 5000;
export const LEASE_HEARTBEAT_MS = 1000;

export function readLease(storage: KeyValueStorage): LeaseRecord | null {
  const raw = storage.get(STORAGE_KEYS.lease);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LeaseRecord>;
    if (typeof parsed.tabId !== 'string' || typeof parsed.heartbeatAtMs !== 'number') return null;
    return { tabId: parsed.tabId, heartbeatAtMs: parsed.heartbeatAtMs };
  } catch {
    return null;
  }
}

export function isHeldByOther(lease: LeaseRecord | null, tabId: string, nowMs: number): boolean {
  return lease !== null && lease.tabId !== tabId && nowMs - lease.heartbeatAtMs < LEASE_STALE_MS;
}

export function writeLease(storage: KeyValueStorage, tabId: string, nowMs: number): void {
  storage.set(STORAGE_KEYS.lease, JSON.stringify({ tabId, heartbeatAtMs: nowMs } satisfies LeaseRecord));
}

export function releaseLease(storage: KeyValueStorage, tabId: string): void {
  const lease = readLease(storage);
  if (lease?.tabId === tabId) storage.remove(STORAGE_KEYS.lease);
}
