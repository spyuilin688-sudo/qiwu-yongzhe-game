import type { EnemyStatusView, EnemyView } from '@qiwu/game-core';
import { memo } from 'react';
import { AddArt, MonsterArt } from '../../../art/index.ts';
import styles from '../battle.module.css';
import { HpBar } from './HpBar.tsx';
import { enemySlotX, type EnemySlot } from './layout.ts';
import { limitTags } from './tags.ts';

/** 向量圖只依怪物決定、與戰況無關：memo 讓每 100ms 的重繪跳過整棵 SVG。 */
const EnemyPortrait = memo(MonsterArt);
const AddPortrait = memo(AddArt);

/** 腳下狀態列只排一行：一般怪與副目標欄位窄（320 寬約 45px）只放 1 個，小首領單獨站中間可多放幾個。 */
const MAX_TAGS_NARROW = 1;
const MAX_TAGS_WIDE = 4;

/**
 * 敵人：外層 .enemy 以「腳底」錨定在地面線（bottom），不受名稱、狀態列高度影響；
 * 血條、名稱、狀態列一律掛在腳下（.enemyLabel，絕對定位），字放大也不會把身體頂高。
 * .enemyActor 是穩定的動畫掛點（出場、受擊、倒下），整場不重掛 SVG。
 */
export function EnemyActor({ enemy, slot, isBossBody, mapNumber }: { readonly enemy: EnemyView; readonly slot: EnemySlot; readonly isBossBody: boolean; readonly mapNumber: number }) {
  return (
    <div className={styles.enemy} style={{ left: `${enemySlotX(slot)}%` }} data-enemy-kind={enemy.kind} data-enemy-uid={enemy.uid} data-slot={slot}>
      <div className={styles.enemyActor}>
        <div className={styles.enemyBody} aria-hidden="true">
          {enemy.kind === 'add' ? <AddPortrait mapNumber={mapNumber} /> : <EnemyPortrait monsterId={enemy.monsterId} />}
        </div>
      </div>
      {/* BOSS 本體的名稱、血量與狀態集中在上方 BOSS 資訊列，腳下不重複顯示。 */}
      {isBossBody ? null : (
        <div className={styles.enemyLabel}>
          <HpBar tone="enemy" value={enemy.hp} max={enemy.maxHp} label={`${enemy.name} 血量`} className={styles.enemyHp} />
          <span className={styles.enemyName}>{enemy.name}</span>
          <EnemyTags traits={enemy.traits} statuses={enemy.statuses} max={enemy.kind === 'elite' ? MAX_TAGS_WIDE : MAX_TAGS_NARROW} />
        </div>
      )}
    </div>
  );
}

type EnemyTag = { readonly kind: 'trait'; readonly key: string; readonly label: string } | { readonly kind: 'status'; readonly key: string; readonly status: EnemyStatusView };

/** 小首領模板、BOSS 機制（trait）與身上的狀態（status）共用一行標籤；BOSS 資訊列也用它。 */
export function EnemyTags({ traits, statuses, max, className }: { readonly traits: readonly string[]; readonly statuses: readonly EnemyStatusView[]; readonly max: number; readonly className?: string }) {
  if (traits.length === 0 && statuses.length === 0) return null;
  const tags: EnemyTag[] = [
    ...traits.map((label): EnemyTag => ({ kind: 'trait', key: `t:${label}`, label })),
    ...statuses.map((status): EnemyTag => ({ kind: 'status', key: `s:${status.statusId}`, status })),
  ];
  const { shown, hiddenCount } = limitTags(tags, max);
  const hiddenLabels = tags.slice(shown.length).map((tag) => (tag.kind === 'trait' ? tag.label : tag.status.label));
  return (
    <span className={[styles.statusRow, className].filter(Boolean).join(' ')}>
      {shown.map((tag) =>
        tag.kind === 'trait' ? (
          <span key={tag.key} className={styles.trait}>
            {tag.label}
          </span>
        ) : (
          <span key={tag.key} className={styles.status}>
            {tag.status.label}
            {tag.status.stacks > 1 ? <span className="numeric">×{tag.status.stacks}</span> : null}
          </span>
        ),
      )}
      {hiddenCount > 0 ? (
        <span className={styles.status}>
          <span className="numeric" aria-hidden="true">
            +{hiddenCount}
          </span>
          <span className="visually-hidden">另有：{hiddenLabels.join('、')}</span>
        </span>
      ) : null}
    </span>
  );
}
