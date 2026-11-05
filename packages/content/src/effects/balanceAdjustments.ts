/**
 * 原型平衡調整清單（N）：實作倍率與設計資料不同的每一處都必須列在這裡，並附上原因與證據來源。
 * 為什麼要有清單：設計資料是主規格；驗證器會比對「設計文字中的倍率」與「實作生成文案」，
 * 只有列在這裡的差異才被接受，避免默默改數字。證據見 docs/BALANCE_REPORT.md（node tools/balance/report.ts）。
 */
export interface BalanceAdjustment {
  /** 被調整的技能（SKxxx）或被動（PSxxx）。 */
  readonly targetId: string;
  /** 設計資料 prototype_effect／prototype_rule 中的原始倍率文字（例如 2.20A）。 */
  readonly designToken: string;
  /** 實作採用的倍率文字。 */
  readonly tunedToken: string;
  readonly reason: string;
}

export const BALANCE_ADJUSTMENTS: readonly BalanceAdjustment[] = [
  {
    targetId: 'SK005',
    designToken: '2.20A',
    tunedToken: '1.20A',
    reason: '劍聖刷怪配置三招皆為 3 目標範圍，同投入清怪比中位數高約 42%；只調三轉專屬招，不動一、二轉共用招。',
  },
  {
    targetId: 'SK006',
    designToken: '9.00A',
    tunedToken: '6.00A',
    reason: '同上（劍聖）；絕招總量下修，每段 1.50A → 1.00A。',
  },
  {
    targetId: 'SK003',
    designToken: '0.55A',
    tunedToken: '0.26A',
    reason: '劍聖只調三轉招仍高約 25%，先下修到 0.40A；proto.2 二轉表狂劍士仍高 30%（第 5 圖），再下修到 0.26A（劍聖同步降到 +8%）。',
  },
  {
    targetId: 'SK019',
    designToken: '2.20A',
    tunedToken: '1.50A',
    reason: '獸王獵手常駐戰獸＋範圍招，清怪比中位數高約 17%（協同撲擊不再白等標記後更高）。',
  },
  {
    targetId: 'SK045',
    designToken: '0.75A',
    tunedToken: '1.00A',
    reason: '審判主教刷怪配置只有淨罪之環一招範圍，清怪比中位數低約 17%。',
  },
  {
    targetId: 'SK054',
    designToken: '0.80A',
    tunedToken: '1.20A',
    reason: '命運魔術師刷怪只有散花飛刃一招範圍，清怪比中位數低約 24%；修正「沒帶切牌仍白等 3 秒」後仍偏低。',
  },
  {
    targetId: 'SK056',
    designToken: '1.30A',
    tunedToken: '2.20A',
    reason: '命運魔術師打王（第 9 圖同投入）造成的傷害比中位數低約 28%；只調絕招，刷怪影響小。',
  },
  {
    targetId: 'SK057',
    designToken: '0.35A',
    tunedToken: '0.55A',
    reason: '千面幻術師打王傷害比中位數低約 31%，幻影是主要輸出；幻影每次攻擊上調，提前結算的補一擊仍為 0.35A。',
  },
  {
    targetId: 'SK060',
    designToken: '2.40A',
    tunedToken: '3.20A',
    reason: '千面幻術師打王輸出仍比中位數低約 27%、刷怪低約 10%；絕招上調同時改善兩者。',
  },
  {
    targetId: 'SK050',
    designToken: '4.00A',
    tunedToken: '3.50A',
    reason: '修羅武聖打王輸出比中位數高約 16%（滿氣脈崩拳）；刷怪仍在 +10% 內。',
  },
  {
    targetId: 'SK065',
    designToken: '0.35A',
    tunedToken: '0.30A',
    reason: '熔爐神匠打王輸出比中位數高約 15%（熔痕是打王配置主力持續傷害）。',
  },
  {
    targetId: 'SK066',
    designToken: '3.50A',
    tunedToken: '3.00A',
    reason: '熔爐神匠絕招 3 目標 × 滿熱度，清怪仍比中位數高約 16%。',
  },
  {
    targetId: 'SK066',
    designToken: '0.45A',
    tunedToken: '0.25A',
    reason: '熔爐神匠絕招 3 目標 × 滿熱度加成過高，清怪比中位數高約 20%。',
  },
  // ── proto.2：二轉 14 路線同投入清怪（第 4～7 圖）拉回中位數 ±15%（docs/BALANCE_REPORT.md 補充表）──
  {
    targetId: 'SK008',
    designToken: '1.60A',
    tunedToken: '1.00A',
    reason: '破陣騎士刷怪兩招範圍（橫掃斬＋震地盾擊），第 5 圖比中位數高約 27%；符文騎士同步降到約 −7%。',
  },
  {
    targetId: 'SK011',
    designToken: '1.50A',
    tunedToken: '1.35A',
    reason: '馴獸師常駐戰獸＋散射，第 5、7 圖仍高 16～19%（清怪多卡在擊殺門檻，只調協同撲擊無效）；神射手、星隼遊俠、獸王獵手同步小幅下降。',
  },
  {
    targetId: 'SK018',
    designToken: '1.30A',
    tunedToken: '0.60A',
    reason: '馴獸師（同上）本體段下修；獸王獵手同步從 +13% 降到約 +6%。',
  },
  {
    targetId: 'SK018',
    designToken: '1.50A',
    tunedToken: '1.00A',
    reason: '馴獸師（同上）戰獸段下修。',
  },
  {
    targetId: 'PS009',
    designToken: '0.50A',
    tunedToken: '0.45A',
    reason: '馴獸師第 7 圖受戰獸普攻決定擊殺門檻，其他招下修都停在 +16%；戰獸每次攻擊小幅下修後降到 +12%。',
  },
  {
    targetId: 'SK033',
    designToken: '0.75A',
    tunedToken: '0.90A',
    reason: '影刃刺客刷怪三招都是單體，第 7 圖比中位數低約 16%；影舞者打王配置同步小幅上升。',
  },
  {
    targetId: 'SK048',
    designToken: '1.90A',
    tunedToken: '1.25A',
    reason: '武僧第 5 圖比中位數高約 24%（破山掌是唯一範圍招）；修羅武聖同步從 +10% 降到約 −3%。',
  },
  {
    targetId: 'SK064',
    designToken: '1.90A',
    tunedToken: '1.50A',
    reason: '戰鎚鐵匠第 5 圖比中位數高約 16%；熔爐神匠同步從 +14% 降到約 +12%。',
  },
];
