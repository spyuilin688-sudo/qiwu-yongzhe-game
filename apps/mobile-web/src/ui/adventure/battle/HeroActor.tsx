import { RESOURCE_LABELS, SUIT_NAMES, UNIT_LABELS, type ResourceId, type UnitKind } from '@qiwu/content';
import type { BattleView } from '@qiwu/game-core';
import { memo } from 'react';
import { HeroArt, UnitArt, type HeroLook } from '../../../art/index.ts';
import styles from '../battle.module.css';
import { buffTagText, limitTags, secondsLeft } from './tags.ts';

/** 角色向量圖只依職業外觀決定：memo ＋ 穩定外層，整場戰鬥只建立一次 SVG（漸層 id 不會一直換）。 */
const HeroPortrait = memo(HeroArt);
const UnitPortrait = memo(UnitArt);

/** 花色符號只是輔助：畫面顯示「下一張」＋符號，螢幕閱讀器讀隱藏文字中的完整花色名。 */
const SUIT_GLYPHS = ['♥', '♦', '♣', '♠'] as const;
/** 腳下增益只排一行：顯示 1 個，其餘以「+N」表示（完整清單在無障礙名稱裡）。 */
const MAX_VISIBLE_BUFFS = 1;

type HeroView = BattleView['hero'];
export type CompanionView = HeroView['units'][number];

export interface HeroBeat {
  /** 每次出手加 1；奇偶交替切換動畫名稱來重播動作，不必重掛 DOM。 */
  readonly key: number;
  /** 正在顯示的技能名稱；普攻不會清掉它，到時由 BattleViewport 移除。 */
  readonly skillName: string | null;
  /** 放出該技能時的 key：只有新技能才重掛名稱標籤（重播淡入動畫）。 */
  readonly skillKey: number;
}

/**
 * 角色（沒有血條或魔條，C-02）。結構給動作演出接手：
 *  .hero          以腳底錨定在地面線，寬度＝角色精靈寬；
 *  .heroActor     穩定的動畫掛點（data-beat 0／1 交替重播出手動作，data-act 表示出手過）；
 *  .heroBody      立繪本體（影子中心對齊地面線）；
 *  .skillPop      技能名稱，永遠在頭頂上方；
 *  .heroTags      資源與增益掛在腳下，不把身體往上推；
 *  .units／.unit  召喚物依 data-slot 站前排（0、1）或身後（2、3），.unitBody 是牠們的動畫掛點。
 */
export function HeroActor({
  look,
  beat,
  hero,
  companions,
}: {
  readonly look: HeroLook;
  readonly beat: HeroBeat;
  readonly hero: HeroView | null;
  readonly companions: readonly { readonly unit: CompanionView; readonly slot: number }[];
}) {
  return (
    <div className={styles.hero} role="group" aria-label="角色">
      <div className={styles.heroActor} data-act={beat.key > 0 ? 'true' : undefined} data-beat={beat.key % 2}>
        <div className={styles.heroBody}>
          <HeroPortrait {...look} />
        </div>
      </div>
      {beat.skillName ? (
        <span key={`skill-${beat.skillKey}`} className={styles.skillPop}>
          {beat.skillName}
        </span>
      ) : null}
      {hero ? <HeroTags hero={hero} /> : null}
      {companions.length > 0 ? (
        <div className={styles.units} role="group" aria-label="召喚物">
          {companions.map(({ unit, slot }) => (
            <Companion key={unit.uid} unit={unit} slot={slot} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function HeroTags({ hero }: { readonly hero: HeroView }) {
  const resources = Object.entries(hero.resources) as [ResourceId, number][];
  const buffs = limitTags(hero.buffs, MAX_VISIBLE_BUFFS);
  if (resources.length === 0 && !hero.cards && hero.buffs.length === 0) return null;
  return (
    <div className={styles.heroTags}>
      {resources.length > 0 || hero.cards ? (
        <div className={styles.resourcePips} role="group" aria-label="角色資源">
          {resources.map(([id, value]) => (
            <span key={id}>
              {RESOURCE_LABELS[id]} {value}
            </span>
          ))}
          {hero.cards ? (
            <span className={styles.nextSuit}>
              下一張
              <span aria-hidden="true" data-suit={hero.cards.nextSuit}>
                {SUIT_GLYPHS[hero.cards.nextSuit]}
              </span>
              <span className="visually-hidden">
                {SUIT_NAMES[hero.cards.nextSuit]}
                {hero.cards.setPending ? '（已切牌）' : ''}
              </span>
            </span>
          ) : null}
        </div>
      ) : null}
      {hero.buffs.length > 0 ? (
        // 只呈現增益名稱與剩餘時間或層數；不做成條狀，避免被看成血條或魔條。
        <div className={styles.buffRow} role="group" aria-label={`角色增益：${hero.buffs.map(buffTagText).join('、')}`}>
          {buffs.shown.map((buff) => (
            <span key={buff.buffId} className={styles.buff} aria-hidden="true">
              {buffTagText(buff)}
            </span>
          ))}
          {buffs.hiddenCount > 0 ? (
            <span className={`${styles.buff} numeric`} aria-hidden="true">
              +{buffs.hiddenCount}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function companionLabel(unit: CompanionView): string {
  return unit.permanent ? `${UNIT_LABELS[unit.kind]}（常駐）` : `${UNIT_LABELS[unit.kind]} 剩 ${secondsLeft(unit.remainingMs)} 秒`;
}

function Companion({ unit, slot }: { readonly unit: CompanionView; readonly slot: number }) {
  const kind: UnitKind = unit.kind;
  return (
    <span className={styles.unit} data-slot={slot} data-unit-kind={kind} role="img" aria-label={companionLabel(unit)}>
      <span className={styles.unitBody}>
        <UnitPortrait kind={kind} />
      </span>
      {unit.permanent ? null : (
        <small className={`${styles.unitTimer} numeric`} aria-hidden="true">
          {secondsLeft(unit.remainingMs)}
        </small>
      )}
    </span>
  );
}
