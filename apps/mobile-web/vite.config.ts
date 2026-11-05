import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    // 內容資料直接讀取 docs/data_v0.2.json，需允許存取 monorepo 根目錄。
    fs: { allow: ['../..'] },
  },
  preview: { port: 4173 },
  build: {
    target: 'es2022',
    sourcemap: true,
    rolldownOptions: {
      output: {
        // 第三方套件與設計資料（約 210KB JSON）分開成獨立 chunk，改遊戲程式時不必重新下載。
        codeSplitting: {
          groups: [
            { name: 'vendor', test: /node_modules/ },
            { name: 'design-data', test: /docs[\\/]data_v0\.2\.json/ },
          ],
        },
      },
    },
  },
});
