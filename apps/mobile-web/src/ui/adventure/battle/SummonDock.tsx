import { getStageAt } from '@qiwu/content';
import { availabilityOf, assertCanStartBoss, type StageMode } from '@qiwu/game-core';
import { useCatalog, useGame } from '../../../app/GameContext.tsx';
import { useOpenSheet } from '../../../app/uiStore.tsx';
import { UiIcon } from '../../../art/index.ts';
import { ActionButton } from '../../components/primitives.tsx';
import styles from '../battle.module.css';

/** 召喚台只在 BOSS 關刷怪時出現：挑戰中、已通關全部地圖時隱藏（挑戰中改由 BOSS 資訊列說明）。 */
export function summonDockVisible(stageType: string, mode: StageMode): boolean {
  return stageType === 'boss' && mode !== 'ENDGAME_FARM' && mode !== 'BOSS_FIGHT';
}

export function useSummonDockVisible(): boolean {
  const catalog = useCatalog();
  const { state } = useGame();
  return summonDockVisible(getStageAt(catalog, state.progress.mapNumber, state.progress.localStage).type, state.progress.mode);
}

/**
 * 召喚台（UI-A04）：戰場內下緣的一條操作列，召喚鍵靠右。放在文件流裡，角色與敵人站在它上方的地面，
 * 所以不論字級多大，按鈕都不會蓋住敵人名稱。BOSS 未通過時左側說明「先鑑定變強，再手動召喚」；
 * 召喚一律由玩家按鍵開啟確認面板，不會自動重試。
 */
export function SummonDock() {
  const catalog = useCatalog();
  const { state, pendingCount } = useGame();
  const openSheet = useOpenSheet();
  const mode = state.progress.mode;
  const availability = availabilityOf(() => assertCanStartBoss(state, { catalog }));
  const disabled = !availability.enabled || pendingCount > 0;
  // 柔和外光只在「第一次可召喚」時提醒；未通過後不催促玩家，等他鑑定變強再自己決定。
  const invite = mode === 'BOSS_READY' && !disabled;
  return (
    <div className={styles.summonDock}>
      {mode === 'FARM_BLOCKED' ? <p className={styles.summonHint}>BOSS 未通過：先鑑定變強，再手動召喚</p> : null}
      <span className={styles.summonSlot} data-invite={invite ? 'true' : undefined}>
        <ActionButton
          className={styles.bossButton}
          variant="primary"
          icon={<UiIcon name="boss" size="m" />}
          label="召喚 BOSS"
          subLabel={availability.enabled ? (mode === 'FARM_BLOCKED' ? '手動再挑戰' : '確認打王配置') : availability.reason}
          disabled={disabled}
          onClick={() => openSheet({ kind: 'bossSummon' })}
          data-testid="summon-boss"
        />
      </span>
    </div>
  );
}
