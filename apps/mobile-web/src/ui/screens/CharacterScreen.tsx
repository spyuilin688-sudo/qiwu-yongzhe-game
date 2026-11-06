import { SLOT_IDS, STAT_KEYS, slotsAvailableForJob, type QualityId, type SlotId } from '@qiwu/content';
import {
  assertCanSwitchJob,
  assertCanUnlockJob,
  assertNotInBossFight,
  availabilityOf,
  readLoadout,
  sellBlockReason,
  sellPriceOf,
} from '@qiwu/game-core';
import { useMemo, useState } from 'react';
import { useCatalog, useGame, useHost, useSend } from '../../app/GameContext.tsx';
import { useOpenSheet, useToast, useUi, type CharacterTab } from '../../app/uiStore.tsx';
import { useEffectiveLoadoutView } from '../adventure/SkillBar.tsx';
import { ActionButton, Chip, QualityBadge, Segmented, primitiveStyles as ps } from '../components/primitives.tsx';
import { formatAttack, formatBp, formatFull, formatStatValue, statLabel } from '../format/format.ts';
import { baseOf, firstJobUnlockLevel, ownedItemsSorted, qualityName, referencingLoadoutLabels, slotLabel } from '../format/viewModels.ts';
import styles from './screens.module.css';
import { EquipIcon, HeroArt, SlotIcon, heroLookFor } from '../../art/index.ts';

/** 職業樹節點的角色小圖寬度（viewBox 64×80）。 */
const JOB_PORTRAIT_WIDTH = 38;
/** 裝備列表的裝備圖示與空部位圖示寬度。 */
const EQUIP_ROW_ICON = 32;
const EQUIP_ROW_SLOT_ICON = 20;

const TABS: readonly { value: CharacterTab; label: string }[] = [
  { value: 'equipment', label: '裝備' },
  { value: 'bag', label: '背包' },
  { value: 'job', label: '職業' },
  { value: 'stats', label: '屬性' },
];

export function CharacterScreen() {
  const { state: ui, dispatch } = useUi();
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>角色</h1>
      </div>
      <div className={styles.tabBar}>
        <Segmented label="角色分頁" options={TABS} value={ui.characterTab} onChange={(tab) => dispatch({ type: 'setCharacterTab', tab })} />
      </div>
      <div className={styles.pageBody}>
        {ui.characterTab === 'equipment' ? <EquipmentTab /> : null}
        {ui.characterTab === 'bag' ? <BagTab /> : null}
        {ui.characterTab === 'job' ? <JobTab /> : null}
        {ui.characterTab === 'stats' ? <StatsTab /> : null}
      </div>
    </div>
  );
}

function LoadoutViewSwitch() {
  const { dispatch } = useUi();
  const { view, frozen } = useEffectiveLoadoutView();
  return (
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
  );
}

function EquipmentTab() {
  const catalog = useCatalog();
  const { state, pendingCount } = useGame();
  const send = useSend();
  const toast = useToast();
  const openSheet = useOpenSheet();
  const { dispatch } = useUi();
  const { view } = useEffectiveLoadoutView();
  const jobId = state.player.currentJobId;
  const loadout = readLoadout(state, catalog, jobId, view);
  const available = new Set(slotsAvailableForJob(catalog, jobId));
  const bossLock = availabilityOf(() => assertNotInBossFight(state));
  const other = view === 'farm' ? 'boss' : 'farm';
  return (
    <>
      <LoadoutViewSwitch />
      <ul className={styles.list}>
        {SLOT_IDS.map((slot) => {
          const itemId = loadout.items[slot];
          const item = itemId ? state.items[itemId] : undefined;
          return (
            <li key={slot}>
              <button type="button" className={styles.listButton} onClick={() => openSheet({ kind: 'slot', slot })}>
                <span className={styles.slotName}>{slotLabel(slot)}</span>
                <span className={[styles.rowArt, `q-${item?.qualityId ?? 'Q1'}`, item ? styles.equipArtFilled : styles.equipArtEmpty].join(' ')} aria-hidden="true">
                  {item ? <EquipIcon baseId={item.baseId} typeName={baseOf(catalog, item).typeName} slot={slot} size={EQUIP_ROW_ICON} /> : <SlotIcon slot={slot} size={EQUIP_ROW_SLOT_ICON} />}
                </span>
                <span className={ps.rowMain}>
                  {item ? (
                    <>
                      <span className={ps.rowTitle}>
                        <QualityBadge catalog={catalog} qualityId={item.qualityId} /> {baseOf(catalog, item).name}
                      </span>
                      <span className={ps.rowSub}>
                        Lv{item.level}・{statLabel(item.mainStat.stat)} {formatStatValue(item.mainStat.stat, item.mainStat.value)}
                        {item.affixes.map((affix) => `・${statLabel(affix.stat)} ${formatStatValue(affix.stat, affix.value)}`).join('')}
                      </span>
                    </>
                  ) : (
                    <span className={ps.rowSub}>{available.has(slot) ? '未穿戴' : `Lv${firstJobUnlockLevel(catalog)} 完成一轉後開放`}</span>
                  )}
                </span>
                <span aria-hidden="true">›</span>
              </button>
            </li>
          );
        })}
      </ul>
      <ActionButton
        label={`複製到${other === 'boss' ? '打王' : '清怪'}配置`}
        subLabel={bossLock.enabled ? '另一套配置會被覆蓋' : 'BOSS 中停用'}
        block
        disabled={!bossLock.enabled || pendingCount > 0}
        onClick={() =>
          dispatch({
            type: 'openConfirm',
            confirm: {
              title: `複製到${other === 'boss' ? '打王' : '清怪'}配置？`,
              message: '裝備、技能順序與條件會複製過去；目前顯示的配置不變。',
              confirmLabel: '複製',
              tone: 'primary',
              onConfirm: async () => {
                const response = await send({ type: 'copyLoadout', payload: { from: view, to: other } });
                if (response.status === 'succeeded') toast('已複製配置', 'success');
              },
            },
          })
        }
      />
    </>
  );
}

function BagTab() {
  const catalog = useCatalog();
  const { state, pendingCount } = useGame();
  const send = useSend();
  const toast = useToast();
  const openSheet = useOpenSheet();
  const { dispatch } = useUi();
  const [slotFilter, setSlotFilter] = useState<SlotId | 'all'>('all');
  const [qualityFilter, setQualityFilter] = useState<QualityId | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const bossLock = availabilityOf(() => assertNotInBossFight(state));

  const items = useMemo(
    () =>
      ownedItemsSorted(state, catalog).filter((item) => {
        if (slotFilter !== 'all' && item.slot !== slotFilter) return false;
        if (qualityFilter !== 'all' && item.qualityId !== qualityFilter) return false;
        if (query && !baseOf(catalog, item).name.includes(query.trim())) return false;
        return true;
      }),
    [state, catalog, slotFilter, qualityFilter, query],
  );
  const validSelected = [...selected].filter((id) => state.items[id]);
  const total = validSelected.reduce((sum, id) => sum + sellPriceOf({ catalog }, state.items[id]!), 0);
  const blocked = validSelected.filter((id) => sellBlockReason(state, id) !== null);

  const maxBatch = catalog.tuning.economy.maxSellBatch;
  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      // 一次出售上限（API itemIds 1～50）：選滿後不能再加，避免確認文字與實際出售件數不一致。
      else if (next.size < maxBatch) next.add(id);
      return next;
    });

  const sellSelected = () =>
    dispatch({
      type: 'openConfirm',
      confirm: {
        title: `出售 ${validSelected.length} 件裝備？`,
        message: `共可取得 ${formatFull(total)} 金幣。出售前會逐件重新驗證；任一件不能出售時整筆不執行。`,
        confirmLabel: `出售 +${formatFull(total)}`,
        tone: 'danger',
        onConfirm: async () => {
          const response = await send({ type: 'sellItems', payload: { itemIds: validSelected, origin: 'manual' } });
          if (response.status === 'succeeded') {
            const result = response.result as { goldGained: number; soldItemIds: string[] };
            toast(`已出售 ${result.soldItemIds.length} 件，+${formatFull(result.goldGained)} 金幣`, 'success');
            setSelected(new Set());
            setSelecting(false);
          }
        },
      },
    });

  const sellableQuick = ownedItemsSorted(state, catalog).filter(
    (item) => item.qualityId === catalog.qualityOrder[0] && sellBlockReason(state, item.id) === null,
  );

  return (
    <>
      <div className={styles.bagHeader}>
        <span className="numeric">
          背包 {Object.keys(state.items).length}/{catalog.globals.backpackCapacity}
        </span>
        <ActionButton
          label={selecting ? '取消選取' : '選取'}
          onClick={() => {
            setSelecting(!selecting);
            setSelected(new Set());
          }}
          data-testid="bag-select"
        />
      </div>
      <input className={styles.search} type="search" placeholder="搜尋裝備名稱" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="搜尋裝備名稱" />
      <div className={styles.filterRow} role="group" aria-label="部位篩選">
        <Chip label="全部部位" on={slotFilter === 'all'} onClick={() => setSlotFilter('all')} />
        {SLOT_IDS.map((slot) => (
          <Chip key={slot} label={slotLabel(slot, true)} on={slotFilter === slot} onClick={() => setSlotFilter(slot)} />
        ))}
      </div>
      <div className={styles.filterRow} role="group" aria-label="品質篩選">
        <Chip label="全部品質" on={qualityFilter === 'all'} onClick={() => setQualityFilter('all')} />
        {catalog.qualityOrder.map((id) => (
          <Chip key={id} label={qualityName(catalog, id)} on={qualityFilter === id} onClick={() => setQualityFilter(id)} />
        ))}
      </div>
      {selecting && sellableQuick.length > 0 ? (
        <ActionButton label={`選取全部可售普通裝備（${Math.min(sellableQuick.length, catalog.tuning.economy.maxSellBatch)}）`} block onClick={() => setSelected(new Set(sellableQuick.slice(0, catalog.tuning.economy.maxSellBatch).map((item) => item.id)))} />
      ) : null}
      {items.length === 0 ? <p className={ps.empty}>{Object.keys(state.items).length === 0 ? '尚未取得裝備；在冒險頁鑑定古物即可獲得。' : '沒有符合篩選的裝備。'}</p> : null}
      <div className={styles.itemGrid} role="list">
        {items.map((item) => {
          const refs = referencingLoadoutLabels(state, catalog, item.id);
          const isSelected = selected.has(item.id);
          return (
            <div key={item.id} role="listitem" className={styles.itemCell}>
            <button
              type="button"
              className={[styles.itemCard, `q-${item.qualityId}`, isSelected && styles.itemSelected].filter(Boolean).join(' ')}
              aria-pressed={selecting ? isSelected : undefined}
              onClick={() => (selecting ? toggle(item.id) : openSheet({ kind: 'itemDetail', itemId: item.id }))}
              aria-label={`${qualityName(catalog, item.qualityId)} ${baseOf(catalog, item).name} Lv${item.level}${refs.length ? '，使用中' : ''}${item.locked ? '，已鎖定' : ''}`}
            >
              <span className={styles.itemArt} aria-hidden="true">
                <EquipIcon baseId={item.baseId} typeName={baseOf(catalog, item).typeName} slot={item.slot} size={30} />
              </span>
              <span className={styles.itemSlot}>{slotLabel(item.slot, true)}</span>
              <span className={styles.itemQuality}>{qualityName(catalog, item.qualityId)}</span>
              <span className="numeric">Lv{item.level}</span>
              <span className={styles.itemMarks}>
                {refs.length ? <span title="配置使用中">穿</span> : null}
                {item.locked ? <span title="已鎖定">鎖</span> : null}
                {item.hasLegendEffect ? <span title="傳說特效">傳</span> : null}
              </span>
            </button>
            </div>
          );
        })}
      </div>
      {selecting ? (
        <div className={styles.selectionBar}>
          <span>
            已選 {validSelected.length}/{maxBatch} 件・+{formatFull(total)} 金幣
            {blocked.length > 0 ? `（${blocked.length} 件不能出售）` : ''}
          </span>
          <ActionButton
            label="出售"
            variant="danger"
            disabled={validSelected.length === 0 || blocked.length > 0 || !bossLock.enabled || pendingCount > 0}
            subLabel={blocked.length > 0 ? '含使用中／鎖定' : !bossLock.enabled ? 'BOSS 中停用' : undefined}
            onClick={sellSelected}
            data-testid="sell-selected"
          />
        </div>
      ) : null}
    </>
  );
}

function JobTab() {
  const catalog = useCatalog();
  const { state } = useGame();
  const openSheet = useOpenSheet();
  const current = catalog.jobs.get(state.player.currentJobId);
  const unlocked = new Set(state.player.unlockedJobIds);
  return (
    <>
      <div className={styles.card}>
        <div className={ps.rowTitle}>
          目前：{current?.tier ? `${current.tier}轉・` : ''}
          {current?.name}
        </div>
        <div className={ps.rowSub}>Lv{state.player.level}・達等級門檻即可解鎖；不需先過 BOSS、不重置等級、沒有費用。</div>
      </div>
      {catalog.families.map((family) => {
        const jobs = [...catalog.jobs.values()].filter((job) => job.familyId === family.id);
        const tier1 = jobs.find((job) => job.tier === 1);
        const tier2 = jobs.filter((job) => job.tier === 2);
        return (
          <section key={family.id} className={styles.family}>
            <h2 className={styles.familyTitle}>{family.name}</h2>
            {tier1 ? <JobNode jobId={tier1.id} unlocked={unlocked} onOpen={(id) => openSheet({ kind: 'jobSwitch', jobId: id })} /> : null}
            <div className={styles.branches}>
              {tier2.map((branch) => {
                const tier3 = jobs.find((job) => job.parentId === branch.id);
                return (
                  <div key={branch.id} className={styles.branch}>
                    <JobNode jobId={branch.id} unlocked={unlocked} onOpen={(id) => openSheet({ kind: 'jobSwitch', jobId: id })} />
                    {tier3 ? <JobNode jobId={tier3.id} unlocked={unlocked} onOpen={(id) => openSheet({ kind: 'jobSwitch', jobId: id })} /> : null}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}

/** 職業節點的可操作狀態與原因直接來自核心驗證器（assertCanUnlockJob／assertCanSwitchJob），不在介面另寫規則。 */
function JobNode({ jobId, unlocked, onOpen }: { jobId: string; unlocked: ReadonlySet<string>; onOpen: (jobId: string) => void }) {
  const catalog = useCatalog();
  const { state } = useGame();
  const job = catalog.jobs.get(jobId)!;
  const isCurrent = state.player.currentJobId === jobId;
  const isUnlocked = unlocked.has(jobId);
  const availability = isUnlocked
    ? availabilityOf(() => assertCanSwitchJob(state, { catalog }, jobId))
    : availabilityOf(() => assertCanUnlockJob(state, { catalog }, jobId));
  let status: string;
  if (isCurrent) status = '目前職業';
  else if (availability.enabled) status = isUnlocked ? '已解鎖・可切換' : '可解鎖';
  else if (availability.code === 'JOB_NOT_IMPLEMENTED') status = '原型尚未實作';
  else if (availability.code === 'BOSS_LOCKED') status = 'BOSS 中停用';
  else status = availability.reason ?? '暫不可用';
  const skills = job.ownSkillIds.map((id) => catalog.skills.get(id)?.name ?? id).join('、');
  return (
    <button
      type="button"
      className={[styles.jobNode, isCurrent && styles.jobCurrent, !job.playable && styles.jobUnavailable].filter(Boolean).join(' ')}
      onClick={() => onOpen(jobId)}
      disabled={isCurrent || !availability.enabled}
      data-job={jobId}
    >
      <span className={styles.jobArt} aria-hidden="true">
        <HeroArt {...heroLookFor(catalog, jobId)} size={JOB_PORTRAIT_WIDTH} />
      </span>
      <span className={styles.jobText}>
        <span className={ps.rowTitle}>
          {job.tier}轉・{job.name}
        </span>
        <span className={ps.rowSub}>{skills}</span>
        <span className={styles.jobStatus}>{status}</span>
      </span>
    </button>
  );
}

function StatsTab() {
  const catalog = useCatalog();
  const host = useHost();
  useGame();
  const { view } = useEffectiveLoadoutView();
  const [open, setOpen] = useState<string | null>(null);
  const snapshot = host.getHeroSnapshot(view);
  if (!snapshot) return null;
  const { breakdown } = snapshot;
  const combat = breakdown.combat;
  return (
    <>
      <LoadoutViewSwitch />
      <dl className={styles.statSummary}>
        <div>
          <dt>最終攻擊 A</dt>
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
      <p className={ps.note}>
        A = (角色基礎攻擊 {breakdown.baseAttack} + 主武／副手固定攻擊 {breakdown.flatAttack}) × (1 + 攻擊加成)。角色沒有 HP／MP 欄位。
      </p>
      <ul className={styles.list}>
        {STAT_KEYS.map((stat) => {
          const line = breakdown.lines[stat];
          if (line.total === 0 && line.sources.length === 0) return null;
          return (
            <li key={stat}>
              <button type="button" className={styles.listButton} aria-expanded={open === stat} onClick={() => setOpen(open === stat ? null : stat)}>
                <span className={ps.rowMain}>
                  <span className={ps.rowTitle}>{statLabel(stat)}</span>
                  {open === stat ? (
                    <span className={ps.rowSub}>
                      {line.sources.map((source) => `${source.label} ${formatStatValue(stat, source.value)}`).join('；')}
                      {line.cap !== null ? `；上限 ${formatStatValue(stat, line.cap, false)}` : ''}
                    </span>
                  ) : null}
                </span>
                <span className="numeric">
                  {formatStatValue(stat, line.effective)}
                  {line.overflow > 0 ? `（溢出 ${formatStatValue(stat, line.overflow, false)}）` : ''}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className={ps.note}>點屬性可展開來源；達上限的多餘值標示溢出，不會換成其他收益。{catalog.tuning.status === 'N' ? '數值為原型 N。' : ''}</p>
    </>
  );
}
