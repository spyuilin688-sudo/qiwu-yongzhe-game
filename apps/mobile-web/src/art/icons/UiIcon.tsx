import { memo } from 'react';
import { IconFrame, type IconSizeProp } from './ui/iconFrame.tsx';
import { ICON_STROKE } from './ui/lineStyle.ts';
import { UI_GLYPHS, type UiGlyphName } from './ui/uiGlyphs.tsx';

export interface UiIconProps {
  readonly name: UiGlyphName;
  /** 數字＝CSS px；'s'｜'m'｜'base'｜'l'｜'xl'＝對應圖示 Token；'em'＝跟著字級；省略＝填滿容器。 */
  readonly size?: IconSizeProp;
  readonly className?: string;
  /** 提供時以 role="img" 呈現；省略時視為裝飾（aria-hidden），旁邊必須已有可見文字。 */
  readonly title?: string;
}

/**
 * 介面圖示（viewBox 0 0 24 24，以 currentColor 著色，可由 CSS 改色）。
 * 以 memo 包裝：圖示常放在每 100ms 重繪一次的戰場與操作區裡，props 不變就不重繪。
 */
export const UiIcon = memo(function UiIcon({ name, size, className, title }: UiIconProps) {
  return (
    <IconFrame viewBox="0 0 24 24" size={size} className={className} title={title}>
      <g {...ICON_STROKE}>{UI_GLYPHS[name]}</g>
    </IconFrame>
  );
});
