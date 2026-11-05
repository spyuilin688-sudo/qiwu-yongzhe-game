import { assertCanUpgradeBench, availabilityOf, benchUpgradeCost, type BenchUpgradeResult } from '@qiwu/game-core';
import { useState } from 'react';
import { useCatalog, useGame, useSend } from '../../app/GameContext.tsx';
import { useToast } from '../../app/uiStore.tsx';
import { ActionButton, Sheet, primitiveStyles as ps } from '../components/primitives.tsx';
import { formatFull } from '../format/format.ts';
import { qualityName } from '../format/viewModels.ts';
import styles from './sheets.module.css';

/** 升級鑑定台（UI-A08）：只列有變化的品質列、花費與升級後餘額；金幣不足顯示差額且不扣款。 */
export function BenchUpgradeSheet({ onClose }: { onClose: () => void }) {
  const catalog = useCatalog();
  const { state, pendingCount } = useGame();
  const send = useSend();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const level = state.wallet.benchLevel;
  const current = catalog.bench[level - 1];
  const next = catalog.bench[level];
  const cost = benchUpgradeCost(state, { catalog });
  const availability = availabilityOf(() => assertCanUpgradeBench(state, { catalog }));

  if (!current || !next || cost === null) {
    return (
      <Sheet title={`遺物鑑定台 Lv${level}`} onClose={onClose} compact testId="bench-sheet">
        <p className={ps.note}>已達本版上限（Lv{level}），不再提供升級。</p>
      </Sheet>
    );
  }

  const rows = catalog.qualityOrder
    .map((qualityId, index) => ({ qualityId, before: current.weights[index] ?? 0, after: next.weights[index] ?? 0 }))
    .filter((row) => row.before !== row.after);
  const shortfall = Math.max(0, cost - state.wallet.gold);

  const upgrade = async () => {
    setBusy(true);
    const response = await send({ type: 'upgradeBench', payload: { expectedBenchLevel: level } });
    setBusy(false);
    if (response.status === 'succeeded') {
      const result = response.result as BenchUpgradeResult;
      toast(`鑑定台升級為 Lv${result.levelAfter}；只影響之後的鑑定`, 'success');
      onClose();
    }
  };

  return (
    <Sheet
      title={`升級鑑定台 Lv${level} → Lv${level + 1}`}
      onClose={onClose}
      compact
      testId="bench-sheet"
      footer={
        <ActionButton
          label={shortfall > 0 ? `還差 ${formatFull(shortfall)} 金幣` : `升級（${formatFull(cost)} 金幣）`}
          subLabel={availability.enabled ? '立即生效，只影響之後的鑑定' : availability.reason}
          variant="primary"
          disabled={!availability.enabled || busy || pendingCount > 0}
          onClick={() => void upgrade()}
          data-testid="confirm-bench-upgrade"
        />
      }
    >
      <table className={ps.table}>
        <thead>
          <tr>
            <th scope="col">品質</th>
            <th scope="col">目前</th>
            <th scope="col">升級後</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.qualityId}>
              <td className={`q-${row.qualityId}`} style={{ color: 'var(--q)' }}>
                {qualityName(catalog, row.qualityId)}
              </td>
              <td className="numeric">{row.before / 100}%</td>
              <td className={['numeric', row.after > row.before ? ps.positive : ps.negative].join(' ')}>{row.after / 100}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className={styles.costList}>
        <div>
          <dt>花費</dt>
          <dd className="numeric">{formatFull(cost)}</dd>
        </div>
        <div>
          <dt>目前金幣</dt>
          <dd className="numeric">{formatFull(state.wallet.gold)}</dd>
        </div>
        <div>
          <dt>升級後餘額</dt>
          <dd className="numeric">{shortfall > 0 ? '不足，無法升級' : formatFull(state.wallet.gold - cost)}</dd>
        </div>
      </dl>
      <p className={ps.note}>金幣只能出售不用的裝備取得，本版只用於升級鑑定台。品質機率屬原型數值（N），尚未平衡。</p>
    </Sheet>
  );
}
