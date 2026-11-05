import { loadDefaultCatalog } from '@qiwu/content';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CreatureArt, hasCreatureDesign } from '../monsters/CreatureArt.tsx';

const catalog = loadDefaultCatalog();
const creatureIds = [...catalog.monsters.values()].filter((monster) => monster.kind === 'normal' || monster.kind === 'elite').map((monster) => monster.id);

/** 單張小怪圖的元素上限：超過代表細節在 48–64px 已看不見，且拖慢戰場重繪。 */
const ELEMENT_BUDGET = 60;
const EXPECTED_CREATURES = 96;

const render = (monsterId: string): string => renderToStaticMarkup(<CreatureArt monsterId={monsterId} size={64} />);
const idsIn = (markup: string): string[] => [...markup.matchAll(/ id="([^"]+)"/g)].map((match) => match[1] ?? '');

describe('小怪與小首領原創 SVG', () => {
  it('目錄內 96 隻普通怪與小首領都有專屬設計', () => {
    expect(creatureIds).toHaveLength(EXPECTED_CREATURES);
    expect(creatureIds.filter((id) => !hasCreatureDesign(id))).toEqual([]);
  });

  it('未知 ID 與 BOSS 不算有專屬設計，但仍能畫出佔位怪', () => {
    for (const unknown of ['MON-99-1', 'ELT-13-1', 'BOSS-01', '']) {
      expect(hasCreatureDesign(unknown)).toBe(false);
      expect(render(unknown).startsWith('<svg')).toBe(true);
    }
  });

  it('任兩隻怪物的標記都不相同（同名的發條鼠也各有設計）', () => {
    const markups = new Map<string, string>();
    for (const id of creatureIds) {
      const markup = render(id);
      const duplicate = markups.get(markup);
      expect(duplicate, `${id} 與 ${duplicate ?? ''} 完全相同`).toBeUndefined();
      markups.set(markup, id);
    }
  });

  it('只用允許的 SVG 元素，並維持輕量', () => {
    for (const id of creatureIds) {
      const markup = render(id);
      expect(markup).not.toMatch(/<image|<text|<filter|<animate|<set |<foreignObject|href=|data:|url\((?!#)/);
      // 路徑產生器參數填錯時會輸出空路徑或 NaN，瀏覽器只會默默略過該形狀。
      expect(markup, `${id} 有無效路徑`).not.toMatch(/ d="(M?Z)?"|NaN|undefined/);
      const elements = (markup.match(/<[a-zA-Z]+/g) ?? []).length - 1;
      expect(elements, `${id} 元素數 ${elements}`).toBeLessThanOrEqual(ELEMENT_BUDGET);
      for (const [, ref] of markup.matchAll(/url\(#([^)]+)\)/g)) expect(idsIn(markup)).toContain(ref);
    }
  });

  it('同頁出現兩隻相同怪物時漸層 id 不衝突', () => {
    const markup = renderToStaticMarkup(
      <>
        <CreatureArt monsterId="ELT-02-5" />
        <CreatureArt monsterId="ELT-02-5" />
      </>,
    );
    const ids = idsIn(markup);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
