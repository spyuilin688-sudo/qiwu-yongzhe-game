import { expect, test, type Locator, type Page } from '@playwright/test';
import { openGame } from './helpers.ts';

/** 設計系統共用元件：提示位置、確認對話、偏好設定（減少動態三選一、字體大小單選）。 */

const PREFS_KEY = 'qiwu-yongzhe:prefs:v1';

async function box(locator: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  const rect = await locator.boundingBox();
  expect(rect, '元素應可見').not.toBeNull();
  return rect!;
}

async function reloadWithPrefs(page: Page, prefs: Record<string, unknown>): Promise<void> {
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [PREFS_KEY, JSON.stringify(prefs)] as const);
  await page.reload();
  await page.waitForFunction(() => Boolean(window.__qiwuDev));
}

test.describe('提示（Toast）不遮住面板表頭與資源數字', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('面板開著時，提示落在面板上緣之上', async ({ page }) => {
    await openGame(page, 'gold');
    await page.getByTestId('identify-once').click();
    await page.getByTestId('equip-item').click();
    await expect(page.getByTestId('item-sheet')).toHaveCount(0);
    // 穿戴的提示還在時再開一次鑑定結果面板。
    await page.getByTestId('identify-once').click();
    const sheet = page.getByTestId('item-sheet');
    await expect(sheet).toBeVisible();
    const toast = page.getByTestId('toast').filter({ hasText: '已穿戴' });
    await expect(toast).toBeVisible();
    // 等面板滑入動畫結束再量位置。
    await page.waitForTimeout(400);
    const [toastBox, sheetBox] = [await box(toast), await box(sheet)];
    expect(toastBox.y + toastBox.height, '提示底端不得壓到面板上緣').toBeLessThanOrEqual(sheetBox.y + 0.5);
  });

  test('字體 200% 時，出售提示不蓋住資源列的金幣數字', async ({ page }) => {
    await openGame(page, 'gold');
    await reloadWithPrefs(page, { textScale: 2, motion: 'on' });
    await page.getByTestId('identify-once').scrollIntoViewIfNeeded();
    await page.getByTestId('identify-once').click();
    await expect(page.getByTestId('item-sheet')).toBeVisible();
    await page.getByTestId('sell-item').click();
    await expect(page.getByTestId('item-sheet')).toHaveCount(0);
    const toast = page.getByTestId('toast').filter({ hasText: '已出售' });
    await expect(toast).toBeVisible();
    const [toastBox, goldBox] = [await box(toast), await box(page.getByTestId('gold-value'))];
    expect(toastBox.y, '提示應在金幣數字下方').toBeGreaterThanOrEqual(goldBox.y + goldBox.height);
  });
});

test.describe('確認對話在 200% 字體的短螢幕仍完整可用', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('標題在畫面內、兩顆按鈕都可點，返回鍵只關確認層', async ({ page }) => {
    await openGame(page, 'gold');
    await reloadWithPrefs(page, { textScale: 2, motion: 'on' });
    await page.getByRole('button', { name: '更多：設定與版本' }).click();
    await expect(page.getByTestId('settings-sheet')).toBeVisible();
    await page.getByRole('button', { name: /清除本機存檔/ }).click();
    const dialog = page.getByRole('alertdialog', { name: '清除本機存檔？' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleDescription(/無法復原/);
    const title = await box(dialog.getByRole('heading', { name: '清除本機存檔？' }));
    expect(title.y, '標題不可被推出畫面頂端').toBeGreaterThanOrEqual(0);
    const viewport = page.viewportSize()!;
    for (const name of ['取消', '清除並重新開始']) {
      const button = await box(dialog.getByRole('button', { name, exact: true }));
      expect(button.height, `${name} 高度`).toBeGreaterThanOrEqual(44);
      expect(button.y + button.height, `${name} 需在畫面內`).toBeLessThanOrEqual(viewport.height + 0.5);
    }
    await expect(dialog.getByRole('button', { name: '取消', exact: true })).toBeFocused();
    await page.goBack();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId('settings-sheet')).toBeVisible();
  });
});

test.describe('偏好設定', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('舊版布林偏好相容：true → 開；改成「關」會明確寫入 false 蓋過系統設定', async ({ page }) => {
    await openGame(page, 'gold');
    await reloadWithPrefs(page, { textScale: 1, reducedMotion: true });
    await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
    await page.getByRole('button', { name: '更多：設定與版本' }).click();
    const motion = page.getByRole('radiogroup', { name: '減少動態效果' });
    await expect(motion.getByRole('radio', { name: '開', exact: true })).toHaveAttribute('aria-checked', 'true');
    await motion.getByRole('radio', { name: '關', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'false');
    await motion.getByRole('radio', { name: '跟隨系統' }).click();
    await expect(page.locator('html')).not.toHaveAttribute('data-reduced-motion', /.*/);
  });

  test('舊版 false 對應「跟隨系統」，並顯示系統目前的設定', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openGame(page, 'gold');
    await reloadWithPrefs(page, { textScale: 1, reducedMotion: false });
    await page.getByRole('button', { name: '更多：設定與版本' }).click();
    const motion = page.getByRole('radiogroup', { name: '減少動態效果' });
    await expect(motion.getByRole('radio', { name: '跟隨系統' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('settings-sheet')).toContainText('系統目前：開');
  });

  test('字體大小是單選：選 200% 後整頁放大並保存', async ({ page }) => {
    await openGame(page, 'gold');
    await page.getByRole('button', { name: '更多：設定與版本' }).click();
    const scale = page.getByRole('radiogroup', { name: '字體大小' });
    await expect(scale.getByRole('radio')).toHaveCount(4);
    await scale.getByRole('radio', { name: '200%' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-text-scale', '2');
    await expect(scale.getByRole('radio', { name: '200%' })).toHaveAttribute('aria-checked', 'true');
    await expect(scale.getByRole('radio', { name: '100%' })).toHaveAttribute('aria-checked', 'false');
    const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}') as { textScale?: number }, PREFS_KEY);
    expect(saved.textScale).toBe(2);
  });
});
