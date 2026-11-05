import { describe, expect, it } from 'vitest';
import {
  getDefaultDesignData,
  identifyBasePool,
  loadDefaultCatalog,
  parseDesignData,
  skillSelectionRule,
  defaultSkillIds,
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

  it('第一階段可玩職業：7 個一轉 + 劍士 A 路線 + 工匠 B 路線', () => {
    const playable = [...catalog.jobs.values()].filter((job) => job.tier > 0 && job.playable).map((job) => job.id);
    expect(playable.sort()).toEqual(['JOB01', 'JOB02', 'JOB03', 'JOB06', 'JOB11', 'JOB16', 'JOB21', 'JOB26', 'JOB31', 'JOB34', 'JOB35'].sort());
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
