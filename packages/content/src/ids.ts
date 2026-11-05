/**
 * 穩定 ID 與顯示名稱對照。
 * 設計資料以中文名稱互相引用（例如 equipment.owner_class = "劍士"），
 * 但規格要求「不使用顯示中文作外鍵」，因此所有中文名稱只在載入時轉成穩定 ID。
 */

export const SLOT_IDS = ['weapon', 'offhand', 'head', 'body', 'hands', 'feet', 'necklace', 'ring'] as const;
export type SlotId = (typeof SLOT_IDS)[number];

/** 尚未一轉時只會產出、穿戴的六個共用部位。 */
export const SHARED_SLOT_IDS = ['head', 'body', 'hands', 'feet', 'necklace', 'ring'] as const satisfies readonly SlotId[];
export type SharedSlotId = (typeof SHARED_SLOT_IDS)[number];

export const ROUTE_SLOT_IDS = ['weapon', 'offhand'] as const satisfies readonly SlotId[];

export const SLOT_NAME_TO_ID: Readonly<Record<string, SlotId>> = {
  主武器: 'weapon',
  副手: 'offhand',
  頭部: 'head',
  身體: 'body',
  手部: 'hands',
  腳部: 'feet',
  項鍊: 'necklace',
  戒指: 'ring',
};

export const SLOT_LABELS: Readonly<Record<SlotId, { full: string; short: string }>> = {
  weapon: { full: '主武器', short: '主武' },
  offhand: { full: '副手', short: '副手' },
  head: { full: '頭部', short: '頭部' },
  body: { full: '身體', short: '身體' },
  hands: { full: '手部', short: '手部' },
  feet: { full: '腳部', short: '腳部' },
  necklace: { full: '項鍊', short: '項鍊' },
  ring: { full: '戒指', short: '戒指' },
};

/** 見習者不是職業節點，而是 Lv1～9 尚未一轉時的狀態。 */
export const NOVICE_JOB_ID = 'NOVICE';
export const NOVICE_JOB_NAME = '見習者';
/** 設計資料中共用裝備的 owner_class 值。 */
export const SHARED_OWNER_NAME = '共用';
export const SHARED_OWNER_ID = 'SHARED';

export const QUALITY_IDS = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'] as const;
export type QualityId = (typeof QUALITY_IDS)[number];

/** 角色可累積的所有屬性；刻意不含 HP、MP、防禦、回復類欄位（C-02）。 */
export const STAT_KEYS = [
  'FLAT_ATTACK',
  'ATK_PCT',
  'BASIC_DMG',
  'SKILL_DMG',
  'ATK_SPEED',
  'CRIT_RATE',
  'CRIT_DMG',
  'CDR',
  'DOT_DMG',
  'SUMMON_DMG',
  'MARK_DMG',
  'SHATTER_DMG',
  'EXECUTE_DMG',
  'FOLLOWUP_DMG',
] as const;
export type StatKey = (typeof STAT_KEYS)[number];

export const STAT_LABELS: Readonly<Record<StatKey, string>> = {
  FLAT_ATTACK: '固定攻擊',
  ATK_PCT: '攻擊加成',
  BASIC_DMG: '普攻傷害',
  SKILL_DMG: '技能傷害',
  ATK_SPEED: '攻速',
  CRIT_RATE: '暴擊率',
  CRIT_DMG: '暴擊傷害',
  CDR: '冷卻縮減',
  DOT_DMG: '持續傷害',
  SUMMON_DMG: '召喚物傷害',
  MARK_DMG: '印記傷害',
  SHATTER_DMG: '碎冰傷害',
  EXECUTE_DMG: '處決傷害',
  FOLLOWUP_DMG: '追擊傷害',
};

/** FLAT_ATTACK 以整數點數表示，其餘屬性一律是萬分位（basis points）。 */
export function isFlatStat(stat: StatKey): boolean {
  return stat === 'FLAT_ATTACK';
}

/** 戰鬥中由職業被動累積的角色資源（不是 MP）。 */
export const RESOURCE_IDS = ['FIGHTING_SPIRIT'] as const;
export type ResourceId = (typeof RESOURCE_IDS)[number];

export const RESOURCE_LABELS: Readonly<Record<ResourceId, string>> = {
  FIGHTING_SPIRIT: '戰意',
};

export const UNIT_KINDS = ['turret', 'mech'] as const;
export type UnitKind = (typeof UNIT_KINDS)[number];

export const UNIT_LABELS: Readonly<Record<UnitKind, string>> = {
  turret: '砲台',
  mech: '機甲',
};
