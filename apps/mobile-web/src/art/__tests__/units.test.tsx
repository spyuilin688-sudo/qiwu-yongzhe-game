import { UNIT_KINDS, type UnitKind } from '@qiwu/content';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  UNIT_ART_FOOT,
  UNIT_FX_KINDS,
  UnitArt,
  UnitFxArt,
  ZONE_ART_ASPECT,
  ZONE_GROUND_RATIO,
  ZONE_VARIANTS,
  zoneVariantFor,
} from '../units/UnitArt.tsx';

/**
 * 召喚物元素上限：精修前的元素數 ×1.5（審查 bf-16 的約束）。
 * 戰場最多同時 3 隻召喚物加 1 個區域，超過代表細節在 30～40px 已看不見，也拖慢重繪。
 */
const UNIT_ELEMENT_BUDGET: Readonly<Record<UnitKind, number>> = {
  beast: 24,
  phantom: 21,
  decoy: 21,
  turret: 18,
  mech: 18,
  zone: 10,
};
/** 根 <svg> 與統一描邊的外層 <g> 不算在設計本身的元素裡。 */
const WRAPPER_ELEMENTS = 2;

const elementsOf = (markup: string): number => (markup.match(/<[a-zA-Z]+/g) ?? []).length - WRAPPER_ELEMENTS;

function expectCleanUnitSvg(markup: string): void {
  expect(markup.startsWith('<svg')).toBe(true);
  // 只用基本向量元素：不得有點陣圖、外部連結、文字（例如血量數字）、濾鏡或 SMIL 動畫。
  expect(markup).not.toMatch(/<image|<text|<filter|<animate|<set\b|<foreignObject|href=|data:|url\(/);
  // 路徑產生器參數填錯時會輸出空路徑或 NaN，瀏覽器只會默默略過該形狀。
  expect(markup).not.toMatch(/ d="(M?Z)?"|NaN|undefined/);
}

describe('召喚物原創 SVG', () => {
  it('每種召喚物乾淨、守住元素上限，且彼此不同', () => {
    const markups = UNIT_KINDS.map((kind) => renderToStaticMarkup(<UnitArt kind={kind} size={32} />));
    for (const [index, markup] of markups.entries()) {
      const kind = UNIT_KINDS[index]!;
      expectCleanUnitSvg(markup);
      expect(elementsOf(markup), `${kind} 元素數`).toBeLessThanOrEqual(UNIT_ELEMENT_BUDGET[kind]);
    }
    expect(new Set(markups).size).toBe(UNIT_KINDS.length);
  });

  it('戰場動畫要用的掛鉤都在：替身引信、機甲噴焰、砲台砲口、區域刻紋圈與火星', () => {
    expect(renderToStaticMarkup(<UnitArt kind="decoy" />)).toContain('data-unit-part="fuse"');
    expect(renderToStaticMarkup(<UnitArt kind="mech" />)).toContain('data-unit-part="thruster"');
    expect(renderToStaticMarkup(<UnitArt kind="turret" />)).toContain('data-unit-part="muzzle"');
    for (const variant of ZONE_VARIANTS) {
      const markup = renderToStaticMarkup(<UnitArt kind="zone" zoneVariant={variant} />);
      expect(markup).toContain('data-zone-part="ring"');
      expect(markup).toContain('data-zone-part="sparks"');
    }
  });
});

describe('區域（星陣／餘燼）', () => {
  it('兩種外觀不同，省略時為星陣；viewBox 扁長，刻紋圈描邊不隨縮放變粗', () => {
    const star = renderToStaticMarkup(<UnitArt kind="zone" />);
    const ember = renderToStaticMarkup(<UnitArt kind="zone" zoneVariant="ember" />);
    expect(star).toBe(renderToStaticMarkup(<UnitArt kind="zone" zoneVariant="star" />));
    expect(ember).not.toBe(star);
    for (const markup of [star, ember]) {
      expectCleanUnitSvg(markup);
      expect(markup).toContain('viewBox="0 0 160 40"');
      expect(markup).toContain('vector-effect="non-scaling-stroke"');
      expect(elementsOf(markup)).toBeLessThanOrEqual(UNIT_ELEMENT_BUDGET.zone);
    }
  });

  it('非區域的召喚物忽略 zoneVariant', () => {
    expect(renderToStaticMarkup(<UnitArt kind="beast" zoneVariant="ember" />)).toBe(renderToStaticMarkup(<UnitArt kind="beast" />));
  });

  it('依 capGroup 決定外觀：熔爐餘燼為 ember，其餘（含未提供）為 star', () => {
    expect(zoneVariantFor('FORGE_EMBER')).toBe('ember');
    expect(zoneVariantFor('zone')).toBe('star');
    expect(zoneVariantFor(undefined)).toBe('star');
    expect(zoneVariantFor('')).toBe('star');
  });

  it('對齊用比例：4:1 扁長，橢圓中心在圖高 62.5% 處，與腳點表一致', () => {
    expect(ZONE_ART_ASPECT).toBe(4);
    expect(ZONE_GROUND_RATIO).toBeCloseTo(0.625);
    expect(UNIT_ART_FOOT.zone.width / UNIT_ART_FOOT.zone.height).toBe(ZONE_ART_ASPECT);
    expect(UNIT_ART_FOOT.zone.shadowY / UNIT_ART_FOOT.zone.height).toBeCloseTo(ZONE_GROUND_RATIO);
    expect(renderToStaticMarkup(<UnitArt kind="zone" />)).toContain(`cy="${UNIT_ART_FOOT.zone.shadowY}"`);
    expect(renderToStaticMarkup(<UnitArt kind="beast" />)).toContain(`cy="${UNIT_ART_FOOT.unit.shadowY}"`);
  });
});

describe('召喚物特效', () => {
  it('爆炸星與砲口火光都是乾淨的 40 格裝飾 SVG，彼此不同', () => {
    const markups = UNIT_FX_KINDS.map((effect) => renderToStaticMarkup(<UnitFxArt effect={effect} size={32} />));
    for (const markup of markups) {
      expectCleanUnitSvg(markup);
      expect(markup).toContain('viewBox="0 0 40 40"');
      expect(markup).toContain('aria-hidden="true"');
    }
    expect(new Set(markups).size).toBe(UNIT_FX_KINDS.length);
  });
});
