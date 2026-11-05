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
        // 第三方套件、設計資料（約 210KB JSON）、向量美術分開成獨立 chunk，改遊戲程式時不必重新下載。
        codeSplitting: {
          groups: [
            // 字型的 @font-face 表只由首屏後的動態載入引用；放在 vendor 之前，避免被併入首屏樣式而阻擋繪製。
            { name: 'fonts', test: /node_modules[\\/]@fontsource[\\/]/, priority: 2 },
            { name: 'vendor', test: /node_modules/, priority: 1 },
            { name: 'design-data', test: /docs[\\/]data_v0\.2\.json/ },
            { name: 'art', test: /src[\\/]art[\\/]/ },
          ],
        },
      },
    },
  },
});
