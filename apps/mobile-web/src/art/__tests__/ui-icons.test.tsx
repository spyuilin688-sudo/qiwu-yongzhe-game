import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { UiIcon } from '../icons/UiIcon.tsx';
import { CurrencyIcon } from '../icons/ui/CurrencyIcon.tsx';
import { UI_GLYPH_NAMES, type UiGlyphName } from '../icons/ui/uiGlyphs.tsx';

/** 美術規範：只用基本向量元素，不得有點陣圖、外部連結、文字、濾鏡或 SMIL 動畫。 */
function expectCleanSvg(markup: string): void {
  expect(markup.startsWith('<svg')).toBe(true);
  const body = markup.replace('xmlns="http://www.w3.org/2000/svg"', '');
  expect(body).not.toMatch(/<image|<text|<filter|<animate|<set\b|<foreignObject|href=|data:|https?:/);
}

function elementCount(markup: string): number {
  return (markup.match(/<(path|circle|ellipse|rect|polygon|line|g|defs|linearGradient|radialGradient|stop)\b/g) ?? []).length;
}

// 設計系統承諾提供的圖示：後續各頁面用它們取代 › ＋ − ↑ ↓ 等文字符號與 CSS 幾何佔位。
const REQUIRED: readonly UiGlyphName[] = ['coin', 'relic', 'bench', 'boss', 'warning', 'lock', 'unlock', 'up', 'down', 'chevron', 'plus', 'minus', 'check', 'close', 'info'];

describe('介面圖示清單', () => {
  it('包含設計系統承諾的全部圖示，且名稱不重複', () => {
    for (const name of REQUIRED) expect(UI_GLYPH_NAMES, name).toContain(name);
    expect(new Set(UI_GLYPH_NAMES).size).toBe(UI_GLYPH_NAMES.length);
  });

  it('每個圖示都是乾淨、互不相同的 currentColor 線條圖', () => {
    const markups = UI_GLYPH_NAMES.map((name) => renderToStaticMarkup(<UiIcon name={name} />));
    for (const [index, markup] of markups.entries()) {
      expectCleanSvg(markup);
      expect(markup, UI_GLYPH_NAMES[index]).toContain('currentColor');
      expect(markup).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
    expect(new Set(markups).size).toBe(markups.length);
  });

  it('尺寸：級距名稱對應圖示 Token、數字為 px、省略時填滿容器', () => {
    expect(renderToStaticMarkup(<UiIcon name="lock" size="s" />)).toContain('width:var(--icon-s);height:var(--icon-s)');
    expect(renderToStaticMarkup(<UiIcon name="lock" size="m" />)).toContain('width:var(--icon-m)');
    expect(renderToStaticMarkup(<UiIcon name="lock" size="base" />)).toContain('width:var(--icon)');
    expect(renderToStaticMarkup(<UiIcon name="lock" size="em" />)).toContain('width:1em;height:1em');
    expect(renderToStaticMarkup(<UiIcon name="lock" size={22} />)).toContain('width:22px;height:22px');
    expect(renderToStaticMarkup(<UiIcon name="lock" />)).toContain('width:100%;height:auto');
  });

  it('省略 title 時是裝飾（aria-hidden），提供 title 時是有名稱的圖片', () => {
    expect(renderToStaticMarkup(<UiIcon name="unlock" />)).toContain('aria-hidden="true"');
    const named = renderToStaticMarkup(<UiIcon name="unlock" title="已解鎖" />);
    expect(named).toContain('role="img"');
    expect(named).toContain('<title>已解鎖</title>');
  });
});

describe('資源圖示（CurrencyIcon）', () => {
  const gold = renderToStaticMarkup(<CurrencyIcon kind="gold" />);
  const relic = renderToStaticMarkup(<CurrencyIcon kind="relic" />);

  it('金幣與古物都是乾淨的小型 SVG，外觀不同', () => {
    for (const markup of [gold, relic]) {
      expectCleanSvg(markup);
      expect(markup).toContain('viewBox="0 0 24 24"');
      // 會出現在資源列、鑑定區、出售鍵：保持很少的元素數。
      expect(elementCount(markup)).toBeLessThanOrEqual(12);
    }
    expect(gold).not.toBe(relic);
  });

  it('顏色全部取自 Token（--coin-*／--relic-*），不寫死色碼，換正式美術只改 Token', () => {
    expect(gold).toMatch(/var\(--coin-light\)/);
    expect(gold).toMatch(/var\(--coin-rim\)/);
    expect(relic).toMatch(/var\(--relic-paper\)/);
    expect(relic).toMatch(/var\(--relic-seal\)/);
    for (const markup of [gold, relic]) expect(markup).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('預設為裝飾；提供 title 時可被讀出', () => {
    expect(gold).toContain('aria-hidden="true"');
    expect(renderToStaticMarkup(<CurrencyIcon kind="relic" title="未鑑定古物" />)).toContain('<title>未鑑定古物</title>');
  });
});
