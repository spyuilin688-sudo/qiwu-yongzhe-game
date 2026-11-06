import { SLOT_IDS, UNIT_KINDS, loadDefaultCatalog } from '@qiwu/content';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FAMILY_KEYS, Gallery, UI_ICON_NAMES } from '../Gallery.tsx';
import { AddArt, EquipIcon, HeroArt, JobEmblem, MapBackdrop, MonsterArt, SkillIcon, SlotIcon, UiIcon, UnitArt, heroLookFor } from '../index.ts';

const catalog = loadDefaultCatalog();

/** 每個資產都能在無瀏覽器環境渲染成合法 SVG，且不含外部圖片或點陣圖。 */
function expectSvg(markup: string): void {
  expect(markup.startsWith('<svg')).toBe(true);
  expect(markup).not.toMatch(/<image|href="http|xlink:href="http|data:image/);
}

describe('原創 SVG 美術：全部資產可渲染', () => {
  it('角色：35 職業節點與見習者', () => {
    for (const jobId of catalog.jobOrder) expectSvg(renderToStaticMarkup(<HeroArt {...heroLookFor(catalog, jobId)} size={56} />));
  });
  it('怪物、小首領、BOSS 與副目標', () => {
    for (const monster of catalog.monsters.values()) expectSvg(renderToStaticMarkup(<MonsterArt monsterId={monster.id} size={64} />));
    for (const map of catalog.maps.values()) expectSvg(renderToStaticMarkup(<AddArt mapNumber={map.number} size={48} />));
  });
  it('召喚物與區域：每種單位都有圖，且是不含血條文字的裝飾圖', () => {
    for (const kind of UNIT_KINDS) {
      const markup = renderToStaticMarkup(<UnitArt kind={kind} size={30} />);
      expectSvg(markup);
      // 區域鋪在地上，改用扁長的 160×40，放大到戰場寬度時描邊才不會變粗（審查 bf-13）。
      expect(markup).toContain(kind === 'zone' ? 'viewBox="0 0 160 40"' : 'viewBox="0 0 40 40"');
      expect(markup).toContain('aria-hidden="true"');
    }
    expect(renderToStaticMarkup(<UnitArt kind="beast" title="戰獸" />)).toContain('<title>戰獸</title>');
  });
  it('12 張地圖背景', () => {
    for (const map of catalog.maps.values()) expectSvg(renderToStaticMarkup(<MapBackdrop mapNumber={map.number} />));
  });
  it('介面、部位、職業系、裝備、技能圖示', () => {
    for (const name of UI_ICON_NAMES) expectSvg(renderToStaticMarkup(<UiIcon name={name} />));
    for (const slot of SLOT_IDS) expectSvg(renderToStaticMarkup(<SlotIcon slot={slot} />));
    for (const family of FAMILY_KEYS) expectSvg(renderToStaticMarkup(<JobEmblem family={family} />));
    for (const base of catalog.equipment.values()) expectSvg(renderToStaticMarkup(<EquipIcon typeName={base.typeName} slot={base.slot} />));
    for (const skill of catalog.skills.values()) expectSvg(renderToStaticMarkup(<SkillIcon skillId={skill.id} />));
  });
  it('美術總覽頁可整頁渲染', () => {
    expect(renderToStaticMarkup(<Gallery catalog={catalog} />)).toContain('art-gallery');
  });
});
