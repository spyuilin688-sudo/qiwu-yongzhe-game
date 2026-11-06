import { SLOT_IDS, STAT_LABELS, type SlotId } from '@qiwu/content';
import { useState } from 'react';
import { useCatalog, useGame } from '../../app/GameContext.tsx';
import { Chip, Segmented, primitiveStyles as ps } from '../components/primitives.tsx';
import { eliteStageNumbers, slotLabel } from '../format/viewModels.ts';
import styles from './screens.module.css';
import { EquipIcon, MapBackdrop, MonsterArt } from '../../art/index.ts';

type CodexTab = 'maps' | 'monsters' | 'equipment';

/** 圖鑑：地圖、怪物、裝備三分頁；只顯示進度與已發現狀態，不額外給金幣或能力。 */
export function CodexScreen() {
  const [tab, setTab] = useState<CodexTab>('maps');
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>圖鑑</h1>
      </div>
      <div className={styles.tabBar}>
        <Segmented<CodexTab>
          label="圖鑑分頁"
          options={[
            { value: 'maps', label: '地圖' },
            { value: 'monsters', label: '怪物' },
            { value: 'equipment', label: '裝備' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      <div className={styles.pageBody}>
        {tab === 'maps' ? <MapsTab /> : null}
        {tab === 'monsters' ? <MonstersTab /> : null}
        {tab === 'equipment' ? <EquipmentCodexTab /> : null}
      </div>
    </div>
  );
}

function MapsTab() {
  const catalog = useCatalog();
  const { state } = useGame();
  const [open, setOpen] = useState<number | null>(state.progress.mapNumber);
  return (
    <ul className={styles.list}>
      {[...catalog.maps.values()].map((map) => {
        const cleared = state.progress.highestClearedMap >= map.number;
        const current = state.progress.mapNumber === map.number;
        const reachable = map.number <= state.progress.highestClearedMap + 1;
        return (
          <li key={map.id}>
            <button type="button" className={styles.listButton} aria-expanded={open === map.number} onClick={() => setOpen(open === map.number ? null : map.number)}>
              <span className={ps.rowMain}>
                <span className={ps.rowTitle}>
                  {String(map.number).padStart(2, '0')} {map.name}
                </span>
                <span className={ps.rowSub}>
                  {current ? `目前・第 ${state.progress.localStage} 關` : cleared ? '已通過' : reachable ? '可前往' : '尚未開放'}・BOSS {map.boss.name}
                </span>
              </span>
              <span aria-hidden="true">{open === map.number ? '−' : '+'}</span>
            </button>
            {open === map.number ? (
              <div className={styles.expand}>
                <div className={[styles.mapThumb, !reachable && styles.silhouette].filter(Boolean).join(' ')} aria-hidden="true">
                  <MapBackdrop mapNumber={map.number} />
                </div>
                <p className={ps.note}>小區：{map.zones.map((zone) => zone.name).join('、')}</p>
                <p className={ps.note}>
                  小首領：
                  {map.elites
                    .map((elite, index) => {
                      const local = eliteStageNumbers(catalog, map.number)[index] ?? 1;
                      return `${elite.name}（${catalog.stages.get(map.stageIds[local - 1] ?? '')?.eliteTemplate?.label ?? ''}）`;
                    })
                    .join('、')}
                </p>
                <p className={ps.note}>BOSS 特色：{map.bossFeature}</p>
                <ul className={styles.compactList}>
                  {map.bossMechanicTexts.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
                <p className={ps.note}>只供查看；本版不提供傳送或回低圖刷資源。</p>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function MonstersTab() {
  const catalog = useCatalog();
  const { state } = useGame();
  const [mapNumber, setMapNumber] = useState(state.progress.mapNumber);
  const map = catalog.maps.get(mapNumber)!;
  const discovered = new Set(state.discovered.monsterIds);
  const bossSeen = state.boss.history.some((attempt) => attempt.mapNumber === mapNumber) || state.boss.active?.mapNumber === mapNumber;
  const groups = [
    { label: '普通怪', monsters: map.normalMonsters },
    { label: '小首領', monsters: map.elites },
  ];
  return (
    <>
      <div className={styles.filterRow} role="group" aria-label="地圖篩選">
        {[...catalog.maps.values()].map((entry) => (
          <Chip key={entry.id} label={String(entry.number).padStart(2, '0')} on={entry.number === mapNumber} onClick={() => setMapNumber(entry.number)} />
        ))}
      </div>
      <h2 className={ps.sectionTitle}>{map.name}</h2>
      {groups.map((group) => (
        <section key={group.label}>
          <h3 className={styles.familyTitle}>{group.label}</h3>
          <ul className={styles.list}>
            {group.monsters.map((monster, index) => {
              const seen = discovered.has(monster.id);
              return (
                <li key={monster.id} className={ps.listRow}>
                  <span className={[styles.rowArt, !seen && styles.silhouette].filter(Boolean).join(' ')} aria-hidden="true">
                    <MonsterArt monsterId={monster.id} size={group.label === '小首領' ? 52 : 44} />
                  </span>
                  <span className={ps.rowMain}>
                    <span className={ps.rowTitle}>{seen ? monster.name : '？？？'}</span>
                    <span className={ps.rowSub}>
                      {seen ? '已發現' : '尚未發現'}
                      {group.label === '小首領' ? `・第 ${eliteStageNumbers(catalog, mapNumber)[index] ?? '—'} 關・${catalog.stages.get(map.stageIds[(eliteStageNumbers(catalog, mapNumber)[index] ?? 1) - 1] ?? '')?.eliteTemplate?.summary ?? ''}` : ''}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <h3 className={styles.familyTitle}>地圖 BOSS</h3>
      <div className={ps.listRow}>
        <span className={[styles.rowArt, !bossSeen && styles.silhouette].filter(Boolean).join(' ')} aria-hidden="true">
          <MonsterArt monsterId={map.boss.id} size={72} />
        </span>
        <span className={ps.rowMain}>
          <span className={ps.rowTitle}>{bossSeen ? map.boss.name : '？？？'}</span>
          <span className={ps.rowSub}>{bossSeen ? map.bossFeature : '召喚挑戰後記錄'}</span>
        </span>
      </div>
      <p className={ps.note}>圖鑑不提供額外能力加成或領取金幣。</p>
    </>
  );
}

function EquipmentCodexTab() {
  const catalog = useCatalog();
  const { state } = useGame();
  const [slot, setSlot] = useState<SlotId | 'all'>('all');
  const [family, setFamily] = useState<string>('all');
  const discovered = new Set(state.discovered.baseIds);
  const families = ['共用', ...catalog.families.map((entry) => entry.name)];
  const bases = catalog.equipmentOrder
    .map((id) => catalog.equipment.get(id)!)
    .filter((base) => (slot === 'all' || base.slot === slot) && (family === 'all' || base.familyName === family));
  return (
    <>
      <div className={styles.filterRow} role="group" aria-label="部位篩選">
        <Chip label="全部" on={slot === 'all'} onClick={() => setSlot('all')} />
        {SLOT_IDS.map((entry) => (
          <Chip key={entry} label={slotLabel(entry, true)} on={slot === entry} onClick={() => setSlot(entry)} />
        ))}
      </div>
      <div className={styles.filterRow} role="group" aria-label="職業篩選">
        <Chip label="全部職業" on={family === 'all'} onClick={() => setFamily('all')} />
        {families.map((name) => (
          <Chip key={name} label={name} on={family === name} onClick={() => setFamily(name)} />
        ))}
      </div>
      <p className={ps.note}>
        共 {bases.length} 件基底・已取得 {bases.filter((base) => discovered.has(base.id)).length} 件。品質（普通～傳說）不是職業階級；圖鑑預覽不代表實際擁有。
      </p>
      <ul className={styles.list}>
        {bases.map((base) => (
          <li key={base.id} className={ps.listRow}>
            <span className={[styles.rowArt, !discovered.has(base.id) && styles.silhouette].filter(Boolean).join(' ')} aria-hidden="true">
              <EquipIcon baseId={base.id} typeName={base.typeName} slot={base.slot} size={40} />
            </span>
            <span className={ps.rowMain}>
              <span className={ps.rowTitle}>
                {base.name}
                {discovered.has(base.id) ? '' : '（尚未取得）'}
              </span>
              <span className={ps.rowSub}>
                {slotLabel(base.slot)}・{base.ownerName === '共用' ? '全職業' : base.ownerName}・最低 Lv{base.minLevel}・主屬性 {STAT_LABELS[base.mainStat]}（{base.mainStatFormula}）
              </span>
              <span className={ps.rowSub}>
                傳說：{base.legendText}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
