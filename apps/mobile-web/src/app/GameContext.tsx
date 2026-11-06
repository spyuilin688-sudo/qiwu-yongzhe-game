import type { ContentCatalog } from '@qiwu/content';
import type { BattleView, Command, CommandResponse } from '@qiwu/game-core';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import type { HostEvent, HostSnapshot, LocalGameHost } from '../host/LocalGameHost.ts';

const HostContext = createContext<LocalGameHost | null>(null);

/** 目前畫面是否可見；隱藏中的分頁凍結快照，不因每次擊殺重繪（仍保持掛載以保留捲動位置）。 */
export const ScreenActiveContext = createContext(true);
const noopUnsubscribe = () => undefined;

export function GameProvider({ host, children }: { host: LocalGameHost; children: ReactNode }) {
  return <HostContext.Provider value={host}>{children}</HostContext.Provider>;
}

export function useHost(): LocalGameHost {
  const host = useContext(HostContext);
  if (!host) throw new Error('GameProvider 未設定');
  return host;
}

export function useCatalog(): ContentCatalog {
  return useHost().catalog;
}

/** 權威狀態快照（伺服器狀態）；只在狀態改變時觸發重繪。 */
export function useGame(): HostSnapshot {
  const host = useHost();
  const active = useContext(ScreenActiveContext);
  const frozen = useRef<HostSnapshot | null>(null);
  const subscribe = useCallback((listener: () => void) => (active ? host.subscribe(listener) : noopUnsubscribe), [host, active]);
  const getSnapshot = useCallback(() => {
    if (active || frozen.current === null) frozen.current = host.getSnapshot();
    return frozen.current;
  }, [host, active]);
  return useSyncExternalStore(subscribe, getSnapshot);
}

/** 戰場畫面快照（約 10fps），只給戰場與冷卻顯示使用。 */
export function useBattleView(): BattleView | null {
  const host = useHost();
  return useSyncExternalStore(host.subscribeBattle, host.getBattleView);
}

export function useHostEvents(listener: (events: readonly HostEvent[]) => void): void {
  const host = useHost();
  const ref = useRef(listener);
  useLayoutEffect(() => {
    ref.current = listener;
  });
  useEffect(() => host.onEvents((events) => ref.current(events)), [host]);
}

/** 送出命令；介面只能透過這裡改變遊戲狀態。 */
export function useSend(): (command: Command) => Promise<CommandResponse> {
  const host = useHost();
  return useCallback((command: Command) => host.send(command), [host]);
}
