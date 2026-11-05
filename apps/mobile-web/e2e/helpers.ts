import { expect, type Page } from '@playwright/test';
import type { FixtureName } from '../src/host/devTools.ts';

export async function openGame(page: Page, fixture: FixtureName = 'fresh'): Promise<void> {
  await page.goto('/?latency=0');
  await page.waitForFunction(() => Boolean(window.__qiwuDev));
  await page.evaluate((name) => window.__qiwuDev!.loadFixture(name), fixture);
  await expect(page.getByTestId('app-frame')).toBeVisible();
  await expect(page.getByTestId('host-blocker')).toHaveCount(0);
}

export async function fastForward(page: Page, ms: number): Promise<void> {
  await page.evaluate((duration) => window.__qiwuDev!.fastForward(duration), ms);
}

export async function gameState(page: Page): Promise<{
  wallet: { gold: number; relics: number; benchLevel: number };
  player: { level: number; xp: number; currentJobId: string };
  progress: { mapNumber: number; localStage: number; mode: string };
  items: Record<string, unknown>;
  boss: { active: unknown; history: { result: string }[] };
  loadouts: Record<string, { items: Record<string, string> }>;
}> {
  return page.evaluate(() => JSON.parse(JSON.stringify(window.__qiwuDev!.state())));
}

/** 檢查沒有橫向超框：文件寬度不得大於視窗寬度。 */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    offenders: [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        if (style.visibility === 'hidden' || rect.width === 0) return false;
        if (element.closest('[aria-hidden="true"]')) return false;
        // 可橫向捲動的篩選列屬刻意設計，不算超框。
        if (element.closest('[role="group"]')) return false;
        return rect.right > window.innerWidth + 1 || rect.left < -1;
      })
      .slice(0, 5)
      .map((element) => `${element.tagName}.${element.className} → ${Math.round(element.getBoundingClientRect().right)}`),
  }));
  expect(metrics.scrollWidth, `文件寬 ${metrics.scrollWidth} > 視窗 ${metrics.innerWidth}`).toBeLessThanOrEqual(metrics.innerWidth);
  expect(metrics.offenders, '有元素超出視窗左右邊界').toEqual([]);
}

/** 檢查元素完整位於可視區且觸控高度足夠。 */
export async function expectTappable(page: Page, testId: string, minSize = 44): Promise<void> {
  const box = await page.getByTestId(testId).boundingBox();
  expect(box, `${testId} 應可見`).not.toBeNull();
  const viewport = page.viewportSize()!;
  expect(box!.height, `${testId} 高度`).toBeGreaterThanOrEqual(minSize);
  expect(box!.y, `${testId} 頂端`).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height, `${testId} 底端需在視窗內`).toBeLessThanOrEqual(viewport.height + 0.5);
  expect(box!.x + box!.width, `${testId} 右緣需在視窗內`).toBeLessThanOrEqual(viewport.width + 0.5);
}
