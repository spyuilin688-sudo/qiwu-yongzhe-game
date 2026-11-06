import { describe, expect, it } from 'vitest';
import { H, HORIZON, W } from '../../../../art/backgrounds/parts.tsx';
import { BOSS_GROUND } from '../../../../art/monsters/bosses/parts.tsx';
import { GROUND_Y } from '../../../../art/monsters/creatures/parts.tsx';
import { ART_FOOT, GROUND_FOOT_DEPTH, GROUND_FOOT_DEPTH_COMPACT, STAGE_GEOMETRY_STYLE, footInsetRatio, groundFootRatio } from '../layout.ts';
import { buffTagText, limitTags } from '../tags.ts';
import { bossHpPercent, bossTraits } from '../BossHud.tsx';
import { summonDockVisible } from '../SummonDock.tsx';

describe('戰場幾何', () => {
  it('腳點落在地面帶指定深度：地平線與畫面底之間', () => {
    for (const depth of [GROUND_FOOT_DEPTH, GROUND_FOOT_DEPTH_COMPACT]) {
      const ratio = groundFootRatio(depth);
      const footY = H - ratio * W;
      expect(footY).toBeGreaterThan(HORIZON);
      expect(footY).toBeLessThan(H);
      expect(footY).toBeCloseTo(HORIZON + depth * (H - HORIZON), 6);
    }
    // 舞台較矮時腳點放得更深（更靠近畫面底）。
    expect(groundFootRatio(GROUND_FOOT_DEPTH_COMPACT)).toBeLessThan(groundFootRatio(GROUND_FOOT_DEPTH));
  });

  it('美術影子座標與各美術模組的接地線常數一致', () => {
    expect(ART_FOOT.creature.shadowY).toBeCloseTo(GROUND_Y + 0.6, 6);
    expect(ART_FOOT.boss.shadowY).toBe(BOSS_GROUND + 1);
    for (const kind of Object.keys(ART_FOOT) as (keyof typeof ART_FOOT)[]) {
      const inset = footInsetRatio(kind);
      expect(inset).toBeGreaterThan(0);
      expect(inset).toBeLessThan(0.25);
    }
  });

  it('舞台自訂屬性都是可用的 CSS 值（沒有 NaN）', () => {
    for (const value of Object.values(STAGE_GEOMETRY_STYLE)) expect(String(value)).not.toMatch(/NaN|undefined/);
  });
});

describe('戰場標籤與資訊列', () => {
  it('標籤超過上限時顯示前幾個，其餘計數', () => {
    expect(limitTags(['a', 'b', 'c'], 1)).toEqual({ shown: ['a'], hiddenCount: 2 });
    expect(limitTags(['a'], 2)).toEqual({ shown: ['a'], hiddenCount: 0 });
  });

  it('增益只顯示名稱與剩餘秒數或層數，不顯示任何血量、護盾數值', () => {
    expect(buffTagText({ buffId: 'B1', label: '淬毒', remainingMs: 5200, charges: 0 })).toBe('淬毒 6秒');
    expect(buffTagText({ buffId: 'B2', label: '符文刻印', remainingMs: 0, charges: 3 })).toBe('符文刻印 ×3');
    expect(buffTagText({ buffId: 'B3', label: '王牌封印', remainingMs: 0, charges: 0 })).toBe('王牌封印');
  });

  it('BOSS 血量百分比夾在 0～100，機制標籤合併去重', () => {
    expect(bossHpPercent({ hp: 50, maxHp: 200 })).toBe(25);
    expect(bossHpPercent({ hp: -5, maxHp: 200 })).toBe(0);
    expect(bossHpPercent({ hp: 1, maxHp: 0 })).toBe(0);
    expect(bossTraits({ phaseLabels: ['狂暴'] }, { traits: ['狂暴', '護根'] })).toEqual(['狂暴', '護根']);
  });

  it('召喚台只在 BOSS 關刷怪時出現：挑戰中與末區不顯示', () => {
    expect(summonDockVisible('boss', 'BOSS_READY')).toBe(true);
    expect(summonDockVisible('boss', 'FARM_BLOCKED')).toBe(true);
    expect(summonDockVisible('boss', 'BOSS_FIGHT')).toBe(false);
    expect(summonDockVisible('boss', 'ENDGAME_FARM')).toBe(false);
    expect(summonDockVisible('normal', 'PROGRESS')).toBe(false);
  });
});
