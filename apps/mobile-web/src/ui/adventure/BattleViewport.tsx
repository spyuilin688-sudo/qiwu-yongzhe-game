import { UNIT_LABELS } from '@qiwu/content';
import type { BattleView, EnemyView } from '@qiwu/game-core';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useBattleView, useCatalog, useGame, useHostEvents } from '../../app/GameContext.tsx';
import { MapBackdrop, UnitArt, heroLookFor } from '../../art/index.ts';
import styles from './battle.module.css';
import { BossHud } from './battle/BossHud.tsx';
import { EnemyActor } from './battle/EnemyActor.tsx';
import { FloatLayer, floatTargetFromBook } from './battle/FloatLayer.tsx';
import { addFloatHits, pruneFloats, type FloatHit, type FloatText } from './battle/floats.ts';
import { HeroActor, type CompanionView, type HeroBeat } from './battle/HeroActor.tsx';
import { CENTER_SLOT, FLOAT_LIFETIME_MS, SKILL_POP_MS, STAGE_GEOMETRY_STYLE, enemySlotX, type EnemySlot } from './battle/layout.ts';
import { UNIT_BOOK_KEY, allocateSlots, assignEnemySlots, emptySlotBook, unitSlotRules, type SlotBook } from './battle/slots.ts';
import { SummonDock, useSummonDockVisible } from './battle/SummonDock.tsx';
import { secondsLeft } from './battle/tags.ts';
import { useStageSize } from './battle/useStageSize.ts';

/**
 * 模擬每 50ms 一刻、戰場畫面約每 100ms 依快照重繪；背景圖與戰況無關（只依地圖與區域），
 * 以 memo 包裝讓 React 跳過未變動的 SVG 樹。
 */
const BackdropArt = memo(MapBackdrop);
const ZonePortrait = memo(UnitArt);

/** 每張地圖 6 個小區、每區 5 關；第 6 區（26～30 關）為 BOSS 王庭。 */
const STAGES_PER_ZONE = 5;
const COMPANION_RULES = unitSlotRules<CompanionView>();
const NO_BEAT: HeroBeat = { key: 0, skillName: null, skillKey: 0 };

function zoneIndexOf(localStage: number): number {
  return Math.floor((localStage - 1) / STAGES_PER_ZONE);
}

/** 依事件決定角色本輪是否出手、放了哪個技能；普攻不會清掉還在顯示的技能名稱。 */
function nextBeat(current: HeroBeat, castSkillName: string | null | undefined): HeroBeat {
  const key = current.key + 1;
  if (castSkillName === undefined) return { ...current, key };
  return { key, skillName: castSkillName, skillKey: key };
}

/**
 * 戰場（規格 07）。結構：
 *  .viewport（data-mode／data-compact）
 *    .fieldTop      BOSS 資訊列或末區提示，在文件流裡，不蓋住舞台；
 *    .stage         舞台（實際寬高由 useStageSize 寫入 --stage-w／--stage-h）：背景、角色、敵人、區域、飄字；
 *    SummonDock     BOSS 關的召喚台（下緣操作列），召喚鍵靠右。
 * 介面只讀戰況快照與事件來顯示，不改任何金幣、裝備或戰鬥結算。
 */
export function BattleViewport() {
  const view = useBattleView();
  const catalog = useCatalog();
  const { state } = useGame();
  const [floats, setFloats] = useState<readonly FloatText[]>([]);
  const [beat, setBeat] = useState<HeroBeat>(NO_BEAT);
  const nextFloatId = useRef(1);
  const stageRef = useRef<HTMLDivElement>(null);
  useStageSize(stageRef);
  // 站位簿只依快照推導、結果穩定（同一波內不換位），重複計算得到相同結果，所以可以在繪製時更新。
  const enemyBook = useRef<SlotBook<EnemyView>>(emptySlotBook());
  const unitBook = useRef<SlotBook<CompanionView>>(emptySlotBook(UNIT_BOOK_KEY));
  enemyBook.current = assignEnemySlots(enemyBook.current, view);
  const companions = view?.hero.units.filter((unit) => unit.kind !== 'zone') ?? [];
  unitBook.current = allocateSlots(unitBook.current, UNIT_BOOK_KEY, companions, COMPANION_RULES);

  // 定時清除已過期的飄字：波次之間沒有新命中時也不會殘留（減少動態效果時飄字不會自行淡出）。
  useEffect(() => {
    const timer = setInterval(() => setFloats((previous) => pruneFloats(previous, performance.now())), FLOAT_LIFETIME_MS / 2);
    return () => clearInterval(timer);
  }, []);

  // 技能名稱是資訊不是動畫：減少動態效果時照樣顯示，到時由這裡移除（動畫開啟時 CSS 也會先淡出）。
  useEffect(() => {
    if (!beat.skillName) return undefined;
    const skillKey = beat.skillKey;
    const timer = setTimeout(() => setBeat((current) => (current.skillKey === skillKey ? { ...current, skillName: null } : current)), SKILL_POP_MS);
    return () => clearTimeout(timer);
  }, [beat.skillName, beat.skillKey]);

  useHostEvents((events) => {
    const now = performance.now();
    const hits: FloatHit[] = [];
    let acted = false;
    let castSkillName: string | null | undefined;
    for (const entry of events) {
      if (entry.type !== 'battle') continue;
      const event = entry.event;
      if (event.type === 'hit') hits.push({ uid: event.targetUid, amount: event.amount, crit: event.crit, source: event.source });
      else if (event.type === 'skillCast') {
        acted = true;
        castSkillName = catalog.skills.get(event.skillId)?.name ?? null;
      } else if (event.type === 'basicAttack') acted = true;
    }
    if (hits.length > 0) {
      setFloats((previous) => addFloatHits(previous, hits, now, (uid) => floatTargetFromBook(enemyBook.current, uid), () => nextFloatId.current++));
    }
    if (acted) setBeat((current) => nextBeat(current, castSkillName));
  });

  const jobId = state.player.currentJobId;
  const heroLook = useMemo(() => heroLookFor(catalog, jobId), [catalog, jobId]);
  const mode = state.progress.mode;
  const showSummon = useSummonDockVisible();
  const boss = view?.boss ?? null;
  const top = boss ? 'boss' : mode === 'ENDGAME_FARM' ? 'endgame' : null;
  const compact = top !== null || showSummon;
  const zones = view?.hero.units.filter((unit) => unit.kind === 'zone') ?? [];
  const companionSlots = companions.map((unit) => ({ unit, slot: unitBook.current.records.get(unit.uid)?.slot ?? 0 }));

  return (
    <div className={styles.viewport} data-testid="battle-viewport" data-mode={mode} data-summon={showSummon} data-compact={compact} data-top={top ?? undefined}>
      {top ? (
        <div className={styles.fieldTop}>
          {boss ? <BossHud boss={boss} body={bossBodyOf(view)} /> : <p className={styles.hint}>已完成本版全部 {catalog.mapCount} 張地圖，持續在末區刷怪。</p>}
        </div>
      ) : null}

      <div ref={stageRef} className={styles.stage} style={STAGE_GEOMETRY_STYLE}>
        <div className={styles.backdrop} aria-hidden="true">
          <BackdropArt mapNumber={state.progress.mapNumber} zoneIndex={zoneIndexOf(state.progress.localStage)} fit="width" />
        </div>

        {zones.map((zone) => (
          <div
            key={zone.uid}
            className={styles.zone}
            style={{ left: `${enemySlotX(CENTER_SLOT)}%` }}
            role="img"
            aria-label={`${UNIT_LABELS.zone} 剩 ${secondsLeft(zone.remainingMs)} 秒`}
          >
            <ZonePortrait kind="zone" />
          </div>
        ))}

        <HeroActor look={heroLook} beat={beat} hero={view?.hero ?? null} companions={companionSlots} />

        {view?.enemies.map((enemy) => (
          <EnemyActor
            key={enemy.uid}
            enemy={enemy}
            slot={(enemyBook.current.records.get(enemy.uid)?.slot ?? CENTER_SLOT) as EnemySlot}
            isBossBody={enemy.uid === boss?.bodyUid}
            mapNumber={state.progress.mapNumber}
          />
        ))}

        <FloatLayer floats={floats} book={enemyBook.current} />

        {view && view.enemies.length === 0 && !boss ? (
          <p className={styles.waiting}>
            <span className={styles.waitingPill}>
              下一波即將出現
              <span className={styles.waitingDots} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </span>
          </p>
        ) : null}
      </div>

      {showSummon ? <SummonDock /> : null}
    </div>
  );
}

function bossBodyOf(view: BattleView | null): EnemyView | null {
  if (!view?.boss) return null;
  const bodyUid = view.boss.bodyUid;
  return view.enemies.find((enemy) => enemy.uid === bodyUid) ?? null;
}
