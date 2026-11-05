import { SLOT_IDS, bossStageLocalNumber, getMap, getStageAt } from '@qiwu/content';
import { assertCanStartBoss, availabilityOf, readLoadout, roughPower, type TargetPolicy } from '@qiwu/game-core';
import { useState } from 'react';
import { useCatalog, useGame, useHost, useSend } from '../../app/GameContext.tsx';
import { useUi, useToast } from '../../app/uiStore.tsx';
import { ActionButton, Segmented, Sheet, primitiveStyles as ps } from '../components/primitives.tsx';
import { formatAttack, formatBp } from '../format/format.ts';
import styles from './sheets.module.css';

/** 召喚 BOSS 前顯示將使用哪套配置（規格 03）；不在未告知時替玩家改裝。挑戰不消耗任何資源。 */
export function BossSummonSheet({ onClose }: { onClose: () => void }) {
  const catalog = useCatalog();
  const host = useHost();
  const { state, pendingCount } = useGame();
  const send = useSend();
  const toast = useToast();
  const { dispatch } = useUi();
  const [busy, setBusy] = useState(false);
  const map = getMap(catalog, state.progress.mapNumber);
  const stage = getStageAt(catalog, state.progress.mapNumber, state.progress.localStage);
  const jobId = state.player.currentJobId;
  const bossLoadout = readLoadout(state, catalog, jobId, 'boss');
  const farmLoadout = readLoadout(state, catalog, jobId, 'farm');
  const bossSnapshot = host.getHeroSnapshot('boss');
  const farmSnapshot = host.getHeroSnapshot('farm');
  const availability = availabilityOf(() => assertCanStartBoss(state, { catalog }, stage.id));
  const bossItems = SLOT_IDS.filter((slot) => bossLoadout.items[slot] && state.items[bossLoadout.items[slot]!]).length;
  const farmItems = SLOT_IDS.filter((slot) => farmLoadout.items[slot] && state.items[farmLoadout.items[slot]!]).length;
  const bossPower = bossSnapshot ? roughPower(bossSnapshot.stats) : 0;
  const farmPower = farmSnapshot ? roughPower(farmSnapshot.stats) : 0;
  const differs = JSON.stringify(bossLoadout.items) !== JSON.stringify(farmLoadout.items) || bossLoadout.skillIds.join() !== farmLoadout.skillIds.join();
  const hasAdds = map.bossMechanics.some((mechanic) => mechanic.kind === 'periodicAdds');

  const run = async (action: () => Promise<boolean>) => {
    setBusy(true);
    const ok = await action();
    setBusy(false);
    return ok;
  };

  const copyFarm = () =>
    dispatch({
      type: 'openConfirm',
      confirm: {
        title: '複製清怪配置到打王配置？',
        message: '打王配置的裝備、技能順序與條件會改為與清怪配置相同；清怪配置不變。',
        confirmLabel: '複製',
        tone: 'primary',
        onConfirm: () =>
          void run(async () => {
            const response = await send({ type: 'copyLoadout', payload: { from: 'farm', to: 'boss' } });
            if (response.status === 'succeeded') toast('已複製到打王配置', 'success');
            return response.status === 'succeeded';
          }),
      },
    });

  const setPolicy = (policy: TargetPolicy) =>
    void run(async () => {
      const response = await send({
        type: 'saveLoadoutSkills',
        payload: { purpose: 'boss', skillIds: [...bossLoadout.skillIds], conditions: { ...bossLoadout.conditions }, targetPolicy: policy },
      });
      return response.status === 'succeeded';
    });

  const start = () =>
    void run(async () => {
      const response = await send({ type: 'startBossAttempt', payload: { stageId: stage.id } });
      if (response.status === 'succeeded') onClose();
      return response.status === 'succeeded';
    });

  return (
    <Sheet
      title={`召喚 BOSS：${map.boss.name}`}
      onClose={onClose}
      testId="boss-summon-sheet"
      footer={
        <ActionButton
          label="開始挑戰"
          subLabel={availability.enabled ? `限時 ${catalog.globals.bossDurationMs / 1000} 秒・使用打王配置` : availability.reason}
          variant="primary"
          disabled={!availability.enabled || busy || pendingCount > 0}
          onClick={start}
          data-testid="start-boss"
        />
      }
    >
      <p className={ps.note}>
        {map.name}・{stage.name}。擊敗才會解鎖下一張地圖；失敗停在此關刷怪，下次必須手動召喚。挑戰期間暫停鑑定、出售、升台與換裝。
      </p>
      <h3 className={ps.sectionTitle}>BOSS 機制</h3>
      <ul className={styles.bulletList}>
        {map.bossMechanicTexts.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>

      <h3 className={ps.sectionTitle}>將使用：打王配置</h3>
      <dl className={styles.costList}>
        <div>
          <dt>攻擊力 A</dt>
          <dd className="numeric">{bossSnapshot ? formatAttack(bossSnapshot.stats.attack) : '—'}</dd>
        </div>
        <div>
          <dt>暴擊率</dt>
          <dd className="numeric">{bossSnapshot ? formatBp(bossSnapshot.stats.critRateBp) : '—'}</dd>
        </div>
        <div>
          <dt>裝備</dt>
          <dd className="numeric">
            {bossItems} 件（清怪配置 {farmItems} 件）
          </dd>
        </div>
        <div>
          <dt>技能</dt>
          <dd>{bossLoadout.skillIds.map((id) => catalog.skills.get(id)?.name ?? id).join('、') || '無'}</dd>
        </div>
        <div>
          <dt>粗略戰力</dt>
          <dd className="numeric">
            {bossPower}（清怪 {farmPower}）
          </dd>
        </div>
      </dl>
      {differs ? (
        <div className={ps.warning}>
          打王配置與清怪配置不同{bossItems < farmItems ? '，且穿戴件數較少' : ''}。
          <div style={{ marginTop: 'var(--space-2)' }}>
            <ActionButton label="複製清怪配置到打王配置" block disabled={busy || pendingCount > 0} onClick={copyFarm} data-testid="copy-farm-to-boss" />
          </div>
        </div>
      ) : null}
      {hasAdds ? (
        <>
          <h3 className={ps.sectionTitle}>目標策略（開戰前設定）</h3>
          <Segmented<TargetPolicy>
            label="BOSS 戰目標策略"
            options={[
              { value: 'default', label: '本體優先' },
              { value: 'mechanicFirst', label: '優先機制目標' },
            ]}
            value={bossLoadout.targetPolicy}
            onChange={setPolicy}
            disabled={busy || pendingCount > 0}
          />
        </>
      ) : null}
      <p className={ps.note}>粗略戰力只供排序參考，不保證勝負。BOSS 時限、血量與機制皆為原型數值（N）。</p>
    </Sheet>
  );
}

export function BossResultSheet({ attemptId, onClose }: { attemptId: string; onClose: () => void }) {
  const catalog = useCatalog();
  const { state } = useGame();
  const attempt = state.boss.history.find((entry) => entry.attemptId === attemptId);
  if (!attempt) {
    return (
      <Sheet title="BOSS 挑戰" onClose={onClose} compact>
        <p className={ps.empty}>找不到挑戰紀錄。</p>
      </Sheet>
    );
  }
  const map = getMap(catalog, attempt.mapNumber);
  const success = attempt.result === 'success';
  const nextMap = catalog.maps.get(attempt.mapNumber + 1);
  return (
    <Sheet
      title={success ? `擊敗 ${map.boss.name}！` : attempt.result === 'aborted' ? '已退出挑戰' : '挑戰失敗：時間到'}
      onClose={onClose}
      compact
      testId="boss-result-sheet"
      footer={<ActionButton label="知道了" variant="primary" onClick={onClose} data-testid="boss-result-ok" />}
    >
      {success ? (
        nextMap ? (
          <p>已解鎖下一張地圖：{nextMap.name}。BOSS 勝利只解鎖地圖，不直接給經驗或金幣。</p>
        ) : (
          <p>已完成本版全部 {catalog.mapCount} 張地圖！之後會留在末區持續刷怪，不會產生未定義的新關卡。</p>
        )
      ) : (
        <>
          <p>
            {map.boss.name} 剩餘血量 {attempt.bossHpRemainingBp !== null ? formatBp(attempt.bossHpRemainingBp, 1) : '—'}。目前停在 {map.name} 第 {bossStageLocalNumber(catalog, attempt.mapNumber)} 關持續刷怪。
          </p>
          <p className={ps.warning}>先鑑定變強，再手動召喚。失敗不扣任何資源，也不會自動再挑戰。</p>
        </>
      )}
    </Sheet>
  );
}
