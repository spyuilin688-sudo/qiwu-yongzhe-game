import { describe, expect, it } from 'vitest';
import {
  getDefaultDesignData,
  identifyBasePool,
  loadDefaultCatalog,
  parseDesignData,
  skillSelectionRule,
  defaultSkillIds,
  describeLegend,
  legendInactiveReason,
  passiveIdsForJob,
  validateContent,
} from '../src/index.ts';

describe('內容資料自動檢查', () => {
  const data = parseDesignData(getDefaultDesignData());
  const catalog = loadDefaultCatalog();
  const report = validateContent(data, catalog);

  it('通過全部結構與引用檢查', () => {
    expect(report.issues).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it('數量符合規格：35 職業、70 主動、35 被動、88 基底、12 地圖、360 關', () => {
    expect(report.summary).toMatchObject({
      classes: 35,
      active_skills: 70,
      passives: 35,
      equipment_bases: 88,
      maps: 12,
      stages: 360,
    });
  });

  it('35 個職業節點全部可玩：每個技能、被動、傳說都有實作效果', () => {
    const jobs = [...catalog.jobs.values()].filter((job) => job.tier > 0);
    expect(jobs).toHaveLength(35);
    expect(jobs.filter((job) => !job.playable).map((job) => job.id)).toEqual([]);
    expect([...catalog.skills.values()].filter((skill) => !skill.effect).map((skill) => skill.id)).toEqual([]);
    expect([...catalog.passives.values()].filter((passive) => !passive.effect).map((passive) => passive.id)).toEqual([]);
    expect([...catalog.equipment.values()].filter((base) => !base.legend).map((base) => base.id)).toEqual([]);
  });

  it('技能選擇規則：一轉 2 招、二轉 4 選 3、三轉 5 選 3 + 絕招', () => {
    expect(skillSelectionRule(catalog, 'JOB01')).toMatchObject({ regularSlots: 2, ultimate: null });
    expect(skillSelectionRule(catalog, 'JOB02').regularPool).toHaveLength(4);
    expect(skillSelectionRule(catalog, 'JOB02').regularSlots).toBe(3);
    const tier3 = skillSelectionRule(catalog, 'JOB03');
    expect(tier3.regularPool).toHaveLength(5);
    expect(tier3.ultimate?.id).toBe('SK006');
    expect(defaultSkillIds(catalog, 'JOB03', 'boss')).toEqual(['SK002', 'SK003', 'SK004']);
  });

  it('主武器基底只來自目標路線與祖先，且受最低等級限制', () => {
    expect(identifyBasePool(catalog, 'JOB01', 'weapon', 10).map((b) => b.id)).toEqual(['EQ001']);
    expect(identifyBasePool(catalog, 'JOB03', 'weapon', 80).map((b) => b.id).sort()).toEqual(['EQ001', 'EQ015', 'EQ017']);
    // 劍聖不可抽到破陣騎士分支武器
    expect(identifyBasePool(catalog, 'JOB03', 'weapon', 80).some((b) => b.ownerJobId === 'JOB04')).toBe(false);
    expect(identifyBasePool(catalog, 'NOVICE', 'head', 1)).toHaveLength(3);
  });

  it('每張圖都有 BOSS 機制與 5 個小首領模板關卡', () => {
    for (const map of catalog.maps.values()) {
      expect(map.bossMechanics.length).toBeGreaterThan(0);
      const elites = map.stageIds.map((id) => catalog.stages.get(id)!).filter((stage) => stage.type === 'elite');
      expect(elites.map((stage) => stage.eliteTemplate?.label)).toEqual(['厚殼', '蓄勢', '裂甲', '反應核心', '耐久外殼']);
    }
  });
});

describe('傳說特效在目前配置是否啟用（共用部位要標示未啟用）', () => {
  const catalog = loadDefaultCatalog();
  const loadout = (jobId: string, skillIds: string[]) => ({
    skillIds,
    ultimateId: skillSelectionRule(catalog, jobId).ultimate?.id ?? null,
    passiveIds: [...passiveIdsForJob(catalog, jobId)],
  });
  const legendOf = (baseId: string) => catalog.equipment.get(baseId)!.legend!;

  it('由絕招觸發的路線傳說不會因為絕招不在常規欄而被誤判未啟用', () => {
    expect(legendInactiveReason(catalog, legendOf('EQ022'), loadout('JOB05', ['SK001', 'SK007', 'SK008']))).toBeNull();
  });

  it('「下一次常規技能」在只有召喚技能的配置仍可啟用；需要機甲的傳說在沒有機甲時未啟用', () => {
    expect(legendInactiveReason(catalog, legendOf('EQ084'), loadout('JOB30', ['SK057', 'SK058', 'SK059']))).toBeNull();
    expect(legendInactiveReason(catalog, legendOf('EQ069'), loadout('JOB34', ['SK061', 'SK067', 'SK068']))).toContain('機甲');
  });

  it('需要狀態來源的傳說：沒帶掠食標記時狼牙骨笛未啟用，帶了就啟用', () => {
    expect(legendInactiveReason(catalog, legendOf('EQ028'), loadout('JOB09', ['SK011', 'SK018']))).toContain('掠食標記');
    expect(legendInactiveReason(catalog, legendOf('EQ028'), loadout('JOB09', ['SK017', 'SK018']))).toBeNull();
  });

  it('沒有絕招的二轉配置：絕招類共用傳說未啟用', () => {
    expect(legendInactiveReason(catalog, legendOf('EQ085'), loadout('JOB02', ['SK001', 'SK003', 'SK004']))).toBe('需要三轉絕招');
  });

  it('消耗門檻的文案寫出計量單位', () => {
    expect(describeLegend(legendOf('EQ036'))).toContain('消耗至少3層寒霜');
    expect(describeLegend(legendOf('EQ034'))).toContain('消耗至少2種印記');
  });
});
