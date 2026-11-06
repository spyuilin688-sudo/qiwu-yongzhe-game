import type { ReactNode } from 'react';
import type { ArtProps } from './types.ts';

/** 共用 SVG 外框：處理尺寸、無障礙標籤與裝飾性隱藏。 */
export function Svg({ viewBox, size, className, title, children }: ArtProps & { viewBox: string; children: ReactNode }) {
  const [, , width, height] = viewBox.split(' ').map(Number);
  const style = size ? { width: size, height: (size * (height ?? 1)) / (width ?? 1) } : { width: '100%', height: 'auto' };
  return (
    <svg
      viewBox={viewBox}
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true, focusable: false })}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}
