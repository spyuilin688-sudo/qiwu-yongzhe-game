import { NOVICE_JOB_ID } from '@qiwu/content';
import type { GameState, IdentifySettings } from '../model/types.ts';
import { autoSellMaxAllowedQuality, autoSellScopeWidened, qualityRank } from '../rules/identifyFilter.ts';
import type { CommandPayload } from './commands.ts';
import type { ServiceContext } from './context.ts';
import { reject } from './errors.ts';

export interface IdentifySettingsResult {
  settings: IdentifySettings;
}

/**
 * 鑑定設定：規則是資料而不是可執行腳本；改動只影響下一筆鑑定（版本 +1）。
 * 切換產出路線只影響新裝備，不改目前職業、不重抽舊裝（規格 02）。
 */
export function updateIdentifySettings(
  draft: GameState,
  payload: CommandPayload<'updateIdentifySettings'>,
  ctx: ServiceContext,
): IdentifySettingsResult {
  const { catalog } = ctx;
  const unlocked = draft.player.unlockedJobIds;
  const targetValid = payload.targetJobId === NOVICE_JOB_ID ? unlocked.length === 0 : unlocked.includes(payload.targetJobId);
  if (!targetValid) reject('ROUTE_INVALID', '只能選擇已解鎖的職業作為產出路線。', { fieldErrors: { targetJobId: '未解鎖' } });
  if (payload.autoSell.enabled) {
    const maxAllowed = autoSellMaxAllowedQuality(catalog);
    if (qualityRank(catalog, payload.autoSell.maxQuality) > qualityRank(catalog, maxAllowed)) {
      reject('INVALID_PAYLOAD', `自動出售最高只能設定到${catalog.qualities.get(maxAllowed)?.name ?? maxAllowed}品質；更高品質一律先暫停讓玩家查看。`, {
        fieldErrors: { 'autoSell.maxQuality': '超出允許範圍' },
      });
    }
    if (payload.autoSell.slots.length === 0) {
      reject('INVALID_PAYLOAD', '自動出售至少要選一個部位。', { fieldErrors: { 'autoSell.slots': '未選擇' } });
    }
    if (autoSellScopeWidened(catalog, draft.identifySettings, payload) && !payload.confirmAutoSell) {
      reject('AUTO_SELL_NOT_CONFIRMED', '自動出售範圍擴大，需要先確認新的出售條件。');
    }
  }
  draft.identifySettings = {
    targetJobId: payload.targetJobId,
    autoEnabled: draft.identifySettings.autoEnabled,
    keep: {
      minQuality: payload.keep.minQuality,
      slots: [...new Set(payload.keep.slots)],
      affixStats: [...new Set(payload.keep.affixStats)],
      upgradesOverEquipped: payload.keep.upgradesOverEquipped,
    },
    autoSell: {
      enabled: payload.autoSell.enabled,
      maxQuality: payload.autoSell.maxQuality,
      slots: [...new Set(payload.autoSell.slots)],
    },
    version: draft.identifySettings.version + 1,
  };
  return { settings: draft.identifySettings };
}

export interface AutoIdentifyResult {
  enabled: boolean;
}

/** 自動鑑定只是按序發送「鑑定一次」的意圖開關；關閉只停止下一筆，不中斷已送出的那筆。 */
export function setAutoIdentify(draft: GameState, payload: CommandPayload<'setAutoIdentify'>): AutoIdentifyResult {
  draft.identifySettings.autoEnabled = payload.enabled;
  return { enabled: payload.enabled };
}

export interface GameSettingsResult {
  firstBossAuto: boolean;
}

export function updateGameSettings(draft: GameState, payload: CommandPayload<'updateGameSettings'>): GameSettingsResult {
  draft.settings.firstBossAuto = payload.firstBossAuto;
  return { firstBossAuto: payload.firstBossAuto };
}
