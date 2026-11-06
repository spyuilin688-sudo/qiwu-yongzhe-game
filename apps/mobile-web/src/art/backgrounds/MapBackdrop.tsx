import { useId } from 'react';
import type { ArtProps } from '../types.ts';
import { createBackdropKit } from './kit.tsx';
import { H, W, zoneLook } from './parts.tsx';
import { SCENES, fallbackScene } from './registry.ts';

/**
 * 12 張地圖背景（viewBox 0 0 390 272，preserveAspectRatio="xMidYMax slice"，填滿容器）。
 * 以底部對齊裁切：窄螢幕裁掉左右、矮螢幕裁掉天空，地面帶與角色腳點永遠保留。
 * zoneIndex（0～5）切換同一地圖的區域光線與道具；第 6 區為 BOSS 王庭。
 */
export function MapBackdrop({ mapNumber, zoneIndex, className, title, size }: ArtProps & { readonly mapNumber: number; readonly zoneIndex?: number }) {
  const prefix = `bg${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const scene = SCENES.get(mapNumber) ?? fallbackScene;
  const { kit, defs } = createBackdropKit(prefix);
  const body = scene(kit, zoneLook(zoneIndex));
  const style = size ? { width: size, height: (size * H) / W } : { width: '100%', height: '100%' };
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
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
