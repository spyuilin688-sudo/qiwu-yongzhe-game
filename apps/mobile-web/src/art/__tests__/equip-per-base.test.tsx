import { loadDefaultCatalog } from '@qiwu/content';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EquipIcon } from '../icons/EquipIcon.tsx';
import { equipDesignFor } from '../icons/equipment/registry.ts';

/**
 * 每件裝備基底都有自己的圖（同種類的基底不再共用一張），且畫出來的 SVG 互不相同。
 * 比對前去掉 useId 產生的漸層 id，避免只因 id 不同而誤判為「不同圖」。
 */
const catalog = loadDefaultCatalog();
const bases = [...catalog.equipment.values()];

function markupOf(baseId: string): string {
  const base = catalog.equipment.get(baseId)!;
  return renderToStaticMarkup(<EquipIcon baseId={base.id} typeName={base.typeName} slot={base.slot} size={48} />).replace(/eq[^"'()#\s]*/g, 'ID');
}

describe('裝備圖示：每件基底一張', () => {
  it(`${bases.length} 件基底各自對應不同的設計`, () => {
    const designs = new Set(bases.map((base) => equipDesignFor(base.typeName, base.slot, base.id)));
    expect(designs.size).toBe(bases.length);
  });

  it('同種類（或同共用部位）的基底畫出來的圖互不相同', () => {
    const groups = new Map<string, string[]>();
    for (const base of bases) {
      const key = base.ownerJobId === 'SHARED' ? `shared:${base.slot}` : base.typeName;
      groups.set(key, [...(groups.get(key) ?? []), base.id]);
    }
    for (const [key, ids] of groups) {
      const rendered = new Set(ids.map(markupOf));
      expect(rendered.size, `${key}：${ids.join('、')}`).toBe(ids.length);
    }
  });

  it('全部是合法 SVG，不含外部圖片', () => {
    for (const base of bases) {
      const markup = markupOf(base.id);
      expect(markup.startsWith('<svg')).toBe(true);
      expect(markup).not.toMatch(/<image|href="http|data:image/);
    }
  });
});
