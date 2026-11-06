/**
 * 固定種子亂數（mulberry32）。狀態只有一個 32 位元整數，可存入存檔與 BOSS 快照，
 * 相同種子與呼叫順序必定得到相同結果（規格：戰鬥重播一致、同操作不重抽）。
 * 不作密碼學用途；正式服務的鑑定抽取應改由伺服器安全亂數注入同一介面。
 */
export interface RandomSource {
  nextUint32(): number;
  /** [0, maxExclusive) 的整數。 */
  nextInt(maxExclusive: number): number;
  /** [min, max] 的整數。 */
  nextIntInclusive(min: number, max: number): number;
  /** 依整數權重選取索引；權重 0 的項目永不被選中。 */
  pickWeightedIndex(weights: readonly number[]): number;
  getState(): number;
}

export class SeededRandom implements RandomSource {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  nextUint32(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }

  nextInt(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) throw new RangeError(`nextInt 上限必須是正整數：${maxExclusive}`);
    // 拒絕取樣避免取模偏差。
    const limit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive;
    let value = this.nextUint32();
    while (value >= limit) value = this.nextUint32();
    return value % maxExclusive;
  }

  nextIntInclusive(min: number, max: number): number {
    if (max < min) throw new RangeError(`區間錯誤：${min}～${max}`);
    return min + this.nextInt(max - min + 1);
  }

  pickWeightedIndex(weights: readonly number[]): number {
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    if (!Number.isInteger(total) || total <= 0) throw new RangeError('權重總和必須是正整數');
    let roll = this.nextInt(total);
    for (let index = 0; index < weights.length; index += 1) {
      const weight = weights[index] ?? 0;
      if (roll < weight) return index;
      roll -= weight;
    }
    throw new Error('權重選取失敗');
  }

  getState(): number {
    return this.state;
  }
}

/** 由兩個整數導出新種子（例如以存檔種子流導出 BOSS 場次種子）。 */
export function deriveSeed(a: number, b: number): number {
  let hash = (a ^ Math.imul(b, 0x9e3779b1)) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35) >>> 0;
  return (hash ^ (hash >>> 16)) >>> 0;
}
