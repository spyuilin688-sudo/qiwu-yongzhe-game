import { ground, hills, sky, type SceneDesign } from '../parts.tsx';

/** 新地圖尚未交付背景時的佔位：中性丘陵與地面，維持同樣的地平線與低對比原則。 */
export const fallbackScene: SceneDesign = (k, zone) => (
  <>
    {sky(k, [[0, '#3a4a3a'], [1, '#6b7b4f']])}
    <path d={hills(150, 10, 2, zone.index)} fill="#56664a" />
    {ground(k, '#5a4a30', '#3a2e1e')}
  </>
);
