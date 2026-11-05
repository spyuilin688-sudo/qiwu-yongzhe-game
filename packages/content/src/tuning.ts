import type { QualityId, StatKey } from './ids.ts';

/**
 * 原型數值表（規格 02／04／05 章標示 N 的起始值）。
 *
 * 為什麼集中在這裡：規格要求所有臨時倍率、BOSS 時限、品質機率與裝備數值統一配置並標示為 N，
 * 禁止寫死在介面元件。遊戲核心與介面只能透過 catalog.tuning 讀取。
 * 已在設計 JSON 內的數值（邏輯刻、BOSS 時限、背包容量、同場敵數、技能欄數、品質倍率、
 * 鑑定台機率／費用、技能冷卻、關卡）不在此重複，統一由 catalog.globals 與各內容表讀取。
 *
 * 百分比一律為萬分位整數（10000 = 100%），時間為整數毫秒。
 */
export const PROTOTYPE_TUNING = deepFreeze({
  status: 'N',
  battle: {
    status: 'N',
    /** 清掉當波全部目標後生成下一波的間隔。 */
    waveSpawnDelayMs: 350,
    /** 常規技能與絕招共用的施放鎖。 */
    castLockMs: 250,
    /** 一般資源門檻最多等待時間，逾時允許基礎施放。 */
    conditionFallbackMs: 3000,
    /** 命中最少延後一個邏輯刻，確保「排程 → 命中 → 清理死亡」順序固定。 */
    minHitDelayMs: 50,
    wavesPerNormalStage: 3,
    monstersPerWave: 3,
    /** 斷線／背景容忍：超過此時間的未推進邏輯刻直接丟棄，不補算離線收益。 */
    maxCatchUpMs: 3000,
  },
  hero: {
    status: 'N',
    baseAttackAtLevel1: 10,
    baseAttackPerLevel: 2,
    basicAttackIntervalMs: 1000,
    basicAttackCoefBp: 10000,
    baseCritRateBp: 500,
    baseCritMultBp: 15000,
    critRateCapBp: 7500,
    critMultCapBp: 30000,
    attackSpeedCapBp: 10000,
    cdrCapBp: 4000,
  },
  armor: {
    status: 'N',
    /** ArmorFactor = K / (K + 有效護甲)。 */
    factorConstant: 400,
  },
  progression: {
    status: 'N',
    /** NextXP(L) = base + linear×(L−1) + quadratic×(L−1)²，從 L 升至 L+1 所需。 */
    nextXp: { base: 60, linear: 15, quadratic: 2 },
    /** XPPerIdentify(L_before) = base + perLevel×L_before。 */
    identifyXp: { base: 20, perLevel: 2 },
    /** 1 轉／2 轉／3 轉解鎖等級屬 P；實際值以設計資料 classes.unlock_level 為準。 */
  },
  relic: {
    status: 'N',
    pointsPerRelic: 100,
    /** w(m) = round(normalBasePoints × normalGrowthPerMap^(m−1)) 內部產出點。 */
    normalBasePoints: 20,
    normalGrowthPerMap: 1.4,
    eliteMultiplier: 6,
    /** BOSS 本體只解鎖地圖；副目標 0 產出，避免反覆失敗刷古物。 */
    bossBodyPoints: 0,
    bossAddPoints: 0,
  },
  enemies: {
    status: 'N',
    normalHpBase: 60,
    hpGrowthPerMap: 1.5,
    hpGrowthPerStage: 1.04,
    eliteHpMultiplier: 6,
    bossHpMultiplier: 25,
    armorBase: 5,
    armorGrowthPerMap: 1.25,
    armorPerStage: 2,
    /** 每個 BOSS 場最多 1 本體 + 2 副目標。 */
    maxBossAdds: 2,
  },
  economy: {
    status: 'N',
    /** Sell = floor[(sellBase + sellPerLevel × 裝備等級) × 品質售價倍率]。 */
    sellBase: 8,
    sellPerLevel: 2,
    sellMultiplierByQuality: { Q1: 1, Q2: 1.5, Q3: 2.5, Q4: 4, Q5: 7 } satisfies Record<QualityId, number>,
    /** 單次批次出售上限（API 契約 itemIds:1～50）。 */
    maxSellBatch: 50,
  },
  boss: {
    status: 'P',
    /**
     * 首次自動挑戰屬 P 提案。使用者第一階段要求以「手動召喚 BOSS」為主循環，
     * 因此預設關閉；玩家可在「更多」開啟，開啟後每張地圖最多自動一次。
     */
    firstAutoChallengeDefault: false,
  },
  identify: {
    status: 'N',
    /** 自動鑑定兩筆之間最短顯示節奏。 */
    autoMinIntervalMs: 500,
    /** 預設保留（暫停自動）的最低品質：史詩。 */
    defaultKeepMinQuality: 'Q4' as QualityId,
    /** 預設自動出售關閉；開啟後預設只賣普通品質。 */
    defaultAutoSellMaxQuality: 'Q1' as QualityId,
    /** 自動出售可設定的最高品質（N）：史詩以上一律先暫停讓玩家查看（規格 07 預設不自動賣特殊裝備）。 */
    autoSellMaxAllowedQuality: 'Q3' as QualityId,
  },
  itemStats: {
    status: 'N',
    /** W = round[(base + perLevel×L) × q]。 */
    weapon: { base: 15, perLevel: 3 },
    /** O = round[(base + perLevel×L) × q]。 */
    offhand: { base: 5, perLevel: 1 },
    /** S = min(cap, (base + perLevel×L) × q)，萬分位。(2 + 0.03L)% → 200 + 3L bp。 */
    percentS: { baseBp: 200, perLevelBp: 3, capBp: 1500 },
    /** C = min(cap, (base + perLevel×L) × q)，萬分位。(1 + 0.01L)% → 100 + 1L bp。 */
    percentC: { baseBp: 100, perLevelBp: 1, capBp: 600 },
  },
  affixRanges: {
    status: 'N',
    /** 詞條基礎範圍（萬分位），最終值再乘品質 q 後四捨五入。 */
    ranges: {
      ATK_PCT: { minBp: 200, maxBp: 500 },
      BASIC_DMG: { minBp: 200, maxBp: 500 },
      SKILL_DMG: { minBp: 200, maxBp: 500 },
      ATK_SPEED: { minBp: 200, maxBp: 400 },
      CRIT_RATE: { minBp: 100, maxBp: 250 },
      CRIT_DMG: { minBp: 300, maxBp: 600 },
      CDR: { minBp: 100, maxBp: 200 },
      DOT_DMG: { minBp: 300, maxBp: 600 },
      SUMMON_DMG: { minBp: 300, maxBp: 600 },
      MARK_DMG: { minBp: 300, maxBp: 600 },
      SHATTER_DMG: { minBp: 300, maxBp: 600 },
      EXECUTE_DMG: { minBp: 300, maxBp: 600 },
      FOLLOWUP_DMG: { minBp: 300, maxBp: 600 },
    } satisfies Partial<Record<StatKey, { minBp: number; maxBp: number }>>,
  },
  persistence: {
    status: 'N',
    /** 原型本機存檔只保留最近的操作與帳本，避免 localStorage 無限成長。 */
    maxOperationRecords: 400,
    maxLedgerEntries: 600,
    maxSoldArchive: 300,
    maxBossHistory: 30,
  },
});

export type PrototypeTuning = typeof PROTOTYPE_TUNING;

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
