import { NOVICE_JOB_ID, SLOT_IDS, type ContentCatalog } from '@qiwu/content';
import { deriveSeed } from '../util/rng.ts';
import type { GameState } from './types.ts';

/**
 * 角色初始：Lv1、經驗 0、金幣 0、古物 0、鑑定台 Lv1；空手也能普攻（規格 02）。
 * 不額外贈送金幣或古物來啟動循環。
 */
export function createInitialState(catalog: ContentCatalog, seed: number): GameState {
  return {
    schemaVersion: 1,
    contentVersion: catalog.contentVersion,
    revision: 0,
    player: { level: 1, xp: 0, currentJobId: NOVICE_JOB_ID, unlockedJobIds: [] },
    wallet: { gold: 0, relics: 0, relicProgress: 0, benchLevel: 1 },
    progress: { mapNumber: 1, localStage: 1, mode: 'PROGRESS', highestClearedMap: 0, firstAutoTriedMaps: [] },
    items: {},
    soldArchive: [],
    loadouts: {},
    identifySettings: {
      targetJobId: NOVICE_JOB_ID,
      autoEnabled: false,
      keep: { minQuality: catalog.tuning.identify.defaultKeepMinQuality, slots: [], affixStats: [], upgradesOverEquipped: false },
      autoSell: { enabled: false, maxQuality: catalog.tuning.identify.defaultAutoSellMaxQuality, slots: [...SLOT_IDS] },
      version: 1,
    },
    settings: { firstBossAuto: catalog.tuning.boss.firstAutoChallengeDefault },
    boss: { active: null, history: [] },
    operations: { records: {}, order: [] },
    ledger: [],
    discovered: { monsterIds: [], baseIds: [], legendBaseIds: [] },
    counters: { itemSerial: 0, ledgerSerial: 0, attemptSerial: 0, sessionSerial: 0 },
    rng: { identifyState: deriveSeed(seed, 1), battleSeedState: deriveSeed(seed, 2) },
    totals: { kills: 0, relicsGranted: 0, identified: 0, itemsSold: 0, goldEarned: 0, bossAttempts: 0 },
  };
}
