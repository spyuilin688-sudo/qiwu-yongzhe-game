import type { StatKey } from './ids.ts';

/**
 * 詞條池（N）。詞條生成先過路線標籤，再無放回抽取；同件不得重複 ID；
 * 絕不產出 HP、MP 或經濟加成。通用池永遠足夠補足品質要求的詞條數。
 */
export const GENERAL_AFFIX_STATS: readonly StatKey[] = [
  'ATK_PCT',
  'BASIC_DMG',
  'SKILL_DMG',
  'ATK_SPEED',
  'CRIT_RATE',
  'CRIT_DMG',
  'CDR',
  'FOLLOWUP_DMG',
];

/**
 * 路線專屬詞條標籤；以職業節點宣告，抽取時合併目標職業與其祖先的標籤。
 * 依據規格 04：持續傷害＝燃燒／毒／熔痕／區域持續；召喚物＝戰獸／幻影／砲台／機甲；
 * 印記／碎冰／處決只給對應路線。
 */
export const ROUTE_AFFIX_TAGS: Readonly<Record<string, readonly StatKey[]>> = {
  JOB09: ['SUMMON_DMG'],
  JOB10: ['SUMMON_DMG'],
  JOB11: ['DOT_DMG'],
  JOB12: ['MARK_DMG'],
  JOB13: ['MARK_DMG'],
  JOB14: ['SHATTER_DMG'],
  JOB15: ['SHATTER_DMG'],
  JOB17: ['EXECUTE_DMG'],
  JOB18: ['EXECUTE_DMG'],
  JOB19: ['DOT_DMG'],
  JOB20: ['DOT_DMG'],
  JOB22: ['MARK_DMG'],
  JOB23: ['MARK_DMG'],
  JOB29: ['SUMMON_DMG'],
  JOB30: ['SUMMON_DMG'],
  JOB32: ['DOT_DMG'],
  JOB33: ['DOT_DMG'],
  JOB34: ['SUMMON_DMG'],
  JOB35: ['SUMMON_DMG'],
};
