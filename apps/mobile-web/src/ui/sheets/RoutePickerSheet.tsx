import { NOVICE_JOB_ID } from '@qiwu/content';
import { useState } from 'react';
import { useCatalog, useGame, useSend } from '../../app/GameContext.tsx';
import { useToast } from '../../app/uiStore.tsx';
import { ActionButton, Sheet, primitiveStyles as ps } from '../components/primitives.tsx';
import { firstJobUnlockLevel } from '../format/viewModels.ts';
import styles from './sheets.module.css';

/** 產出路線（UI-A12）：選已解鎖職業作為鑑定目標；不切換當前戰鬥職業，舊裝不重抽。 */
export function RoutePickerSheet({ onClose }: { onClose: () => void }) {
  const catalog = useCatalog();
  const { state, pendingCount } = useGame();
  const send = useSend();
  const toast = useToast();
  const settings = state.identifySettings;
  const [selected, setSelected] = useState(settings.targetJobId);
  const [busy, setBusy] = useState(false);
  const unlocked = new Set(state.player.unlockedJobIds);
  const noJobs = unlocked.size === 0;

  const confirm = async () => {
    setBusy(true);
    const response = await send({
      type: 'updateIdentifySettings',
      payload: {
        targetJobId: selected,
        keep: { ...settings.keep, slots: [...(settings.keep.slots ?? [])], affixStats: [...settings.keep.affixStats] },
        autoSell: { ...settings.autoSell, slots: [...settings.autoSell.slots] },
        confirmAutoSell: false,
      },
    });
    setBusy(false);
    if (response.status === 'succeeded') {
      toast('產出路線已更新；只影響之後鑑定的裝備', 'success');
      onClose();
    }
  };

  return (
    <Sheet
      title="產出路線"
      onClose={onClose}
      testId="route-sheet"
      footer={
        <ActionButton
          label="確認"
          variant="primary"
          disabled={busy || pendingCount > 0 || selected === settings.targetJobId}
          subLabel={selected === settings.targetJobId ? '目前選擇' : undefined}
          onClick={() => void confirm()}
        />
      }
    >
      <p className={ps.note}>決定鑑定時主武器與副手從哪條路線（含祖先）抽取。共用部位不受影響。</p>
      {noJobs ? (
        <label className={styles.radioRow}>
          <input type="radio" name="route" checked={selected === NOVICE_JOB_ID} onChange={() => setSelected(NOVICE_JOB_ID)} />
          <span>
            <span className={ps.rowTitle}>見習者（共用部位）</span>
            <span className={ps.rowSub}>Lv{firstJobUnlockLevel(catalog)} 解鎖一轉後可選職業路線</span>
          </span>
        </label>
      ) : null}
      {catalog.families.map((family) => {
        const jobs = [...catalog.jobs.values()].filter((job) => job.familyId === family.id);
        return (
          <fieldset key={family.id} className={styles.fieldset}>
            <legend>{family.name}</legend>
            {jobs.map((job) => {
              const isUnlocked = unlocked.has(job.id);
              return (
                <label key={job.id} className={[styles.radioRow, !isUnlocked && styles.radioDisabled].filter(Boolean).join(' ')}>
                  <input type="radio" name="route" disabled={!isUnlocked} checked={selected === job.id} onChange={() => setSelected(job.id)} />
                  <span>
                    <span className={ps.rowTitle}>
                      {job.tier}轉・{job.name}
                    </span>
                    <span className={ps.rowSub}>
                      {isUnlocked ? '已解鎖' : job.playable ? `未解鎖（Lv${job.unlockLevel}，於角色頁職業分頁解鎖）` : '原型尚未實作，下一階段開放'}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        );
      })}
    </Sheet>
  );
}
