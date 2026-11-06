import type { SceneDesign } from './parts.tsx';
import { EARLY_SCENES } from './scenes/early.tsx';
import { LATE_SCENES } from './scenes/late.tsx';
import { MIDDLE_SCENES } from './scenes/middle.tsx';

export { fallbackScene } from './scenes/fallback.tsx';

/** 地圖編號（1～12）→ 背景場景。 */
export const SCENES: ReadonlyMap<number, SceneDesign> = new Map([...EARLY_SCENES, ...MIDDLE_SCENES, ...LATE_SCENES]);
