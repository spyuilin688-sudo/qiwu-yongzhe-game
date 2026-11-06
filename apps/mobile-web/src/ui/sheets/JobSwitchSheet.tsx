import { skillSelectionRule } from '@qiwu/content';
import { assertCanSwitchJob, assertCanUnlockJob, availabilityOf, planJobSwitch } from '@qiwu/game-core';
import { useState } from 'react';
import { useCatalog, useGame, useSend } from '../../app/GameContext.tsx';
import { useToast } from '../../app/uiStore.tsx';
import { ActionButton, Sheet, primitiveStyles as ps } from '../components/primitives.tsx';
import { baseOf } from '../format/viewModels.ts';
import styles from './sheets.module.css';

/** 轉職確認（規格 03）：列出將失效的武器／副手與技能，確認後交易一次完成；不產生經驗或金幣。 */
export function JobSwitchSheet({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const catalog = useCatalog();
  const { state, pendingCount } = useGame();
  const send = useSend();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const job = catalog.jobs.get(jobId);
  if (!job) return null;
  const unlocked = state.player.unlockedJobIds.includes(jobId);
  const unlockAvailability = unlocked ? null : availabilityOf(() => assertCanUnlockJob(state, { catalog }, jobId));
  // 預覽以「已解鎖」假設計算，確保列出的卸下清單與實際交易一致。
  const previewState = unlocked ? state : { ...state, player: { ...state.player, unlockedJobIds: [...state.player.unlockedJobIds, jobId] } };
  const plan = planJobSwitch(previewState, catalog, jobId);
  const switchAvailability = availabilityOf(() => assertCanSwitchJob(previewState, { catalog }, jobId));
  const rule = skillSelectionRule(catalog, jobId);
  const blocked = unlockAvailability && !unlockAvailability.enabled ? unlockAvailability : !switchAvailability.enabled ? switchAvailability : null;

  const confirm = async () => {
    setBusy(true);
    if (!unlocked) {
      const unlockResponse = await send({ type: 'unlockJob', payload: { jobId } });
      if (unlockResponse.status !== 'succeeded') {
        setBusy(false);
        return;
      }
    }
    const response = await send({ type: 'switchJob', payload: { jobId, ackUnequipItemIds: plan.unequippedItemIds } });
    setBusy(false);
    if (response.status === 'succeeded') {
      toast(`已轉為 ${job.name}`, 'success');
      onClose();
    }
  };

  return (
    <Sheet
      title={`${unlocked ? '切換' : '解鎖並切換'}：${job.name}`}
      onClose={onClose}
      testId="job-switch-sheet"
      footer={
        <ActionButton
          label={unlocked ? '確認切換' : '解鎖並切換'}
          subLabel={blocked ? blocked.reason : '不需費用、不重置等級'}
          variant="primary"
          disabled={Boolean(blocked) || busy || pendingCount > 0}
          onClick={() => void confirm()}
          data-testid="confirm-job-switch"
        />
      }
    >
      <p className={ps.note}>
        {job.tier}轉・需求 Lv{job.unlockLevel}・技能 {rule.regularSlots} 格常規{rule.ultimate ? ' + 絕招' : ''}
      </p>
      <h3 className={ps.sectionTitle}>將卸下（留在背包）</h3>
      {plan.unequippedItemIds.length === 0 ? (
        <p className={ps.note}>沒有裝備需要卸下；共用部位裝備保留。</p>
      ) : (
        <ul className={styles.bulletList}>
          {plan.unequippedItemIds.map((id) => {
            const item = state.items[id];
            return <li key={id}>{item ? `${baseOf(catalog, item).name}（Lv${item.level}）` : id}</li>;
          })}
        </ul>
      )}
      <h3 className={ps.sectionTitle}>技能配置</h3>
      {plan.droppedSkillIds.length > 0 ? (
        <p className={ps.warning}>將移除：{plan.droppedSkillIds.map((id) => catalog.skills.get(id)?.name ?? id).join('、')}</p>
      ) : null}
      <p>
        清怪：{plan.loadouts.farm.skillIds.map((id) => catalog.skills.get(id)?.name ?? id).join('、') || '無'}
        <br />
        打王：{plan.loadouts.boss.skillIds.map((id) => catalog.skills.get(id)?.name ?? id).join('、') || '無'}
      </p>
      <p className={ps.note}>已解鎖職業可在非 BOSS 狀態隨時切換，沒有新增費用；轉職本身不給經驗或金幣。</p>
    </Sheet>
  );
}
