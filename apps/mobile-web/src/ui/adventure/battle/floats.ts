import type { EnemyKind } from '@qiwu/game-core';
import { FLOAT_LIFETIME_MS } from './layout.ts';

/** 同目標在這段時間內的多段命中合併成一個數字（只合併視覺，不丟傷害事件）。 */
export const FLOAT_MERGE_MS = 160;
/** 規格：最多 20 組飄字同時顯示。 */
export const MAX_FLOATS = 20;
/** 同一目標在這段時間內接連出現的飄字分層往上疊，不會疊成一團。 */
export const FLOAT_LANE_WINDOW_MS = 400;
export const FLOAT_LANES = 3;

/** 飄字錨點：依目標種類決定冒出的高度（對應各自的精靈尺寸）。 */
export type FloatAnchor = 'mob' | 'elite' | 'boss' | 'add';

const ANCHOR_BY_KIND: Readonly<Record<EnemyKind, FloatAnchor>> = {
  normal: 'mob',
  elite: 'elite',
  boss: 'boss',
  add: 'add',
};

export function floatAnchorOf(kind: EnemyKind): FloatAnchor {
  return ANCHOR_BY_KIND[kind];
}

export interface FloatHit {
  readonly uid: number;
  readonly amount: number;
  readonly crit: boolean;
  readonly source: string;
}

export interface FloatTarget {
  /** 目標所在欄位的水平位置（戰場寬度 %）。 */
  readonly x: number;
  readonly anchor: FloatAnchor;
}

export interface FloatText extends FloatHit {
  readonly id: number;
  readonly createdAt: number;
  /** 建立當下記住的錨點；目標尚未出現在站位簿時為 null，渲染時再補查。之後不再跟著目標移動。 */
  readonly target: FloatTarget | null;
  /** 0 起算的疊層；同目標短時間內第 n 個飄字往上（或 BOSS 往下）錯開一層。 */
  readonly lane: number;
  /** 左右微錯開的方向，避免同層數字完全重疊。 */
  readonly side: -1 | 1;
}

export function isFloatAlive(item: FloatText, now: number): boolean {
  return now - item.createdAt < FLOAT_LIFETIME_MS;
}

/** 移除過期飄字；沒有可移除的項目時回傳同一個陣列，讓 React 跳過重繪。 */
export function pruneFloats(floats: readonly FloatText[], now: number): readonly FloatText[] {
  return floats.every((item) => isFloatAlive(item, now)) ? floats : floats.filter((item) => isFloatAlive(item, now));
}

/** 取同目標近期還沒用到的最低層；三層都用掉時依數量循環。 */
function freeLane(floats: readonly FloatText[], uid: number, now: number): number {
  const recent = floats.filter((item) => item.uid === uid && now - item.createdAt < FLOAT_LANE_WINDOW_MS);
  const used = new Set(recent.map((item) => item.lane));
  for (let lane = 0; lane < FLOAT_LANES; lane += 1) if (!used.has(lane)) return lane;
  return recent.length % FLOAT_LANES;
}

export function addFloatHits(
  previous: readonly FloatText[],
  hits: readonly FloatHit[],
  now: number,
  resolveTarget: (uid: number) => FloatTarget | null,
  nextId: () => number,
): readonly FloatText[] {
  const next: FloatText[] = previous.filter((item) => isFloatAlive(item, now));
  for (const hit of hits) {
    const mergeIndex = next.findIndex((item) => item.uid === hit.uid && item.crit === hit.crit && now - item.createdAt < FLOAT_MERGE_MS);
    if (mergeIndex >= 0) {
      const merged = next[mergeIndex]!;
      next[mergeIndex] = { ...merged, amount: merged.amount + hit.amount };
      continue;
    }
    const id = nextId();
    next.push({ ...hit, id, createdAt: now, target: resolveTarget(hit.uid), lane: freeLane(next, hit.uid, now), side: id % 2 === 0 ? 1 : -1 });
  }
  return next.slice(-MAX_FLOATS);
}
