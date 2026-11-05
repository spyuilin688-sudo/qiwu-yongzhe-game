import { SLOT_IDS, STAT_KEYS, type QualityId, type SlotId, type StatKey } from '@qiwu/content';
import { autoSellMaxAllowedQuality, autoSellScopeWidened, qualityRank, type AutoSellRules, type KeepRules } from '@qiwu/game-core';
import { useState } from 'react';
import { useCatalog, useGame, useSend } from '../../app/GameContext.tsx';
import { useUi, useToast } from '../../app/uiStore.tsx';
import { ActionButton, Chip, Sheet, Toggle, primitiveStyles as ps } from '../components/primitives.tsx';
import { statLabel } from '../format/format.ts';
import { qualityName, slotLabel } from '../format/viewModels.ts';

/**
 * 鑑定篩選（UI-A11）：先保護再處理。保留優先於出售；自動出售預設關閉，
 * 開啟時需確認條件，且史詩以上永遠不自動出售。設定只影響下一筆鑑定。
 */
export function FilterSheet({ onClose }: { onClose: () => void }) {
  const catalog = useCatalog();
  const { state, pendingCount } = useGame();
  const send = useSend();
  const toast = useToast();
  const { dispatch } = useUi();
  const settings = state.identifySettings;
  const [keep, setKeep] = useState<KeepRules>(() => ({ ...settings.keep, slots: [...(settings.keep.slots ?? [])], affixStats: [...settings.keep.affixStats] }));
  const [autoSell, setAutoSell] = useState<AutoSellRules>(() => ({ ...settings.autoSell, slots: [...settings.autoSell.slots] }));
  const [busy, setBusy] = useState(false);

  // 保留門檻從第二個品質起選：「普通以上」等於全部保留，會讓自動鑑定每件都暫停。
  const keepQualities = catalog.qualityOrder.slice(1);
  const sellQualities = catalog.qualityOrder.filter((id) => qualityRank(catalog, id) <= qualityRank(catalog, autoSellMaxAllowedQuality(catalog)));
  const affixOptions = STAT_KEYS.filter((stat) => stat !== 'FLAT_ATTACK') as StatKey[];

  const save = async (confirmAutoSell: boolean) => {
    setBusy(true);
    const response = await send({
      type: 'updateIdentifySettings',
      payload: { targetJobId: settings.targetJobId, keep, autoSell, confirmAutoSell },
    });
    setBusy(false);
    if (response.status === 'succeeded') {
      toast('篩選已儲存；從下一筆鑑定開始生效', 'success');
      onClose();
    }
  };

  const onSave = () => {
    // 首次開啟或擴大出售範圍（提高品質上限、增加部位、放寬保留條件）都需要再次確認。
    if (!autoSellScopeWidened(catalog, settings, { keep, autoSell })) {
      void save(false);
      return;
    }
    const maxAllowed = autoSellMaxAllowedQuality(catalog);
    dispatch({
      type: 'openConfirm',
      confirm: {
        title: settings.autoSell.enabled ? '擴大自動出售範圍？' : '開啟自動出售？',
        message: `自動鑑定取得的裝備，若不符合保留條件、品質在「${qualityName(catalog, autoSell.maxQuality)}」以下且部位為：${autoSell.slots
          .map((slot) => slotLabel(slot))
          .join('、')}，將自動出售換成金幣。\n品質高於「${qualityName(catalog, maxAllowed)}」的裝備永遠不會自動出售；達保留條件（目前：${qualityName(
          catalog,
          keep.minQuality,
        )}以上）與首次取得的傳說基底會先暫停讓你查看。`,
        confirmLabel: '確認並儲存',
        tone: 'primary',
        onConfirm: () => void save(true),
      },
    });
  };

  const toggleAffix = (stat: StatKey) =>
    setKeep((current) => ({
      ...current,
      affixStats: current.affixStats.includes(stat) ? current.affixStats.filter((s) => s !== stat) : [...current.affixStats, stat],
    }));
  const toggleKeepSlot = (slot: SlotId) =>
    setKeep((current) => ({
      ...current,
      slots: current.slots.includes(slot) ? current.slots.filter((s) => s !== slot) : [...current.slots, slot],
    }));
  const toggleSlot = (slot: SlotId) =>
    setAutoSell((current) => ({
      ...current,
      slots: current.slots.includes(slot) ? current.slots.filter((s) => s !== slot) : [...current.slots, slot],
    }));

  return (
    <Sheet
      title="鑑定篩選"
      onClose={onClose}
      testId="filter-sheet"
      footer={
        <>
          <ActionButton label="取消" variant="ghost" onClick={onClose} />
          <ActionButton
            label="儲存"
            variant="primary"
            disabled={busy || pendingCount > 0 || (autoSell.enabled && autoSell.slots.length === 0)}
            subLabel={autoSell.enabled && autoSell.slots.length === 0 ? '至少選一個部位' : undefined}
            onClick={onSave}
            data-testid="save-filter"
          />
        </>
      }
    >
      <h3 className={ps.sectionTitle}>保留（暫停自動鑑定，等你查看）</h3>
      <p className={ps.note}>品質達以下等級即保留：</p>
      <div className={ps.chipRow}>
        {keepQualities.map((id: QualityId) => (
          <Chip key={id} label={`${qualityName(catalog, id)}以上`} on={keep.minQuality === id} onClick={() => setKeep((current) => ({ ...current, minQuality: id }))} />
        ))}
      </div>
      <p className={ps.note}>以下部位一律保留：</p>
      <div className={ps.chipRow}>
        {SLOT_IDS.map((slot) => (
          <Chip key={slot} label={slotLabel(slot)} on={keep.slots.includes(slot)} onClick={() => toggleKeepSlot(slot)} />
        ))}
      </div>
      <p className={ps.note}>含以下任一詞條即保留：</p>
      <div className={ps.chipRow}>
        {affixOptions.map((stat) => (
          <Chip key={stat} label={statLabel(stat)} on={keep.affixStats.includes(stat)} onClick={() => toggleAffix(stat)} />
        ))}
      </div>
      <div style={{ marginTop: 'var(--space-3)' }}>
        <Toggle
          label="主屬性高於目前清怪配置時保留"
          description="空的部位也會視為可提升"
          on={keep.upgradesOverEquipped}
          onChange={(next) => setKeep((current) => ({ ...current, upgradesOverEquipped: next }))}
        />
      </div>
      <p className={ps.note}>首次取得的傳說基底一律保留。</p>

      <h3 className={ps.sectionTitle}>自動出售（預設關閉）</h3>
      <Toggle
        label="自動出售不符合保留條件的裝備"
        description="只在自動鑑定時生效；手動鑑定一律顯示比較面板"
        on={autoSell.enabled}
        onChange={(next) => setAutoSell((current) => ({ ...current, enabled: next }))}
      />
      <p className={ps.note}>出售品質上限（高於「{qualityName(catalog, autoSellMaxAllowedQuality(catalog))}」不可自動出售）：</p>
      <div className={ps.chipRow}>
        {sellQualities.map((id) => (
          <Chip
            key={id}
            label={`${qualityName(catalog, id)}以下`}
            on={autoSell.maxQuality === id}
            onClick={() => setAutoSell((current) => ({ ...current, maxQuality: id }))}
            disabled={!autoSell.enabled}
          />
        ))}
      </div>
      <p className={ps.note}>適用部位：</p>
      <div className={ps.chipRow}>
        {SLOT_IDS.map((slot) => (
          <Chip key={slot} label={slotLabel(slot)} on={autoSell.slots.includes(slot)} onClick={() => toggleSlot(slot)} disabled={!autoSell.enabled} />
        ))}
      </div>
    </Sheet>
  );
}
