import { describeLegend, skillNameLookup } from '@qiwu/content';
import {
  assertCanEquip,
  availabilityOf,
  assertNotInBossFight,
  readLoadout,
  sellBlockReason,
  sellPriceOf,
} from '@qiwu/game-core';
import { useState } from 'react';
import { useCatalog, useGame, useHost, useSend } from '../../app/GameContext.tsx';
import { useUi, useToast, type SheetState } from '../../app/uiStore.tsx';
import { useEffectiveLoadoutView } from '../adventure/SkillBar.tsx';
import { ActionButton, QualityBadge, Sheet, primitiveStyles as ps } from '../components/primitives.tsx';
import { formatStatDiff, formatStatValue, statLabel } from '../format/format.ts';
import { baseOf, compareItems, equippedInSlot, needsSellConfirm, qualityName, referencingLoadoutLabels, slotLabel, type ReadonlyItem } from '../format/viewModels.ts';
import styles from './sheets.module.css';

type IdentifySheet = Extract<SheetState, { kind: 'identifyResult' }>;

/**
 * 鑑定結果／裝備詳情共用的比較面板（規格 07「比較面板細部」）：
 * 表頭 → 4 欄屬性比較（只列變動項）→ 傳說特效 → 底部「出售 +金幣／穿戴／保留」。
 */
export function ItemSheet({ itemId, mode, identify, onClose }: { itemId: string; mode: 'identify' | 'detail'; identify?: IdentifySheet; onClose: () => void }) {
  const catalog = useCatalog();
  const { state, pendingCount } = useGame();
  const host = useHost();
  const send = useSend();
  const toast = useToast();
  const { dispatch } = useUi();
  const { view } = useEffectiveLoadoutView();
  const [busy, setBusy] = useState(false);

  const item: ReadonlyItem | undefined = state.items[itemId] ?? state.soldArchive.find((archived) => archived.id === itemId);
  if (!item) {
    return (
      <Sheet title="裝備" onClose={onClose} compact>
        <p className={ps.empty}>找不到這件裝備。</p>
      </Sheet>
    );
  }
  const base = baseOf(catalog, item);
  const sold = item.status === 'sold' || !state.items[itemId];
  const equipped = equippedInSlot(state, catalog, view, item.slot);
  const isCurrent = equipped?.id === item.id;
  const lines = compareItems(isCurrent ? null : equipped, item);
  const references = referencingLoadoutLabels(state, catalog, item.id);
  const equipAvailability = sold ? null : availabilityOf(() => assertCanEquip(state, { catalog }, item.id));
  const bossLock = availabilityOf(() => assertNotInBossFight(state));
  const sellBlock = sold ? null : sellBlockReason(state, item.id);
  const price = sellPriceOf({ catalog }, item);
  const loadout = readLoadout(state, catalog, state.player.currentJobId, view);
  const legendInactive = item.hasLegendEffect && base.legend ? legendInactiveReason(base.legend.procs, loadout.skillIds, loadout.ultimateId) : null;

  const act = async (action: () => Promise<boolean>) => {
    setBusy(true);
    const ok = await action();
    setBusy(false);
    if (ok) onClose();
  };

  const sell = () =>
    act(async () => {
      const response = await send({ type: 'sellItems', payload: { itemIds: [item.id], origin: 'manual' } });
      if (response.status === 'succeeded') toast(`已出售 ${base.name}，+${(response.result as { goldGained: number }).goldGained} 金幣`, 'success');
      return response.status === 'succeeded';
    });

  const confirmSell = () => {
    if (needsSellConfirm(catalog, item.qualityId)) {
      dispatch({
        type: 'openConfirm',
        confirm: {
          title: `出售${qualityName(catalog, item.qualityId)}裝備？`,
          message: `${base.name}（Lv${item.level}）將被出售並取得 ${price} 金幣，無法復原。`,
          confirmLabel: `出售 +${price}`,
          tone: 'danger',
          onConfirm: () => void sell(),
        },
      });
      return;
    }
    void sell();
  };

  const equip = () =>
    act(async () => {
      const response = await send({ type: 'equipItem', payload: { itemId: item.id, purpose: view } });
      if (response.status === 'succeeded') toast(`已穿戴到${view === 'farm' ? '清怪' : '打王'}配置；舊裝留在背包`, 'success');
      return response.status === 'succeeded';
    });

  const toggleLock = async () => {
    setBusy(true);
    await send({ type: 'lockItem', payload: { itemId: item.id, locked: !item.locked } });
    setBusy(false);
  };

  const sellDisabledReason = sold ? '已出售' : !bossLock.enabled ? 'BOSS 中停用' : sellBlock ? sellBlockShort(sellBlock.code) : null;
  const equipDisabledReason = sold
    ? '已出售'
    : isCurrent
      ? '穿戴中'
      : equipAvailability && !equipAvailability.enabled
        ? (equipAvailability.reason ?? '不可穿戴')
        : null;

  return (
    <Sheet
      testId="item-sheet"
      title={
        <span className={styles.itemTitle}>
          <QualityBadge catalog={catalog} qualityId={item.qualityId} />
          <span className={`${styles.itemName} q-${item.qualityId}`}>{base.name}</span>
        </span>
      }
      onClose={onClose}
      headerExtra={
        !sold ? (
          <button type="button" className={styles.lockButton} onClick={toggleLock} disabled={busy} aria-pressed={item.locked} data-testid="lock-toggle">
            {item.locked ? '已鎖定' : '鎖定'}
          </button>
        ) : null
      }
      footer={
        <>
          <ActionButton
            label={`出售 +${price}`}
            subLabel={sellDisabledReason ?? '金幣'}
            variant="danger"
            disabled={busy || pendingCount > 0 || sellDisabledReason !== null}
            onClick={confirmSell}
            data-testid="sell-item"
          />
          <ActionButton
            label="穿戴"
            subLabel={equipDisabledReason ?? `${view === 'farm' ? '清怪' : '打王'}配置`}
            variant="primary"
            disabled={busy || pendingCount > 0 || equipDisabledReason !== null}
            onClick={() => void equip()}
            data-testid="equip-item"
          />
          <ActionButton label="保留" subLabel="收進背包" onClick={onClose} data-testid="keep-item" />
        </>
      }
    >
      {mode === 'identify' ? <div className={styles.reveal} aria-hidden="true" /> : null}
      <p className={styles.itemMeta}>
        Lv{item.level}・{slotLabel(item.slot)}・{base.typeName}・{base.ownerName === '共用' ? '全職業' : `限 ${base.ownerName} 路線`}
      </p>
      {identify && identify.xpGained !== null ? (
        <p className={styles.xpLine} data-testid="identify-xp">
          鑑定經驗 +{identify.xpGained}
          {identify.levelAfter !== null && identify.levelBefore !== null && identify.levelAfter > identify.levelBefore
            ? `，升級 Lv${identify.levelBefore} → Lv${identify.levelAfter}（本件仍為 Lv${item.level}）`
            : ''}
        </p>
      ) : null}
      {identify?.fromAuto ? (
        <div className={ps.warning}>
          自動鑑定已暫停：{identify.reasons.length > 0 ? identify.reasons.join('、') : '符合保留條件'}。處理後自動繼續。
          <div style={{ marginTop: 'var(--space-2)' }}>
            <ActionButton
              label="停止自動鑑定"
              block
              onClick={() => {
                void host.setAutoIdentify(false);
                onClose();
              }}
              data-testid="stop-auto"
            />
          </div>
        </div>
      ) : null}
      {references.length > 0 ? <p className={ps.note}>使用中：{references.join('、')}</p> : null}
      {item.locked ? <p className={ps.note}>已鎖定：不能出售（保留與鎖定分開）。</p> : null}

      <h3 className={ps.sectionTitle}>{isCurrent ? '屬性（目前穿戴中）' : equipped ? `與目前${view === 'farm' ? '清怪' : '打王'}配置比較` : '屬性（此部位目前未穿戴）'}</h3>
      <table className={ps.table}>
        <thead>
          <tr>
            <th scope="col">屬性</th>
            <th scope="col">目前</th>
            <th scope="col">新裝</th>
            <th scope="col">差異</th>
          </tr>
        </thead>
        <tbody>
          {(isCurrent ? compareItems(null, item) : lines).map((line) => (
            <tr key={line.stat}>
              <td>{statLabel(line.stat)}</td>
              <td className="numeric">{isCurrent ? '—' : line.current ? formatStatValue(line.stat, line.current, false) : '—'}</td>
              <td className="numeric">{line.next ? formatStatValue(line.stat, line.next, false) : '—'}</td>
              <td className={['numeric', line.diff > 0 ? ps.positive : ps.negative].join(' ')}>{isCurrent ? '—' : formatStatDiff(line.stat, line.diff)}</td>
            </tr>
          ))}
          {lines.length === 0 && !isCurrent ? (
            <tr>
              <td colSpan={4}>屬性與目前裝備相同</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <h3 className={ps.sectionTitle}>傳說特效</h3>
      {!isCurrent && equipped?.hasLegendEffect && (!item.hasLegendEffect || equipped.baseId !== item.baseId) ? (
        <p className={ps.warning}>穿戴後失去：{baseOf(catalog, equipped).legendText}</p>
      ) : null}
      {item.hasLegendEffect ? (
        <div className={styles.legend}>
          <p>{base.legendText}</p>
          {base.legend ? <p className={ps.note}>觸發規則：{describeLegend(base.legend, skillNameLookup(catalog))}</p> : null}
          {legendInactive ? <p className={ps.warning}>目前配置未啟用：{legendInactive}</p> : null}
        </div>
      ) : (
        <p className={ps.note}>此件沒有傳說特效（只有傳說品質附帶）。</p>
      )}
      <p className={ps.note}>粗略比較只供參考，不代表實戰必勝；不會自動決定出售。</p>
    </Sheet>
  );
}

function sellBlockShort(code: string): string {
  switch (code) {
    case 'ITEM_LOCKED':
      return '已鎖定';
    case 'ITEM_REFERENCED':
      return '配置使用中';
    case 'ITEM_ALREADY_SOLD':
      return '已出售';
    default:
      return '不可出售';
  }
}

function legendInactiveReason(
  procs: readonly { trigger: { kind: string; skillId?: string } }[],
  skillIds: readonly string[],
  ultimateId: string | null,
): string | null {
  for (const proc of procs) {
    if (proc.trigger.kind === 'skillCast' && proc.trigger.skillId && !skillIds.includes(proc.trigger.skillId)) return '觸發技能不在此配置';
    if (proc.trigger.kind === 'ultimateCast' && !ultimateId) return '目前沒有絕招';
    if ((proc.trigger.kind === 'distinctRegularSequence' || proc.trigger.kind === 'directSkillCrit') && skillIds.length === 0) return '目前沒有常規技能';
  }
  return null;
}
