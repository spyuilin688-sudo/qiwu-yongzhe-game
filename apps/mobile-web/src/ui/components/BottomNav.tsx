import { useUi, type TabId } from '../../app/uiStore.tsx';
import styles from './shell.module.css';

const TABS: readonly { id: TabId; label: string; glyph: string }[] = [
  { id: 'adventure', label: '冒險', glyph: '⚔' },
  { id: 'character', label: '角色', glyph: '◈' },
  { id: 'skills', label: '技能', glyph: '✦' },
  { id: 'codex', label: '圖鑑', glyph: '❖' },
];

/** 底部固定四個入口（UI-A14）；不放未定義的商城、社群、活動或充值。 */
export function BottomNav() {
  const { state, dispatch } = useUi();
  return (
    <nav className={styles.nav} aria-label="主要頁面">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={[styles.navButton, state.tab === tab.id && styles.navActive].filter(Boolean).join(' ')}
          aria-current={state.tab === tab.id ? 'page' : undefined}
          onClick={() => dispatch({ type: 'setTab', tab: tab.id })}
        >
          <span className={styles.navGlyph} aria-hidden="true">
            {tab.glyph}
          </span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
