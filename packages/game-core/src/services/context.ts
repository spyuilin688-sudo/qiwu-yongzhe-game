import type { ContentCatalog } from '@qiwu/content';
import type { GameState } from '../model/types.ts';
import type { DeepReadonly } from '../util/clone.ts';
import { reject } from './errors.ts';

export interface ServiceContext {
  readonly catalog: ContentCatalog;
  readonly nowMs: number;
  readonly operationId: string;
}

export type ReadState = DeepReadonly<GameState> | GameState;

/** BOSS 挑戰中凍結配置與成長操作（規格 02 BOSS_FIGHT）。 */
export function assertNotInBossFight(state: ReadState): void {
  if (state.progress.mode === 'BOSS_FIGHT' || state.boss.active?.result === 'pending') {
    reject('BOSS_LOCKED', 'BOSS 挑戰進行中，鑑定、出售、升台、換裝與轉職暫停；挑戰結束後即可繼續。');
  }
}
