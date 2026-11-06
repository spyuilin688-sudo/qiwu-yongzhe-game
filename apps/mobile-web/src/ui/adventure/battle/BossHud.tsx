import { bossStageLocalNumber } from '@qiwu/content';
import type { BattleView, EnemyView } from '@qiwu/game-core';
import { useCatalog, useGame, useSend } from '../../../app/GameContext.tsx';
import { useUi } from '../../../app/uiStore.tsx';
import { formatClock } from '../../format/format.ts';
import styles from '../battle.module.css';
import { EnemyTags } from './EnemyActor.tsx';
import { HpBar } from './HpBar.tsx';
import { secondsLeft } from './tags.ts';

type BossView = NonNullable<BattleView['boss']>;

/** 剩餘時間低於此值時計時轉為警示色（減少動態效果時只變色、不脈動）。 */
export const BOSS_URGENT_MS = 10_000;
/** BOSS 資訊列的標籤排在名稱後面：顯示 2 個，其餘以「+N」表示（完整清單在無障礙文字裡）。 */
const MAX_BOSS_TAGS = 2;
const PERCENT = 100;

export function bossHpPercent(boss: Pick<BossView, 'hp' | 'maxHp'>): number {
  if (boss.maxHp <= 0) return 0;
  return Math.max(0, Math.min(PERCENT, (boss.hp / boss.maxHp) * PERCENT));
}

/** 階段標籤與本體身上的機制標籤合併去重：本體腳下不再顯示標籤，資訊集中在這一列。 */
export function bossTraits(boss: Pick<BossView, 'phaseLabels'>, body: Pick<EnemyView, 'traits'> | null): readonly string[] {
  return [...new Set([...boss.phaseLabels, ...(body?.traits ?? [])])];
}

/**
 * BOSS 資訊列（規格 07：戰場上緣放 BOSS 名稱與血條，倒數靠右）。放在文件流裡（.fieldTop），
 * 不再疊在戰場上：字體放大時把舞台往下推，而不是蓋住 BOSS 的臉。
 * 只顯示敵方血量；角色沒有任何血條或魔條。
 */
export function BossHud({ boss, body }: { readonly boss: BossView; readonly body: EnemyView | null }) {
  const catalog = useCatalog();
  const { state } = useGame();
  const send = useSend();
  const { dispatch } = useUi();
  const attempt = state.boss.active;
  const percent = bossHpPercent(boss);
  const percentText = `${percent.toFixed(1)}%`;
  return (
    <div className={styles.bossBar} data-testid="boss-bar">
      <span className={styles.bossName}>{boss.name}</span>
      {/* 地圖列已顯示「BOSS 挑戰中」，這裡只留給螢幕閱讀器。 */}
      <span className="visually-hidden">挑戰中・不可重複召喚</span>
      <span className={`${styles.bossTimer} numeric`} data-urgent={boss.remainingMs < BOSS_URGENT_MS ? 'true' : undefined} aria-label={`剩餘 ${secondsLeft(boss.remainingMs)} 秒`}>
        {formatClock(boss.remainingMs)}
      </span>
      {attempt ? (
        <button
          type="button"
          className={styles.abortButton}
          onClick={() =>
            dispatch({
              type: 'openConfirm',
              confirm: {
                title: '退出 BOSS 挑戰？',
                message: `退出視為挑戰失敗：留在本圖第 ${bossStageLocalNumber(catalog, state.progress.mapNumber)} 關刷怪，不會失去任何資源；下次需手動召喚。`,
                confirmLabel: '退出挑戰',
                tone: 'danger',
                onConfirm: () => void send({ type: 'abortBossAttempt', payload: { attemptId: attempt.attemptId } }),
              },
            })
          }
        >
          退出
        </button>
      ) : null}
      <HpBar tone="boss" value={Number(percent.toFixed(1))} max={PERCENT} label="BOSS 血量" valueText={percentText} className={styles.bossHp}>
        <span className="numeric">{percentText}</span>
      </HpBar>
      <EnemyTags traits={bossTraits(boss, body)} statuses={body?.statuses ?? []} max={MAX_BOSS_TAGS} className={styles.bossTags} />
    </div>
  );
}
