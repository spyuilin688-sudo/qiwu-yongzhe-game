import { getMap, getStageAt } from '@qiwu/content';
import { useBattleView, useCatalog, useGame } from '../../app/GameContext.tsx';
import { useOpenSheet } from '../../app/uiStore.tsx';
import styles from './adventure.module.css';

const MODE_LABEL: Record<string, string> = {
  BOSS_READY: '可召喚 BOSS',
  FARM_BLOCKED: 'BOSS 未通過・刷怪中',
  BOSS_FIGHT: 'BOSS 挑戰中',
  ENDGAME_FARM: '已完成本版內容',
};

/** 地圖列（UI-A03）：當前圖／關、進度；點擊只看情報，不傳送至舊圖。 */
export function StageBar() {
  const catalog = useCatalog();
  const { state } = useGame();
  const battle = useBattleView();
  const openSheet = useOpenSheet();
  const { mapNumber, localStage, mode } = state.progress;
  const map = getMap(catalog, mapNumber);
  const stage = getStageAt(catalog, mapNumber, localStage);
  let detail: string;
  if (mode === 'PROGRESS') {
    if (stage.type === 'elite') detail = `小首領・${stage.eliteTemplate?.label ?? ''}`;
    else detail = battle && battle.totalWaves ? `第 ${Math.min(battle.waveIndex + 1, battle.totalWaves)}/${battle.totalWaves} 波` : '普通關';
  } else {
    detail = MODE_LABEL[mode] ?? '';
  }
  return (
    <button type="button" className={styles.stageBar} onClick={() => openSheet({ kind: 'mapInfo' })} aria-label={`目前地圖 ${map.name}，${stage.displayCode} ${stage.name}，${detail}。點擊查看地圖情報`}>
      <span className={styles.stageMap}>
        <span className={styles.stageCode + ' numeric'}>{stage.displayCode}</span>
        <span className={styles.stageName}>{stage.name}</span>
        <span className={styles.stageMapName}>
          {map.name}・{localStage}/{map.stageIds.length}
        </span>
      </span>
      <span className={styles.stageMeta}>
        <span className={mode === 'PROGRESS' ? styles.stageDetail : styles.stageAlert} data-testid="stage-detail">
          {detail}
        </span>
        <span className={styles.stageProgress} aria-hidden="true">
          <span style={{ width: `${(localStage / map.stageIds.length) * 100}%` }} />
        </span>
      </span>
    </button>
  );
}
