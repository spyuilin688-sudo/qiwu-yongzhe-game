import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HeroArt } from '../heroes/HeroArt.tsx';
import { heroDesignFor } from '../heroes/design.ts';
import { GLOW, LINE, SKIN } from '../heroes/palette.ts';
import { Aura, SPARKLE_MIN_SIZE, Sparkles } from '../heroes/props.tsx';
import type { HeroDesign } from '../heroes/rig.tsx';
import { rotatePoint, sparklePath, tiltedEllipsePath } from '../heroes/shapes.ts';
import type { FamilyKey } from '../types.ts';

const COMBAT_FAMILIES = Object.keys({
  sword: true, bow: true, mage: true, rogue: true, priest: true, jester: true, artisan: true,
} satisfies Record<Exclude<FamilyKey, 'novice'>, true>) as Exclude<FamilyKey, 'novice'>[];
const BRANCHES = ['A', 'B'] as const;
const UID = 'test';

const design = (family: FamilyKey, tier: 1 | 2 | 3, branch: 'A' | 'B'): HeroDesign => heroDesignFor(family, tier, branch, UID);
const markupOf = (node: ReactNode): string => renderToStaticMarkup(<svg>{node}</svg>);
/** 只比形狀：去掉顏色與透明度，換色不算「換行頭」。 */
const geometryOf = (node: ReactNode): string => markupOf(node).replace(/\s(fill|stroke|stop-color|opacity)="[^"]*"/g, '');
const hero = (family: FamilyKey, tier: 0 | 1 | 2 | 3, branch: 'A' | 'B' | null): string =>
  renderToStaticMarkup(<HeroArt family={family} tier={tier} branch={branch} size={56} />);

const rgb = (hex: string): readonly number[] => [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
const colorDistance = (a: string, b: string): number => {
  const [ca, cb] = [rgb(a), rgb(b)];
  return Math.hypot(...ca.map((value, channel) => value - (cb[channel] ?? 0)));
};

/** 主色差距門檻：低於此值時 56px 並排看起來是同一件衣服（舊版法師→元素術士為 0）。 */
const MIN_TOP_COLOR_DISTANCE = 35;
/** 一轉→二轉至少要有幾項「大改變」。舊版法師→元素術士、盜賊→毒刃獵手都只有 1 項，看起來像同一張圖。 */
const MIN_OUTFIT_CHANGES = 2;

/** 一轉→二轉「換行頭」的大改變清單：主色、姿勢、頭部（帽子形狀或髮型）、臉部配件或表情、身後剪影。 */
function outfitChanges(from: HeroDesign, to: HeroDesign): string[] {
  const changes: string[] = [];
  if (colorDistance(from.outfit.top.base, to.outfit.top.base) > MIN_TOP_COLOR_DISTANCE) changes.push('主色');
  if (from.frontHand !== to.frontHand || from.backHand !== to.backHand) changes.push('姿勢');
  if (from.hair !== to.hair || geometryOf(from.headOver) !== geometryOf(to.headOver)) changes.push('頭部');
  if (from.mood !== to.mood || geometryOf(from.faceOver) !== geometryOf(to.faceOver)) changes.push('臉部');
  if (geometryOf(from.behind) !== geometryOf(to.behind)) changes.push('身後');
  return changes;
}

describe('角色美術：轉職辨識', () => {
  it('同系一轉→二轉至少有兩項大改變（不能只換顏色或只換手上道具）', () => {
    for (const family of COMBAT_FAMILIES) {
      const tier1 = design(family, 1, 'A');
      for (const branch of BRANCHES) {
        const changes = outfitChanges(tier1, design(family, 2, branch));
        expect(changes.length, `${family} 2${branch}：${changes.join('、') || '沒有'}`).toBeGreaterThanOrEqual(MIN_OUTFIT_CHANGES);
      }
    }
  });

  it('元素術士換掉一轉法師的袍色，毒刃獵手改戴蒙面巾、不再戴一轉的眼罩', () => {
    expect(colorDistance(design('mage', 1, 'A').outfit.top.base, design('mage', 2, 'A').outfit.top.base)).toBeGreaterThan(0);
    expect(geometryOf(design('rogue', 2, 'B').faceOver)).not.toBe(geometryOf(design('rogue', 1, 'A').faceOver));
    expect(geometryOf(design('rogue', 2, 'A').faceOver)).toContain(geometryOf(design('rogue', 1, 'A').faceOver).replace(/^<svg>|<\/svg>$/g, ''));
  });

  it('只有三轉有腳下魔法陣（光暈裡的雙橢圓光線），在亮色地圖上作為固定標記', () => {
    const sigil = markupOf(<Aura id="probe" color={GLOW.gold} />).match(/<path d="([^"]+)"/)?.[1];
    expect(sigil).toBeTruthy();
    for (const family of COMBAT_FAMILIES) {
      for (const branch of BRANCHES) {
        expect(hero(family, 3, branch), `${family} 3${branch}`).toContain(sigil);
        expect(hero(family, 2, branch), `${family} 2${branch}`).not.toContain(sigil);
      }
      expect(hero(family, 1, null), `${family} 1`).not.toContain(sigil);
    }
  });

  it('光暈漸層有中段，肩膀外側仍看得到光', () => {
    const stops = markupOf(<Aura id="probe" color={GLOW.gold} />).match(/<stop\b/g) ?? [];
    expect(stops.length).toBe(3);
  });
});

describe('角色美術：細節規則', () => {
  it('閃光再小也不低於最小尺寸，且多顆同色閃光只佔一個元素', () => {
    const markup = markupOf(<Sparkles spots={[{ x: 10, y: 10, size: 1 }, { x: 40, y: 40, size: 5 }]} color={GLOW.star} />);
    expect(markup.match(/<path\b/g)?.length).toBe(1);
    expect(markup).toContain(`d="${sparklePath(10, 10, SPARKLE_MIN_SIZE)}${sparklePath(40, 40, 5)}"`);
  });

  it('施法中的三轉法師與審判主教改成半睜眼；一轉祭司與聖詠祭司保留閉眼祈禱', () => {
    expect(design('mage', 3, 'A').mood).toBe('serene');
    expect(design('mage', 3, 'B').mood).toBe('serene');
    expect(design('priest', 3, 'A').mood).toBe('serene');
    expect(design('priest', 1, 'A').mood).toBe('calm');
    expect(design('priest', 2, 'A').mood).toBe('calm');
  });

  it('穿盔甲、拿重工具與盜賊系戴手套；武僧的拳套另外畫，不再設手套', () => {
    const gloved: readonly [FamilyKey, 1 | 2 | 3, 'A' | 'B'][] = [
      ['sword', 2, 'B'], ['sword', 3, 'B'], ['bow', 2, 'A'], ['bow', 3, 'A'],
      ['rogue', 1, 'A'], ['rogue', 2, 'A'], ['rogue', 3, 'B'],
      ['artisan', 1, 'A'], ['artisan', 2, 'A'], ['artisan', 3, 'B'],
    ];
    for (const [family, tier, branch] of gloved) {
      const gloves = design(family, tier, branch).outfit.gloves;
      expect(gloves, `${family} ${tier}${branch}`).toBeDefined();
      expect(gloves?.base).not.toBe(SKIN.base);
    }
    expect(design('priest', 2, 'B').outfit.gloves).toBeUndefined();
    expect(design('priest', 3, 'B').outfit.gloves).toBeUndefined();
  });

  it('千面幻術師的殘影是兩層由近到遠變淡的真身形，位移不超過畫面左緣的安全範圍', () => {
    const markup = hero('jester', 3, 'B');
    const layers = [...markup.matchAll(/transform="translate\((-?[\d.]+) (-?[\d.]+)\)" opacity="([\d.]+)"/g)].map((m) => ({
      dx: Number(m[1]),
      opacity: Number(m[3]),
    }));
    expect(layers.length).toBe(2);
    const [far, near] = layers;
    expect(far && near && far.dx < near.dx && far.opacity < near.opacity).toBe(true);
    for (const layer of layers) expect(layer.dx).toBeGreaterThanOrEqual(-12);
  });

  it('角色主體外框用外輪廓線寬，戴帽子的職業不畫被蓋住的頭髮高光', () => {
    expect(hero('sword', 1, null)).toContain(`stroke-width="${LINE.silhouette}"`);
    const hairLightCount = (markup: string): number => (markup.match(/opacity="0.8"/g) ?? []).length;
    // 劍士（沒戴帽）有頭髮高光與臉部陰影兩個 0.8 透明度圖層；法師戴尖帽只剩臉部陰影。
    expect(hairLightCount(hero('sword', 1, null))).toBe(2);
    expect(hairLightCount(hero('mage', 1, null))).toBe(1);
  });
});

describe('角色美術：路徑小工具', () => {
  it('rotatePoint 依 SVG 方向（y 朝下）順時針旋轉', () => {
    const point = rotatePoint({ x: 1, y: 0 }, { x: 0, y: 0 }, 90);
    expect(point.x).toBeCloseTo(0);
    expect(point.y).toBeCloseTo(1);
  });

  it('tiltedEllipsePath 從長軸一端畫兩段弧回到起點', () => {
    expect(tiltedEllipsePath(10, 10, 2, 1, 0)).toBe('M8 10A2 1 0 1 0 12 10A2 1 0 1 0 8 10Z');
  });
});
