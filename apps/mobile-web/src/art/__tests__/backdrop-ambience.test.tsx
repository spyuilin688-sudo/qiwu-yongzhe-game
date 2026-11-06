import { loadDefaultCatalog } from '@qiwu/content';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AMBIENCE, AMBIENCE_MAX_ITEMS, AMBIENCE_MOTIONS, BackdropAmbience } from '../backgrounds/ambience.tsx';
import { H, W } from '../backgrounds/parts.tsx';

const maps = [...loadDefaultCatalog().maps.values()];
/** 只有會位移的動態需要位移量；明暗類動態不能帶位移，否則會被誤寫成移動。 */
const MOVING_MOTIONS = new Set(['drift', 'rise']);

describe('背景環境動態（bf-17）', () => {
  it('12 張地圖各有 1～2 個動態，種類都在允許清單內', () => {
    for (const map of maps) {
      const items = AMBIENCE.get(map.number) ?? [];
      expect(items.length, `map ${map.number}`).toBeGreaterThanOrEqual(1);
      expect(items.length, `map ${map.number}`).toBeLessThanOrEqual(AMBIENCE_MAX_ITEMS);
      for (const item of items) {
        expect(AMBIENCE_MOTIONS).toContain(item.motion);
        expect(item.travel !== undefined, `map ${map.number} ${item.motion} 位移量`).toBe(MOVING_MOTIONS.has(item.motion));
      }
    }
  });

  it('每個動態的框都在背景 viewBox 內，寬度貼齊時不會跑出畫面', () => {
    for (const [mapNumber, items] of AMBIENCE) {
      for (const { box } of items) {
        const [x, y, width, height] = box;
        expect(x, `map ${mapNumber}`).toBeGreaterThanOrEqual(0);
        expect(y, `map ${mapNumber}`).toBeGreaterThanOrEqual(0);
        expect(x + width, `map ${mapNumber}`).toBeLessThanOrEqual(W);
        expect(y + height, `map ${mapNumber}`).toBeLessThanOrEqual(H);
      }
    }
  });

  it('渲染為裝飾性的乾淨 SVG：沒有漸層 id、文字、濾鏡或 SMIL 動畫', () => {
    for (const map of maps) {
      const markup = renderToStaticMarkup(<BackdropAmbience mapNumber={map.number} />);
      expect(markup).toContain('aria-hidden="true"');
      expect(markup).toContain('aspect-ratio:390 / 272');
      const body = markup.replaceAll('xmlns="http://www.w3.org/2000/svg"', '');
      expect(body).not.toMatch(/<image|<text|<filter|<animate|<set\b|<foreignObject|href=|data:|https?:|url\(| id="/);
      expect(body).not.toMatch(/ d="(M?Z)?"|NaN|undefined/);
    }
  });

  it('未知地圖不畫任何東西', () => {
    expect(renderToStaticMarkup(<BackdropAmbience mapNumber={42} />)).toBe('');
  });
});
