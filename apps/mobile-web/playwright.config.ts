import { defineConfig } from '@playwright/test';

/**
 * 本地端到端驗證（不建立 GitHub Actions）。使用開發伺服器，因為測試需要 DEV 專用的
 * window.__qiwuDev 夾具與快轉；被測行為仍透過畫面按鈕與正式命令流程完成。
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5174',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx vite --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
