import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { STORAGE_KEYS, type KeyValueStorage } from '../host/storage.ts';

/** 本機偏好（字體大小、減少動態）：純顯示設定，不影響戰力或資源。 */
export interface Prefs {
  readonly textScale: number;
  readonly reducedMotion: boolean;
}

export const TEXT_SCALES: readonly number[] = [1, 1.25, 1.5, 2];
const DEFAULT_PREFS: Prefs = { textScale: 1, reducedMotion: false };

const PrefsContext = createContext<{ prefs: Prefs; update: (patch: Partial<Prefs>) => void } | null>(null);

function readPrefs(storage: KeyValueStorage): Prefs {
  try {
    const parsed = JSON.parse(storage.get(STORAGE_KEYS.prefs) ?? '{}') as Partial<Prefs>;
    return {
      textScale: TEXT_SCALES.includes(parsed.textScale ?? 1) ? (parsed.textScale ?? 1) : 1,
      reducedMotion: parsed.reducedMotion === true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function PrefsProvider({ storage, children }: { storage: KeyValueStorage; children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(() => readPrefs(storage));
  useEffect(() => {
    document.documentElement.style.setProperty('--text-scale', String(prefs.textScale));
    document.documentElement.dataset.textScale = String(prefs.textScale);
    // 未開啟時移除屬性，讓系統「減少動態效果」設定（prefers-reduced-motion）仍可生效。
    if (prefs.reducedMotion) document.documentElement.dataset.reducedMotion = 'true';
    else delete document.documentElement.dataset.reducedMotion;
  }, [prefs]);
  const update = useCallback(
    (patch: Partial<Prefs>) => {
      setPrefs((current) => {
        const next = { ...current, ...patch };
        storage.set(STORAGE_KEYS.prefs, JSON.stringify(next));
        return next;
      });
    },
    [storage],
  );
  const value = useMemo(() => ({ prefs, update }), [prefs, update]);
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): { prefs: Prefs; update: (patch: Partial<Prefs>) => void } {
  const context = useContext(PrefsContext);
  if (!context) throw new Error('PrefsProvider 未設定');
  return context;
}
