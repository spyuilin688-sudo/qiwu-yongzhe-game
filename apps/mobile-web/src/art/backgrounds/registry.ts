import { zoneLook, type BackdropLight, type BackdropTone, type SceneDesign, type SceneEntry } from './parts.tsx';
import { EARLY_SCENES } from './scenes/early.tsx';
import { LATE_SCENES } from './scenes/late.tsx';
import { MIDDLE_SCENES } from './scenes/middle.tsx';

export { fallbackScene } from './scenes/fallback.tsx';

/** 全部地圖的背景登記（地圖編號 1～12），依編號排序。 */
export const SCENE_ENTRIES: readonly SceneEntry[] = [...EARLY_SCENES, ...MIDDLE_SCENES, ...LATE_SCENES];

/** 地圖編號（1～12）→ 背景場景。 */
export const SCENES: ReadonlyMap<number, SceneDesign> = new Map(SCENE_ENTRIES.map((entry) => [entry.mapNumber, entry.draw]));

const LIGHTS: ReadonlyMap<number, SceneEntry> = new Map(SCENE_ENTRIES.map((entry) => [entry.mapNumber, entry]));

/**
 * 未交付背景的地圖：佔位背景是偏暗的橄欖綠，保守地當成暗色圖處理（多一圈邊光不會傷害辨識）。
 * 邊光用中性暖白，不暗示任何場景光源。
 */
const FALLBACK_LIGHT: BackdropLight = { tone: 'dark', rim: 'rgba(255, 236, 204, 0.5)' };

/**
 * 背景光線（純函式）：戰場用來決定是否替角色、怪物加邊光與邊光顏色。
 * zoneIndex 與 MapBackdrop 相同（0～5，超出範圍會夾回）；暮色加深的後段區域可能由亮轉暗。
 */
export function backdropLightFor(mapNumber: number, zoneIndex?: number): BackdropLight {
  const entry = LIGHTS.get(mapNumber);
  if (!entry) return FALLBACK_LIGHT;
  const { index } = zoneLook(zoneIndex);
  const darkened = entry.darkFromZone !== undefined && index >= entry.darkFromZone;
  return darkened && entry.light.tone !== 'dark' ? { ...entry.light, tone: 'dark' } : entry.light;
}

/** 背景明暗（純函式）：'dark' 時戰場應替深色角色與怪物加一圈邊光。 */
export function backdropToneFor(mapNumber: number, zoneIndex?: number): BackdropTone {
  return backdropLightFor(mapNumber, zoneIndex).tone;
}
