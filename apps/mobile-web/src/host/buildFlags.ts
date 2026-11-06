/**
 * 測試工具（開發測試夾具、開發加速、美術總覽、window.__qiwuDev）是否可用。
 *
 * 開發模式一律開啟；正式建置只有「手機試玩版」（`npm run build:playtest`，讀取 `.env.playtest`）才開啟，
 * 一般 `npm run build` 不含這些工具。
 * 為什麼試玩版不直接用開發模式打包：開發模式的 React 比較慢，手機上量到的流暢度會失真。
 */
export const DEV_TOOLS_ENABLED: boolean = import.meta.env.DEV || import.meta.env.VITE_PLAYTEST === '1';
