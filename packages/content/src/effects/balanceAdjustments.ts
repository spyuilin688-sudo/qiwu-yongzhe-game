/**
 * 原型平衡調整清單（N）：實作倍率與設計資料不同的每一處都必須列在這裡，並附上原因與證據來源。
 * 為什麼要有清單：設計資料是主規格；驗證器會比對「設計文字中的倍率」與「實作生成文案」，
 * 只有列在這裡的差異才被接受，避免默默改數字。證據見 docs/BALANCE_REPORT.md（node tools/balance/report.ts）。
 */
export interface BalanceAdjustment {
  readonly skillId: string;
  /** 設計資料 prototype_effect 中的原始倍率文字（例如 2.20A）。 */
  readonly designToken: string;
  /** 實作採用的倍率文字。 */
  readonly tunedToken: string;
  readonly reason: string;
}

export const BALANCE_ADJUSTMENTS: readonly BalanceAdjustment[] = [
  {
    skillId: 'SK005',
    designToken: '2.20A',
    tunedToken: '1.20A',
    reason: '劍聖刷怪配置三招皆為 3 目標範圍，同投入清怪比中位數高約 42%；只調三轉專屬招，不動一、二轉共用招。',
  },
  {
    skillId: 'SK006',
    designToken: '9.00A',
    tunedToken: '6.00A',
    reason: '同上（劍聖）；絕招總量下修，每段 1.50A → 1.00A。',
  },
  {
    skillId: 'SK003',
    designToken: '0.55A',
    tunedToken: '0.40A',
    reason: '劍聖（同上）只調三轉招仍高約 25%；旋風連斬是刷怪主力之一，每段下修（狂劍士同步受影響，見報告二轉表）。',
  },
  {
    skillId: 'SK019',
    designToken: '2.20A',
    tunedToken: '1.50A',
    reason: '獸王獵手常駐戰獸＋範圍招，清怪比中位數高約 17%（協同撲擊不再白等標記後更高）。',
  },
  {
    skillId: 'SK045',
    designToken: '0.75A',
    tunedToken: '1.00A',
    reason: '審判主教刷怪配置只有淨罪之環一招範圍，清怪比中位數低約 17%。',
  },
  {
    skillId: 'SK054',
    designToken: '0.80A',
    tunedToken: '1.20A',
    reason: '命運魔術師刷怪只有散花飛刃一招範圍，清怪比中位數低約 24%；修正「沒帶切牌仍白等 3 秒」後仍偏低。',
  },
  {
    skillId: 'SK056',
    designToken: '1.30A',
    tunedToken: '2.20A',
    reason: '命運魔術師打王（第 9 圖同投入）造成的傷害比中位數低約 28%；只調絕招，刷怪影響小。',
  },
  {
    skillId: 'SK057',
    designToken: '0.35A',
    tunedToken: '0.55A',
    reason: '千面幻術師打王傷害比中位數低約 31%，幻影是主要輸出；幻影每次攻擊上調，提前結算的補一擊仍為 0.35A。',
  },
  {
    skillId: 'SK060',
    designToken: '2.40A',
    tunedToken: '3.20A',
    reason: '千面幻術師打王輸出仍比中位數低約 27%、刷怪低約 10%；絕招上調同時改善兩者。',
  },
  {
    skillId: 'SK050',
    designToken: '4.00A',
    tunedToken: '3.50A',
    reason: '修羅武聖打王輸出比中位數高約 16%（滿氣脈崩拳）；刷怪仍在 +10% 內。',
  },
  {
    skillId: 'SK065',
    designToken: '0.35A',
    tunedToken: '0.30A',
    reason: '熔爐神匠打王輸出比中位數高約 15%（熔痕是打王配置主力持續傷害）。',
  },
  {
    skillId: 'SK066',
    designToken: '3.50A',
    tunedToken: '3.00A',
    reason: '熔爐神匠絕招 3 目標 × 滿熱度，清怪仍比中位數高約 16%。',
  },
  {
    skillId: 'SK066',
    designToken: '0.45A',
    tunedToken: '0.25A',
    reason: '熔爐神匠絕招 3 目標 × 滿熱度加成過高，清怪比中位數高約 20%。',
  },
];
