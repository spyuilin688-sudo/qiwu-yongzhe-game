import { expect, test } from '@playwright/test';
import { fastForward, gameState, openGame } from './helpers.ts';

test.use({ viewport: { width: 390, height: 844 } });

const nav = (label: string) => `nav[aria-label="主要頁面"] >> role=button[name="${label}"]`;

test('Lv10 解鎖一轉並切換：技能列出現招式、不給經驗或金幣', async ({ page }) => {
  await openGame(page, 'lv10');
  const before = await gameState(page);
  await page.locator(nav('角色')).click();
  await page.getByRole('radio', { name: '職業' }).click();
  await page.locator('[data-job="JOB01"]').click();
  await expect(page.getByTestId('job-switch-sheet')).toBeVisible();
  await page.getByTestId('confirm-job-switch').click();
  await expect(page.getByTestId('job-switch-sheet')).toHaveCount(0);
  const after = await gameState(page);
  expect(after.player.currentJobId).toBe('JOB01');
  expect(after.player.xp).toBe(before.player.xp);
  expect(after.wallet.gold).toBe(before.wallet.gold);
  await page.locator(nav('冒險')).click();
  await expect(page.getByRole('button', { name: /橫掃斬/ })).toBeVisible();
  await expect(page.getByTestId('route-picker')).toContainText('劍士');
});

test('第二輪補完的路線可解鎖並切換：破陣騎士的招式出現在技能列', async ({ page }) => {
  await openGame(page, 'swordSaint');
  const before = await gameState(page);
  await page.locator(nav('角色')).click();
  await page.getByRole('radio', { name: '職業' }).click();
  const node = page.locator('[data-job="JOB04"]');
  await expect(node).toBeEnabled();
  await expect(node).toContainText('可解鎖');
  await node.click();
  await expect(page.getByTestId('job-switch-sheet')).toBeVisible();
  await page.getByTestId('confirm-job-switch').click();
  await expect(page.getByTestId('job-switch-sheet')).toHaveCount(0);
  const after = await gameState(page);
  expect(after.player.currentJobId).toBe('JOB04');
  // 轉職不給經驗或金幣（C：經驗只來自鑑定、金幣只來自出售）。
  expect(after.player.xp).toBe(before.player.xp);
  expect(after.wallet.gold).toBe(before.wallet.gold);
  await page.locator(nav('冒險')).click();
  await expect(page.getByRole('button', { name: /盾刃突擊/ })).toBeVisible();
});

test('自動出售需確認條件；開啟後自動鑑定的普通裝備自動換成金幣', async ({ page }) => {
  await openGame(page, 'gold');
  await page.getByTestId('filter-open').click();
  await page.getByRole('switch', { name: /自動出售不符合保留條件/ }).click();
  await page.getByTestId('save-filter').click();
  await expect(page.getByRole('alertdialog', { name: '開啟自動出售？' })).toBeVisible();
  await page.getByRole('button', { name: '確認並儲存' }).click();
  await expect(page.getByTestId('filter-sheet')).toHaveCount(0);
  const before = await gameState(page);
  await page.getByTestId('auto-identify').click();
  await expect.poll(async () => (await gameState(page)).wallet.relics, { timeout: 25_000 }).toBe(0);
  // 等最後一筆自動出售送完
  await page.waitForTimeout(800);
  const after = await gameState(page);
  expect(after.wallet.gold).toBeGreaterThan(before.wallet.gold);
  for (const item of Object.values(after.items) as { qualityId: string }[]) expect(item.qualityId).not.toBe('Q1');
});

test('兩個分頁同時開啟：只有一個能推進戰鬥，另一個需接管（T-28）', async ({ page, context }) => {
  await openGame(page, 'gold');
  const second = await context.newPage();
  await second.setViewportSize({ width: 390, height: 844 });
  await second.goto('/?latency=0');
  await expect(second.getByTestId('host-blocker')).toContainText('遊戲已在其他分頁執行');
  await second.getByRole('button', { name: '在此分頁接管' }).click();
  await expect(second.getByTestId('host-blocker')).toHaveCount(0);
  await expect(page.getByTestId('host-blocker')).toContainText('此分頁已被接管');
  await expect(second.getByTestId('relic-value')).toHaveText('20');
  await second.close();
});

test('重新整理後進度保留，且不補算離線收益', async ({ page }) => {
  await openGame(page, 'gold');
  await page.getByTestId('identify-once').click();
  await page.getByTestId('equip-item').click();
  await expect(page.getByTestId('item-sheet')).toHaveCount(0);
  const before = await gameState(page);
  await page.reload();
  await page.waitForFunction(() => Boolean(window.__qiwuDev));
  await expect(page.getByTestId('host-blocker')).toHaveCount(0);
  const after = await gameState(page);
  expect(Object.keys(after.items)).toEqual(Object.keys(before.items));
  expect(after.player.xp).toBe(before.player.xp);
  expect(after.wallet.relics).toBeGreaterThanOrEqual(before.wallet.relics);
  expect(after.wallet.relics - before.wallet.relics).toBeLessThanOrEqual(1);
});

test('BOSS 挑戰中重新整理：依原截止時間結算，不重開 60 秒', async ({ page }) => {
  await openGame(page, 'bossReady');
  await page.getByTestId('summon-boss').click();
  await page.getByTestId('start-boss').click();
  await expect(page.getByTestId('boss-bar')).toBeVisible();
  const started = await gameState(page);
  expect(started.boss.active).not.toBeNull();
  await page.reload();
  await page.waitForFunction(() => Boolean(window.__qiwuDev));
  await expect(page.getByTestId('boss-bar')).toBeVisible();
  const after = await gameState(page);
  expect(after.boss.active).toEqual(started.boss.active);
  await fastForward(page, 61_000);
  await expect(page.getByTestId('boss-result-sheet')).toBeVisible();
  expect((await gameState(page)).boss.history).toHaveLength(1);
});

test('存檔損壞：可在畫面上確認清除並重新開始', async ({ page }) => {
  // 在遊戲啟動前寫入損壞的存檔（模擬舊版本或被破壞的資料）。
  await page.addInitScript(() => {
    if (sessionStorage.getItem('qiwu-seeded')) return;
    sessionStorage.setItem('qiwu-seeded', '1');
    localStorage.setItem('qiwu-yongzhe:save:v1', '{"garbage":true}');
  });
  await page.goto('/?latency=0');
  await expect(page.getByTestId('host-blocker')).toContainText('無法讀取存檔');
  await page.getByRole('button', { name: '清除本機存檔並重新開始' }).click();
  await page.getByRole('button', { name: '清除並重新開始' }).click();
  await expect(page.getByTestId('host-blocker')).toHaveCount(0);
  const state = await gameState(page);
  expect(state.player.level).toBe(1);
});

test('自動鑑定因保留裝備暫停時，可從面板直接停止自動', async ({ page }) => {
  await openGame(page, 'gold');
  await page.getByTestId('filter-open').click();
  await page.getByRole('switch', { name: /主屬性高於目前清怪配置時保留/ }).click();
  await page.getByTestId('save-filter').click();
  await expect(page.getByTestId('filter-sheet')).toHaveCount(0);
  await page.getByTestId('auto-identify').click();
  await expect(page.getByTestId('item-sheet')).toBeVisible();
  await page.getByTestId('stop-auto').click();
  await expect(page.getByTestId('item-sheet')).toHaveCount(0);
  await expect.poll(async () => (await page.evaluate(() => (window.__qiwuDev!.state() as { identifySettings: { autoEnabled: boolean } }).identifySettings.autoEnabled))).toBe(false);
  const relics = (await gameState(page)).wallet.relics;
  await page.waitForTimeout(1500);
  expect((await gameState(page)).wallet.relics).toBeGreaterThanOrEqual(relics);
  await expect(page.getByTestId('item-sheet')).toHaveCount(0);
});
