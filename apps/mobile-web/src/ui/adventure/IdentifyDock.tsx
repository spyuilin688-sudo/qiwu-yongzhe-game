import { NOVICE_JOB_ID } from '@qiwu/content';
import {
  assertCanIdentify,
  assertNotInBossFight,
  availabilityOf,
  benchUpgradeCost,
  type IdentifyResult,
} from '@qiwu/game-core';
import { useCatalog, useGame, useHost, useSend } from '../../app/GameContext.tsx';
import { useOpenSheet, useUi } from '../../app/uiStore.tsx';
import { UiIcon } from '../../art/index.ts';
import { ActionButton } from '../components/primitives.tsx';

/** 鑑定區按鈕內的輔助圖示大小（與按鈕字級一致）。 */
const DOCK_ICON_SIZE = 16;
const MAIN_ICON_SIZE = 20;
import { formatCompact } from '../format/format.ts';
import { qualityShort } from '../format/viewModels.ts';
import styles from './adventure.module.css';

/**
 * 鑑定區（UI-A08～A13）拆成三列：台資訊與升級、主操作（鑑定一次／自動鑑定）、篩選／路線／古物存量。
 * 為什麼拆開：短螢幕時主操作列固定在可捲動區外，任何高度都不會被底部導覽蓋住或蓋住其他按鈕。
 */

export function BenchRow() {
  const catalog = useCatalog();
  const { state, identifyPending } = useGame();
  const openSheet = useOpenSheet();
  const benchLevel = state.wallet.benchLevel;
  const benchRow = catalog.bench[benchLevel - 1];
  const distribution = catalog.qualityOrder
    .map((qualityId, index) => ({ qualityId, weight: benchRow?.weights[index] ?? 0 }))
    .filter((entry) => entry.weight > 0)
    .map((entry) => `${qualityShort(catalog, entry.qualityId)}${entry.weight / 100}%`)
    .join('・');
  const cost = benchUpgradeCost(state, { catalog });
  const bossLock = availabilityOf(() => assertNotInBossFight(state));
  const canAfford = cost !== null && state.wallet.gold >= cost;
  return (
    <div className={styles.benchRow}>
      <span className={[styles.benchIcon, identifyPending && styles.benchScanning].filter(Boolean).join(' ')} aria-hidden="true" />
      <span className={styles.benchInfo}>
        <span className={styles.benchName}>遺物鑑定台 Lv{benchLevel}</span>
        <span className={styles.benchDist}>{distribution}</span>
      </span>
      <ActionButton
        className={styles.benchUpgrade}
        label={cost === null ? '已達上限' : '升級台'}
        subLabel={cost === null ? '本版上限' : !bossLock.enabled ? 'BOSS 中停用' : canAfford ? `可升級・${formatCompact(cost)}` : `${formatCompact(cost)} 金幣`}
        disabled={cost === null || !bossLock.enabled}
        onClick={() => openSheet({ kind: 'benchUpgrade' })}
        data-testid="bench-upgrade"
      />
    </div>
  );
}

export function MainActions() {
  const catalog = useCatalog();
  const host = useHost();
  const game = useGame();
  const send = useSend();
  const openSheet = useOpenSheet();
  const { state, auto, identifyPending } = game;
  const identify = availabilityOf(() => assertCanIdentify(state, { catalog }));
  const identifyDisabled = !identify.enabled || identifyPending || game.status !== 'running';
  // 首次使用提示（規格 07 N）：只換按鈕副標，不做強制教學頁。
  const firstIdentify = state.totals.identified === 0;
  const identifySub = identifyPending ? '等待回覆…' : identify.enabled ? (firstIdentify ? '點我鑑定第一件古物' : '消耗 1 件古物') : shortReason(identify.code);
  const statusText = auto.enabled ? auto.message : identify.enabled ? '點「鑑定一次」把古物變成經驗與裝備' : (identify.reason ?? '');

  const onIdentify = async () => {
    const response = await send({ type: 'identify', payload: {} });
    if (response.status !== 'succeeded') return;
    const result = response.result as IdentifyResult;
    openSheet({
      kind: 'identifyResult',
      itemId: result.item.id,
      fromAuto: false,
      xpGained: result.xpGained,
      levelBefore: result.levelBefore,
      levelAfter: result.levelAfter,
      reasons: result.classification.reasons,
    });
  };

  // 主按鈕永遠是開／關切換；暫停中的保留裝備另由狀態文字旁的「查看」開啟。
  const onAuto = () => void host.setAutoIdentify(!auto.enabled);
  const openReview = () => {
    if (!auto.reviewItemId) return;
    openSheet({ kind: 'identifyResult', itemId: auto.reviewItemId, fromAuto: true, xpGained: null, levelBefore: null, levelAfter: null, reasons: [] });
  };

  return (
    <div className={styles.mainRow}>
      <span className="visually-hidden" role="status" aria-live="polite" data-testid="auto-status">
        {statusText}
      </span>
      <ActionButton
        className={styles.identifyButton}
        variant="primary"
        size="l"
        icon={<UiIcon name="lens" size={MAIN_ICON_SIZE} />}
        label="鑑定一次"
        subLabel={identifySub}
        disabled={identifyDisabled}
        onClick={onIdentify}
        data-testid="identify-once"
      />
      <ActionButton
        className={[styles.autoButton, auto.enabled && styles.autoOn].filter(Boolean).join(' ')}
        size="l"
        label={auto.enabled ? '自動：開' : '自動鑑定'}
        subLabel={auto.enabled ? (auto.phase === 'review' ? '點擊關閉自動' : auto.message) : '逐筆鑑定'}
        aria-pressed={auto.enabled}
        disabled={game.status !== 'running'}
        onClick={onAuto}
        data-testid="auto-identify"
      />
      {auto.phase === 'review' ? (
        <ActionButton className={styles.reviewButton} label="查看" subLabel="暫停中" variant="primary" onClick={openReview} data-testid="open-review" />
      ) : null}
    </div>
  );
}

export function SecondaryActions() {
  const catalog = useCatalog();
  const { state } = useGame();
  const openSheet = useOpenSheet();
  const targetJob = catalog.jobs.get(state.identifySettings.targetJobId);
  const targetLabel = state.identifySettings.targetJobId === NOVICE_JOB_ID ? '共用部位' : (targetJob?.name ?? '—');
  const bagCount = Object.keys(state.items).length;
  const relicPercent = (state.wallet.relicProgress / catalog.tuning.relic.pointsPerRelic) * 100;
  return (
    <div className={styles.secondaryRow}>
      <ActionButton
        className={styles.secondaryButton}
        icon={<UiIcon name="filter" size={DOCK_ICON_SIZE} />}
        label="篩選"
        subLabel="保留・出售"
        onClick={() => openSheet({ kind: 'filter' })}
        data-testid="filter-open"
      />
      <ActionButton
        className={styles.routeButton}
        icon={<UiIcon name="route" size={DOCK_ICON_SIZE} />}
        label="產出路線"
        subLabel={targetLabel}
        onClick={() => openSheet({ kind: 'routePicker' })}
        data-testid="route-picker"
      />
      <div className={styles.relicStock} aria-label={`古物剩餘 ${state.wallet.relics} 件，背包 ${bagCount}/${catalog.globals.backpackCapacity}`}>
        <span className={styles.relicCount + ' numeric'}>古物 {formatCompact(state.wallet.relics)}</span>
        <span className={styles.relicNext} aria-hidden="true">
          <span style={{ width: `${relicPercent}%` }} />
        </span>
        <span className={styles.bagCount + ' numeric'}>
          背包 {bagCount}/{catalog.globals.backpackCapacity}
        </span>
      </div>
    </div>
  );
}

/** 背包已滿時提供「前往背包」，不提供未定義的付費擴充（規格 07）。 */
export function BagFullNotice() {
  const catalog = useCatalog();
  const { state } = useGame();
  const { dispatch } = useUi();
  if (Object.keys(state.items).length < catalog.globals.backpackCapacity) return null;
  return (
    <div className={styles.noticeRow}>
      <span>背包已滿：鑑定暫停，古物不會被扣除。</span>
      <ActionButton
        label="前往背包"
        variant="primary"
        onClick={() => {
          dispatch({ type: 'setTab', tab: 'character' });
          dispatch({ type: 'setCharacterTab', tab: 'bag' });
        }}
        data-testid="go-bag"
      />
    </div>
  );
}

function shortReason(code: string | null): string {
  switch (code) {
    case 'NO_RELIC':
      return '古物不足';
    case 'BAG_FULL':
      return '背包已滿';
    case 'BOSS_LOCKED':
      return 'BOSS 中停用';
    case 'ROUTE_INVALID':
      return '請重選路線';
    default:
      return '暫不可用';
  }
}
