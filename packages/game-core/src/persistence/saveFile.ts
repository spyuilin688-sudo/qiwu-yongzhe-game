import type { ContentCatalog } from '@qiwu/content';
import type { GameState } from '../model/types.ts';
import { migrateContentVersion, type ContentMigrationReport } from './contentMigrations.ts';

/**
 * 原型本機存檔格式。正式服務時伺服器資料庫才是權威，前端快取只作顯示（規格 08「存檔與回復」）；
 * 原型沒有伺服器，因此本機引擎狀態即權威狀態，並以版本欄位防止讀入不相容資料。
 */
export interface SaveFile {
  readonly format: 'qiwu-save';
  readonly schemaVersion: 1;
  readonly contentVersion: string;
  readonly savedAtMs: number;
  readonly state: GameState;
}

export type LoadResult =
  /** migration：舊內容版本升級時的紀錄（同版本讀檔為 null）。 */
  | { readonly ok: true; readonly state: GameState; readonly migration: ContentMigrationReport | null }
  | { readonly ok: false; readonly reason: 'EMPTY' | 'CORRUPTED' | 'SCHEMA_MISMATCH' | 'CONTENT_VERSION_MISMATCH'; readonly message: string };

export function serializeSave(state: GameState, savedAtMs: number): string {
  const file: SaveFile = { format: 'qiwu-save', schemaVersion: 1, contentVersion: state.contentVersion, savedAtMs, state };
  return JSON.stringify(file);
}

const REQUIRED_KEYS: readonly (keyof GameState)[] = [
  'player',
  'wallet',
  'progress',
  'items',
  'soldArchive',
  'loadouts',
  'identifySettings',
  'settings',
  'boss',
  'operations',
  'ledger',
  'discovered',
  'counters',
  'rng',
  'totals',
];

export function parseSave(raw: string | null, catalog: ContentCatalog): LoadResult {
  if (!raw) return { ok: false, reason: 'EMPTY', message: '沒有存檔。' };
  let file: Partial<SaveFile>;
  try {
    file = JSON.parse(raw) as Partial<SaveFile>;
  } catch {
    return { ok: false, reason: 'CORRUPTED', message: '存檔格式損壞。' };
  }
  if (file.format !== 'qiwu-save' || !file.state) return { ok: false, reason: 'CORRUPTED', message: '存檔格式損壞。' };
  if (file.schemaVersion !== 1 || file.state.schemaVersion !== 1) {
    return { ok: false, reason: 'SCHEMA_MISMATCH', message: '存檔結構版本不相容。' };
  }
  if (file.contentVersion !== file.state.contentVersion) {
    return { ok: false, reason: 'CORRUPTED', message: '存檔外層與內層的內容版本不一致。' };
  }
  const state = file.state as GameState;
  const missing = REQUIRED_KEYS.filter((key) => state[key] === undefined);
  if (missing.length > 0) return { ok: false, reason: 'CORRUPTED', message: `存檔缺少欄位：${missing.join(', ')}` };
  if (state.contentVersion === catalog.contentVersion) return { ok: true, state, migration: null };

  const migrated = migrateContentVersion(state, catalog, typeof file.savedAtMs === 'number' ? file.savedAtMs : 0);
  if (!migrated.ok) return { ok: false, reason: 'CONTENT_VERSION_MISMATCH', message: migrated.message };
  return { ok: true, state, migration: migrated.report };
}
