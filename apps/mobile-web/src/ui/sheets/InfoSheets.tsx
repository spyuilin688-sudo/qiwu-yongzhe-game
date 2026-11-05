import { describeAutoCast, describeSteps, getMap, formatSeconds } from '@qiwu/content';
import { nextLevelXp } from '@qiwu/game-core';
import { useCatalog, useGame, useHost } from '../../app/GameContext.tsx';
import { useUi } from '../../app/uiStore.tsx';
import { ActionButton, Sheet, primitiveStyles as ps } from '../components/primitives.tsx';
import { formatAttack, formatBp, formatFull } from '../format/format.ts';
import { eliteStageNumbers, firstJobUnlockLevel } from '../format/viewModels.ts';
import styles from './sheets.module.css';

/** 技能詳情（UI-A05）：只查看；BOSS 中可查看不可修改。文案由效果參數產生。 */
export function SkillDetailSheet({ skillId, onClose }: { skillId: string; onClose: () => void }) {
  const catalog = useCatalog();
  const { state } = useGame();
  const { dispatch } = useUi();
  const skill = catalog.skills.get(skillId);
  if (!skill) return null;
  const job = catalog.jobs.get(skill.jobId);
  const inBoss = state.progress.mode === 'BOSS_FIGHT';
  return (
    <Sheet
      title={skill.name}
      onClose={onClose}
      compact
      testId="skill-sheet"
      footer={
        <ActionButton
          label="前往技能頁調整"
          subLabel={inBoss ? 'BOSS 中僅可查看' : undefined}
          disabled={inBoss}
          onClick={() => {
            dispatch({ type: 'setTab', tab: 'skills' });
            onClose();
          }}
        />
      }
    >
      <p className={ps.note}>
        {job?.tier}轉 {job?.name}・{skill.kind === 'ultimate' ? '絕招' : '常規技能'}・冷卻 {formatSeconds(skill.cooldownMs)}・{skill.tags.join('／')}
      </p>
      <p>{skill.description}</p>
      {skill.effect ? (
        <>
          <h3 className={ps.sectionTitle}>效果（原型數值 N）</h3>
          <p>{describeSteps(skill.effect.steps)}</p>
          <h3 className={ps.sectionTitle}>自動施放條件</h3>
          <p>{describeAutoCast(skill.effect.autoCast, catalog.tuning.battle.conditionFallbackMs)}</p>
        </>
      ) : (
        <>
          <p className={ps.warning}>此技能尚未在原型實作，下一階段開放。</p>
          <p className={ps.note}>設計：{skill.designEffectText}</p>
        </>
      )}
    </Sheet>
  );
}

/** 地圖情報（UI-A03）：只看情報，不提供回低圖或傳送。 */
export function MapInfoSheet({ onClose }: { onClose: () => void }) {
  const catalog = useCatalog();
  const { state } = useGame();
  const map = getMap(catalog, state.progress.mapNumber);
  return (
    <Sheet title={`${String(map.number).padStart(2, '0')} ${map.name}`} onClose={onClose} testId="map-sheet">
      <h3 className={ps.sectionTitle}>六個小區</h3>
      <ul className={styles.bulletList}>
        {map.zones.map((zone) => {
          const stages = zone.stageIds.map((id) => catalog.stages.get(id)!);
          const first = stages[0]!.localNumber;
          const last = stages.at(-1)!.localNumber;
          const cleared = state.progress.localStage > last || state.progress.highestClearedMap >= map.number;
          const current = state.progress.localStage >= first && state.progress.localStage <= last;
          return (
            <li key={zone.name}>
              {zone.name}（{first}～{last}）{current ? '・目前' : cleared ? '・已通過' : ''}
            </li>
          );
        })}
      </ul>
      <h3 className={ps.sectionTitle}>小首領</h3>
      <ul className={styles.bulletList}>
        {map.elites.map((elite, index) => {
          const localNumber = eliteStageNumbers(catalog, map.number)[index];
          const template = catalog.stages.get(map.stageIds[(localNumber ?? 1) - 1] ?? '')?.eliteTemplate;
          return (
            <li key={elite.id}>
              第 {localNumber} 關 {elite.name}：{template ? `${template.label}（${template.summary}）` : ''}
            </li>
          );
        })}
      </ul>
      <h3 className={ps.sectionTitle}>地圖 BOSS：{map.boss.name}</h3>
      <p>{map.bossFeature}</p>
      <ul className={styles.bulletList}>
        {map.bossMechanicTexts.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
      <p className={ps.note}>普通怪：{map.normalMonsters.map((monster) => monster.name).join('、')}。本版不提供回低圖刷資源。</p>
    </Sheet>
  );
}

/** 資源詳情：完整數值與來源說明（數字縮寫的完整值入口）。 */
export function ResourceSheet({ resource, onClose }: { resource: 'gold' | 'relic' | 'level'; onClose: () => void }) {
  const catalog = useCatalog();
  const host = useHost();
  const { state } = useGame();
  const { dispatch } = useUi();
  const combat = resource === 'level' ? host.getHeroSnapshot('farm')?.stats : undefined;
  const job = catalog.jobs.get(state.player.currentJobId);
  const content = {
    gold: {
      title: '金幣',
      value: formatFull(state.wallet.gold),
      lines: ['只有出售不用的裝備才會取得金幣。', '擊殺、過關、BOSS、轉職都不給金幣。', '本版金幣只用於升級遺物鑑定台。'],
    },
    relic: {
      title: '未鑑定古物',
      value: formatFull(state.wallet.relics),
      lines: ['持續清怪會累積古物；清怪越快，古物越多。', '每次鑑定消耗 1 件古物，取得角色經驗與 1 件裝備。', '打怪與推圖本身不給經驗或金幣。'],
    },
    level: {
      title: `${job?.name ?? ''} Lv${state.player.level}`,
      value: `${formatFull(state.player.xp)} / ${formatFull(nextLevelXp(catalog, state.player.level))} 經驗`,
      lines: ['角色經驗只能透過鑑定古物取得。', '角色沒有 HP 與 MP，不會被擊倒。', `Lv${firstJobUnlockLevel(catalog)} 可在角色頁「職業」分頁解鎖一轉。`],
    },
  }[resource];
  return (
    <Sheet
      title={content.title}
      onClose={onClose}
      compact
      testId="resource-sheet"
      footer={
        resource === 'level' ? (
          <ActionButton
            label="查看完整屬性"
            onClick={() => {
              dispatch({ type: 'setTab', tab: 'character' });
              dispatch({ type: 'setCharacterTab', tab: 'stats' });
              onClose();
            }}
          />
        ) : undefined
      }
    >
      <p className={styles.bigValue + ' numeric'}>{content.value}</p>
      {combat ? (
        <dl className={styles.costList}>
          <div>
            <dt>攻擊力 A（清怪配置）</dt>
            <dd className="numeric">{formatAttack(combat.attack)}</dd>
          </div>
          <div>
            <dt>普攻間隔</dt>
            <dd className="numeric">{(combat.basicIntervalMs / 1000).toFixed(2)} 秒</dd>
          </div>
          <div>
            <dt>暴擊率／倍率</dt>
            <dd className="numeric">
              {formatBp(combat.critRateBp)}／×{(combat.critMultBp / 10000).toFixed(2)}
            </dd>
          </div>
          <div>
            <dt>冷卻縮減</dt>
            <dd className="numeric">{formatBp(combat.cdrBp)}</dd>
          </div>
        </dl>
      ) : null}
      <ul className={styles.bulletList}>
        {content.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </Sheet>
  );
}
