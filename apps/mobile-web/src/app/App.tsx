import { memo, useEffect, useRef, type ComponentType } from 'react';
import { BottomNav } from '../ui/components/BottomNav.tsx';
import { ActionButton, primitiveStyles } from '../ui/components/primitives.tsx';
import { ResourceHeader } from '../ui/components/ResourceHeader.tsx';
import { AdventureScreen } from '../ui/screens/AdventureScreen.tsx';
import { CharacterScreen } from '../ui/screens/CharacterScreen.tsx';
import { CodexScreen } from '../ui/screens/CodexScreen.tsx';
import { SkillsScreen } from '../ui/screens/SkillsScreen.tsx';
import { SheetHost } from '../ui/sheets/SheetHost.tsx';
import styles from './App.module.css';
import { ScreenActiveContext, useCatalog, useGame, useHost, useHostEvents } from './GameContext.tsx';
import { useUi, type TabId } from './uiStore.tsx';

/** 頁面以 memo 包裝：App 因面板／提示變動重繪時，不連帶重繪四個頁面；各頁只依自己的訂閱更新。 */
const SCREENS: readonly { id: TabId; Component: ComponentType }[] = [
  { id: 'adventure', Component: memo(AdventureScreen) },
  { id: 'character', Component: memo(CharacterScreen) },
  { id: 'skills', Component: memo(SkillsScreen) },
  { id: 'codex', Component: memo(CodexScreen) },
];

export function App() {
  const { state: ui } = useUi();
  return (
    <div className={styles.frame} data-testid="app-frame">
      <DevSpeedBadge />
      <ResourceHeader />
      <main className={styles.main}>
        {SCREENS.map((screen) => (
          <section
            key={screen.id}
            className={[styles.screen, ui.tab !== screen.id && styles.screenHidden].filter(Boolean).join(' ')}
            aria-hidden={ui.tab !== screen.id}
            {...(ui.tab !== screen.id ? { inert: true } : {})}
            data-screen={screen.id}
          >
            <ScreenActiveContext.Provider value={ui.tab === screen.id}>
              <screen.Component />
            </ScreenActiveContext.Provider>
          </section>
        ))}
      </main>
      <BottomNav />
      <SheetHost />
      <ConfirmLayer />
      <ToastRegion />
      <HostBlocker />
      <EventBridge />
      <MilestoneHints />
      <BackStack />
    </div>
  );
}

function DevSpeedBadge() {
  const { devSpeed } = useGame();
  return devSpeed > 1 ? <span className={styles.devBadge}>開發加速 ×{devSpeed}</span> : null;
}

function ConfirmLayer() {
  const { state, dispatch } = useUi();
  const confirm = state.confirm;
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!confirm) return;
    // 預設焦點放在不會造成後果的按鈕；只需確認的說明則放在唯一的按鈕上。
    (confirm.acknowledgeOnly ? confirmRef : cancelRef).current?.focus();
    // 以捕獲階段先處理 Esc，避免底下的面板同時被關閉。
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopImmediatePropagation();
      dispatch({ type: 'closeConfirm' });
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [confirm, dispatch]);
  if (!confirm) return null;
  return (
    <div className={primitiveStyles.confirmLayer}>
      <button type="button" className={primitiveStyles.sheetBackdrop} aria-label="取消" onClick={() => dispatch({ type: 'closeConfirm' })} tabIndex={-1} />
      <div className={primitiveStyles.confirmBox} role="alertdialog" aria-modal="true" aria-label={confirm.title}>
        <h2>{confirm.title}</h2>
        <p>{confirm.message}</p>
        <div className={primitiveStyles.confirmActions}>
          {confirm.acknowledgeOnly ? null : (
            <ActionButton ref={cancelRef} label="取消" variant="ghost" onClick={() => dispatch({ type: 'closeConfirm' })} />
          )}
          <ActionButton
            ref={confirmRef}
            label={confirm.confirmLabel}
            variant={confirm.tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => {
              dispatch({ type: 'closeConfirm' });
              confirm.onConfirm();
            }}
          />
        </div>
      </div>
    </div>
  );
}

const TOAST_MS = 2600;

function ToastRegion() {
  const { state, dispatch } = useUi();
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  useEffect(() => {
    for (const toast of state.toasts) {
      if (timers.current.has(toast.id)) continue;
      timers.current.set(
        toast.id,
        setTimeout(() => {
          timers.current.delete(toast.id);
          dispatch({ type: 'dismissToast', id: toast.id });
        }, TOAST_MS),
      );
    }
  }, [state.toasts, dispatch]);
  return (
    <div className={primitiveStyles.toastRegion} role="status" aria-live="polite">
      {state.toasts.map((toast) => (
        <div key={toast.id} className={[primitiveStyles.toast, primitiveStyles[`toast_${toast.tone}`]].filter(Boolean).join(' ')}>
          {toast.text}
        </div>
      ))}
    </div>
  );
}

/** 分頁衝突、被接管、存檔不相容時以明確文字說明原因與下一步。 */
function HostBlocker() {
  const game = useGame();
  const host = useHost();
  const { dispatch } = useUi();
  if (game.status === 'running' || game.status === 'booting') return null;
  return (
    <div className={styles.blocker} role="alertdialog" aria-modal="true" aria-labelledby="host-blocker-title" data-testid="host-blocker">
      {game.status === 'conflict' ? (
        <>
          <h2 id="host-blocker-title">遊戲已在其他分頁執行</h2>
          <p>同一時間只允許一個分頁推進戰鬥，避免重複刷資源或互相覆蓋存檔。</p>
          <ActionButton label="在此分頁接管" variant="primary" onClick={() => host.takeOver()} />
        </>
      ) : null}
      {game.status === 'readonly' ? (
        <>
          <h2 id="host-blocker-title">此分頁已被接管</h2>
          <p>{game.statusMessage}</p>
          <ActionButton label="重新接管" variant="primary" onClick={() => host.takeOver()} />
        </>
      ) : null}
      {game.status === 'loadError' ? (
        <>
          <h2 id="host-blocker-title">無法讀取存檔</h2>
          <p>{game.statusMessage}</p>
          <ActionButton
            label="清除本機存檔並重新開始"
            variant="danger"
            onClick={() =>
              dispatch({
                type: 'openConfirm',
                confirm: {
                  title: '清除本機存檔？',
                  message: '目前存檔將被刪除且無法復原，角色會從 Lv1 重新開始。',
                  confirmLabel: '清除並重新開始',
                  tone: 'danger',
                  onConfirm: () => host.resetSave(),
                },
              })
            }
          />
        </>
      ) : null}
    </div>
  );
}

/**
 * 手機返回鍵：每開一層（主面板、確認對話）就推一筆歷史；返回時先關最上層，
 * 不會一次關掉兩層，也不會在只有確認對話時誤退遊戲（規格 07 面板層級）。
 */
function BackStack() {
  const { state, dispatch } = useUi();
  const depth = (state.sheet ? 1 : 0) + (state.confirm ? 1 : 0);
  const pushed = useRef(0);
  const ignorePops = useRef(0);
  const latest = useRef(state);
  latest.current = state;

  useEffect(() => {
    const onPop = () => {
      if (ignorePops.current > 0) {
        ignorePops.current -= 1;
        return;
      }
      pushed.current = Math.max(0, pushed.current - 1);
      if (latest.current.confirm) dispatch({ type: 'closeConfirm' });
      else if (latest.current.sheet) dispatch({ type: 'closeSheet' });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [dispatch]);

  useEffect(() => {
    while (pushed.current < depth) {
      window.history.pushState({ qiwuLayer: pushed.current + 1 }, '');
      pushed.current += 1;
    }
    if (pushed.current > depth) {
      // 由畫面按鈕關閉：退回多推的歷史紀錄，並忽略因此產生的 popstate。
      const extra = pushed.current - depth;
      pushed.current = depth;
      ignorePops.current += extra;
      window.history.go(-extra);
    }
  }, [depth]);
  return null;
}

/** 首次使用提示（規格 07 N）：達成時提示一次即結束，不設強制教學頁。 */
function MilestoneHints() {
  const catalog = useCatalog();
  const { state } = useGame();
  const { dispatch } = useUi();
  const previousLevel = useRef(state.player.level);
  const firstJobLevel = Math.min(...[...catalog.jobs.values()].filter((job) => job.tier === 1).map((job) => job.unlockLevel));
  useEffect(() => {
    const before = previousLevel.current;
    previousLevel.current = state.player.level;
    if (before < firstJobLevel && state.player.level >= firstJobLevel && state.player.unlockedJobIds.length === 0) {
      dispatch({ type: 'toast', text: `Lv${firstJobLevel}！到「角色 → 職業」解鎖一轉，開放主武器與技能`, tone: 'success' });
    }
  }, [state.player.level, state.player.unlockedJobIds.length, firstJobLevel, dispatch]);
  return null;
}

/** 把宿主事件轉成介面反應：BOSS 結果、自動鑑定暫停、拒絕原因、換圖提示、存檔升級說明。 */
function EventBridge() {
  const catalog = useCatalog();
  const host = useHost();
  const { state: ui, dispatch } = useUi();
  const sheetOpen = ui.sheet !== null || ui.confirm !== null;
  const { state: game, migrationNotice } = useGame();
  const reviewItemId = useGame().auto.reviewItemId;
  useEffect(() => {
    if (!migrationNotice) return;
    // 說明較長且牽涉 BOSS 挑戰作廢，用需要點按的對話框而不是會自動消失的提示。
    dispatch({
      type: 'openConfirm',
      confirm: { title: '存檔已升級', message: migrationNotice, confirmLabel: '知道了', tone: 'primary', acknowledgeOnly: true, onConfirm: () => undefined },
    });
    host.dismissMigrationNotice();
  }, [migrationNotice, dispatch, host]);
  useEffect(() => {
    const deferred = ui.deferredReviewItemId;
    if (!deferred || sheetOpen) return;
    dispatch({ type: 'deferReview', itemId: null });
    // 只有那件裝備仍在暫停清單且仍在背包時才開啟（可能已在背包中處理掉）。
    if (deferred === reviewItemId && game.items[deferred]) {
      dispatch({
        type: 'openSheet',
        sheet: { kind: 'identifyResult', itemId: deferred, fromAuto: true, xpGained: null, levelBefore: null, levelAfter: null, reasons: [] },
      });
    }
  }, [ui.deferredReviewItemId, sheetOpen, reviewItemId, game.items, dispatch]);
  useHostEvents((events) => {
    for (const event of events) {
      switch (event.type) {
        case 'bossResolved':
          dispatch({ type: 'openSheet', sheet: { kind: 'bossResult', attemptId: event.attempt.attemptId } });
          break;
        case 'bossStarted':
          if (event.autoTriggered) dispatch({ type: 'toast', text: '首次自動挑戰 BOSS（設定可關閉）', tone: 'warning' });
          break;
        case 'reviewRequired':
          if (sheetOpen) {
            // 不打斷目前面板：關閉後自動開啟這件裝備（見下方 effect）。
            dispatch({ type: 'deferReview', itemId: event.itemId });
            dispatch({ type: 'toast', text: '自動鑑定已暫停：關閉目前面板後顯示需查看的裝備', tone: 'warning' });
          } else {
            dispatch({
              type: 'openSheet',
              sheet: { kind: 'identifyResult', itemId: event.itemId, fromAuto: true, xpGained: null, levelBefore: null, levelAfter: null, reasons: [] },
            });
          }
          break;
        case 'commandRejected':
          if (event.code !== 'LEASE_LOST') dispatch({ type: 'toast', text: event.message, tone: 'danger' });
          break;
        case 'stageAdvanced':
          if (event.localStage === 1 && event.mode === 'PROGRESS') {
            dispatch({ type: 'toast', text: `進入新地圖：${catalog.maps.get(event.mapNumber)?.name ?? ''}`, tone: 'success' });
          }
          break;
        default:
          break;
      }
    }
  });
  return null;
}
