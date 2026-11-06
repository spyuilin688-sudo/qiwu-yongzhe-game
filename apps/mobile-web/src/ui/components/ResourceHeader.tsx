import { nextLevelXp } from '@qiwu/game-core';
import { useLayoutEffect, useRef, type RefObject } from 'react';
import { useCatalog, useGame } from '../../app/GameContext.tsx';
import { useOpenSheet } from '../../app/uiStore.tsx';
import { formatCompact } from '../format/format.ts';
import { CurrencyIcon, JobEmblem, UiIcon, familyKeyOfName } from '../../art/index.ts';
import { Meter } from './primitives.tsx';
import styles from './shell.module.css';

/** 資源列實際高度（含安全區域）寫到這個自訂屬性；提示（Toast）據此貼在資源列正下方。 */
const HEADER_HEIGHT_VAR = '--h-header-live';

/**
 * 字體放大時資源列會換成兩列，固定的 --h-header 估不準，提示會蓋住金幣與古物數字。
 * 只在資源列尺寸改變時（ResizeObserver）才寫入，不影響戰場每 100ms 的重繪。
 */
function usePublishHeaderHeight(ref: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const header = ref.current;
    if (!header || typeof ResizeObserver === 'undefined') return undefined;
    const root = document.documentElement;
    const publish = () => root.style.setProperty(HEADER_HEIGHT_VAR, `${header.getBoundingClientRect().height}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(header);
    return () => {
      observer.disconnect();
      root.style.removeProperty(HEADER_HEIGHT_VAR);
    };
  }, [ref]);
}

/** 資源列（UI-A01、A02）：頭像／等級／經驗、金幣、古物、更多；數字縮寫，點擊看完整值。 */
export function ResourceHeader() {
  const catalog = useCatalog();
  const { state } = useGame();
  const openSheet = useOpenSheet();
  const headerRef = useRef<HTMLElement>(null);
  usePublishHeaderHeight(headerRef);
  const { level, xp, currentJobId } = state.player;
  const needed = nextLevelXp(catalog, level);
  const jobName = catalog.jobs.get(currentJobId)?.name ?? '';
  return (
    <header ref={headerRef} className={styles.header}>
      <button type="button" className={styles.profile} onClick={() => openSheet({ kind: 'resource', resource: 'level' })} aria-label={`角色 ${jobName} Lv${level}，經驗 ${xp}/${needed}`}>
        <span className={styles.avatar} aria-hidden="true">
          <JobEmblem family={familyKeyOfName(catalog.jobs.get(currentJobId)?.familyName ?? null)} />
        </span>
        <span className={styles.levelBlock}>
          <span className={styles.levelText}>
            <span className="numeric">Lv{level}</span>
            <span className={styles.jobName}>{jobName}</span>
          </span>
          <Meter tone="xp" value={xp} max={needed} label="經驗" />
        </span>
      </button>
      <button type="button" className={styles.resource} onClick={() => openSheet({ kind: 'resource', resource: 'gold' })} aria-label={`金幣 ${state.wallet.gold}`}>
        <span className={styles.resIcon} aria-hidden="true">
          <CurrencyIcon kind="gold" />
        </span>
        <span className={styles.resourceText}>
          <span className={styles.resourceLabel}>金幣</span>
          <span className="numeric" data-testid="gold-value">
            {formatCompact(state.wallet.gold)}
          </span>
        </span>
      </button>
      <button type="button" className={styles.resource} onClick={() => openSheet({ kind: 'resource', resource: 'relic' })} aria-label={`未鑑定古物 ${state.wallet.relics}`}>
        <span className={styles.resIcon} aria-hidden="true">
          <CurrencyIcon kind="relic" />
        </span>
        <span className={styles.resourceText}>
          <span className={styles.resourceLabel}>古物</span>
          <span className="numeric" data-testid="relic-value">
            {formatCompact(state.wallet.relics)}
          </span>
        </span>
      </button>
      <button type="button" className={styles.more} onClick={() => openSheet({ kind: 'settings' })} aria-label="更多：設定與版本">
        <UiIcon name="more" size="m" />
        <span className={styles.moreLabel}>更多</span>
      </button>
    </header>
  );
}
