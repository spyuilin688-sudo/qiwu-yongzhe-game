import { slotsAvailableForJob, type SlotId } from '@qiwu/content';
import { assertCanEquip, assertNotInBossFight, availabilityOf } from '@qiwu/game-core';
import { useCatalog, useGame, useSend } from '../../app/GameContext.tsx';
import { useOpenSheet } from '../../app/uiStore.tsx';
import { useEffectiveLoadoutView } from '../adventure/SkillBar.tsx';
import { ActionButton, QualityBadge, Sheet, primitiveStyles as ps } from '../components/primitives.tsx';
import { formatStatDiff, formatStatValue, statLabel } from '../format/format.ts';
import { baseOf, equippedInSlot, firstJobUnlockLevel, ownedItemsSorted, slotLabel } from '../format/viewModels.ts';
import styles from './sheets.module.css';

/** 裝備格詳情：目前穿戴 + 同部位背包清單，可直接穿戴（穿戴限制由服務層再驗證）。 */
export function SlotSheet({ slot, onClose }: { slot: SlotId; onClose: () => void }) {
  const catalog = useCatalog();
  const { state, pendingCount } = useGame();
  const send = useSend();
  const openSheet = useOpenSheet();
  const { view } = useEffectiveLoadoutView();
  const equipped = equippedInSlot(state, catalog, view, slot);
  const available = slotsAvailableForJob(catalog, state.player.currentJobId).includes(slot);
  const candidates = ownedItemsSorted(state, catalog).filter((item) => item.slot === slot && item.id !== equipped?.id);
  const bossLock = availabilityOf(() => assertNotInBossFight(state));

  return (
    <Sheet title={`${slotLabel(slot)}・${view === 'farm' ? '清怪' : '打王'}配置`} onClose={onClose} testId="slot-sheet">
      {!available ? <p className={ps.warning}>主武器與副手在 Lv{firstJobUnlockLevel(catalog)} 完成一轉後開放；目前只能穿戴六個共用部位。</p> : null}
      <h3 className={ps.sectionTitle}>目前穿戴</h3>
      {equipped ? (
        <div className={ps.listRow}>
          <button type="button" className={styles.rowButton} onClick={() => openSheet({ kind: 'itemDetail', itemId: equipped.id })}>
            <span className={ps.rowTitle}>
              <QualityBadge catalog={catalog} qualityId={equipped.qualityId} /> {baseOf(catalog, equipped).name}
            </span>
            <span className={ps.rowSub}>
              Lv{equipped.level}・{statLabel(equipped.mainStat.stat)} {formatStatValue(equipped.mainStat.stat, equipped.mainStat.value)}
            </span>
          </button>
          <ActionButton
            label="卸下"
            subLabel={bossLock.enabled ? '留在背包' : 'BOSS 中停用'}
            disabled={!bossLock.enabled || pendingCount > 0}
            onClick={() => void send({ type: 'unequipSlot', payload: { slot, purpose: view } })}
          />
        </div>
      ) : (
        <p className={ps.note}>此部位未穿戴。</p>
      )}

      <h3 className={ps.sectionTitle}>背包中的{slotLabel(slot)}（{candidates.length}）</h3>
      {candidates.length === 0 ? <p className={ps.empty}>尚未取得；鑑定古物可獲得裝備。</p> : null}
      {candidates.map((item) => {
        const availability = availabilityOf(() => assertCanEquip(state, { catalog }, item.id));
        const diff = equipped && equipped.mainStat.stat === item.mainStat.stat ? item.mainStat.value - equipped.mainStat.value : null;
        return (
          <div key={item.id} className={ps.listRow}>
            <button type="button" className={styles.rowButton} onClick={() => openSheet({ kind: 'itemDetail', itemId: item.id })}>
              <span className={ps.rowTitle}>
                <QualityBadge catalog={catalog} qualityId={item.qualityId} /> {baseOf(catalog, item).name}
                {item.locked ? ' 🔒' : ''}
              </span>
              <span className={ps.rowSub}>
                Lv{item.level}・{statLabel(item.mainStat.stat)} {formatStatValue(item.mainStat.stat, item.mainStat.value)}
                {diff !== null ? `（${formatStatDiff(item.mainStat.stat, diff)}）` : ''}
                {item.affixes.length > 0 ? `・詞條 ${item.affixes.length}` : ''}
              </span>
            </button>
            <ActionButton
              label="穿戴"
              subLabel={availability.enabled ? undefined : availability.reason}
              variant="primary"
              disabled={!availability.enabled || pendingCount > 0}
              onClick={() => void send({ type: 'equipItem', payload: { itemId: item.id, purpose: view } })}
            />
          </div>
        );
      })}
    </Sheet>
  );
}
