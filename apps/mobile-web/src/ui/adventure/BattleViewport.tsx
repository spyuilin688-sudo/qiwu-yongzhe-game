import { RESOURCE_LABELS, SUIT_NAMES, UNIT_LABELS, bossStageLocalNumber, getStageAt, type ResourceId } from '@qiwu/content';
import { availabilityOf, assertCanStartBoss, type BattleView, type EnemyView } from '@qiwu/game-core';
import { useEffect, useRef, useState } from 'react';
import { useBattleView, useCatalog, useGame, useHostEvents, useSend } from '../../app/GameContext.tsx';
import { useOpenSheet, useUi } from '../../app/uiStore.tsx';
import { usePrefs } from '../../app/prefs.tsx';
import { formatClock, formatCompact } from '../format/format.ts';
import { jobGlyph } from '../format/viewModels.ts';
import { ActionButton } from '../components/primitives.tsx';
import styles from './battle.module.css';

/** 戰場構圖（規格 07）：角色腳點在寬 24%；敵人依 62%、76%、90% 排列，最多 3 敵。 */
const ENEMY_X = [62, 76, 90] as const;
/** 花色符號只是輔助，旁邊一律附文字（下一張）並在 aria-label 給完整花色名。 */
const SUIT_GLYPHS = ['♥', '♦', '♣', '♠'] as const;
const BOSS_BODY_X = 76;
const FLOAT_LIFETIME_MS = 800;
const FLOAT_MERGE_MS = 160;
const MAX_FLOATS = 20;

interface FloatText {
  id: number;
  uid: number;
  amount: number;
  crit: boolean;
  source: string;
  createdAt: number;
}

function enemyPositions(view: BattleView): Map<number, number> {
  const positions = new Map<number, number>();
  if (view.boss) {
    const adds = view.enemies.filter((enemy) => enemy.uid !== view.boss!.bodyUid);
    positions.set(view.boss.bodyUid, BOSS_BODY_X);
    adds.forEach((add, index) => positions.set(add.uid, index === 0 ? ENEMY_X[0] : ENEMY_X[2]));
    return positions;
  }
  if (view.enemies.length === 1 && view.enemies[0]!.kind === 'elite') {
    positions.set(view.enemies[0]!.uid, BOSS_BODY_X);
    return positions;
  }
  // 依生成順序固定站位，前面的怪死亡時後面的怪不換位置，避免畫面跳動。
  const sorted = [...view.enemies].sort((a, b) => a.uid - b.uid);
  const base = sorted[0]?.uid ?? 0;
  for (const enemy of sorted) positions.set(enemy.uid, ENEMY_X[(enemy.uid - base) % ENEMY_X.length]!);
  return positions;
}

export function BattleViewport() {
  const view = useBattleView();
  const catalog = useCatalog();
  const { state } = useGame();
  const { prefs } = usePrefs();
  const [floats, setFloats] = useState<FloatText[]>([]);
  const [heroAction, setHeroAction] = useState<{ key: number; skillName: string | null }>({ key: 0, skillName: null });
  const nextId = useRef(1);

  // 定時清除已過期的飄字：波次之間沒有新命中時也不會殘留（減少動態效果時飄字不會自行淡出）。
  useEffect(() => {
    const timer = setInterval(() => {
      const now = performance.now();
      setFloats((previous) => (previous.some((item) => now - item.createdAt >= FLOAT_LIFETIME_MS) ? previous.filter((item) => now - item.createdAt < FLOAT_LIFETIME_MS) : previous));
    }, FLOAT_LIFETIME_MS / 2);
    return () => clearInterval(timer);
  }, []);

  useHostEvents((events) => {
    const now = performance.now();
    const hits: { uid: number; amount: number; crit: boolean; source: string }[] = [];
    let action: { skillName: string | null } | null = null;
    for (const entry of events) {
      if (entry.type !== 'battle') continue;
      const event = entry.event;
      if (event.type === 'hit') hits.push({ uid: event.targetUid, amount: event.amount, crit: event.crit, source: event.source });
      else if (event.type === 'skillCast') action = { skillName: catalog.skills.get(event.skillId)?.name ?? null };
      else if (event.type === 'basicAttack' && !action) action = { skillName: null };
    }
    if (hits.length > 0) {
      setFloats((previous) => {
        const next = previous.filter((item) => now - item.createdAt < FLOAT_LIFETIME_MS).map((item) => ({ ...item }));
        for (const hit of hits) {
          // 同目標短時間多段合併顯示；只合併視覺，不丟傷害事件。
          const merge = next.find((item) => item.uid === hit.uid && item.crit === hit.crit && now - item.createdAt < FLOAT_MERGE_MS);
          if (merge) merge.amount += hit.amount;
          else next.push({ id: nextId.current++, createdAt: now, ...hit });
        }
        return next.slice(-MAX_FLOATS);
      });
    }
    if (action && !prefs.reducedMotion) {
      const skillName = action.skillName;
      setHeroAction((current) => ({ key: current.key + 1, skillName }));
    }
  });

  const mode = state.progress.mode;
  const positions = view ? enemyPositions(view) : new Map<number, number>();
  const resources = view ? (Object.entries(view.hero.resources) as [ResourceId, number][]) : [];

  const showSummon = state.progress.mode === 'BOSS_READY' || state.progress.mode === 'FARM_BLOCKED';
  return (
    <div className={styles.viewport} data-testid="battle-viewport" data-summon={showSummon}>
      <div className={styles.backdrop} aria-hidden="true" />
      {view?.boss ? <BossBar view={view} /> : null}
      {mode === 'FARM_BLOCKED' ? (
        <p className={styles.hint}>BOSS 未通過：持續刷怪累積古物，先鑑定變強，再手動召喚。</p>
      ) : null}
      {mode === 'ENDGAME_FARM' ? <p className={styles.hint}>已完成本版全部 {catalog.mapCount} 張地圖，持續在末區刷怪。</p> : null}

      <div className={styles.hero} style={{ left: '24%' }} aria-label="角色">
        <div key={heroAction.key} className={[styles.heroBody, heroAction.key > 0 && styles.heroLunge].filter(Boolean).join(' ')}>
          {jobGlyph(catalog, state.player.currentJobId)}
        </div>
        {heroAction.skillName ? (
          <span key={`s${heroAction.key}`} className={styles.skillPop}>
            {heroAction.skillName}
          </span>
        ) : null}
        {resources.length > 0 ? (
          <div className={styles.resourcePips} aria-label="角色資源">
            {resources.map(([id, value]) => (
              <span key={id}>
                {RESOURCE_LABELS[id]} {value}
              </span>
            ))}
          </div>
        ) : null}
        {view?.hero.cards ? (
          <span className={styles.nextSuit} aria-label={`下一張牌：${SUIT_NAMES[view.hero.cards.nextSuit]}${view.hero.cards.setPending ? '（已切牌）' : ''}`}>
            <span aria-hidden="true" data-suit={view.hero.cards.nextSuit}>
              {SUIT_GLYPHS[view.hero.cards.nextSuit]}
            </span>
            下一張
          </span>
        ) : null}
        {view && view.hero.units.length > 0 ? (
          <div className={styles.units}>
            {view.hero.units.map((unit) => (
              <span
                key={unit.uid}
                className={styles.unit}
                title={unit.permanent ? `${UNIT_LABELS[unit.kind]}（常駐）` : `${UNIT_LABELS[unit.kind]} 剩 ${Math.ceil(unit.remainingMs / 1000)} 秒`}
              >
                {UNIT_LABELS[unit.kind].slice(0, 1)}
                {unit.permanent ? null : <small className="numeric">{Math.ceil(unit.remainingMs / 1000)}</small>}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {view?.enemies.map((enemy) => (
        <Enemy key={enemy.uid} enemy={enemy} x={positions.get(enemy.uid) ?? ENEMY_X[1]} isBody={enemy.uid === view.boss?.bodyUid} />
      ))}

      {floats.map((item) => (
        <span
          key={item.id}
          className={[styles.float, item.crit && styles.floatCrit, item.source === 'dot' && styles.floatDot, item.source === 'summon' && styles.floatSummon, item.source === 'followUp' && styles.floatFollow]
            .filter(Boolean)
            .join(' ')}
          style={{ left: `${positions.get(item.uid) ?? ENEMY_X[1]}%` }}
          aria-hidden="true"
        >
          {formatCompact(item.amount)}
        </span>
      ))}

      {view && view.enemies.length === 0 && !view.boss ? <p className={styles.waiting}>下一波即將出現…</p> : null}
      <BossButton />
    </div>
  );
}

function Enemy({ enemy, x, isBody }: { enemy: EnemyView; x: number; isBody: boolean }) {
  const large = enemy.kind === 'boss' || enemy.kind === 'elite';
  return (
    <div
      className={[styles.enemy, large && styles.enemyLarge, enemy.kind === 'add' && styles.enemyAdd].filter(Boolean).join(' ')}
      style={{ left: `${x}%` }}
      data-enemy-kind={enemy.kind}
    >
      {!isBody ? (
        <div className={styles.enemyHp} role="meter" aria-label={`${enemy.name} 血量`} aria-valuenow={enemy.hp} aria-valuemin={0} aria-valuemax={enemy.maxHp}>
          <span style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
        </div>
      ) : null}
      <div className={styles.enemyBody} aria-hidden="true" />
      <span className={styles.enemyName}>{enemy.name}</span>
      {enemy.statuses.length > 0 || enemy.traits.length > 0 ? (
        <span className={styles.statusRow}>
          {enemy.traits.map((trait) => (
            <span key={trait} className={styles.trait}>
              {trait}
            </span>
          ))}
          {enemy.statuses.map((status) => (
            <span key={status.statusId} className={styles.status}>
              {status.label}
              {status.stacks > 1 ? <span className="numeric">×{status.stacks}</span> : null}
            </span>
          ))}
        </span>
      ) : null}
    </div>
  );
}

function BossBar({ view }: { view: BattleView }) {
  const boss = view.boss!;
  const catalog = useCatalog();
  const { state } = useGame();
  const send = useSend();
  const { dispatch } = useUi();
  const attempt = state.boss.active;
  const percent = Math.max(0, (boss.hp / boss.maxHp) * 100);
  return (
    <div className={styles.bossBar} data-testid="boss-bar">
      <div className={styles.bossTop}>
        <span className={styles.bossName}>{boss.name}</span>
        <span className={styles.bossState}>挑戰中・不可重複召喚</span>
        <span className={styles.bossTimer + ' numeric'} aria-label={`剩餘 ${Math.ceil(boss.remainingMs / 1000)} 秒`}>
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
      </div>
      <div className={styles.bossHp} role="meter" aria-label="BOSS 血量" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${percent}%` }} />
        <em className="numeric">{percent.toFixed(1)}%</em>
      </div>
      {boss.phaseLabels.length > 0 ? (
        <div className={styles.phaseRow}>
          {boss.phaseLabels.map((label) => (
            <span key={label} className={styles.trait}>
              {label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** 召喚 BOSS（UI-A04）：非 BOSS 關隱藏；進行中禁用並顯示原因；按戰鬥區右下錨定。 */
function BossButton() {
  const catalog = useCatalog();
  const { state, pendingCount } = useGame();
  const openSheet = useOpenSheet();
  const mode = state.progress.mode;
  const stage = getStageAt(catalog, state.progress.mapNumber, state.progress.localStage);
  // 挑戰中不再佔用戰場右下角（會蓋住 BOSS 名稱），改在 BOSS 血條列顯示「挑戰中・不可重複召喚」。
  if (stage.type !== 'boss' || mode === 'ENDGAME_FARM' || mode === 'BOSS_FIGHT') return null;
  const availability = availabilityOf(() => assertCanStartBoss(state, { catalog }));
  const disabled = !availability.enabled || pendingCount > 0;
  return (
    <ActionButton
      className={styles.bossButton}
      variant="primary"
      label="召喚 BOSS"
      subLabel={availability.enabled ? (mode === 'FARM_BLOCKED' ? '手動再挑戰' : '確認打王配置') : availability.reason}
      disabled={disabled}
      onClick={() => openSheet({ kind: 'bossSummon' })}
      data-testid="summon-boss"
    />
  );
}
