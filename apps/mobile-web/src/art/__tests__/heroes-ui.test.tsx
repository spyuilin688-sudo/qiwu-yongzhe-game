import { SLOT_IDS, loadDefaultCatalog } from '@qiwu/content';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HeroArt } from '../heroes/HeroArt.tsx';
import { JobEmblem } from '../icons/JobEmblem.tsx';
import { SlotIcon } from '../icons/SlotIcon.tsx';
import { UiIcon } from '../icons/UiIcon.tsx';
import { EMBLEM_FIELD } from '../icons/ui/emblemGlyphs.tsx';
import { heroLookFor } from '../mapping.ts';
import type { FamilyKey, UiIconName } from '../types.ts';

const catalog = loadDefaultCatalog();

// 以 Record 列舉，型別新增成員時這裡會編譯失敗，測試清單不會悄悄漏掉。
const UI_NAMES = Object.keys({
  adventure: true, character: true, skills: true, codex: true, more: true, coin: true, relic: true,
  lens: true, lock: true, boss: true, filter: true, route: true, bag: true, close: true, up: true,
  down: true, check: true, warning: true, timer: true, star: true,
} satisfies Record<UiIconName, true>) as UiIconName[];
const FAMILIES = Object.keys({
  novice: true, sword: true, bow: true, mage: true, rogue: true, priest: true, jester: true, artisan: true,
} satisfies Record<FamilyKey, true>) as FamilyKey[];
const COMBAT_FAMILIES = FAMILIES.filter((family) => family !== 'novice');

/** 美術規範：只用基本向量元素，不得有點陣圖、外部連結、文字、濾鏡或 SMIL 動畫。 */
function expectCleanSvg(markup: string): void {
  expect(markup.startsWith('<svg')).toBe(true);
  // SVG 命名空間宣告本身是合法網址，排除後再檢查有無外部資源。
  const body = markup.replace('xmlns="http://www.w3.org/2000/svg"', '');
  expect(body).not.toMatch(/<image|<text|<filter|<animate|<set\b|<foreignObject|href=|data:|https?:/);
}

/** 圖形元素數（含群組與漸層節點），用來守住「每張圖約 60 個元素內」的效能預算。 */
function elementCount(markup: string): number {
  return (markup.match(/<(path|circle|ellipse|rect|polygon|line|g|defs|linearGradient|radialGradient|stop)\b/g) ?? []).length;
}

const hero = (family: FamilyKey, tier: 0 | 1 | 2 | 3, branch: 'A' | 'B' | null): string =>
  renderToStaticMarkup(<HeroArt family={family} tier={tier} branch={branch} size={56} />);

describe('角色立繪', () => {
  it('全部職業節點（含見習者）都能渲染成乾淨的 SVG，且不超過元素預算', () => {
    expect(catalog.jobOrder.length).toBeGreaterThan(30);
    for (const jobId of catalog.jobOrder) {
      const markup = renderToStaticMarkup(<HeroArt {...heroLookFor(catalog, jobId)} size={56} />);
      expectCleanSvg(markup);
      expect(markup).toContain('viewBox="0 0 64 80"');
      expect(elementCount(markup), jobId).toBeLessThanOrEqual(60);
    }
  });

  it('不同職業系的一轉外觀互不相同，也都不同於見習者', () => {
    const markups = FAMILIES.map((family) => hero(family, family === 'novice' ? 0 : 1, null));
    expect(new Set(markups).size).toBe(FAMILIES.length);
  });

  it('同系一轉與三轉外觀不同（兩條分支都檢查）', () => {
    for (const family of COMBAT_FAMILIES) {
      const tier1 = hero(family, 1, null);
      expect(hero(family, 3, 'A'), `${family} A`).not.toBe(tier1);
      expect(hero(family, 3, 'B'), `${family} B`).not.toBe(tier1);
      expect(hero(family, 2, 'A'), `${family} 2A`).not.toBe(hero(family, 3, 'A'));
    }
  });

  it('二轉兩條分支也都與一轉不同（轉職後必須看得出換了行頭）', () => {
    for (const family of COMBAT_FAMILIES) {
      const tier1 = hero(family, 1, null);
      expect(hero(family, 2, 'A'), `${family} 2A`).not.toBe(tier1);
      expect(hero(family, 2, 'B'), `${family} 2B`).not.toBe(tier1);
    }
  });

  it('二轉、三轉的 A／B 分支可區分', () => {
    for (const family of COMBAT_FAMILIES) {
      expect(hero(family, 2, 'A'), `${family} tier2`).not.toBe(hero(family, 2, 'B'));
      expect(hero(family, 3, 'A'), `${family} tier3`).not.toBe(hero(family, 3, 'B'));
    }
  });

  it('35 個職業節點各自對應到不同外觀（同系同階不同分支不會撞圖）', () => {
    const looks = catalog.jobOrder.map((jobId) => renderToStaticMarkup(<HeroArt {...heroLookFor(catalog, jobId)} />));
    expect(new Set(looks).size).toBe(looks.length);
  });

  it('資料異常（二轉以上缺分支）時退回 A 線，而不是丟錯', () => {
    expect(hero('sword', 3, null)).toBe(hero('sword', 3, 'A'));
  });

  it('同一畫面多個實例的漸層 id 不重複', () => {
    const markup = renderToStaticMarkup(
      <div>
        <HeroArt family="sword" tier={3} branch="A" />
        <HeroArt family="sword" tier={3} branch="A" />
        <JobEmblem family="mage" />
        <JobEmblem family="mage" />
      </div>,
    );
    const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(ids.length).toBe(4);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-zA-Z0-9_-]+$/);
      expect(markup).toContain(`url(#${id})`);
    }
  });
});

describe('職業系徽章', () => {
  it('每個職業系（含見習者）都有各自的徽章', () => {
    const markups = FAMILIES.map((family) => renderToStaticMarkup(<JobEmblem family={family} size={32} />));
    for (const markup of markups) {
      expectCleanSvg(markup);
      expect(markup).toContain('viewBox="0 0 32 32"');
      expect(elementCount(markup)).toBeLessThanOrEqual(30);
    }
    expect(new Set(markups).size).toBe(FAMILIES.length);
  });

  it('各職業系徽章底色彼此拉得開（避免像舊版劍士與祭司都是同一種藍）', () => {
    const rgb = (hex: string): readonly number[] => [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
    // RGB 歐氏距離門檻：低於此值時 32px 並排幾乎分不出差異（舊版劍士／祭司僅約 15）。
    const MIN_FIELD_DISTANCE = 35;
    for (const [index, a] of FAMILIES.entries()) {
      for (const b of FAMILIES.slice(index + 1)) {
        const [ra, rb] = [rgb(EMBLEM_FIELD[a].base), rgb(EMBLEM_FIELD[b].base)];
        const distance = Math.hypot(...ra.map((value, channel) => value - (rb[channel] ?? 0)));
        expect(distance, `${a} vs ${b}`).toBeGreaterThan(MIN_FIELD_DISTANCE);
      }
    }
  });
});

describe('介面與部位圖示', () => {
  it('全部介面圖示可渲染、彼此不同，且只用 currentColor 著色', () => {
    const markups = UI_NAMES.map((name) => renderToStaticMarkup(<UiIcon name={name} />));
    for (const markup of markups) {
      expectCleanSvg(markup);
      expect(markup).toContain('viewBox="0 0 24 24"');
      expect(markup).toContain('currentColor');
      expect(markup).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
    expect(new Set(markups).size).toBe(UI_NAMES.length);
  });

  it('八個裝備部位圖示可渲染、彼此不同，且只用 currentColor 著色', () => {
    const markups = SLOT_IDS.map((slot) => renderToStaticMarkup(<SlotIcon slot={slot} />));
    for (const markup of markups) {
      expectCleanSvg(markup);
      expect(markup).toContain('currentColor');
      expect(markup).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
    expect(new Set(markups).size).toBe(SLOT_IDS.length);
  });

  it('提供 title 時以 role="img" 呈現，省略時對輔助技術隱藏', () => {
    expect(renderToStaticMarkup(<UiIcon name="relic" title="未鑑定古物" />)).toContain('role="img"');
    expect(renderToStaticMarkup(<UiIcon name="relic" />)).toContain('aria-hidden="true"');
  });
});
