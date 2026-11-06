import type { ContentCatalog } from '@qiwu/content';
import type { GameState } from '../model/types.ts';
import { voidActiveBossAttempt } from '../services/bossServices.ts';

/**
 * 內容版本升級（原型本機存檔）。
 *
 * 只收「存檔結構不變、只改戰鬥／產出數值或效果」的相容升級：已持有的裝備、金幣、經驗、
 * 鑑定台等級都是玩家已結算的資產，一律原樣保留（裝備自己的 contentVersion 是產出紀錄，不改寫）。
 * 唯一不能沿用的是進行中的 BOSS 挑戰：它用舊內容的快照與種子重播，換了內容就不是同一場戰鬥，
 * 所以作廢（不給獎勵、不算失敗以外的結果），並停在 BOSS 關刷怪，下一次必須手動召喚（C-04）。
 *
 * 新增內容版本時在表尾加一筆；表尾的 to 必須等於目前內容版本（測試會檢查），
 * 否則舊存檔會被拒絕讀取，而不是被錯誤地沿用。
 */
export interface ContentUpgrade {
  readonly from: string;
  readonly to: string;
  /** 給玩家看的變更摘要。 */
  readonly summary: string;
}

export const CONTENT_UPGRADES: readonly ContentUpgrade[] = [
  {
    from: '0.2-proto.1',
    to: '0.2-proto.2',
    summary: '同花迴響改為湊成同花後的下一張本體牌都會重演；二轉清怪招與獵伴戰獸下修、連環牌擊在 BOSS 戰集中主目標、千面幻術師打王預設配置調整。',
  },
];

export interface ContentMigrationReport {
  readonly from: string;
  readonly to: string;
  readonly summaries: readonly string[];
  /** 因內容改版而作廢的進行中 BOSS 挑戰；沒有則為 null。 */
  readonly voidedBossAttemptId: string | null;
}

export type ContentMigrationResult =
  | { readonly ok: true; readonly report: ContentMigrationReport }
  | { readonly ok: false; readonly message: string };

/** 從 from 一路升到 to 的升級鏈；接不上就回傳 null。 */
export function upgradePath(from: string, to: string, upgrades: readonly ContentUpgrade[] = CONTENT_UPGRADES): ContentUpgrade[] | null {
  const path: ContentUpgrade[] = [];
  let version = from;
  const visited = new Set<string>([version]);
  while (version !== to) {
    const step = upgrades.find((upgrade) => upgrade.from === version);
    if (!step || visited.has(step.to)) return null;
    path.push(step);
    visited.add(step.to);
    version = step.to;
  }
  return path;
}

/** 存檔引用的 ID 在新內容裡都還存在，才算相容；列出前幾個缺漏給玩家看。 */
export function missingContentReferences(state: GameState, catalog: ContentCatalog): string[] {
  const missing: string[] = [];
  const need = (exists: boolean, label: string) => {
    if (!exists) missing.push(label);
  };
  const { mapNumber, localStage } = state.progress;
  const stageId = catalog.maps.get(mapNumber)?.stageIds[localStage - 1];
  need(stageId !== undefined && catalog.stages.has(stageId), `關卡 ${mapNumber}-${localStage}`);
  for (const jobId of new Set([state.player.currentJobId, ...state.player.unlockedJobIds])) need(catalog.jobs.has(jobId), `職業 ${jobId}`);
  for (const item of Object.values(state.items)) {
    need(catalog.equipment.has(item.baseId), `裝備基底 ${item.baseId}`);
    need(catalog.qualities.has(item.qualityId), `品質 ${item.qualityId}`);
  }
  for (const loadout of Object.values(state.loadouts)) {
    need(catalog.jobs.has(loadout.jobId), `職業 ${loadout.jobId}`);
    for (const skillId of [...loadout.skillIds, ...(loadout.ultimateId ? [loadout.ultimateId] : [])]) need(catalog.skills.has(skillId), `技能 ${skillId}`);
  }
  return [...new Set(missing)];
}

const MAX_LISTED_MISSING = 5;

/**
 * 把舊內容版本的存檔升到目前版本（直接改寫傳入的 state）。
 * atMs：作廢 BOSS 挑戰的時間點（讀檔時用存檔時間，與離線期間無關）。
 */
export function migrateContentVersion(state: GameState, catalog: ContentCatalog, atMs: number): ContentMigrationResult {
  const from = state.contentVersion;
  const path = upgradePath(from, catalog.contentVersion);
  if (!path) return { ok: false, message: `存檔內容版本 ${from} 沒有可升級到 ${catalog.contentVersion} 的路徑。` };
  const missing = missingContentReferences(state, catalog);
  if (missing.length > 0) {
    const listed = missing.slice(0, MAX_LISTED_MISSING).join('、');
    const more = missing.length > MAX_LISTED_MISSING ? `等 ${missing.length} 項` : '';
    return { ok: false, message: `存檔引用的內容在 ${catalog.contentVersion} 已不存在：${listed}${more}。` };
  }
  const voided = voidActiveBossAttempt(state, catalog, atMs);
  state.contentVersion = catalog.contentVersion;
  return {
    ok: true,
    report: { from, to: catalog.contentVersion, summaries: path.map((step) => step.summary), voidedBossAttemptId: voided },
  };
}
