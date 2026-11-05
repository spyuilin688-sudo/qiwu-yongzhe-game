import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, expectTappable, openGame } from './helpers.ts';

/** T-23／T-24：320／360／390／430 寬與短螢幕；不超框、主按鈕可點、不被底部導覽蓋住。 */
const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 390, height: 700 },
  { width: 360, height: 560 },
] as const;

const TABS = [
  { label: '角色', screen: 'character' },
  { label: '技能', screen: 'skills' },
  { label: '圖鑑', screen: 'codex' },
  { label: '冒險', screen: 'adventure' },
] as const;

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport });

    test('冒險頁主操作可點且不超框', async ({ page }) => {
      await openGame(page, 'gold');
      await expectNoHorizontalOverflow(page);
      await expectTappable(page, 'identify-once');
      await expectTappable(page, 'auto-identify');
      const nav = await page.getByRole('navigation', { name: '主要頁面' }).boundingBox();
      const identify = await page.getByTestId('identify-once').boundingBox();
      expect(identify!.y + identify!.height, '鑑定按鈕不可被底部導覽蓋住').toBeLessThanOrEqual(nav!.y + 0.5);
      const battle = await page.getByTestId('battle-viewport').boundingBox();
      expect(battle!.height, '戰場至少 180 高').toBeGreaterThanOrEqual(179.5);
    });

    test('四個頁面都不超框', async ({ page }) => {
      await openGame(page, 'swordSaint');
      for (const tab of TABS) {
        await page.getByRole('navigation', { name: '主要頁面' }).getByRole('button', { name: tab.label }).click();
        await expect(page.locator(`[data-screen="${tab.screen}"]`)).toBeVisible();
        await expectNoHorizontalOverflow(page);
      }
    });

    test('面板開啟時關閉與操作鍵可點', async ({ page }) => {
      await openGame(page, 'gold');
      await page.getByTestId('identify-once').click();
      await expect(page.getByTestId('item-sheet')).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectTappable(page, 'sell-item');
      await expectTappable(page, 'equip-item');
      await expectTappable(page, 'keep-item');
      await page.getByRole('button', { name: '關閉', exact: true }).click();
      await expect(page.getByTestId('item-sheet')).toHaveCount(0);
    });
  });
}

test.describe('BOSS 戰版面', () => {
  test.use({ viewport: { width: 320, height: 568 } });
  test('BOSS 倒數與血條在窄螢幕可見', async ({ page }) => {
    await openGame(page, 'bossReady');
    await page.getByTestId('summon-boss').click();
    await expectTappable(page, 'start-boss');
    await page.getByTestId('start-boss').click();
    await expect(page.getByTestId('boss-bar')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

test.describe('字體放大 200%', () => {
  test.use({ viewport: { width: 360, height: 640 } });
  test('內容改為可捲動，不橫向超框，確認鍵仍可點', async ({ page }) => {
    await openGame(page, 'gold');
    await page.evaluate(() => {
      localStorage.setItem('qiwu-yongzhe:prefs:v1', JSON.stringify({ textScale: 2, reducedMotion: true }));
    });
    await page.reload();
    await page.waitForFunction(() => Boolean(window.__qiwuDev));
    await expectNoHorizontalOverflow(page);
    await page.getByTestId('identify-once').scrollIntoViewIfNeeded();
    await page.getByTestId('identify-once').click();
    await expect(page.getByTestId('item-sheet')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectTappable(page, 'keep-item');
  });
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 360, height: 640 },
  { width: 390, height: 700 },
]) {
  test.describe(`回歸 ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport });

    test('資源列數字不被裁切', async ({ page }) => {
      await openGame(page, 'gold');
      for (const id of ['gold-value', 'relic-value']) {
        const clipped = await page.getByTestId(id).evaluate((element) => element.scrollWidth > element.clientWidth + 1);
        expect(clipped, `${id} 不可被省略號裁切`).toBe(false);
      }
    });

    test('展開裝備後鑑定主操作仍在底部導覽之上', async ({ page }) => {
      await openGame(page, 'gold');
      const toggle = page.getByRole('button', { name: /清怪裝備/ });
      if (await toggle.isVisible()) await toggle.click();
      await expectTappable(page, 'identify-once');
      const nav = await page.getByRole('navigation', { name: '主要頁面' }).boundingBox();
      const identify = await page.getByTestId('identify-once').boundingBox();
      expect(identify!.y + identify!.height).toBeLessThanOrEqual(nav!.y + 0.5);
    });

    test('召喚 BOSS 按鈕不蓋住敵人名稱', async ({ page }) => {
      await openGame(page, 'bossReady');
      await page.waitForSelector('[data-enemy-kind="normal"]');
      const button = await page.getByTestId('summon-boss').boundingBox();
      const names = await page.locator('[data-enemy-kind] span').evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom };
        }),
      );
      for (const name of names) {
        const overlap = name.right > button!.x && name.x < button!.x + button!.width && name.bottom > button!.y && name.y < button!.y + button!.height;
        expect(overlap, '敵人名稱與召喚按鈕重疊').toBe(false);
      }
    });
  });
}

test.describe('返回鍵一次只關一層', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('面板上的確認對話：返回只關確認，面板仍在', async ({ page }) => {
    await openGame(page, 'gold');
    await page.getByRole('button', { name: /更多/ }).click();
    await expect(page.getByTestId('settings-sheet')).toBeVisible();
    await page.getByRole('button', { name: /清除本機存檔/ }).click();
    await expect(page.getByRole('alertdialog', { name: '清除本機存檔？' })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('alertdialog', { name: '清除本機存檔？' })).toHaveCount(0);
    await expect(page.getByTestId('settings-sheet')).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId('settings-sheet')).toHaveCount(0);
    await expect(page.getByTestId('app-frame')).toBeVisible();
  });

  test('BOSS 戰中只有確認對話：返回只關對話，不離開遊戲', async ({ page }) => {
    await openGame(page, 'bossReady');
    await page.getByTestId('summon-boss').click();
    await page.getByTestId('start-boss').click();
    await page.getByRole('button', { name: '退出' }).click();
    await expect(page.getByRole('alertdialog', { name: '退出 BOSS 挑戰？' })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('alertdialog', { name: '退出 BOSS 挑戰？' })).toHaveCount(0);
    await expect(page.getByTestId('boss-bar')).toBeVisible();
    expect(page.url()).toContain('localhost');
  });
});
