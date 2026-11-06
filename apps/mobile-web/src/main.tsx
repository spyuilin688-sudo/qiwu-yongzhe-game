import { loadDefaultCatalog } from '@qiwu/content';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.tsx';
import { GameProvider } from './app/GameContext.tsx';
import { PrefsProvider } from './app/prefs.tsx';
import { UiProvider } from './app/uiStore.tsx';
import { DEV_TOOLS_ENABLED } from './host/buildFlags.ts';
import { installDevTools } from './host/devTools.ts';
import { LocalGameHost } from './host/LocalGameHost.ts';
import { createBrowserStorage } from './host/storage.ts';
import './styles/tokens.css';
import './styles/global.css';

const catalog = loadDefaultCatalog();
const storage = createBrowserStorage();
const params = new URLSearchParams(window.location.search);
// 開發加速只在開發模式與手機試玩版生效；正式建置永遠以真實時間推進。
const devSpeed = DEV_TOOLS_ENABLED ? Math.min(50, Math.max(1, Number(params.get('devSpeed') ?? '1') || 1)) : 1;
const latencyMs = DEV_TOOLS_ENABLED && params.has('latency') ? Math.max(0, Number(params.get('latency')) || 0) : 60;

const host = new LocalGameHost({ catalog, storage, devSpeed, latencyMs });
host.start();
if (DEV_TOOLS_ENABLED) installDevTools(host, storage);

const root = document.getElementById('root');
if (!root) throw new Error('找不到 #root');

// 粉圓字型的 @font-face 表（111 個字元切片）約 90KB（gzip）；改為首屏後非同步載入，
// 不阻擋第一次繪製。字型本身為 font-display: swap，載入前以系統字型顯示。
void import('@fontsource/huninn/400.css');

// 美術總覽：?gallery=1（開發模式與手機試玩版）。動態載入，正式建置不包含。
if (DEV_TOOLS_ENABLED && params.has('gallery')) {
  void import('./art/Gallery.tsx').then(({ Gallery }) => createRoot(root).render(<Gallery catalog={catalog} />));
} else {
createRoot(root).render(
  <StrictMode>
    <PrefsProvider storage={storage}>
      <GameProvider host={host}>
        <UiProvider>
          <App />
        </UiProvider>
      </GameProvider>
    </PrefsProvider>
  </StrictMode>,
);
}
