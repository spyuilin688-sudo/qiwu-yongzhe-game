import { useCatalog, useGame, useHost, useSend } from '../../app/GameContext.tsx';
import { TEXT_SCALES, usePrefs } from '../../app/prefs.tsx';
import { useUi } from '../../app/uiStore.tsx';
import { ActionButton, Chip, Sheet, Toggle, primitiveStyles as ps } from '../components/primitives.tsx';
import { formatFull } from '../format/format.ts';
import type { FixtureName } from '../../host/devTools.ts';
import styles from './sheets.module.css';

const LEDGER_LABELS: Record<string, string> = {
  ITEM_SOLD: '出售',
  IDENTIFIED: '鑑定經驗',
  RELIC_GRANTED: '清怪取得古物',
  RELIC_CONSUMED: '鑑定消耗古物',
  BENCH_UPGRADED: '升級鑑定台',
};

const RESOURCE_LABELS: Record<string, string> = { GOLD: '金幣', XP: '經驗', RELIC: '古物', BENCH_LEVEL: '台等' };

const DEV_FIXTURES: readonly { name: FixtureName; label: string }[] = [
  { name: 'fresh', label: '全新角色' },
  { name: 'gold', label: '5000 金幣＋20 古物' },
  { name: 'lv10', label: 'Lv10 可轉職' },
  { name: 'bossReady', label: '第 30 關（Lv10 見習者）' },
  { name: 'bossStrong', label: '第 30 關（強化劍士）' },
  { name: 'fullBag', label: '背包已滿' },
  { name: 'swordSaint', label: '劍聖 Lv80（戰意）' },
  { name: 'mechCommander', label: '機械統帥 Lv80（砲台／機甲）' },
];

/** 僅開發模式：在手機上直接載入測試前置狀態，用來檢查二、三轉的差異機制。正式建置不包含。 */
function DevFixtures({ onClose }: { onClose: () => void }) {
  const { dispatch } = useUi();
  return (
    <>
      <h3 className={ps.sectionTitle}>開發測試（僅開發模式）</h3>
      <p className={ps.note}>載入後會覆蓋目前本機存檔。夾具只建立前置狀態，之後的操作仍走正式命令流程。</p>
      <div className={ps.chipRow}>
        {DEV_FIXTURES.map((fixture) => (
          <ActionButton
            key={fixture.name}
            label={fixture.label}
            onClick={() =>
              dispatch({
                type: 'openConfirm',
                confirm: {
                  title: `載入「${fixture.label}」？`,
                  message: '目前本機存檔會被取代。',
                  confirmLabel: '載入',
                  tone: 'danger',
                  onConfirm: () => {
                    window.__qiwuDev?.loadFixture(fixture.name);
                    onClose();
                  },
                },
              })
            }
          />
        ))}
      </div>
    </>
  );
}

/** 更多（UI-A02）：聲音、效能、字體、首次自動挑戰、連線／版本、操作紀錄；危險操作另確認。 */
export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const catalog = useCatalog();
  const host = useHost();
  const game = useGame();
  const send = useSend();
  const { prefs, update } = usePrefs();
  const { dispatch } = useUi();
  const { state } = game;
  const recentLedger = [...state.ledger].reverse().filter((entry) => entry.eventType !== 'RELIC_GRANTED').slice(0, 20);
  const recentBoss = [...state.boss.history].reverse().slice(0, 5);

  return (
    <Sheet title="更多" onClose={onClose} testId="settings-sheet">
      <h3 className={ps.sectionTitle}>聲音與畫面</h3>
      <Toggle label="聲音" description="原型尚無音效；聲音不會是唯一的資訊來源" on={false} onChange={() => undefined} disabled />
      <div style={{ height: 'var(--space-2)' }} />
      <Toggle
        label="減少動態效果"
        description="移除震動、閃光與位移動畫；不改變實際戰鬥速度"
        on={prefs.reducedMotion}
        onChange={(next) => update({ reducedMotion: next })}
      />
      <h3 className={ps.sectionTitle}>字體大小</h3>
      <div className={ps.chipRow} role="group" aria-label="字體大小">
        {TEXT_SCALES.map((scale) => (
          <Chip key={scale} label={`${Math.round(scale * 100)}%`} on={prefs.textScale === scale} onClick={() => update({ textScale: scale })} />
        ))}
      </div>

      <h3 className={ps.sectionTitle}>BOSS</h3>
      <Toggle
        label="首次自動挑戰（P 提案）"
        description="開啟後，每張地圖首次抵達 BOSS 關時自動挑戰一次；失敗後一律需要手動召喚"
        on={state.settings.firstBossAuto}
        disabled={game.pendingCount > 0}
        onChange={(next) => void send({ type: 'updateGameSettings', payload: { firstBossAuto: next } })}
      />

      <h3 className={ps.sectionTitle}>連線與版本</h3>
      <dl className={styles.costList}>
        <div>
          <dt>連線</dt>
          <dd>本機原型（無伺服器）{game.storageAvailable ? '' : '・無法存檔：瀏覽器封鎖本機儲存'}</dd>
        </div>
        <div>
          <dt>內容版本</dt>
          <dd className="numeric">
            {catalog.contentVersion}（{catalog.checksum}）
          </dd>
        </div>
        <div>
          <dt>分頁</dt>
          <dd>{game.status === 'running' ? '此分頁可寫入' : '唯讀'}</dd>
        </div>
        <div>
          <dt>累計</dt>
          <dd className="numeric">
            擊殺 {formatFull(state.totals.kills)}・鑑定 {formatFull(state.totals.identified)}・出售 {formatFull(state.totals.itemsSold)}
          </dd>
        </div>
      </dl>

      <h3 className={ps.sectionTitle}>操作紀錄（最近 20 筆）</h3>
      {recentLedger.length === 0 ? <p className={ps.note}>尚無紀錄。</p> : null}
      <ul className={styles.logList}>
        {recentLedger.map((entry) => (
          <li key={entry.ledgerId}>
            <span>{LEDGER_LABELS[entry.eventType] ?? entry.eventType}</span>
            <span className="numeric">
              {RESOURCE_LABELS[entry.resource]} {entry.delta > 0 ? '+' : ''}
              {formatFull(entry.delta)} → {formatFull(entry.balanceAfter)}
            </span>
          </li>
        ))}
      </ul>
      {recentBoss.length > 0 ? (
        <>
          <h3 className={ps.sectionTitle}>BOSS 紀錄</h3>
          <ul className={styles.logList}>
            {recentBoss.map((attempt) => (
              <li key={attempt.attemptId}>
                <span>
                  {catalog.maps.get(attempt.mapNumber)?.boss.name}
                  {attempt.autoTriggered ? '（自動）' : ''}
                </span>
                <span>{{ success: '勝利', timeout: '時間到', aborted: '退出', pending: '進行中' }[attempt.result]}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {import.meta.env.DEV ? <DevFixtures onClose={onClose} /> : null}

      <h3 className={ps.sectionTitle}>危險操作</h3>
      <ActionButton
        label="清除本機存檔"
        subLabel="角色回到 Lv1，無法復原"
        variant="danger"
        block
        onClick={() =>
          dispatch({
            type: 'openConfirm',
            confirm: {
              title: '清除本機存檔？',
              message: '所有進度、裝備與金幣都會被刪除且無法復原。',
              confirmLabel: '清除並重新開始',
              tone: 'danger',
              onConfirm: () => {
                host.resetSave();
                onClose();
              },
            },
          })
        }
      />
    </Sheet>
  );
}
