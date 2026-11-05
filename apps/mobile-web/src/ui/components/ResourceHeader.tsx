import { nextLevelXp } from '@qiwu/game-core';
import { useCatalog, useGame } from '../../app/GameContext.tsx';
import { useOpenSheet } from '../../app/uiStore.tsx';
import { formatCompact } from '../format/format.ts';
import { JobEmblem, UiIcon, familyKeyOfName } from '../../art/index.ts';
import { ProgressBar } from './primitives.tsx';
import styles from './shell.module.css';

/** 資源列（UI-A01、A02）：頭像／等級／經驗、金幣、古物、更多；數字縮寫，點擊看完整值。 */
export function ResourceHeader() {
  const catalog = useCatalog();
  const { state } = useGame();
  const openSheet = useOpenSheet();
  const { level, xp, currentJobId } = state.player;
  const needed = nextLevelXp(catalog, level);
  const jobName = catalog.jobs.get(currentJobId)?.name ?? '';
  return (
    <header className={styles.header}>
      <button type="button" className={styles.profile} onClick={() => openSheet({ kind: 'resource', resource: 'level' })} aria-label={`角色 ${jobName} Lv${level}，經驗 ${xp}/${needed}`}>
        <span className={styles.avatar} aria-hidden="true">
          <JobEmblem family={familyKeyOfName(catalog.jobs.get(currentJobId)?.familyName ?? null)} size={34} />
        </span>
        <span className={styles.levelBlock}>
          <span className={styles.levelText}>
            <span className="numeric">Lv{level}</span>
            <span className={styles.jobName}>{jobName}</span>
          </span>
          <ProgressBar value={xp} max={needed} label="經驗" />
        </span>
      </button>
      <button type="button" className={styles.resource} onClick={() => openSheet({ kind: 'resource', resource: 'gold' })} aria-label={`金幣 ${state.wallet.gold}`}>
        <span className={styles.coin} aria-hidden="true" />
        <span className={styles.resourceText}>
          <span className={styles.resourceLabel}>金幣</span>
          <span className="numeric" data-testid="gold-value">{formatCompact(state.wallet.gold)}</span>
        </span>
      </button>
      <button type="button" className={styles.resource} onClick={() => openSheet({ kind: 'resource', resource: 'relic' })} aria-label={`未鑑定古物 ${state.wallet.relics}`}>
        <span className={styles.relic} aria-hidden="true" />
        <span className={styles.resourceText}>
          <span className={styles.resourceLabel}>古物</span>
          <span className="numeric" data-testid="relic-value">{formatCompact(state.wallet.relics)}</span>
        </span>
      </button>
      <button type="button" className={styles.more} onClick={() => openSheet({ kind: 'settings' })} aria-label="更多：設定與版本">
        <UiIcon name="more" size={20} />
        <span className={styles.moreLabel}>更多</span>
      </button>
    </header>
  );
}
