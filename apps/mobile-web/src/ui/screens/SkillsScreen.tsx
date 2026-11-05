import { describeAutoCast, describeSteps, formatSeconds, lineageIds, skillSelectionRule, type SkillDef } from '@qiwu/content';
import { assertNotInBossFight, availabilityOf, readLoadout, type SkillConditionMode, type TargetPolicy } from '@qiwu/game-core';
import { useState } from 'react';
import { useCatalog, useGame, useSend } from '../../app/GameContext.tsx';
import { useOpenSheet, useToast, useUi } from '../../app/uiStore.tsx';
import { useEffectiveLoadoutView } from '../adventure/SkillBar.tsx';
import { ActionButton, Segmented, primitiveStyles as ps } from '../components/primitives.tsx';
import { firstJobUnlockLevel } from '../format/viewModels.ts';
import styles from './screens.module.css';

interface Draft {
  skillIds: string[];
  conditions: Record<string, SkillConditionMode>;
  targetPolicy: TargetPolicy;
}

/** 技能頁：清怪／打王兩配置；三常規不可重複、絕招只可選當前路線；只提供本招支援的條件。 */
export function SkillsScreen() {
  const catalog = useCatalog();
  const { state, pendingCount } = useGame();
  const send = useSend();
  const toast = useToast();
  const openSheet = useOpenSheet();
  const { dispatch } = useUi();
  const { view, frozen } = useEffectiveLoadoutView();
  const jobId = state.player.currentJobId;
  const job = catalog.jobs.get(jobId);
  const loadout = readLoadout(state, catalog, jobId, view);
  const rule = skillSelectionRule(catalog, jobId);
  // 每套配置各自保留未儲存的草稿：在其他頁切換清怪／打王時不會悄悄丟掉編輯；
  // 該配置在別處被儲存（revision 改變）時，草稿以新版本為準重新開始。
  const draftKey = `${jobId}:${view}`;
  const [drafts, setDrafts] = useState<Record<string, { revision: number; draft: Draft }>>({});
  const stored = drafts[draftKey];
  const draft = stored && stored.revision === loadout.revision ? stored.draft : toDraft(loadout);
  const setDraft = (update: Draft | ((current: Draft) => Draft)) =>
    setDrafts((current) => {
      const base = current[draftKey] && current[draftKey]!.revision === loadout.revision ? current[draftKey]!.draft : toDraft(loadout);
      const next = typeof update === 'function' ? update(base) : update;
      return { ...current, [draftKey]: { revision: loadout.revision, draft: next } };
    });
  const [tier, setTier] = useState<'1' | '2' | '3'>(String(Math.max(1, job?.tier ?? 1)) as '1' | '2' | '3');

  if (!job || job.tier === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>技能</h1>
        </div>
        <div className={styles.pageBody}>
          <p className={ps.empty}>見習者只會普攻。Lv{firstJobUnlockLevel(catalog)} 後到「角色 → 職業」解鎖一轉，即可配置技能。</p>
          <ActionButton
            label="前往職業"
            block
            onClick={() => {
              dispatch({ type: 'setTab', tab: 'character' });
              dispatch({ type: 'setCharacterTab', tab: 'job' });
            }}
          />
        </div>
      </div>
    );
  }

  const bossLock = availabilityOf(() => assertNotInBossFight(state));
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(loadout));
  const lineage = lineageIds(catalog, jobId);
  const familyJobs = [...catalog.jobs.values()].filter((candidate) => candidate.familyId === job.familyId && candidate.tier === Number(tier));
  const legalIds = new Set(rule.regularPool.map((skill) => skill.id));

  const move = (index: number, delta: number) =>
    setDraft((current) => {
      const next = [...current.skillIds];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return { ...current, skillIds: next };
    });
  const remove = (skillId: string) =>
    setDraft((current) => {
      const conditions = { ...current.conditions };
      delete conditions[skillId];
      return { ...current, skillIds: current.skillIds.filter((id) => id !== skillId), conditions };
    });
  const add = (skillId: string) =>
    setDraft((current) => (current.skillIds.length >= rule.regularSlots || current.skillIds.includes(skillId) ? current : { ...current, skillIds: [...current.skillIds, skillId] }));
  const setCondition = (skillId: string, mode: SkillConditionMode) =>
    setDraft((current) => {
      const conditions = { ...current.conditions };
      if (mode === 'default') delete conditions[skillId];
      else conditions[skillId] = mode;
      return { ...current, conditions };
    });

  const save = async () => {
    const response = await send({
      type: 'saveLoadoutSkills',
      payload: { purpose: view, skillIds: draft.skillIds, conditions: draft.conditions, targetPolicy: draft.targetPolicy },
    });
    if (response.status === 'succeeded') toast(`${view === 'farm' ? '清怪' : '打王'}技能配置已儲存`, 'success');
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>技能・{job.name}</h1>
      </div>
      <div className={styles.tabBar}>
        <Segmented
          label="配置"
          options={[
            { value: 'farm', label: '清怪配置' },
            { value: 'boss', label: '打王配置' },
          ]}
          value={view}
          disabled={frozen}
          onChange={(next) => dispatch({ type: 'setLoadoutView', view: next })}
        />
        {dirty ? <p className={ps.note}>此配置有未儲存的變更（切換配置不會遺失）。</p> : null}
      </div>
      <div className={styles.pageBody}>
        <h2 className={ps.sectionTitle}>
          已裝技能（常規 {draft.skillIds.length}/{rule.regularSlots}）
        </h2>
        <ol className={styles.equippedSkills}>
          {draft.skillIds.map((skillId, index) => {
            const skill = catalog.skills.get(skillId)!;
            return (
              <li key={skillId} className={styles.skillRow}>
                <div className={ps.rowMain}>
                  <div className={ps.rowTitle}>
                    {index + 1}. {skill.name}
                  </div>
                  <div className={ps.rowSub}>
                    冷卻 {formatSeconds(skill.cooldownMs)}・{draft.conditions[skillId] === 'immediate' ? '立即施放' : `預設：${skill.effect ? describeAutoCast(skill.effect.autoCast, catalog.tuning.battle.conditionFallbackMs) : skill.designAutoConditionText}`}
                  </div>
                  <div className={styles.conditionPicker}>
                    <Segmented<SkillConditionMode>
                      label={`${skill.name} 施放條件`}
                      options={[
                        { value: 'default', label: '預設條件' },
                        { value: 'immediate', label: '立即施放' },
                      ]}
                      value={draft.conditions[skillId] ?? 'default'}
                      onChange={(mode) => setCondition(skillId, mode)}
                      disabled={frozen}
                    />
                  </div>
                </div>
                <div className={styles.skillActions}>
                  <ActionButton label="↑" aria-label={`${skill.name} 上移`} disabled={frozen || index === 0} onClick={() => move(index, -1)} />
                  <ActionButton label="↓" aria-label={`${skill.name} 下移`} disabled={frozen || index === draft.skillIds.length - 1} onClick={() => move(index, 1)} />
                  <ActionButton label="移除" disabled={frozen} onClick={() => remove(skillId)} />
                </div>
              </li>
            );
          })}
          {Array.from({ length: Math.max(0, rule.regularSlots - draft.skillIds.length) }, (_, index) => (
            <li key={`empty-${index}`} className={styles.skillRowEmpty}>
              空欄位：從下方清單加入
            </li>
          ))}
        </ol>
        <div className={styles.card}>
          <div className={ps.rowTitle}>絕招：{rule.ultimate ? rule.ultimate.name : '三轉後開放'}</div>
          <div className={ps.rowSub}>{rule.ultimate ? '固定為目前三轉路線絕招，自動帶入兩套配置。' : '絕招只可選當前三轉路線。'}</div>
        </div>
        {view === 'boss' ? (
          <>
            <h2 className={ps.sectionTitle}>BOSS 目標策略（開戰前設定）</h2>
            <Segmented<TargetPolicy>
              label="BOSS 目標策略"
              options={[
                { value: 'default', label: '本體優先' },
                { value: 'mechanicFirst', label: '優先機制目標' },
              ]}
              value={draft.targetPolicy}
              onChange={(policy) => setDraft((current) => ({ ...current, targetPolicy: policy }))}
              disabled={frozen}
            />
          </>
        ) : null}

        <h2 className={ps.sectionTitle}>技能清單</h2>
        <Segmented
          label="轉職階段"
          options={[
            { value: '1', label: '1 轉' },
            { value: '2', label: '2 轉' },
            { value: '3', label: '3 轉' },
          ]}
          value={tier}
          onChange={setTier}
        />
        {familyJobs.map((candidate) => (
          <section key={candidate.id} className={styles.skillGroup}>
            <h3 className={styles.familyTitle}>
              {candidate.name}
              {lineage.has(candidate.id) ? '' : `（需轉職：Lv${candidate.unlockLevel}${candidate.playable ? '' : '・原型尚未實作'}）`}
            </h3>
            {candidate.ownSkillIds.map((skillId) => {
              const skill = catalog.skills.get(skillId)!;
              return (
                <SkillListRow
                  key={skillId}
                  skill={skill}
                  usable={legalIds.has(skillId)}
                  equipped={draft.skillIds.includes(skillId) || rule.ultimate?.id === skillId}
                  canAdd={!frozen && legalIds.has(skillId) && draft.skillIds.length < rule.regularSlots && !draft.skillIds.includes(skillId)}
                  onAdd={() => add(skillId)}
                  onDetail={() => openSheet({ kind: 'skillDetail', skillId })}
                  fallbackMs={catalog.tuning.battle.conditionFallbackMs}
                />
              );
            })}
          </section>
        ))}
      </div>
      <div className={styles.saveBar}>
        <ActionButton label="還原" variant="ghost" disabled={!dirty} onClick={() => setDraft(toDraft(loadout))} />
        <ActionButton
          label="儲存"
          variant="primary"
          disabled={!dirty || !bossLock.enabled || pendingCount > 0}
          subLabel={bossLock.enabled ? undefined : 'BOSS 中停用'}
          onClick={() => void save()}
          data-testid="save-skills"
        />
      </div>
    </div>
  );
}

function SkillListRow({
  skill,
  usable,
  equipped,
  canAdd,
  onAdd,
  onDetail,
  fallbackMs,
}: {
  skill: SkillDef;
  usable: boolean;
  equipped: boolean;
  canAdd: boolean;
  onAdd: () => void;
  onDetail: () => void;
  fallbackMs: number;
}) {
  const isUltimate = skill.kind === 'ultimate';
  return (
    <div className={styles.skillRow}>
      <button type="button" className={styles.skillInfo} onClick={onDetail}>
        <span className={ps.rowTitle}>
          {skill.name}
          {isUltimate ? '【絕招】' : ''}
        </span>
        <span className={ps.rowSub}>
          冷卻 {formatSeconds(skill.cooldownMs)}・{skill.tags.join('／')}
        </span>
        <span className={ps.rowSub}>{skill.effect ? describeSteps(skill.effect.steps) : `原型尚未實作：${skill.designEffectText}`}</span>
        {skill.effect ? <span className={ps.rowSub}>條件：{describeAutoCast(skill.effect.autoCast, fallbackMs)}</span> : null}
      </button>
      {isUltimate ? (
        <span className={styles.skillBadge}>{equipped ? '已帶入' : '三轉固定'}</span>
      ) : (
        <ActionButton
          label={equipped ? '已裝入' : '加入'}
          subLabel={!usable ? '未解鎖' : equipped ? undefined : canAdd ? undefined : '欄位已滿'}
          disabled={!canAdd}
          onClick={onAdd}
        />
      )}
    </div>
  );
}

function toDraft(loadout: { skillIds: readonly string[]; conditions: Readonly<Record<string, SkillConditionMode>>; targetPolicy: TargetPolicy }): Draft {
  return { skillIds: [...loadout.skillIds], conditions: { ...loadout.conditions }, targetPolicy: loadout.targetPolicy };
}
