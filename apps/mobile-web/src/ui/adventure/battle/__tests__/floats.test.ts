import { describe, expect, it } from 'vitest';
import { FLOAT_LANES, FLOAT_MERGE_MS, MAX_FLOATS, addFloatHits, floatAnchorOf, pruneFloats, type FloatHit, type FloatTarget } from '../floats.ts';
import { FLOAT_LIFETIME_MS } from '../layout.ts';

const hit = (uid: number, amount = 10, crit = false, source = 'basic'): FloatHit => ({ uid, amount, crit, source });

function counter(): () => number {
  let id = 0;
  return () => {
    id += 1;
    return id;
  };
}

describe('傷害飄字', () => {
  const targets = new Map<number, FloatTarget>([
    [1, { x: 62, anchor: 'mob' }],
    [2, { x: 90, anchor: 'mob' }],
  ]);
  const resolve = (uid: number) => targets.get(uid) ?? null;

  it('建立時記下目標欄位，之後目標離場也不改變', () => {
    const floats = addFloatHits([], [hit(1)], 0, resolve, counter());
    targets.delete(1);
    expect(floats[0]!.target).toEqual({ x: 62, anchor: 'mob' });
    targets.set(1, { x: 62, anchor: 'mob' });
  });

  it('找不到目標時記為 null（渲染時再補查），不會猜一個欄位', () => {
    const floats = addFloatHits([], [hit(99)], 0, resolve, counter());
    expect(floats[0]!.target).toBeNull();
  });

  it('同目標短時間內的多段命中合併，傷害總和不變', () => {
    const nextId = counter();
    let floats = addFloatHits([], [hit(1, 10), hit(1, 15)], 0, resolve, nextId);
    floats = addFloatHits(floats, [hit(1, 5)], FLOAT_MERGE_MS - 1, resolve, nextId);
    expect(floats).toHaveLength(1);
    expect(floats[0]!.amount).toBe(30);
  });

  it('合併期過後同目標的新數字分層錯開，層數循環使用', () => {
    const nextId = counter();
    let floats = addFloatHits([], [hit(1)], 0, resolve, nextId);
    for (let step = 1; step <= FLOAT_LANES; step += 1) floats = addFloatHits(floats, [hit(1)], step * (FLOAT_MERGE_MS + 1), resolve, nextId);
    const lanes = floats.map((item) => item.lane);
    // 0、161、322ms 依序用掉三層；483ms 時第 0 層那個已超過分層時間，空出來給新數字。
    expect(lanes).toEqual([0, 1, 2, 0]);
    expect(Math.max(...lanes)).toBeLessThan(FLOAT_LANES);
  });

  it('不同目標各自從第 0 層開始，左右錯開方向依 id 交替', () => {
    const floats = addFloatHits([], [hit(1), hit(2)], 0, resolve, counter());
    expect(floats.map((item) => item.lane)).toEqual([0, 0]);
    expect(floats[0]!.side).not.toBe(floats[1]!.side);
  });

  it('暴擊與一般命中不合併', () => {
    const floats = addFloatHits([], [hit(1, 10, false), hit(1, 20, true)], 0, resolve, counter());
    expect(floats).toHaveLength(2);
  });

  it('同時最多 20 組；過期的會被移除，沒有過期時回傳同一個陣列', () => {
    const hits = Array.from({ length: MAX_FLOATS + 5 }, (_, index) => hit(index + 100));
    const floats = addFloatHits([], hits, 0, resolve, counter());
    expect(floats).toHaveLength(MAX_FLOATS);
    expect(pruneFloats(floats, FLOAT_LIFETIME_MS - 1)).toBe(floats);
    expect(pruneFloats(floats, FLOAT_LIFETIME_MS)).toHaveLength(0);
  });

  it('錨點依敵人種類', () => {
    expect(floatAnchorOf('normal')).toBe('mob');
    expect(floatAnchorOf('elite')).toBe('elite');
    expect(floatAnchorOf('boss')).toBe('boss');
    expect(floatAnchorOf('add')).toBe('add');
  });
});
