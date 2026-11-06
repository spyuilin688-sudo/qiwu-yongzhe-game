import { loadDefaultCatalog } from '@qiwu/content';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MapBackdrop } from '../backgrounds/MapBackdrop.tsx';
import { H, SKY_TOP, cloud } from '../backgrounds/parts.tsx';
import { SCENE_ENTRIES, backdropLightFor, backdropToneFor } from '../backgrounds/registry.ts';
import { AddArt, BossArt } from '../monsters/BossArt.tsx';

const catalog = loadDefaultCatalog();
const maps = [...catalog.maps.values()];
const bosses = [...catalog.monsters.values()].filter((monster) => monster.kind === 'boss');
const ZONES = [0, 1, 2, 3, 4, 5] as const;

/** 美術規範：只用基本向量元素，不得有點陣圖、外部連結、文字、濾鏡或 SMIL 動畫。 */
function expectCleanSvg(markup: string): void {
  expect(markup.startsWith('<svg')).toBe(true);
  // SVG 命名空間宣告本身是合法網址，排除後再檢查有無外部資源。
  const body = markup.replace('xmlns="http://www.w3.org/2000/svg"', '');
  expect(body).not.toMatch(/<image|<text|<filter|<animate|<set\b|<foreignObject|href=|data:|https?:/);
}

/**
 * 每個 url(#…) 都必須在同一份標記內有對應的 id。
 * 漸層若在子元件裡才登記，<defs> 會先輸出而漏掉定義，圖面會整片變黑；這條檢查專門擋這種錯。
 */
function expectResolvedRefs(markup: string): void {
  const ids = new Set([...markup.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const refs = [...markup.matchAll(/url\(#([^)]+)\)/g)].map((match) => match[1]);
  for (const ref of refs) expect(ids.has(ref), `未定義的漸層 ${ref}`).toBe(true);
}

/** 圖形元素數（含群組與漸層節點），與其他美術測試同一把尺。 */
function elementCount(markup: string): number {
  return (markup.match(/<(path|circle|ellipse|rect|polygon|line|g|defs|linearGradient|radialGradient|stop)\b/g) ?? []).length;
}

/** 只算實際繪製的形狀（不含 defs／漸層節點），對應「每張圖約 60／80 個 SVG 元素」的預算。 */
function shapeCount(markup: string): number {
  return (markup.match(/<(path|circle|ellipse|rect|polygon|line|polyline|g)\b/g) ?? []).length;
}

const boss = (monsterId: string): string => renderToStaticMarkup(<BossArt monsterId={monsterId} size={112} />);
const add = (mapNumber: number): string => renderToStaticMarkup(<AddArt mapNumber={mapNumber} size={48} />);
const backdrop = (mapNumber: number, zoneIndex?: number): string =>
  renderToStaticMarkup(zoneIndex === undefined ? <MapBackdrop mapNumber={mapNumber} /> : <MapBackdrop mapNumber={mapNumber} zoneIndex={zoneIndex} />);

describe('地圖 BOSS', () => {
  it('內容目錄的 12 位 BOSS 都有專屬設計，彼此不同、也不是佔位圖', () => {
    expect(bosses.map((monster) => monster.id)).toEqual(Array.from({ length: 12 }, (_, index) => `BOSS-${String(index + 1).padStart(2, '0')}`));
    const fallback = boss('BOSS-UNKNOWN');
    const markups = bosses.map((monster) => boss(monster.id));
    expect(new Set(markups).size).toBe(12);
    for (const [index, markup] of markups.entries()) expect(markup, bosses[index]?.id).not.toBe(fallback);
  });

  it('乾淨的 128 格 SVG、漸層都有定義，且守住元素預算', () => {
    for (const monster of bosses) {
      const markup = boss(monster.id);
      expectCleanSvg(markup);
      expectResolvedRefs(markup);
      expect(markup).toContain('viewBox="0 0 128 128"');
      expect(shapeCount(markup), monster.id).toBeLessThanOrEqual(60);
      expect(elementCount(markup), monster.id).toBeLessThanOrEqual(80);
    }
  });

  it('未知 ID 也畫得出佔位 BOSS（不會出現空白或文字）', () => {
    const markup = boss('BOSS-99');
    expectCleanSvg(markup);
    expectResolvedRefs(markup);
    expect(shapeCount(markup)).toBeGreaterThan(3);
  });

  it('同頁多個實例的漸層 id 互不衝突', () => {
    const markup = renderToStaticMarkup(
      <div>
        <BossArt monsterId="BOSS-01" />
        <BossArt monsterId="BOSS-01" />
        <AddArt mapNumber={1} />
        <MapBackdrop mapNumber={1} />
        <MapBackdrop mapNumber={1} />
      </div>,
    );
    const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).not.toMatch(/[:«»]/);
    expectResolvedRefs(markup);
  });

  it('有 title 時以 role="img" 呈現，否則為裝飾', () => {
    expect(renderToStaticMarkup(<BossArt monsterId="BOSS-02" title="琥珀蜂后" />)).toMatch(/role="img".*<title>琥珀蜂后<\/title>/);
    expect(boss('BOSS-02')).toContain('aria-hidden="true"');
  });
});

describe('BOSS 副目標', () => {
  it('12 張地圖各有一張副目標圖，彼此不同，且是乾淨的 48 格 SVG', () => {
    expect(maps.map((map) => map.number)).toEqual(Array.from({ length: 12 }, (_, index) => index + 1));
    const markups = maps.map((map) => add(map.number));
    expect(new Set(markups).size).toBe(12);
    for (const [index, markup] of markups.entries()) {
      expectCleanSvg(markup);
      expectResolvedRefs(markup);
      expect(markup).toContain('viewBox="0 0 48 48"');
      expect(shapeCount(markup), `map ${index + 1}`).toBeLessThanOrEqual(30);
    }
  });

  it('未知地圖編號畫通用佔位，不會丟錯', () => {
    const markup = add(99);
    expectCleanSvg(markup);
    expect(maps.map((map) => add(map.number))).not.toContain(markup);
  });
});

describe('地圖背景', () => {
  it('12 張背景彼此不同，viewBox 與底部對齊裁切符合戰場規格', () => {
    const markups = maps.map((map) => backdrop(map.number));
    expect(new Set(markups).size).toBe(12);
    for (const markup of markups) {
      expectCleanSvg(markup);
      expectResolvedRefs(markup);
      expect(markup).toContain('viewBox="0 0 390 272"');
      expect(markup).toContain('preserveAspectRatio="xMidYMax slice"');
      expect(markup).toContain('aria-hidden="true"');
    }
  });

  it('每張地圖 6 個區域都能渲染、守住元素預算，且王庭區（第 6 區）與起點區不同', () => {
    for (const map of maps) {
      const zones = ZONES.map((zone) => backdrop(map.number, zone));
      for (const [zone, markup] of zones.entries()) {
        expectCleanSvg(markup);
        expectResolvedRefs(markup);
        expect(shapeCount(markup), `map ${map.number} zone ${zone}`).toBeLessThanOrEqual(80);
      }
      expect(new Set(zones).size, `map ${map.number}`).toBeGreaterThanOrEqual(5);
      expect(zones[5]).not.toBe(zones[0]);
      // 省略 zoneIndex 等同第一區。
      expect(backdrop(map.number)).toBe(zones[0]);
    }
  });

  it('超出範圍或非整數的 zoneIndex 會夾回 0～5，不會丟錯', () => {
    expect(backdrop(3, 99)).toBe(backdrop(3, 5));
    expect(backdrop(3, -4)).toBe(backdrop(3, 0));
    expect(backdrop(3, Number.NaN)).toBe(backdrop(3, 0));
    expect(backdrop(3, 2.7)).toBe(backdrop(3, 2));
  });

  it('未知地圖編號使用中性佔位背景', () => {
    const markup = backdrop(42);
    expectCleanSvg(markup);
    expectResolvedRefs(markup);
    expect(maps.map((map) => backdrop(map.number))).not.toContain(markup);
  });
});

describe('地圖背景：寬度貼齊與王庭', () => {
  /** 舊版場景頂端畫的壓暗色；寬度貼齊後改由戰場 CSS 負責，場景裡不可再出現。 */
  const LEGACY_TOP_SHADE = '#120c08';

  it('天空往上延伸到 SKY_TOP，高螢幕寬度貼齊時不會露底；場景頂端不再畫暗帶', () => {
    for (const map of maps) {
      for (const zone of ZONES) {
        const markup = backdrop(map.number, zone);
        expect(markup, `map ${map.number} zone ${zone}`).toContain(`y="${SKY_TOP}"`);
        expect(markup, `map ${map.number} zone ${zone}`).not.toContain(LEGACY_TOP_SHADE);
      }
    }
    expect(backdrop(42)).toContain(`y="${SKY_TOP}"`);
  });

  it('第 2 區起的暮色也從 SKY_TOP 蓋到底部；起點區沒有暮色', () => {
    const tintHeight = `height="${H - SKY_TOP}"`;
    for (const map of maps) {
      expect(backdrop(map.number, 0), `map ${map.number}`).not.toContain(tintHeight);
      for (const zone of ZONES.slice(1)) expect(backdrop(map.number, zone), `map ${map.number} zone ${zone}`).toContain(tintHeight);
    }
  });

  it('王庭區有地面暗角與 BOSS 腳下聚光，其他區沒有', () => {
    const vignette = /<radialGradient[^>]*cx="0.5" cy="0" r="1"/;
    for (const map of maps) {
      expect(backdrop(map.number, 5), `map ${map.number}`).toMatch(vignette);
      for (const zone of ZONES.slice(0, 5)) expect(backdrop(map.number, zone), `map ${map.number} zone ${zone}`).not.toMatch(vignette);
    }
  });
});

describe('背景光線（給戰場決定邊光）', () => {
  /** 實測角色身後亮度約 0.03～0.17 的地圖：礦山、古鎮、火山、花園、書庫。 */
  const DARK_MAPS = [3, 4, 8, 10, 12];
  /** 邊光太亮會像「已選取」的框，透明度上限 0.6。 */
  const RIM_ALPHA_MAX = 0.6;

  it('每張地圖都登記一次，起點區的暗色圖符合實測', () => {
    expect(SCENE_ENTRIES.map((entry) => entry.mapNumber)).toEqual(maps.map((map) => map.number));
    expect(maps.filter((map) => backdropToneFor(map.number) === 'dark').map((map) => map.number)).toEqual(DARK_MAPS);
  });

  it('邊光顏色都是含透明度的 rgba，且不超過上限', () => {
    for (const map of maps) {
      const { rim } = backdropLightFor(map.number);
      const alpha = Number(/^rgba\(\d+, \d+, \d+, ([\d.]+)\)$/.exec(rim)?.[1]);
      expect(alpha, `map ${map.number} ${rim}`).toBeGreaterThan(0);
      expect(alpha, `map ${map.number} ${rim}`).toBeLessThanOrEqual(RIM_ALPHA_MAX);
    }
  });

  it('暮色加深的後段區域可由亮轉暗（發條王城第 5、6 區），區域編號超出範圍會夾回', () => {
    expect(backdropToneFor(9, 0)).toBe('light');
    expect(backdropToneFor(9, 3)).toBe('light');
    expect(backdropToneFor(9, 4)).toBe('dark');
    expect(backdropToneFor(9, 99)).toBe('dark');
    expect(backdropToneFor(9, -3)).toBe('light');
    expect(backdropToneFor(1, 5)).toBe('light');
    expect(backdropToneFor(3)).toBe('dark');
    expect(backdropLightFor(9, 5).rim).toBe(backdropLightFor(9, 0).rim);
  });

  it('未知地圖保守地當成暗色，仍有邊光顏色', () => {
    expect(backdropToneFor(42)).toBe('dark');
    expect(backdropLightFor(42).rim).toMatch(/^rgba\(/);
  });
});

describe('背景共用形狀', () => {
  /**
   * 雲朵由三個圓＋一個切平雲底的矩形合成一條路徑。nonzero 填色規則下，
   * 矩形若與圓的繞向相反，重疊處繞數相消，雲底會挖出透明橫紋（曾實際發生過）。
   */
  it('雲底矩形與圓同為逆時針繞向，重疊處不會挖洞', () => {
    const d = cloud(40, 60, 20);
    const subpaths = d.split('M').filter(Boolean);
    const arcs = subpaths.filter((sub) => sub.includes('a'));
    const rect = subpaths.find((sub) => /[vh]/.test(sub));
    expect(arcs.length).toBe(3);
    // circles() 的圓弧 sweep-flag 全為 0：螢幕座標（y 向下）中為逆時針。
    const sweeps = arcs.flatMap((arc) => [...arc.matchAll(/a[\d.]+ [\d.]+ 0 1 (\d)/g)].map((match) => match[1]));
    expect(sweeps).toEqual(['0', '0', '0', '0', '0', '0']);
    expect(rect).toBeDefined();
    // 依序走完相對位移 v/h，以鞋帶公式求有號面積；y 向下座標中逆時針為負值，與上面的圓一致。
    const [startX = 0, startY = 0] = (rect ?? '').match(/^[-\d.]+ [-\d.]+/)?.[0].split(' ').map(Number) ?? [];
    const points: [number, number][] = [[startX, startY]];
    for (const [, axis, value] of (rect ?? '').matchAll(/([vh])(-?[\d.]+)/g)) {
      const [x, y] = points[points.length - 1]!;
      points.push(axis === 'h' ? [x + Number(value), y] : [x, y + Number(value)]);
    }
    const area = points.reduce((sum, [x, y], index) => {
      const [nx, ny] = points[(index + 1) % points.length]!;
      return sum + x * ny - nx * y;
    }, 0);
    expect(area).toBeLessThan(0);
  });
});
