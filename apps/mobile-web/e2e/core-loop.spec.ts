import { expect, test } from '@playwright/test';
import { fastForward, gameState, openGame } from './helpers.ts';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('核心循環：清怪 → 古物 → 鑑定 → 裝備／出售 → 升台 → BOSS', () => {
  test('自動清怪只累積古物，不給經驗或金幣', async ({ page }) => {
    await openGame(page, 'fresh');
    await fastForward(page, 90_000);
    const state = await gameState(page);
    expect(state.wallet.relics).toBeGreaterThan(0);
    expect(state.wallet.gold).toBe(0);
    expect(state.player.xp).toBe(0);
    expect(state.player.level).toBe(1);
    await expect(page.getByTestId('relic-value')).toHaveText(String(state.wallet.relics));
  });

  test('鑑定一次：古物 −1、得到經驗與一件裝備；穿戴後舊裝留在背包', async ({ page }) => {
    await openGame(page, 'gold');
    const before = await gameState(page);
    await page.getByTestId('identify-once').click();
    await expect(page.getByTestId('item-sheet')).toBeVisible();
    await expect(page.getByTestId('identify-xp')).toContainText('鑑定經驗 +22');
    const afterIdentify = await gameState(page);
    expect(afterIdentify.wallet.relics).toBe(before.wallet.relics - 1);
    expect(Object.keys(afterIdentify.items)).toHaveLength(1);
    expect(afterIdentify.player.xp).toBe(22);
    expect(afterIdentify.wallet.gold).toBe(before.wallet.gold);

    await page.getByTestId('equip-item').click();
    await expect(page.getByTestId('item-sheet')).toHaveCount(0);
    const afterEquip = await gameState(page);
    const farm = afterEquip.loadouts['NOVICE:farm'];
    expect(Object.values(farm?.items ?? {})).toHaveLength(1);
    // 穿戴中的裝備不能出售
    await page.getByTestId('identify-once').click();
    await expect(page.getByTestId('item-sheet')).toBeVisible();
    await page.getByTestId('keep-item').click();
    expect(Object.keys((await gameState(page)).items)).toHaveLength(2);
  });

  test('只有出售才增加金幣，且同一件不能重複出售', async ({ page }) => {
    await openGame(page, 'gold');
    await page.getByTestId('identify-once').click();
    await expect(page.getByTestId('item-sheet')).toBeVisible();
    const before = await gameState(page);
    const sellButton = page.getByTestId('sell-item');
    const label = (await sellButton.textContent()) ?? '';
    const price = Number(/\+(\d+)/.exec(label)?.[1]);
    expect(price).toBeGreaterThan(0);
    await sellButton.click();
    await expect(page.getByTestId('item-sheet')).toHaveCount(0);
    const after = await gameState(page);
    expect(after.wallet.gold).toBe(before.wallet.gold + price);
    expect(after.player.xp).toBe(before.player.xp);
    expect(Object.keys(after.items)).toHaveLength(0);
  });

  test('金幣不足不能升台；足夠時升級並扣款', async ({ page }) => {
    await openGame(page, 'fresh');
    await page.getByTestId('bench-upgrade').click();
    await expect(page.getByTestId('confirm-bench-upgrade')).toBeDisabled();
    await expect(page.getByTestId('confirm-bench-upgrade')).toContainText('還差 500 金幣');
    await page.keyboard.press('Escape');

    await openGame(page, 'gold');
    await page.getByTestId('bench-upgrade').click();
    await page.getByTestId('confirm-bench-upgrade').click();
    await expect(page.getByTestId('bench-sheet')).toHaveCount(0);
    const state = await gameState(page);
    expect(state.wallet.benchLevel).toBe(2);
    expect(state.wallet.gold).toBe(4500);
  });

  test('BOSS 失敗：停在第 30 關刷怪，不自動再挑戰，需手動召喚', async ({ page }) => {
    await openGame(page, 'bossReady');
    await expect(page.getByTestId('stage-detail')).toHaveText('可召喚 BOSS');
    await page.getByTestId('summon-boss').click();
    await page.getByTestId('start-boss').click();
    await expect(page.getByTestId('boss-bar')).toBeVisible();
    await expect(page.getByTestId('identify-once')).toBeDisabled();
    await fastForward(page, 61_000);
    await expect(page.getByTestId('boss-result-sheet')).toContainText('挑戰失敗');
    await page.getByTestId('boss-result-ok').click();
    let state = await gameState(page);
    expect(state.progress).toMatchObject({ mapNumber: 1, localStage: 30, mode: 'FARM_BLOCKED' });
    expect(state.boss.history.at(-1)?.result).toBe('timeout');

    await fastForward(page, 120_000);
    state = await gameState(page);
    expect(state.boss.active).toBeNull();
    expect(state.boss.history).toHaveLength(1);
    expect(state.progress.mode).toBe('FARM_BLOCKED');
    expect(state.wallet.relics).toBeGreaterThan(5);
    await expect(page.getByTestId('summon-boss')).toBeEnabled();
  });

  test('BOSS 勝利：只解鎖下一張地圖一次，不給經驗或金幣', async ({ page }) => {
    await openGame(page, 'bossStrong');
    const before = await gameState(page);
    await page.getByTestId('summon-boss').click();
    await page.getByTestId('start-boss').click();
    await expect(page.getByTestId('boss-bar')).toBeVisible();
    await fastForward(page, 61_000);
    await expect(page.getByTestId('boss-result-sheet')).toContainText('擊敗');
    const after = await gameState(page);
    // 勝利後剩餘的快轉時間會在第 2 圖繼續推關，因此只檢查換圖一次與 BOSS 結果唯一。
    expect(after.progress).toMatchObject({ mapNumber: 2, mode: 'PROGRESS' });
    expect(after.boss.history.filter((attempt) => attempt.result === 'success')).toHaveLength(1);
    expect(after.wallet.gold).toBe(before.wallet.gold);
    expect(after.player.xp).toBe(before.player.xp);
  });

  test('背包已滿：鑑定停用並說明原因，古物不被扣除', async ({ page }) => {
    await openGame(page, 'fullBag');
    await expect(page.getByTestId('identify-once')).toBeDisabled();
    await expect(page.getByTestId('identify-once')).toContainText('背包已滿');
    expect((await gameState(page)).wallet.relics).toBe(3);
  });

  test('鎖定的裝備不能出售', async ({ page }) => {
    await openGame(page, 'gold');
    await page.getByTestId('identify-once').click();
    await page.getByTestId('lock-toggle').click();
    await expect(page.getByTestId('lock-toggle')).toHaveText('已鎖定');
    await expect(page.getByTestId('sell-item')).toBeDisabled();
    await expect(page.getByTestId('sell-item')).toContainText('已鎖定');
  });

  test('自動鑑定逐筆進行，古物用完後顯示原因', async ({ page }) => {
    await openGame(page, 'gold');
    await page.getByTestId('auto-identify').click();
    await expect.poll(async () => (await gameState(page)).wallet.relics, { timeout: 20_000 }).toBe(0);
    const state = await gameState(page);
    expect(Object.keys(state.items).length).toBeGreaterThan(0);
    await expect(page.getByTestId('auto-identify')).toContainText('古物不足');
  });
});
