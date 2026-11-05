import { loadDefaultCatalog } from '@qiwu/content';
import { describe, expect, it } from 'vitest';
import { GameEngine } from '../src/index.ts';

describe('smoke: 自動清怪 → 古物 → 鑑定', () => {
  it('跑 10 分鐘普通戰鬥並鑑定', () => {
    const catalog = loadDefaultCatalog();
    const engine = new GameEngine({ catalog, nowMs: 0, seed: 42 });
    let now = 0;
    let op = 0;
    for (let minute = 0; minute < 10; minute += 1) {
      for (let step = 0; step < 600; step += 1) {
        now += 100;
        engine.advance(now);
        engine.drainEvents();
      }
      while (engine.getState().wallet.relics > 0) {
        op += 1;
        const res = engine.execute({ operationId: `op-smoke-${op}`, command: { type: 'identify', payload: {} } }, now);
        expect(res.status).toBe('succeeded');
      }
    }
    const state = engine.getState();
    expect(state.wallet.gold).toBe(0);
    expect(state.totals.kills).toBeGreaterThan(0);
    expect(state.totals.identified).toBeGreaterThan(0);
  });
});
