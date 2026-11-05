import { loadDefaultCatalog } from '@qiwu/content';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.tsx';
import { GameProvider } from './app/GameContext.tsx';
import { PrefsProvider } from './app/prefs.tsx';
import { UiProvider } from './app/uiStore.tsx';
import { installDevTools } from './host/devTools.ts';
import { LocalGameHost } from './host/LocalGameHost.ts';
import { createBrowserStorage } from './host/storage.ts';
import './styles/tokens.css';
import './styles/global.css';

const catalog = loadDefaultCatalog();
const storage = createBrowserStorage();
const params = new URLSearchParams(window.location.search);
// 開發加速只在開發模式生效；正式建置永遠以真實時間推進。
const devSpeed = import.meta.env.DEV ? Math.min(50, Math.max(1, Number(params.get('devSpeed') ?? '1') || 1)) : 1;
const latencyMs = import.meta.env.DEV && params.has('latency') ? Math.max(0, Number(params.get('latency')) || 0) : 60;

const host = new LocalGameHost({ catalog, storage, devSpeed, latencyMs });
host.start();
if (import.meta.env.DEV) installDevTools(host, storage);

const root = document.getElementById('root');
if (!root) throw new Error('找不到 #root');

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
