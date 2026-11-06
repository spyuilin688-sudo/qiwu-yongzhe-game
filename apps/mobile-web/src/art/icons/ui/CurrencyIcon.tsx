import { memo, type CSSProperties } from 'react';
import { IconFrame, type IconSizeProp } from './iconFrame.tsx';

export type CurrencyKind = 'gold' | 'relic';

export interface CurrencyIconProps {
  readonly kind: CurrencyKind;
  /** 數字＝CSS px；級距名稱＝圖示 Token；'em'＝跟著字級；省略＝填滿容器（由外層 CSS 決定大小）。 */
  readonly size?: IconSizeProp;
  readonly className?: string;
  /** 提供時以 role="img" 呈現；省略時視為裝飾，旁邊必須有「金幣」「古物」文字或無障礙名稱。 */
  readonly title?: string;
}

// 顏色一律取自 tokens.css 的暫時美術色（--coin-*／--relic-*）：換正式美術時只改 Token，不改這裡。
// 以 style 帶入 var()，因為 SVG 屬性值不保證支援 CSS 自訂屬性。
const fill = (token: string): CSSProperties => ({ fill: `var(${token})` });
const line = (token: string): CSSProperties => ({ fill: 'none', stroke: `var(${token})` });

const COIN = {
  rim: fill('--coin-rim'),
  body: fill('--coin-dark'),
  face: fill('--coin-light'),
  innerRing: { ...line('--coin-dark'), opacity: 0.75 },
  emboss: fill('--coin-rim'),
  glint: { ...line('--c-white'), opacity: 0.75 },
} as const satisfies Record<string, CSSProperties>;

const RELIC = {
  paper: { ...fill('--relic-paper'), stroke: 'var(--relic-rim)' },
  rubbing: { ...line('--relic-rim'), opacity: 0.7 },
  roller: fill('--relic-rim'),
  seal: fill('--relic-seal'),
  sealRing: { ...line('--c-white'), opacity: 0.35 },
} as const satisfies Record<string, CSSProperties>;

/**
 * 金幣：外緣、暗面、偏左上的亮面（右下留出暗色月牙做立體感）、內圈與中央四芒鏡片紋、左上高光。
 * 金幣只來自出售裝備；這個圖示只用在金幣數字旁，不放在戰場或打怪結果上。
 */
function CoinShape() {
  return (
    <>
      <circle cx="12" cy="12" r="10.8" style={COIN.rim} />
      <circle cx="12" cy="12" r="9.2" style={COIN.body} />
      <circle cx="11.3" cy="11.3" r="8.3" style={COIN.face} />
      <circle cx="12" cy="12" r="5.9" strokeWidth="1.3" style={COIN.innerRing} />
      <path d="M12 8.2L13.3 10.7L15.8 12L13.3 13.3L12 15.8L10.7 13.3L8.2 12L10.7 10.7Z" style={COIN.emboss} />
      <path d="M6.6 9.6Q7.6 6.9 10.4 6.2" strokeWidth="1.5" strokeLinecap="round" style={COIN.glint} />
    </>
  );
}

/**
 * 未鑑定古物：上下有卷軸的拓印卷＋紅色封蠟（C-10：不畫寶箱、不畫神燈）。
 * 卷軸畫在紙面之後，紙邊才會被卷軸壓住，看起來是捲起來的。
 */
function RelicShape() {
  return (
    <>
      <path d="M5.4 5.2H18.6V18.8H5.4Z" strokeWidth="1.3" strokeLinejoin="round" style={RELIC.paper} />
      <path d="M8.2 8.8H15.8M8.2 11.4H13" strokeWidth="1.3" strokeLinecap="round" style={RELIC.rubbing} />
      <rect x="3.4" y="3" width="17.2" height="3.2" rx="1.6" style={RELIC.roller} />
      <rect x="3.4" y="17.8" width="17.2" height="3.2" rx="1.6" style={RELIC.roller} />
      <path d="M13.6 16.2L12.8 21.4L14.4 20.4L15.6 21.6L16.6 16.2Z" style={RELIC.seal} />
      <circle cx="15.1" cy="14.6" r="3.2" style={RELIC.seal} />
      <circle cx="15.1" cy="14.6" r="1.7" strokeWidth="0.9" style={RELIC.sealRing} />
    </>
  );
}

/**
 * 資源圖示（彩色 SVG 佔位，不是最終美術）：資源列、鑑定區古物存量、出售鍵、升台費用共用同一組。
 * 以 memo 包裝：放在每次戰鬥更新都會重繪的區域時不重建 SVG。
 */
export const CurrencyIcon = memo(function CurrencyIcon({ kind, size, className, title }: CurrencyIconProps) {
  return (
    <IconFrame viewBox="0 0 24 24" size={size} className={className} title={title}>
      {kind === 'gold' ? <CoinShape /> : <RelicShape />}
    </IconFrame>
  );
});
