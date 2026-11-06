import type { QualityId, SlotId, StatKey } from '@qiwu/content';

/**
 * 權威遊戲狀態（原型中由本機 GameEngine 持有；正式服務時對應伺服器資料表）。
 * 刻意沒有角色 HP／MP 欄位（C-02）。所有資源為整數；百分比為萬分位；時間為毫秒。
 */

export type LoadoutPurpose = 'farm' | 'boss';
export const LOADOUT_PURPOSES: readonly LoadoutPurpose[] = ['farm', 'boss'];

export type SkillConditionMode = 'default' | 'immediate';
/** default：普通戰鬥＝最早生成的敵人、BOSS＝本體；mechanicFirst：BOSS 戰優先副目標（開戰前設定）。 */
export type TargetPolicy = 'default' | 'mechanicFirst';

export interface StatValue {
  stat: StatKey;
  /** FLAT_ATTACK 為點數，其餘為萬分位。 */
  value: number;
}

export interface ItemInstance {
  id: string;
  baseId: string;
  slot: SlotId;
  /** 物品等級 = 鑑定前角色等級（T-06）。 */
  level: number;
  qualityId: QualityId;
  mainStat: StatValue;
  affixes: StatValue[];
  hasLegendEffect: boolean;
  locked: boolean;
  status: 'owned' | 'sold';
  createdByOperation: string;
  contentVersion: string;
  /** 取得順序，用於排序與「首次取得」判斷。 */
  serial: number;
  /** 產出時使用的鑑定目標路線。 */
  targetJobId: string;
}

export interface Loadout {
  jobId: string;
  purpose: LoadoutPurpose;
  items: Partial<Record<SlotId, string>>;
  skillIds: string[];
  ultimateId: string | null;
  conditions: Record<string, SkillConditionMode>;
  targetPolicy: TargetPolicy;
  revision: number;
}

export interface KeepRules {
  /** 達此品質（含）以上一律保留並暫停自動鑑定。 */
  minQuality: QualityId;
  /** 指定部位一律保留（例如「戒指一律保留」）。 */
  slots: SlotId[];
  /** 含任一指定詞條即保留。 */
  affixStats: StatKey[];
  /** 可穿戴且主屬性高於目前清怪配置同部位即保留。 */
  upgradesOverEquipped: boolean;
}

export interface AutoSellRules {
  /** 自動出售必須由玩家主動開啟並確認條件。 */
  enabled: boolean;
  maxQuality: QualityId;
  slots: SlotId[];
}

export interface IdentifySettings {
  targetJobId: string;
  autoEnabled: boolean;
  keep: KeepRules;
  autoSell: AutoSellRules;
  version: number;
}

export interface GameSettings {
  firstBossAuto: boolean;
}

export type StageMode = 'PROGRESS' | 'BOSS_READY' | 'BOSS_FIGHT' | 'FARM_BLOCKED' | 'ENDGAME_FARM';

export interface Progress {
  mapNumber: number;
  localStage: number;
  mode: StageMode;
  /** 已擊敗 BOSS 的最高地圖編號；0 代表尚未通過任何地圖。 */
  highestClearedMap: number;
  firstAutoTriedMaps: number[];
}

export interface CombatStatsSnapshot {
  attack: number;
  basicIntervalMs: number;
  critRateBp: number;
  critMultBp: number;
  cdrBp: number;
  bonusBp: Record<DamageBonusKey, number>;
}

export type DamageBonusKey =
  | 'BASIC_DMG'
  | 'SKILL_DMG'
  | 'DOT_DMG'
  | 'SUMMON_DMG'
  | 'FOLLOWUP_DMG'
  | 'MARK_DMG'
  | 'SHATTER_DMG'
  | 'EXECUTE_DMG';

export interface HeroLoadoutSnapshot {
  jobId: string;
  skillIds: string[];
  ultimateId: string | null;
  conditions: Record<string, SkillConditionMode>;
  targetPolicy: TargetPolicy;
  passiveIds: string[];
  legendBaseIds: string[];
}

export type BossResult = 'pending' | 'success' | 'timeout' | 'aborted';

export interface BossAttempt {
  attemptId: string;
  operationId: string;
  mapNumber: number;
  stageId: string;
  startedAtMs: number;
  deadlineAtMs: number;
  durationMs: number;
  loadoutKey: string;
  stats: CombatStatsSnapshot;
  hero: HeroLoadoutSnapshot;
  seed: number;
  contentVersion: string;
  result: BossResult;
  resolvedAtMs: number | null;
  /** 結束時 BOSS 剩餘血量萬分比，用於失敗提示。 */
  bossHpRemainingBp: number | null;
  autoTriggered: boolean;
}

export type LedgerResource = 'GOLD' | 'XP' | 'RELIC' | 'BENCH_LEVEL';
export type LedgerEventType = 'ITEM_SOLD' | 'IDENTIFIED' | 'RELIC_GRANTED' | 'RELIC_CONSUMED' | 'BENCH_UPGRADED';

export interface LedgerEntry {
  ledgerId: string;
  operationId: string | null;
  eventType: LedgerEventType;
  resource: LedgerResource;
  delta: number;
  balanceAfter: number;
  entityRef: string | null;
  atMs: number;
}

export interface OperationRecord {
  operationId: string;
  commandType: string;
  requestHash: string;
  status: 'succeeded' | 'rejected';
  response: unknown;
  createdAtMs: number;
}

export interface GameState {
  schemaVersion: 1;
  contentVersion: string;
  /** 每次玩家命令成功提交 +1；戰鬥產出不改 revision（見 docs/IMPLEMENTATION_NOTES.md）。 */
  revision: number;
  player: {
    level: number;
    xp: number;
    currentJobId: string;
    unlockedJobIds: string[];
  };
  wallet: {
    gold: number;
    relics: number;
    /** 0～99 內部產出點；不是第二種貨幣，不顯示錢包。 */
    relicProgress: number;
    benchLevel: number;
  };
  progress: Progress;
  /** 只含 owned 物品；出售後移入 soldArchive 封存。 */
  items: Record<string, ItemInstance>;
  soldArchive: ItemInstance[];
  /** 鍵為 `${jobId}:${purpose}`。 */
  loadouts: Record<string, Loadout>;
  identifySettings: IdentifySettings;
  settings: GameSettings;
  boss: {
    active: BossAttempt | null;
    history: BossAttempt[];
  };
  operations: {
    records: Record<string, OperationRecord>;
    order: string[];
  };
  ledger: LedgerEntry[];
  discovered: {
    monsterIds: string[];
    baseIds: string[];
    legendBaseIds: string[];
  };
  counters: {
    itemSerial: number;
    ledgerSerial: number;
    attemptSerial: number;
    sessionSerial: number;
  };
  rng: {
    identifyState: number;
    battleSeedState: number;
  };
  totals: {
    kills: number;
    relicsGranted: number;
    identified: number;
    itemsSold: number;
    goldEarned: number;
    bossAttempts: number;
  };
}

export function loadoutKey(jobId: string, purpose: LoadoutPurpose): string {
  return `${jobId}:${purpose}`;
}
