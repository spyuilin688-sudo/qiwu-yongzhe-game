import { loadDefaultCatalog } from '@qiwu/content';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EquipIcon, KNOWN_EQUIP_TYPES, SHARED_EQUIP_TYPE, isKnownEquipType } from '../icons/EquipIcon.tsx';
import { SkillIcon, ULTIMATE_SKILL_IDS, hasSkillDesign } from '../icons/SkillIcon.tsx';
import { skillIconSpec } from '../icons/skills/registry.ts';
import { familyKeyOfName } from '../mapping.ts';

const catalog = loadDefaultCatalog();
const bases = [...catalog.equipment.values()];
const skills = [...catalog.skills.values()];

/** 單張圖示的元素上限：超過代表細節在 48px 已看不見，且列表大量重繪時拖慢效能。 */
const ELEMENT_BUDGET = 60;
const EXPECTED_SKILLS = 70;
const EXPECTED_ULTIMATES = 14;

const renderEquip = (typeName: string, slot: (typeof bases)[number]['slot']): string => renderToStaticMarkup(<EquipIcon typeName={typeName} slot={slot} size={48} />);
const renderSkill = (skillId: string): string => renderToStaticMarkup(<SkillIcon skillId={skillId} size={48} />);
const idsIn = (markup: string): string[] => [...markup.matchAll(/ id="([^"]+)"/g)].map((match) => match[1] ?? '');

/** 只允許向量元素、不得有外部資源；路徑不得含 NaN；漸層引用都要能找到定義。 */
function expectCleanArt(markup: string, label: string): void {
  expect(markup.startsWith('<svg'), label).toBe(true);
  expect(markup, label).not.toMatch(/<image|<text|<filter|<animate|<set |<foreignObject|href=|data:|url\((?!#)/);
  expect(markup, `${label} 有無效路徑`).not.toMatch(/ d="(M?Z)?"|NaN|undefined|Infinity/);
  const elements = (markup.match(/<[a-zA-Z]+/g) ?? []).length - 1;
  expect(elements, `${label} 元素數 ${elements}`).toBeLessThanOrEqual(ELEMENT_BUDGET);
  for (const [, ref] of markup.matchAll(/url\(#([^)]+)\)/g)) expect(idsIn(markup), label).toContain(ref);
}

describe('裝備基底圖示', () => {
  it('設計資料每一種裝備基底都有專屬設計（不落到佔位布包）', () => {
    const unknown = bases.filter((base) => !isKnownEquipType(base.typeName)).map((base) => `${base.id}:${base.typeName}`);
    expect(unknown).toEqual([]);
    const fallback = renderEquip('不存在的種類', 'weapon');
    for (const base of bases) expect(renderEquip(base.typeName, base.slot), base.name).not.toBe(fallback);
  });

  it('登記的種類都真的出現在設計資料中（防止名稱打錯而永遠用不到）', () => {
    const dataTypes = new Set(bases.map((base) => base.typeName));
    expect(KNOWN_EQUIP_TYPES.filter((typeName) => !dataTypes.has(typeName))).toEqual([]);
    expect(isKnownEquipType(SHARED_EQUIP_TYPE)).toBe(true);
    expect(isKnownEquipType('不存在的種類')).toBe(false);
  });

  it('不同種類、不同共用部位的圖互不相同', () => {
    const byKey = new Map<string, string>();
    for (const base of bases) {
      const key = base.typeName === SHARED_EQUIP_TYPE ? `共用:${base.slot}` : base.typeName;
      if (!byKey.has(key)) byKey.set(key, renderEquip(base.typeName, base.slot));
    }
    expect(byKey.size).toBe(KNOWN_EQUIP_TYPES.length + 6);
    const owners = new Map<string, string>();
    for (const [key, markup] of byKey) {
      expect(owners.get(markup), `${key} 與 ${owners.get(markup) ?? ''} 相同`).toBeUndefined();
      owners.set(markup, key);
    }
  });

  it('只用允許的 SVG 元素，並維持輕量', () => {
    for (const base of bases) expectCleanArt(renderEquip(base.typeName, base.slot), base.name);
    expectCleanArt(renderEquip('不存在的種類', 'offhand'), 'fallback');
  });

  it('同頁兩個相同圖示的漸層 id 不衝突', () => {
    const markup = renderToStaticMarkup(
      <>
        <EquipIcon typeName="法珠" slot="offhand" />
        <EquipIcon typeName="法珠" slot="offhand" />
      </>,
    );
    const ids = idsIn(markup);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('技能圖示', () => {
  it('70 個技能都有專屬設計，且任兩個圖示都不相同', () => {
    expect(skills).toHaveLength(EXPECTED_SKILLS);
    expect(skills.filter((skill) => !hasSkillDesign(skill.id)).map((skill) => skill.id)).toEqual([]);
    const owners = new Map<string, string>();
    for (const skill of skills) {
      const markup = renderSkill(skill.id);
      expect(owners.get(markup), `${skill.id} 與 ${owners.get(markup) ?? ''} 相同`).toBeUndefined();
      owners.set(markup, skill.id);
    }
  });

  it('絕招登記與設計資料一致，且絕招用黃銅框、一般技能用單層框', () => {
    const dataUltimates = skills.filter((skill) => skill.kind === 'ultimate').map((skill) => skill.id);
    expect(dataUltimates).toHaveLength(EXPECTED_ULTIMATES);
    expect([...ULTIMATE_SKILL_IDS].sort()).toEqual([...dataUltimates].sort());
    for (const skill of skills) {
      const markup = renderSkill(skill.id);
      const expected = skill.kind === 'ultimate' ? 'ultimate' : 'regular';
      expect(markup, skill.id).toContain(`data-frame="${expected}"`);
      expect(markup, skill.id).not.toContain(`data-frame="${expected === 'ultimate' ? 'regular' : 'ultimate'}"`);
    }
  });

  it('同一職業系的技能共用同一個底色家族', () => {
    for (const skill of skills) {
      const job = catalog.jobs.get(skill.jobId);
      expect(skillIconSpec(skill.id)?.family, skill.id).toBe(familyKeyOfName(job?.familyName ?? null));
    }
  });

  it('只用允許的 SVG 元素，並維持輕量；未知技能仍畫得出佔位', () => {
    for (const skill of skills) expectCleanArt(renderSkill(skill.id), skill.id);
    expect(hasSkillDesign('SK999')).toBe(false);
    expectCleanArt(renderSkill('SK999'), 'SK999');
  });

  it('同頁兩個相同技能的漸層 id 不衝突', () => {
    const markup = renderToStaticMarkup(
      <>
        <SkillIcon skillId="SK056" />
        <SkillIcon skillId="SK056" />
      </>,
    );
    const ids = idsIn(markup);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
