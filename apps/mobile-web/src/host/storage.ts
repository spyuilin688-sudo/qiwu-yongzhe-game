/**
 * localStorage 包裝：私密視窗、被封鎖的網站資料或預覽環境可能讓存取直接拋錯，
 * 因此每次讀寫都 try/catch，失敗時回報狀態而不是讓遊戲崩潰。
 */
export interface KeyValueStorage {
  get(key: string): string | null;
  set(key: string, value: string): boolean;
  remove(key: string): void;
  readonly available: boolean;
}

export function createBrowserStorage(): KeyValueStorage {
  let available = true;
  try {
    const probe = '__qiwu_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
  } catch {
    available = false;
  }
  return {
    available,
    get(key) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
    remove(key) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // 無法移除時保持現狀即可；下一次寫入會覆蓋。
      }
    },
  };
}

export function createMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    available: true,
    get: (key) => map.get(key) ?? null,
    set: (key, value) => {
      map.set(key, value);
      return true;
    },
    remove: (key) => {
      map.delete(key);
    },
  };
}

export const STORAGE_KEYS = {
  save: 'qiwu-yongzhe:save:v1',
  lease: 'qiwu-yongzhe:lease:v1',
  prefs: 'qiwu-yongzhe:prefs:v1',
} as const;
