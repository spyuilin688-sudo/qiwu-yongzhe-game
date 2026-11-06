import type { CSSProperties, ReactNode } from 'react';

/**
 * 介面圖示的尺寸級距，直接對應 tokens.css 的圖示 Token；
 * 讓 TSX 不必再寫 size={14}／{20}／{22} 之類的數字，改 Token 時全站一起變。
 * - 's' → --icon-s（14px）、'm' → --icon-m（20px）、'base' → --icon（24px）、'l' → --icon-l（28px）、'xl' → --icon-xl（32px）
 * - 'em' → 1em：跟著所在文字的字級縮放（字體放大 200% 時圖示也放大）
 */
export type IconSize = 's' | 'm' | 'base' | 'l' | 'xl' | 'em';

/** 數字＝固定 CSS px；級距名稱＝Token；省略＝填滿容器寬度（由外層 CSS 決定大小）。 */
export type IconSizeProp = number | IconSize;

const SIZE_VALUE: Readonly<Record<IconSize, string>> = {
  s: 'var(--icon-s)',
  m: 'var(--icon-m)',
  base: 'var(--icon)',
  l: 'var(--icon-l)',
  xl: 'var(--icon-xl)',
  em: '1em',
};

// 預先建好樣式物件：圖示常出現在每 100ms 重繪的戰場與操作區，不要每次渲染都配置新物件。
const TOKEN_STYLE: Readonly<Record<IconSize, CSSProperties>> = Object.fromEntries(
  Object.entries(SIZE_VALUE).map(([key, value]) => [key, { width: value, height: value, flex: 'none' }]),
) as Record<IconSize, CSSProperties>;
const FILL_STYLE: CSSProperties = { width: '100%', height: 'auto' };

function sizeStyle(size: IconSizeProp | undefined): CSSProperties {
  if (size === undefined) return FILL_STYLE;
  if (typeof size === 'number') return { width: size, height: size, flex: 'none' };
  return TOKEN_STYLE[size];
}

/** 正方形圖示的 SVG 外框：處理尺寸級距與無障礙（有 title 才是圖片，否則對輔助技術隱藏）。 */
export function IconFrame({
  viewBox,
  size,
  className,
  title,
  children,
}: {
  readonly viewBox: string;
  readonly size?: IconSizeProp;
  readonly className?: string;
  readonly title?: string;
  readonly children: ReactNode;
}) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      style={sizeStyle(size)}
      xmlns="http://www.w3.org/2000/svg"
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true, focusable: false })}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}
