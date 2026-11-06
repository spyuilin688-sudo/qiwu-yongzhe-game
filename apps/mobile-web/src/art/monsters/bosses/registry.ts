import { EARLY_BOSSES } from './designs/early.tsx';
import { LATE_BOSSES } from './designs/late.tsx';
import { MIDDLE_BOSSES } from './designs/middle.tsx';
import type { BossDesign } from './kit.tsx';

export { fallbackBoss } from './designs/fallback.tsx';

/** 全部 BOSS 設計：鍵為內容目錄產生的 BOSS ID（BOSS-01～BOSS-12）。 */
export const BOSS_DESIGNS: ReadonlyMap<string, BossDesign> = new Map([EARLY_BOSSES, MIDDLE_BOSSES, LATE_BOSSES].flatMap((table) => Object.entries(table)));
