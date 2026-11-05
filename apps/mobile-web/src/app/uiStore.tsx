import type { SlotId } from '@qiwu/content';
import type { LoadoutPurpose } from '@qiwu/game-core';
import { createContext, useCallback, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';

/**
 * 本機 UI 狀態（分頁、面板、捲動、提示）。與伺服器狀態分離：這裡的任何變更都不帶來經濟效果。
 */

export type TabId = 'adventure' | 'character' | 'skills' | 'codex';
export type CharacterTab = 'equipment' | 'bag' | 'job' | 'stats';

export type SheetState =
  | {
      kind: 'identifyResult';
      itemId: string;
      fromAuto: boolean;
      xpGained: number | null;
      levelBefore: number | null;
      levelAfter: number | null;
      reasons: readonly string[];
    }
  | { kind: 'itemDetail'; itemId: string }
  | { kind: 'slot'; slot: SlotId }
  | { kind: 'benchUpgrade' }
  | { kind: 'filter' }
  | { kind: 'routePicker' }
  | { kind: 'bossSummon' }
  | { kind: 'bossResult'; attemptId: string }
  | { kind: 'skillDetail'; skillId: string }
  | { kind: 'mapInfo' }
  | { kind: 'settings' }
  | { kind: 'resource'; resource: 'gold' | 'relic' | 'level' }
  | { kind: 'jobSwitch'; jobId: string };

export interface ConfirmRequest {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel: string;
  readonly tone: 'primary' | 'danger';
  readonly onConfirm: () => void;
  /** 只需要玩家看過（例如存檔升級說明）：不顯示「取消」，只留確認鍵。 */
  readonly acknowledgeOnly?: boolean;
}

export interface Toast {
  readonly id: number;
  readonly text: string;
  readonly tone: 'info' | 'success' | 'warning' | 'danger';
}

export interface UiState {
  readonly tab: TabId;
  readonly characterTab: CharacterTab;
  readonly sheet: SheetState | null;
  readonly confirm: ConfirmRequest | null;
  readonly loadoutView: LoadoutPurpose;
  readonly toasts: readonly Toast[];
  readonly nextToastId: number;
  readonly equipmentExpanded: boolean;
  /** 自動鑑定暫停時若已有其他面板開著，先記下，等面板關閉後再開啟該件裝備。 */
  readonly deferredReviewItemId: string | null;
}

export type UiAction =
  | { type: 'setTab'; tab: TabId }
  | { type: 'setCharacterTab'; tab: CharacterTab }
  | { type: 'openSheet'; sheet: SheetState }
  | { type: 'closeSheet' }
  | { type: 'openConfirm'; confirm: ConfirmRequest }
  | { type: 'closeConfirm' }
  | { type: 'setLoadoutView'; view: LoadoutPurpose }
  | { type: 'toast'; text: string; tone?: Toast['tone'] }
  | { type: 'dismissToast'; id: number }
  | { type: 'toggleEquipmentExpanded' }
  | { type: 'deferReview'; itemId: string | null };

const MAX_TOASTS = 3;

export const initialUiState: UiState = {
  tab: 'adventure',
  characterTab: 'equipment',
  sheet: null,
  confirm: null,
  loadoutView: 'farm',
  toasts: [],
  nextToastId: 1,
  equipmentExpanded: false,
  deferredReviewItemId: null,
};

export function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'setTab':
      return { ...state, tab: action.tab };
    case 'setCharacterTab':
      return { ...state, characterTab: action.tab };
    case 'openSheet':
      // 同時只有一個主面板：開新面板即取代舊面板。
      return { ...state, sheet: action.sheet, confirm: null };
    case 'closeSheet':
      return { ...state, sheet: null, confirm: null };
    case 'openConfirm':
      return { ...state, confirm: action.confirm };
    case 'closeConfirm':
      return { ...state, confirm: null };
    case 'setLoadoutView':
      return { ...state, loadoutView: action.view };
    case 'toast': {
      const toast: Toast = { id: state.nextToastId, text: action.text, tone: action.tone ?? 'info' };
      return { ...state, toasts: [...state.toasts, toast].slice(-MAX_TOASTS), nextToastId: state.nextToastId + 1 };
    }
    case 'dismissToast':
      return { ...state, toasts: state.toasts.filter((toast) => toast.id !== action.id) };
    case 'toggleEquipmentExpanded':
      return { ...state, equipmentExpanded: !state.equipmentExpanded };
    case 'deferReview':
      return { ...state, deferredReviewItemId: action.itemId };
  }
}

const UiContext = createContext<{ state: UiState; dispatch: Dispatch<UiAction> } | null>(null);

export function UiProvider({ children, initial }: { children: ReactNode; initial?: Partial<UiState> }) {
  const [state, dispatch] = useReducer(uiReducer, { ...initialUiState, ...initial });
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): { state: UiState; dispatch: Dispatch<UiAction> } {
  const context = useContext(UiContext);
  if (!context) throw new Error('UiProvider 未設定');
  return context;
}

export function useToast(): (text: string, tone?: Toast['tone']) => void {
  const { dispatch } = useUi();
  return useCallback((text, tone) => dispatch({ type: 'toast', text, ...(tone ? { tone } : {}) }), [dispatch]);
}

export function useOpenSheet(): (sheet: SheetState) => void {
  const { dispatch } = useUi();
  return useCallback((sheet) => dispatch({ type: 'openSheet', sheet }), [dispatch]);
}
