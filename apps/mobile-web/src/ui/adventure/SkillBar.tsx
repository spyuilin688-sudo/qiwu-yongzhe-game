import { skillSelectionRule } from '@qiwu/content';
import { readLoadout, type LoadoutPurpose } from '@qiwu/game-core';
import { useBattleView, useCatalog, useGame } from '../../app/GameContext.tsx';
import { useOpenSheet, useUi } from '../../app/uiStore.tsx';
import { formatSecondsShort } from '../format/format.ts';
import { firstJobUnlockLevel } from '../format/viewModels.ts';
import styles from './adventure.module.css';

/** 目前畫面顯示／編輯的配置；BOSS 戰中固定為打王配置且不可切換（UI-A06 戰鬥中凍結修改）。 */
export function useEffectiveLoadoutView(): { view: LoadoutPurpose; frozen: boolean } {
  const { state } = useGame();
  const { state: ui } = useUi();
  const frozen = state.progress.mode === 'BOSS_FIGHT';
  return { view: frozen ? 'boss' : ui.loadoutView, frozen };
}

interface SlotInfo {
  readonly skillId: string | null;
  readonly ultimate: boolean;
  readonly emptyLabel: string;
}

/** 技能列（UI-A05）：前三格常規、第四格絕招；只開技能詳情，不改成手動即時放招。 */
export function SkillBar() {
  const catalog = useCatalog();
  const { state } = useGame();
  const battle = useBattleView();
  const { dispatch } = useUi();
  const openSheet = useOpenSheet();
  const { view, frozen } = useEffectiveLoadoutView();
  const jobId = state.player.currentJobId;
  const job = catalog.jobs.get(jobId);
  const loadout = readLoadout(state, catalog, jobId, view);
  const rule = skillSelectionRule(catalog, jobId);
  const tier = job?.tier ?? 0;

  const slots: SlotInfo[] = [0, 1, 2].map((index) => ({
    skillId: loadout.skillIds[index] ?? null,
    ultimate: false,
    emptyLabel: tier === 0 ? `Lv${firstJobUnlockLevel(catalog)} 轉職` : index >= rule.regularSlots ? '二轉開放' : '未配置',
  }));
  slots.push({ skillId: loadout.ultimateId, ultimate: true, emptyLabel: '三轉絕招' });

  // 冷卻只在顯示的配置就是目前戰鬥使用的配置時呈現（普通戰鬥＝清怪，BOSS 戰＝打王）。
  const battlePurpose: LoadoutPurpose = state.progress.mode === 'BOSS_FIGHT' ? 'boss' : 'farm';
  const cooldowns = battlePurpose === view ? new Map(battle?.hero.skills.map((skill) => [skill.skillId, skill]) ?? []) : new Map();

  return (
    <div className={styles.skillBar}>
      <div className={styles.skillSlots}>
        {slots.map((slot, index) => {
          const skill = slot.skillId ? catalog.skills.get(slot.skillId) : undefined;
          const cooldown = slot.skillId ? cooldowns.get(slot.skillId) : undefined;
          const ratio = cooldown && cooldown.cooldownMs > 0 ? cooldown.remainingMs / cooldown.cooldownMs : 0;
          if (!skill) {
            return (
              <button key={index} type="button" className={[styles.skillSlot, styles.skillEmpty, slot.ultimate && styles.skillUltimate].filter(Boolean).join(' ')} disabled aria-label={`${slot.ultimate ? '絕招欄' : `技能欄 ${index + 1}`}：${slot.emptyLabel}`}>
                <span className={styles.skillName}>{slot.emptyLabel}</span>
              </button>
            );
          }
          return (
            <button
              key={index}
              type="button"
              className={[styles.skillSlot, slot.ultimate && styles.skillUltimate].filter(Boolean).join(' ')}
              onClick={() => openSheet({ kind: 'skillDetail', skillId: skill.id })}
              aria-label={`${skill.name}${cooldown && cooldown.remainingMs > 0 ? `，冷卻 ${formatSecondsShort(cooldown.remainingMs)} 秒` : ''}。查看技能詳情`}
            >
              <span className={styles.skillName}>{skill.name}</span>
              {ratio > 0 ? (
                <span className={styles.skillCooldown} style={{ height: `${ratio * 100}%` }} aria-hidden="true" />
              ) : null}
              {cooldown && cooldown.remainingMs > 0 ? (
                <span className={styles.skillTimer + ' numeric'} aria-hidden="true">
                  {formatSecondsShort(cooldown.remainingMs)}
                </span>
              ) : null}
              {cooldown?.waitingForCondition && cooldown.remainingMs === 0 ? (
                <span className={styles.skillWaiting} aria-hidden="true">
                  等條件
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className={styles.loadoutToggle}
        onClick={() => dispatch({ type: 'setLoadoutView', view: view === 'farm' ? 'boss' : 'farm' })}
        disabled={frozen}
        aria-label={`目前顯示${view === 'farm' ? '清怪' : '打王'}配置，點擊切換`}
        data-testid="loadout-toggle"
      >
        <span className={styles.loadoutLabel}>{view === 'farm' ? '清怪' : '打王'}</span>
        <span className={styles.loadoutSub}>{frozen ? '挑戰中凍結' : '配置・切換'}</span>
      </button>
    </div>
  );
}
