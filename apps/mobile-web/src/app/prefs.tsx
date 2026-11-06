import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { STORAGE_KEYS, type KeyValueStorage } from '../host/storage.ts';

/**
 * 減少動態效果偏好：
 * - system：跟隨系統設定（prefers-reduced-motion）
 * - on：一律減少（不論系統）
 * - off：一律不減少（即使系統開啟，也照常播放動畫）
 */
export type MotionPreference = 'system' | 'on' | 'off';

export const MOTION_PREFERENCES: readonly MotionPreference[] = ['system', 'on', 'off'];

/** 寫入本機的偏好（字體大小、減少動態）：純顯示設定，不影響戰力或資源。 */
export interface StoredPrefs {
  readonly textScale: number;
  readonly motion: MotionPreference;
}

export interface Prefs extends StoredPrefs {
  /**
   * 實際是否減少動態（已合併偏好與系統設定）。
   * @deprecated 舊欄位，保留給既有呼叫端；新程式請用 useReducedMotion()。
   */
  readonly reducedMotion: boolean;
}

export const TEXT_SCALES: readonly number[] = [1, 1.25, 1.5, 2];
const DEFAULT_PREFS: StoredPrefs = { textScale: 1, motion: 'system' };
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

interface PrefsContextValue {
  readonly prefs: Prefs;
  readonly update: (patch: Partial<StoredPrefs>) => void;
}

const PrefsContext = createContext<PrefsContextValue | null>(null);

function isMotionPreference(value: unknown): value is MotionPreference {
  return typeof value === 'string' && (MOTION_PREFERENCES as readonly string[]).includes(value);
}

/**
 * 讀取時相容舊格式（v1 曾存布林 reducedMotion）：true → 開；false 或缺少 → 跟隨系統。
 * 舊版的「關」本來就只是移除屬性、讓系統設定生效，所以 false 對應「跟隨系統」而不是「關」。
 */
export function parseStoredPrefs(raw: string | null): StoredPrefs {
  try {
    const parsed = JSON.parse(raw ?? '{}') as { textScale?: unknown; motion?: unknown; reducedMotion?: unknown };
    const textScale = typeof parsed.textScale === 'number' && TEXT_SCALES.includes(parsed.textScale) ? parsed.textScale : DEFAULT_PREFS.textScale;
    const motion = isMotionPreference(parsed.motion) ? parsed.motion : parsed.reducedMotion === true ? 'on' : DEFAULT_PREFS.motion;
    return { textScale, motion };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function resolveReducedMotion(motion: MotionPreference, systemReduced: boolean): boolean {
  if (motion === 'on') return true;
  if (motion === 'off') return false;
  return systemReduced;
}

function subscribeSystemMotion(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => undefined;
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function readSystemMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** 系統目前是否開啟「減少動態效果」（會跟著系統設定即時更新）。 */
export function useSystemReducedMotion(): boolean {
  return useSyncExternalStore(subscribeSystemMotion, readSystemMotion, () => false);
}

export function PrefsProvider({ storage, children }: { storage: KeyValueStorage; children: ReactNode }) {
  const [stored, setStored] = useState<StoredPrefs>(() => parseStoredPrefs(storage.get(STORAGE_KEYS.prefs)));
  const systemReduced = useSystemReducedMotion();
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--text-scale', String(stored.textScale));
    root.dataset.textScale = String(stored.textScale);
    // 跟隨系統時移除屬性，交給 tokens.css 的 prefers-reduced-motion 規則；「關」要明確寫 false 才能蓋過系統設定。
    if (stored.motion === 'system') delete root.dataset.reducedMotion;
    else root.dataset.reducedMotion = stored.motion === 'on' ? 'true' : 'false';
  }, [stored]);
  const update = useCallback(
    (patch: Partial<StoredPrefs>) => {
      setStored((current) => {
        const next = { ...current, ...patch };
        storage.set(STORAGE_KEYS.prefs, JSON.stringify(next));
        return next;
      });
    },
    [storage],
  );
  const value = useMemo<PrefsContextValue>(
    () => ({ prefs: { ...stored, reducedMotion: resolveReducedMotion(stored.motion, systemReduced) }, update }),
    [stored, systemReduced, update],
  );
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): PrefsContextValue {
  const context = useContext(PrefsContext);
  if (!context) throw new Error('PrefsProvider 未設定');
  return context;
}

/**
 * 是否應減少動態（偏好＋系統設定）。CSS 動畫已由 tokens.css 全域停用；
 * JS／WAAPI 動畫（例如戰場突進、閃光）必須自己用這個 hook 判斷。
 */
export function useReducedMotion(): boolean {
  return usePrefs().prefs.reducedMotion;
}
