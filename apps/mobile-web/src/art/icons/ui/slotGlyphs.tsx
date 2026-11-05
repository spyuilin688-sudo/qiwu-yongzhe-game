import type { SlotId } from '@qiwu/content';
import type { ReactNode } from 'react';
import { SOLID_FILL, TONE_FILL } from './lineStyle.ts';

/** 八個裝備部位的剪影（24×24 格），風格與介面圖示一致。 */
export const SLOT_GLYPHS: Readonly<Record<SlotId, ReactNode>> = {
  weapon: (
    <>
      <path d="M20.4 3.6L19.8 7.8L10.6 17L7 13.4L16.2 4.2Z" {...TONE_FILL} />
      <path d="M5 11.6L12.4 19" />
      <path d="M7.4 16.6L4.2 19.8" strokeWidth="2.8" />
    </>
  ),
  offhand: (
    <>
      <path d="M12 3L19.6 5.6V11.2C19.6 15.8 16.4 19.4 12 21.2C7.6 19.4 4.4 15.8 4.4 11.2V5.6Z" {...TONE_FILL} />
      <path d="M8.4 10.2L12 13.4L15.6 10.2" />
    </>
  ),
  // 頭盔：圓頂＋護鼻條＋頂上短羽冠。舊版方形開口在小尺寸像拱門，護鼻條與羽冠才讓它讀成「頭盔」。
  head: (
    <>
      <path d="M4.6 19.6V14.6C4.6 9 7.8 5.2 12 5.2C16.2 5.2 19.4 9 19.4 14.6V19.6Q19.4 20.6 18.4 20.6H15.2L14.4 15.2H9.6L8.8 20.6H5.6Q4.6 20.6 4.6 19.6Z" {...TONE_FILL} />
      <path d="M4.8 11.8H19.2M12 11.8V17.4" strokeWidth="1.8" />
      <path d="M12 5.2Q12.6 2.4 16.4 2.4" strokeWidth="1.8" />
    </>
  ),
  // 身體：短袖上衣＋V 領＋腰帶的胸甲剪影，比圓滾滾的護甲輪廓更容易一眼認出是「衣服」。
  body: (
    <>
      <path d="M8.6 3.6L3.8 6.4L5.6 11.4L7.4 10.8V19.4Q7.4 20.6 8.6 20.6H15.4Q16.6 20.6 16.6 19.4V10.8L18.4 11.4L20.2 6.4L15.4 3.6Q12 7.6 8.6 3.6Z" {...TONE_FILL} />
      <path d="M9.4 4.4L12 9.2L14.6 4.4M7.6 15.6H16.4" strokeWidth="1.6" />
    </>
  ),
  hands: (
    <>
      <path d="M7.6 20.6V13Q5 11.6 4.4 9.2Q4.2 7.6 5.6 7.6Q7 7.6 7.8 9.8V5.2Q7.8 3.8 9 3.8Q10.2 3.8 10.2 5.2V4.6Q10.2 3.2 11.4 3.2Q12.6 3.2 12.6 4.6V5.2Q12.6 3.8 13.8 3.8Q15 3.8 15 5.2V6.6Q15 5.2 16.2 5.2Q17.4 5.2 17.4 6.6V14.2Q17.4 17 16.2 18V20.6Z" {...TONE_FILL} />
      <path d="M7.8 17.4H16.2" strokeWidth="1.6" />
    </>
  ),
  feet: (
    <>
      <path d="M6.6 3.4H14V13L19.4 15.4Q21 16.2 21 18V20.6H5.4L5.8 13Z" {...TONE_FILL} />
      <path d="M5.6 17.6H21M6.2 7H14" strokeWidth="1.6" />
    </>
  ),
  necklace: (
    <>
      <path d="M5 3.6Q5 12.4 12 14.2Q19 12.4 19 3.6" strokeDasharray="0.1 3" strokeWidth="2.4" />
      <path d="M12 13.6L15.2 17.4L12 21.2L8.8 17.4Z" {...TONE_FILL} />
      <circle cx="12" cy="17.4" r="1" {...SOLID_FILL} />
    </>
  ),
  ring: (
    <>
      <circle cx="12" cy="15" r="5.8" strokeWidth="2.4" />
      <path d="M8.8 7.4L10.4 4.4H13.6L15.2 7.4L12 10.6Z" {...TONE_FILL} />
    </>
  ),
};
