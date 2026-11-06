import { expect, test, type Page } from '@playwright/test';
import { fastForward, gameState, openGame } from './helpers.ts';
import type { FixtureName } from '../src/host/devTools.ts';

/**
 * 戰場版面量測（adv-1／adv-2／adv-heroes-1／mon-1／mon-4／bf-1／bf-2／bf-5）：
 * 腳底對齊同一條地面線、同一波內敵人不換位、BOSS 不被資訊列蓋住、退出鍵完整可點、
 * 召喚台不蓋住敵人名稱、FARM_BLOCKED 不自動重試、角色立繪整場只建立一次。
 */
const PREFS_KEY = 'qiwu-yongzhe:prefs:v1';
const SIZES = [
  { width: 320, height: 568 },
  { width: 360, height: 640 },
  { width: 390, height: 844 },
] as const;
const TEXT_SCALES = [1, 2] as const;
/** 量測容許誤差（px）：次像素取整與影子內縮差異。 */
const ALIGN_TOLERANCE = 3;

interface Box {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

async function openWithPrefs(page: Page, fixture: FixtureName, textScale: number, motion: 'system' | 'on' | 'off' = 'off'): Promise<void> {
  await page.addInitScript(
    ([key, scale, preference]) => localStorage.setItem(key as string, JSON.stringify({ textScale: scale, motion: preference })),
    [PREFS_KEY, textScale, motion] as const,
  );
  await openGame(page, fixture);
}

async function startBossFight(page: Page): Promise<void> {
  await page.getByTestId('summon-boss').click();
  await page.getByTestId('start-boss').click();
  await expect(page.getByTestId('boss-bar')).toBeVisible();
}

function overlaps(a: Box, b: Box): boolean {
  return a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
}

/** 戰場內所有角色與敵人的錨點、精靈與腳下標籤位置。 */
async function measureField(page: Page) {
  return page.evaluate(() => {
    const box = (element: Element | null) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    };
    const viewport = document.querySelector('[data-testid="battle-viewport"]')!;
    const hero = document.querySelector('[aria-label="角色"]')!;
    return {
      viewport: box(viewport)!,
      hero: box(hero)!,
      heroSvg: box(hero.querySelector('svg'))!,
      enemies: [...document.querySelectorAll('[data-enemy-kind]')].map((element) => ({
        kind: (element as HTMLElement).dataset.enemyKind!,
        anchor: box(element)!,
        svg: box(element.querySelector('svg'))!,
        labels: [...element.querySelectorAll('[role="meter"], span')].map((label) => box(label)!).filter((label) => label.right > label.left),
      })),
      summon: box(document.querySelector('[data-testid="summon-boss"]')),
      bossBar: box(document.querySelector('[data-testid="boss-bar"]')),
    };
  });
}

for (const size of SIZES) {
  for (const textScale of TEXT_SCALES) {
    test.describe(`${size.width}×${size.height} 字級 ${textScale * 100}%`, () => {
      test.use({ viewport: size });

      test('角色與小怪腳底在同一條地面線，名稱不把身體往上推', async ({ page }) => {
        await openWithPrefs(page, 'route:JOB28', textScale);
        await page.waitForSelector('[data-enemy-kind="normal"]');
        const field = await measureField(page);
        expect(field.enemies.length).toBeGreaterThan(0);
        for (const enemy of field.enemies) {
          expect(Math.abs(enemy.anchor.bottom - field.hero.bottom), '敵人與角色的腳底線').toBeLessThanOrEqual(ALIGN_TOLERANCE);
          expect(Math.abs(enemy.svg.bottom - field.heroSvg.bottom), '影子位置').toBeLessThanOrEqual(ALIGN_TOLERANCE);
          for (const label of enemy.labels) expect(label.bottom, '腳下標籤不可超出戰場底部').toBeLessThanOrEqual(field.viewport.bottom + 0.5);
        }
        expect(field.heroSvg.top, '角色頂端在戰場內').toBeGreaterThanOrEqual(field.viewport.top - 0.5);
      });

      test('BOSS 圖不高於血條底部，退出鍵完整在畫面內', async ({ page }) => {
        await openWithPrefs(page, 'bossStrong', textScale);
        await startBossFight(page);
        const exit = page.getByRole('button', { name: '退出', exact: true });
        await exit.scrollIntoViewIfNeeded();
        const field = await measureField(page);
        const boss = field.enemies.find((enemy) => enemy.kind === 'boss');
        expect(boss, 'BOSS 本體').toBeTruthy();
        expect(boss!.svg.top, 'BOSS 圖頂端 ≥ BOSS 資訊列底部').toBeGreaterThanOrEqual(field.bossBar!.bottom - 0.5);
        expect(Math.abs(boss!.anchor.bottom - field.hero.bottom), 'BOSS 與角色腳底線').toBeLessThanOrEqual(ALIGN_TOLERANCE);
        const exitBox = await exit.boundingBox();
        expect(exitBox!.x).toBeGreaterThanOrEqual(0);
        expect(exitBox!.y).toBeGreaterThanOrEqual(0);
        expect(exitBox!.x + exitBox!.width, '退出鍵右緣').toBeLessThanOrEqual(size.width + 0.5);
        expect(exitBox!.y + exitBox!.height).toBeLessThanOrEqual(size.height + 0.5);
        expect(exitBox!.height, '退出鍵高度').toBeGreaterThanOrEqual(44);
        const exitLines = await exit.evaluate((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
        });
        expect(exitLines, '「退出」只佔一行，不直排').toBe(1);
      });

      test('召喚台不蓋住敵人與名稱', async ({ page }) => {
        await openWithPrefs(page, 'bossReady', textScale);
        await page.waitForSelector('[data-enemy-kind="normal"]');
        const field = await measureField(page);
        expect(field.summon, '召喚鍵').not.toBeNull();
        for (const enemy of field.enemies) {
          expect(overlaps(enemy.svg, field.summon!), '召喚鍵與敵人圖重疊').toBe(false);
          for (const label of enemy.labels) expect(overlaps(label, field.summon!), '召喚鍵與敵人名稱或血條重疊').toBe(false);
        }
        expect(field.summon!.bottom, '召喚鍵在戰場內').toBeLessThanOrEqual(field.viewport.bottom + 0.5);
      });
    });
  }
}

test.describe('站位與立繪穩定', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('同一波內前面的怪倒下，其餘敵人不換位', async ({ page }) => {
    await openWithPrefs(page, 'gold', 1);
    await page.waitForSelector('[data-enemy-kind="normal"]');
    const samples = await page.evaluate(
      () =>
        new Promise<{ uid: string; left: number }[][]>((resolve) => {
          const frames: { uid: string; left: number }[][] = [];
          const timer = setInterval(() => {
            frames.push(
              [...document.querySelectorAll<HTMLElement>('[data-enemy-uid]')].map((element) => ({ uid: element.dataset.enemyUid!, left: Math.round(element.getBoundingClientRect().left + element.getBoundingClientRect().width / 2) })),
            );
          }, 100);
          setTimeout(() => {
            clearInterval(timer);
            resolve(frames);
          }, 12_000);
        }),
    );
    const firstX = new Map<string, number>();
    let partialDeaths = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const frame = samples[index]!;
      for (const { uid, left } of frame) {
        const seen = firstX.get(uid);
        if (seen === undefined) firstX.set(uid, left);
        else expect(Math.abs(seen - left), `敵人 ${uid} 換位`).toBeLessThanOrEqual(1);
      }
      const previous = samples[index - 1];
      if (previous && frame.length > 0 && frame.length < previous.length && frame.every((item) => previous.some((old) => old.uid === item.uid))) partialDeaths += 1;
    }
    expect(partialDeaths, '量測期間至少有一次「前面的怪倒下、其餘還在」').toBeGreaterThan(0);
  });

  test('角色立繪整場只建立一次（出手不重掛 SVG）', async ({ page }) => {
    await openWithPrefs(page, 'route:JOB03', 1);
    await page.waitForSelector('[data-enemy-kind]');
    await page.evaluate(() => {
      (document.querySelector('[aria-label="角色"] svg') as SVGElement & { __battleMark?: boolean }).__battleMark = true;
    });
    const beats = new Set<string>();
    for (let step = 0; step < 15; step += 1) {
      beats.add((await page.locator('[aria-label="角色"] [data-beat]').getAttribute('data-beat')) ?? '');
      await page.waitForTimeout(200);
    }
    expect(beats.size, '期間有出手（data-beat 交替）').toBeGreaterThan(1);
    const same = await page.evaluate(() => (document.querySelector('[aria-label="角色"] svg') as SVGElement & { __battleMark?: boolean }).__battleMark === true);
    expect(same, '角色 SVG 仍是同一個節點').toBe(true);
  });

  test('飄字落在目標欄位上方，不跳到中間欄', async ({ page }) => {
    await openWithPrefs(page, 'route:JOB03', 1);
    await page.waitForSelector('[data-enemy-kind]');
    const floats = await page.evaluate(
      () =>
        new Promise<{ cx: number; bottom: number; slotXs: number[]; foot: number }[]>((resolve) => {
          const found: { cx: number; bottom: number; slotXs: number[]; foot: number }[] = [];
          const viewport = document.querySelector('[data-testid="battle-viewport"]')!.getBoundingClientRect();
          const foot = document.querySelector('[aria-label="角色"]')!.getBoundingClientRect().bottom;
          const slotXs = [0.62, 0.76, 0.9].map((ratio) => viewport.left + viewport.width * ratio);
          const timer = setInterval(() => {
            for (const element of document.querySelectorAll('[class*="float"][data-anchor]')) {
              const rect = element.getBoundingClientRect();
              found.push({ cx: rect.left + rect.width / 2, bottom: rect.bottom, slotXs, foot });
            }
          }, 50);
          setTimeout(() => {
            clearInterval(timer);
            resolve(found);
          }, 4000);
        }),
    );
    expect(floats.length, '量測期間有飄字').toBeGreaterThan(0);
    // 飄字中心只會在三個欄位附近（左右錯開 6px＋暴擊放大），而且一律在腳底線上方。
    const FLOAT_X_TOLERANCE = 14;
    for (const item of floats) {
      expect(Math.min(...item.slotXs.map((x) => Math.abs(x - item.cx))), '飄字離最近欄位的距離').toBeLessThanOrEqual(FLOAT_X_TOLERANCE);
      expect(item.bottom).toBeLessThan(item.foot);
    }
  });

  test('減少動態效果時仍顯示技能名稱', async ({ page }) => {
    await openWithPrefs(page, 'route:JOB03', 1, 'on');
    await page.waitForSelector('[data-enemy-kind]');
    await expect(page.locator('[aria-label="角色"] [class*="skillPop"]').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('BOSS 未通過（FARM_BLOCKED）', () => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
  ]) {
    test(`${viewport.width}×${viewport.height}：提示在召喚台內、不蓋住敵人，且不會自動再挑戰`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openWithPrefs(page, 'bossReady', 1);
      await startBossFight(page);
      await fastForward(page, 61_000);
      await page.getByTestId('boss-result-ok').click();
      await expect(page.getByText('BOSS 未通過：先鑑定變強，再手動召喚')).toBeVisible();
      await page.waitForSelector('[data-enemy-kind="normal"]');
      const field = await measureField(page);
      const hint = await page.getByText('BOSS 未通過：先鑑定變強，再手動召喚').boundingBox();
      const hintBox = { left: hint!.x, top: hint!.y, right: hint!.x + hint!.width, bottom: hint!.y + hint!.height };
      for (const enemy of field.enemies) {
        expect(overlaps(enemy.svg, hintBox), '提示蓋住敵人').toBe(false);
        for (const label of enemy.labels) expect(overlaps(label, hintBox), '提示蓋住敵人名稱或血條').toBe(false);
      }
      const sameDock = await page.getByText('BOSS 未通過：先鑑定變強，再手動召喚').evaluate((element) => Boolean(element.parentElement?.querySelector('[data-testid="summon-boss"]')));
      expect(sameDock, '提示與召喚鍵在同一條召喚台').toBe(true);
      await expect(page.getByTestId('summon-boss')).toBeEnabled();
      await fastForward(page, 5_000);
      expect((await gameState(page)).progress.mode, '未通過後不自動重試 BOSS').toBe('FARM_BLOCKED');
      await expect(page.getByTestId('boss-bar')).toHaveCount(0);
    });
  }
});
