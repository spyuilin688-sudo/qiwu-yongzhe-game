import type { ReactNode } from 'react';
import type { UiIconName } from '../../types.ts';
import { SOLID_FILL, TONE_FILL } from './lineStyle.ts';

/**
 * 介面圖示圖形（24×24 格）。每個圖示的外框由 UiIcon 套上 currentColor 線條樣式。
 * 「古物」刻意畫成封印拓本卷軸，絕不使用寶箱或神燈外型（核心規則）。
 */
export const UI_GLYPHS: Readonly<Record<UiIconName, ReactNode>> = {
  adventure: (
    <>
      <path d="M2.4 21Q12 12.6 21.6 21Z" {...TONE_FILL} />
      <path d="M8.6 4.4Q12.4 3 15.4 4.6Q18 5.8 20 4.8V11Q18 12 15.4 10.8Q12.4 9.2 8.6 10.6Z" {...TONE_FILL} />
      <path d="M8.6 16.6V3.4" />
    </>
  ),
  character: (
    <>
      <circle cx="12" cy="8.2" r="4" {...TONE_FILL} />
      <path d="M4.5 21C4.8 16 8 13.6 12 13.6C16 13.6 19.2 16 19.5 21Z" {...TONE_FILL} />
    </>
  ),
  skills: (
    <>
      <path d="M10 4Q11 11.4 17.6 13Q11 14.6 10 22Q9 14.6 2.4 13Q9 11.4 10 4Z" {...TONE_FILL} />
      <path d="M18 2.2Q18.4 5.4 21.6 5.8Q18.4 6.2 18 9.4Q17.6 6.2 14.4 5.8Q17.6 5.4 18 2.2Z" {...SOLID_FILL} />
    </>
  ),
  codex: (
    <>
      <path d="M12 6.4C9.4 4.6 6 4.4 2.8 5.4V19C6 18 9.4 18.2 12 20C14.6 18.2 18 18 21.2 19V5.4C18 4.4 14.6 4.6 12 6.4Z" {...TONE_FILL} />
      <path d="M12 6.4V20M5.6 9.2Q7.6 8.8 9.4 9.6M14.6 9.6Q16.4 8.8 18.4 9.2" />
    </>
  ),
  more: (
    <path d="M3.2 12a1.9 1.9 0 1 0 3.8 0a1.9 1.9 0 1 0 -3.8 0ZM10.1 12a1.9 1.9 0 1 0 3.8 0a1.9 1.9 0 1 0 -3.8 0ZM17 12a1.9 1.9 0 1 0 3.8 0a1.9 1.9 0 1 0 -3.8 0Z" {...SOLID_FILL} />
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.6" {...TONE_FILL} />
      <circle cx="12" cy="12" r="5.6" strokeWidth="1.4" />
      <path d="M12 8.8L14.4 12L12 15.2L9.6 12Z" {...SOLID_FILL} />
    </>
  ),
  relic: (
    <>
      <path d="M6.4 6H17.6V18H6.4Z" {...TONE_FILL} />
      <path d="M4.6 4.4H19.4M4.6 19.6H19.4" strokeWidth="2.8" />
      <path d="M9 9.2H15M9 12H13" strokeWidth="1.5" />
      <path d="M13.4 16.6L12.4 21.4M16.2 16.6L17.2 21.4" strokeWidth="1.5" />
      <circle cx="14.8" cy="15.4" r="2.6" {...SOLID_FILL} />
    </>
  ),
  lens: (
    <>
      <circle cx="10" cy="10" r="6.2" {...TONE_FILL} />
      <path d="M14.6 14.6L16 16" strokeWidth="2.6" />
      <path d="M16.6 16.6L20.6 20.6" strokeWidth="3.4" />
      <path d="M6.8 9.2Q7.4 6.8 9.8 6.4" strokeWidth="1.5" />
    </>
  ),
  lock: (
    <>
      <path d="M8 11V8.2a4 4 0 0 1 8 0V11" />
      <rect x="5" y="11" width="14" height="10" rx="2.2" {...TONE_FILL} />
      <path d="M12 15V17.4" strokeWidth="2.2" />
    </>
  ),
  boss: (
    <>
      <path d="M7.4 7.6Q3.4 6.4 3 2.4Q5.6 5 8.6 5.4M16.6 7.6Q20.6 6.4 21 2.4Q18.4 5 15.4 5.4" />
      <path d="M6 11Q6 5 12 5Q18 5 18 11V14.6Q18 17 15.6 17.6V20.6H8.4V17.6Q6 17 6 14.6Z" {...TONE_FILL} />
      <path d="M8 11.2L11 12.6L8.4 14.2ZM16 11.2L13 12.6L15.6 14.2Z" {...SOLID_FILL} />
      <path d="M10.6 17.8V20.4M13.4 17.8V20.4" strokeWidth="1.4" />
    </>
  ),
  filter: <path d="M3.4 4.6H20.6L14 12.4V18.6L10 20.8V12.4Z" {...TONE_FILL} />,
  route: (
    <>
      <path d="M12 18V13.4L6.6 7.2M12 13.4L17.4 7.2" />
      <circle cx="12" cy="19.4" r="2" {...SOLID_FILL} />
      <circle cx="5.6" cy="5.6" r="2.4" {...TONE_FILL} />
      <circle cx="18.4" cy="5.6" r="2.4" {...TONE_FILL} />
    </>
  ),
  bag: (
    <>
      <path d="M9 7.4V6a3 3 0 0 1 6 0V7.4" />
      <rect x="4.6" y="7.4" width="14.8" height="13.6" rx="3.6" {...TONE_FILL} />
      <path d="M8.4 14.2H15.6V18H8.4Z" strokeWidth="1.5" />
      <path d="M4.8 12H19.2" strokeWidth="1.5" />
    </>
  ),
  close: <path d="M6 6L18 18M18 6L6 18" strokeWidth="2.6" />,
  up: (
    <>
      <path d="M12 19.6V7" strokeWidth="2.4" />
      <path d="M5.6 11.4L12 4.6L18.4 11.4Z" {...TONE_FILL} />
    </>
  ),
  down: (
    <>
      <path d="M12 4.4V17" strokeWidth="2.4" />
      <path d="M5.6 12.6L12 19.4L18.4 12.6Z" {...TONE_FILL} />
    </>
  ),
  check: <path d="M4.4 12.6L9.6 17.6L19.6 6.4" strokeWidth="2.6" />,
  warning: (
    <>
      <path d="M12 3.4L21.6 20H2.4Z" {...TONE_FILL} />
      <path d="M12 9.4V13.8" strokeWidth="2.2" />
      <circle cx="12" cy="16.9" r="1.25" {...SOLID_FILL} />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.6" r="7.6" {...TONE_FILL} />
      <path d="M9.6 2.6H14.4M12 2.6V6M18.2 6.4L19.8 4.8" />
      <path d="M12 13.6L15.2 10.4" strokeWidth="2.2" />
    </>
  ),
  star: <path d="M12 3.2L14.6 8.7L20.6 9.4L16.2 13.5L17.3 19.5L12 16.6L6.7 19.5L7.8 13.5L3.4 9.4L9.4 8.7Z" {...TONE_FILL} />,
};
