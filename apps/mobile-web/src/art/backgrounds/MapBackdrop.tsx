import { useId, type CSSProperties } from 'react';
import type { ArtProps } from '../types.ts';
import { createBackdropKit } from './kit.tsx';
import { H, W, zoneLook } from './parts.tsx';
import { SCENES, fallbackScene } from './registry.ts';

/**
 * 背景鋪放方式：
 *  cover：填滿容器、底部對齊裁切（窄螢幕裁左右、矮螢幕裁天空）；圖鑑縮圖、面板背景用它。
 *  width：寬度貼齊、高度依比例、底部由容器對齊；任何寬度都看到完整 390 寬構圖，
 *         超出 viewBox 的天空延伸（場景往上多畫的部分）以 overflow visible 顯示，戰場用它。
 */
export type BackdropFit = 'cover' | 'width';

const FIT_ASPECT: Readonly<Record<BackdropFit, string>> = {
  cover: 'xMidYMax slice',
  width: 'xMidYMax meet',
};

const FIT_STYLE: Readonly<Record<BackdropFit, CSSProperties>> = {
  cover: { width: '100%', height: '100%' },
  width: { display: 'block', width: '100%', height: 'auto', overflow: 'visible' },
};

/**
 * 12 張地圖背景（viewBox 0 0 390 272）。預設 fit="cover"：preserveAspectRatio="xMidYMax slice"，
 * 地面帶與角色腳點永遠保留。zoneIndex（0～5）切換同一地圖的區域光線與道具；第 6 區為 BOSS 王庭。
 */
export function MapBackdrop({
  mapNumber,
  zoneIndex,
  className,
  title,
  size,
  fit = 'cover',
}: ArtProps & { readonly mapNumber: number; readonly zoneIndex?: number; readonly fit?: BackdropFit }) {
  const prefix = `bg${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const scene = SCENES.get(mapNumber) ?? fallbackScene;
  const { kit, defs } = createBackdropKit(prefix);
  const body = scene(kit, zoneLook(zoneIndex));
  const style = size ? { width: size, height: (size * H) / W } : FIT_STYLE[fit];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio={FIT_ASPECT[fit]}
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true, focusable: false })}
    >
      {title ? <title>{title}</title> : null}
      <defs>{defs()}</defs>
      {body}
    </svg>
  );
}
