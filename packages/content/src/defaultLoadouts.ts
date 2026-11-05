/**
 * 三轉預設配置（規格 03「三轉預設配置」表，P），以及一、二轉的原型預設（N）。
 * 表列為起始配置，不是唯一最佳解；絕招由引擎自動帶入該三轉路線的絕招。
 */
export interface DefaultSkillTable {
  readonly farm: readonly string[];
  readonly boss: readonly string[];
}

export const TIER3_DEFAULT_SKILLS: Readonly<Record<string, DefaultSkillTable>> = {
  JOB03: { farm: ['SK001', 'SK003', 'SK005'], boss: ['SK002', 'SK003', 'SK004'] },
  JOB05: { farm: ['SK001', 'SK007', 'SK008'], boss: ['SK002', 'SK007', 'SK008'] },
  JOB08: { farm: ['SK011', 'SK012', 'SK015'], boss: ['SK013', 'SK014', 'SK015'] },
  JOB10: { farm: ['SK011', 'SK018', 'SK019'], boss: ['SK017', 'SK018', 'SK012'] },
  JOB13: { farm: ['SK021', 'SK023', 'SK025'], boss: ['SK021', 'SK023', 'SK024'] },
  JOB15: { farm: ['SK022', 'SK027', 'SK029'], boss: ['SK027', 'SK028', 'SK029'] },
  JOB18: { farm: ['SK031', 'SK032', 'SK035'], boss: ['SK033', 'SK034', 'SK035'] },
  JOB20: { farm: ['SK032', 'SK038', 'SK039'], boss: ['SK037', 'SK038', 'SK039'] },
  JOB23: { farm: ['SK042', 'SK044', 'SK045'], boss: ['SK043', 'SK044', 'SK045'] },
  JOB25: { farm: ['SK042', 'SK048', 'SK049'], boss: ['SK041', 'SK047', 'SK049'] },
  JOB28: { farm: ['SK052', 'SK054', 'SK055'], boss: ['SK053', 'SK054', 'SK055'] },
  // 打王配置偏離規格表（P）：規格為鏡像飛牌、替身爆彈、戲法換位。替身與幻影共用上限 2，替身會把幻影提前擠掉，
  // 同投入打王輸出比中位數低約 23%，把幻影倍率加到設計的 2.9 倍仍低 13%；改以飛牌取代替身爆彈（約 −10%），
  // 保留「布置幻影、調整結算、集中謝幕」。證據：docs/BALANCE_REPORT.md 表二。
  JOB30: { farm: ['SK052', 'SK057', 'SK058'], boss: ['SK051', 'SK057', 'SK059'] },
  JOB33: { farm: ['SK062', 'SK063', 'SK064'], boss: ['SK061', 'SK063', 'SK065'] },
  JOB35: { farm: ['SK062', 'SK067', 'SK068'], boss: ['SK067', 'SK068', 'SK069'] },
};
