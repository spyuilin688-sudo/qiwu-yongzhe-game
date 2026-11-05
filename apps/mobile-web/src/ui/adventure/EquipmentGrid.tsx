import { SLOT_IDS, slotsAvailableForJob } from '@qiwu/content';
import { readLoadout } from '@qiwu/game-core';
import { useCatalog, useGame } from '../../app/GameContext.tsx';
import { useOpenSheet, useUi } from '../../app/uiStore.tsx';
import { baseOf, qualityShort, slotLabel } from '../format/viewModels.ts';
import styles from './adventure.module.css';
import { useEffectiveLoadoutView } from './SkillBar.tsx';

/** 八個裝備格（UI-A07）：2 列 × 4 格；部位與品質以文字顯示。短螢幕時收合為 60 高摘要列。 */
export function EquipmentGrid() {
  const catalog = useCatalog();
  const { state } = useGame();
  const { state: ui, dispatch } = useUi();
  const openSheet = useOpenSheet();
  const { view } = useEffectiveLoadoutView();
  const jobId = state.player.currentJobId;
  const loadout = readLoadout(state, catalog, jobId, view);
  const available = new Set(slotsAvailableForJob(catalog, jobId));
  const equippedCount = SLOT_IDS.filter((slot) => loadout.items[slot] && state.items[loadout.items[slot]!]).length;

  return (
    <div className={styles.equipment} data-expanded={ui.equipmentExpanded}>
      <button
        type="button"
        className={styles.equipmentCollapsed}
        onClick={() => dispatch({ type: 'toggleEquipmentExpanded' })}
        aria-expanded={ui.equipmentExpanded}
      >
        <span>
          {view === 'farm' ? '清怪' : '打王'}裝備 {equippedCount}/{available.size}
        </span>
        <span className={styles.equipmentToggleText}>{ui.equipmentExpanded ? '收合' : '展開'}</span>
      </button>
      <div className={styles.equipmentGrid} role="list" aria-label={`${view === 'farm' ? '清怪' : '打王'}配置裝備`}>
        {SLOT_IDS.map((slot) => {
          const itemId = loadout.items[slot];
          const item = itemId ? state.items[itemId] : undefined;
          const slotAvailable = available.has(slot);
          const label = slotLabel(slot, true);
          return (
            <div key={slot} role="listitem" className={styles.equipItem}>
            <button
              type="button"
              className={[styles.equipCell, item && `q-${item.qualityId}`, item && styles.equipFilled].filter(Boolean).join(' ')}
              onClick={() => openSheet({ kind: 'slot', slot })}
              aria-label={
                item
                  ? `${slotLabel(slot)}：${baseOf(catalog, item).name}，${qualityShort(catalog, item.qualityId)}品質，Lv${item.level}`
                  : `${slotLabel(slot)}：${slotAvailable ? '未穿戴' : '完成一轉後開放'}`
              }
              data-slot={slot}
            >
              <span className={styles.equipSlot}>{label}</span>
              {item ? (
                <span className={styles.equipInfo}>
                  <span className={styles.equipQuality}>{qualityShort(catalog, item.qualityId)}</span>
                  <span className="numeric">Lv{item.level}</span>
                </span>
              ) : (
                <span className={styles.equipEmpty}>{slotAvailable ? '空' : '一轉開放'}</span>
              )}
            </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
