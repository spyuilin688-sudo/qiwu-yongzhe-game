import { STAT_KEYS, type ContentCatalog, type StatKey } from '@qiwu/content';
import type { CombatStatsSnapshot, DamageBonusKey, ItemInstance } from '../model/types.ts';
import type { DeepReadonly } from '../util/clone.ts';
import { baseAttackAt } from './formulas.ts';

/**
 * 角色屬性計算（規格 02「戰鬥計算」）：
 * A = (角色基礎攻擊 + 主武固定攻擊 + 副手固定攻擊) × (1 + 攻擊加成總和)。
 * 攻速上限 100%（最快 0.5 秒 1 次）、冷卻縮減上限 40%、暴擊率上限 75%、暴擊倍率上限 3.0。
 * 沒有 HP／MP、防禦或回復屬性。
 */

export interface StatSource {
  readonly label: string;
  readonly itemId: string | null;
  readonly value: number;
}

export interface StatLine {
  readonly stat: StatKey;
  readonly total: number;
  /** 套用上限後的有效值。 */
  readonly effective: number;
  readonly cap: number | null;
  readonly overflow: number;
  readonly sources: readonly StatSource[];
}

export interface StatBreakdown {
  readonly baseAttack: number;
  readonly flatAttack: number;
  readonly lines: Readonly<Record<StatKey, StatLine>>;
  readonly combat: CombatStatsSnapshot;
}

const BONUS_KEYS: readonly DamageBonusKey[] = [
  'BASIC_DMG',
  'SKILL_DMG',
  'DOT_DMG',
  'SUMMON_DMG',
  'FOLLOWUP_DMG',
  'MARK_DMG',
  'SHATTER_DMG',
  'EXECUTE_DMG',
];

export function computeStatBreakdown(
  catalog: ContentCatalog,
  level: number,
  equipped: readonly DeepReadonly<ItemInstance>[],
  baseNameOf: (item: DeepReadonly<ItemInstance>) => string,
): StatBreakdown {
  const { hero } = catalog.tuning;
  const sources = new Map<StatKey, StatSource[]>(STAT_KEYS.map((key) => [key, []]));
  const baseAttack = baseAttackAt(catalog, level);
  sources.get('CRIT_RATE')!.push({ label: '角色基礎', itemId: null, value: hero.baseCritRateBp });
  for (const item of equipped) {
    const name = baseNameOf(item);
    sources.get(item.mainStat.stat)!.push({ label: `${name}（主屬性）`, itemId: item.id, value: item.mainStat.value });
    for (const affix of item.affixes) {
      sources.get(affix.stat)!.push({ label: `${name}（詞條）`, itemId: item.id, value: affix.value });
    }
  }
  const caps: Partial<Record<StatKey, number>> = {
    ATK_SPEED: hero.attackSpeedCapBp,
    CDR: hero.cdrCapBp,
    CRIT_RATE: hero.critRateCapBp,
    CRIT_DMG: hero.critMultCapBp - hero.baseCritMultBp,
  };
  const lines = {} as Record<StatKey, StatLine>;
  for (const stat of STAT_KEYS) {
    const list = sources.get(stat) ?? [];
    const total = list.reduce((sum, source) => sum + source.value, 0);
    const cap = caps[stat] ?? null;
    const effective = cap === null ? total : Math.min(cap, total);
    lines[stat] = { stat, total, effective, cap, overflow: total - effective, sources: list };
  }

  const flatAttack = lines.FLAT_ATTACK.effective;
  const attack = (baseAttack + flatAttack) * (1 + lines.ATK_PCT.effective / 10000);
  const basicIntervalMs = Math.round(hero.basicAttackIntervalMs / (1 + lines.ATK_SPEED.effective / 10000));
  const bonusBp = Object.fromEntries(BONUS_KEYS.map((key) => [key, lines[key].effective])) as Record<DamageBonusKey, number>;

  return {
    baseAttack,
    flatAttack,
    lines,
    combat: {
      attack,
      basicIntervalMs,
      critRateBp: lines.CRIT_RATE.effective,
      critMultBp: hero.baseCritMultBp + lines.CRIT_DMG.effective,
      cdrBp: lines.CDR.effective,
      bonusBp,
    },
  };
}

/** 粗略戰力只作排序輔助，不能自動決定售出（規格 04）。 */
export function roughPower(stats: CombatStatsSnapshot): number {
  const critFactor = 1 + (stats.critRateBp / 10000) * (stats.critMultBp / 10000 - 1);
  const speedFactor = 1000 / stats.basicIntervalMs;
  const skillFactor = 1 + stats.bonusBp.SKILL_DMG / 10000 + stats.cdrBp / 10000;
  return Math.round(stats.attack * critFactor * (speedFactor + skillFactor) * 10);
}
