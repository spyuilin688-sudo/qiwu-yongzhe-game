import { createInitialState, defaultEquipFixture, serializeSave, type GameState } from './devFixtures.ts';
import type { LocalGameHost } from './LocalGameHost.ts';
import { STORAGE_KEYS, type KeyValueStorage } from './storage.ts';

/**
 * 僅開發模式的測試輔助（正式建置不會呼叫 installDevTools）。
 * 夾具只用來建立「測試前置狀態」（例如已到第 30 關、已有金幣），
 * 被測行為仍必須透過介面按鈕與正式命令流程完成。
 */
export interface QiwuDevTools {
  fastForward(ms: number): void;
  loadFixture(name: FixtureName): void;
  reset(): void;
  state(): unknown;
}

export type FixtureName = 'fresh' | 'gold' | 'lv10' | 'bossReady' | 'bossStrong' | 'fullBag' | 'swordSaint' | 'mechCommander';

declare global {
  interface Window {
    __qiwuDev?: QiwuDevTools;
  }
}

export function installDevTools(host: LocalGameHost, storage: KeyValueStorage): void {
  window.__qiwuDev = {
    fastForward: (ms) => host.devFastForward(ms),
    loadFixture: (name) => {
      const state = buildFixture(host, name);
      storage.set(STORAGE_KEYS.save, serializeSave(state, Date.now()));
      host.takeOver();
    },
    reset: () => host.resetSave(),
    state: () => host.getSnapshot().state,
  };
}

function buildFixture(host: LocalGameHost, name: FixtureName): GameState {
  const catalog = host.catalog;
  const state = createInitialState(catalog, 20261105);
  switch (name) {
    case 'fresh':
      return state;
    case 'gold':
      state.wallet.gold = 5000;
      state.wallet.relics = 20;
      return state;
    case 'lv10':
      state.player.level = 10;
      state.wallet.relics = 10;
      return state;
    case 'bossReady':
      state.player.level = 10;
      state.wallet.relics = 5;
      state.progress.localStage = 30;
      state.progress.mode = 'BOSS_READY';
      return state;
    case 'bossStrong':
      state.player.level = 30;
      state.player.unlockedJobIds = ['JOB01'];
      state.player.currentJobId = 'JOB01';
      state.identifySettings.targetJobId = 'JOB01';
      state.progress.localStage = 30;
      state.progress.mode = 'BOSS_READY';
      defaultEquipFixture(catalog, state, 'JOB01', 30, 'Q4');
      return state;
    case 'fullBag': {
      state.wallet.relics = 3;
      defaultEquipFixture(catalog, state, 'NOVICE', 1, 'Q1', catalog.globals.backpackCapacity);
      return state;
    }
    case 'swordSaint':
      state.player.level = 80;
      state.player.unlockedJobIds = ['JOB01', 'JOB02', 'JOB03'];
      state.player.currentJobId = 'JOB03';
      state.identifySettings.targetJobId = 'JOB03';
      defaultEquipFixture(catalog, state, 'JOB03', 80, 'Q3');
      return state;
    case 'mechCommander':
      state.player.level = 80;
      state.player.unlockedJobIds = ['JOB31', 'JOB34', 'JOB35'];
      state.player.currentJobId = 'JOB35';
      state.identifySettings.targetJobId = 'JOB35';
      defaultEquipFixture(catalog, state, 'JOB35', 80, 'Q3');
      return state;
  }
}
