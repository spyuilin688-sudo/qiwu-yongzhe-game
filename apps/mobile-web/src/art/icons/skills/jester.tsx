import { circle, dots, leaf, polar, sparkle, star, strokes } from './geometry.ts';
import { Beam, Card, Glint, Place, TEMPLATE, at, type SkillGlyph } from './kit.tsx';
import { FX } from './palette.ts';
import { suitPath } from './suits.ts';

const HAT_CROWN = 'M15.4 37V20.6Q15.4 18.6 17.4 18.6H30.6Q32.6 18.6 32.6 20.6V37Z';
const JESTER_CAP = 'M12 19.6Q9.6 10.6 15.6 7Q16.4 13 20.6 15.6Q22 9 28 9.4Q24.4 14 25.6 18.4Q19 15.6 12 19.6Z';

/** 四象牌陣的四個方位與花色。 */
const SUIT_RING = [
  { suit: 'spade', x: 24, y: 10 },
  { suit: 'heart', x: 38, y: 24 },
  { suit: 'club', x: 24, y: 38 },
  { suit: 'diamond', x: 10, y: 24 },
] as const;

/** 小丑系（緋紅底）：牌術師一線用牌與花色，幻戲師一線用幻影、替身與禮炮。 */
export const JESTER_GLYPHS: Readonly<Record<string, SkillGlyph>> = {
  /** 飛牌：一張黑桃牌旋轉著往右上飛。 */
  SK051: () => (
    <>
      <Beam d={strokes([[6, 34.6, 14, 30.4], [8.6, 40.6, 16.4, 36.4], [5, 27.4, 11, 24.6]])} color={FX.cream} width={1.2} />
      <Place x={27} y={21} angle={24} scale={1.3}>
        <Card suit="spade" />
      </Place>
      <path d={sparkle(39.6, 9.6, 2.8)} fill={FX.gold.light} stroke="none" />
    </>
  ),

  /** 散花飛刃：花瓣與小飛刃交錯著旋轉散開。 */
  SK052: () => (
    <>
      <Glint d="M24 13Q35 13 35 24M24 35Q13 35 13 24" color={FX.cream} width={1.2} opacity={0.7} />
      <path
        d={[0, 120, 240].map((deg) => {
          const [x, y] = polar(24, 24, 11.4, deg - 90);
          return leaf(x, y, 10, 5.6, deg - 30);
        }).join('')}
        fill={FX.petal.base}
        strokeWidth={1.4}
      />
      <path
        d={[60, 180, 300].map((deg) => {
          const [x, y] = polar(24, 24, 12, deg - 90);
          return at(TEMPLATE.kite, x, y, 3.4, deg + 60, 2.2);
        }).join('')}
        fill={FX.steel.base}
        strokeWidth={1.4}
      />
      <path d={star(24, 24, 5, 4, 2)} fill={FX.gold.light} strokeWidth={1.2} />
    </>
  ),

  /** 切牌：兩張牌之間繞著一對換位箭頭，把下一張換成指定花色。 */
  SK053: () => (
    <>
      <Place x={17} y={25} angle={-14} scale={1.05}>
        <Card suit="heart" />
      </Place>
      <Place x={31} y={24} angle={12} scale={1.05}>
        <Card back />
      </Place>
      <Beam d="M13.4 12.4Q24 5 34.4 11.6M34.6 37.4Q24 43 13.6 37.8" color={FX.gold.light} width={1.8} />
      <path d="M36.6 8.6L37 15L31.4 13.2ZM11.4 41.2L11 34.8L16.6 36.6Z" fill={FX.gold.light} strokeWidth={1.2} />
    </>
  ),

  /** 連環牌擊：梅花、方塊、紅心三張牌依序由小到大連發。 */
  SK054: () => (
    <>
      <Place x={12.6} y={33.4} angle={-24} scale={0.78}>
        <Card suit="club" />
      </Place>
      <Place x={22.4} y={25.4} angle={-10} scale={0.92}>
        <Card suit="diamond" />
      </Place>
      <Place x={33.4} y={16.4} angle={8} scale={1.06}>
        <Card suit="heart" />
      </Place>
    </>
  ),

  /** 王牌封印：印著皇冠的王牌，右下角蓋上紅色星形封蠟。 */
  SK055: () => (
    <>
      <Place x={21.6} y={22.6} angle={-8} scale={1.45}>
        <Card />
      </Place>
      <path d={at(TEMPLATE.crown, 21.4, 21, 6.2, -8)} fill={FX.gold.base} strokeWidth={1.4} />
      <path d="M30 38.4L28.6 42.6L31 41.6L32.6 43.4L33 39.6Z" fill={FX.gold.base} strokeWidth={1.2} />
      <circle cx="33.4" cy="34" r="6" fill={FX.mark} strokeWidth={1.6} />
      <path d={star(33.4, 34, 5, 3.6, 1.6)} fill={FX.gold.light} stroke="none" />
    </>
  ),

  /** 四象牌陣：四種花色排成菱形陣，中央一顆金星。 */
  SK056: () => (
    <>
      <Beam d={circle(24, 24, 14)} color={FX.gold.light} width={1.4} />
      <path d={dots(SUIT_RING.map(({ x, y }) => [x, y, 6.4] as const))} fill={FX.paper} strokeWidth={1.6} />
      <path d={SUIT_RING.filter(({ suit }) => suit === 'heart' || suit === 'diamond').map(({ suit, x, y }) => suitPath(suit, x, y, 3.8)).join('')} fill={FX.cardRed} strokeWidth={1.1} />
      <path d={SUIT_RING.filter(({ suit }) => suit === 'spade' || suit === 'club').map(({ suit, x, y }) => suitPath(suit, x, y, 3.8)).join('')} fill={FX.cardInk} strokeWidth={1.1} />
      <path d={star(24, 24, 4, 7, 2.6, -45)} fill={FX.gold.base} strokeWidth={1.4} />
    </>
  ),

  /** 鏡像飛牌：一張牌與鏡面另一側的虛線幻影對稱。 */
  SK057: () => (
    <>
      <Beam d="M24 6V42" color={FX.rune.light} width={1} dash="2.4 2" />
      <Place x={15} y={24} angle={-16} scale={1.12}>
        <Card suit="spade" />
      </Place>
      <Place x={33} y={24} angle={16} scale={1.12}>
        <Card ghost />
      </Place>
      <path d={suitPath('spade', 33, 24, 4.4, 16)} fill={FX.white} fillOpacity={0.55} stroke="none" />
      <path d={sparkle(33, 9.6, 2.8)} fill={FX.white} stroke="none" />
    </>
  ),

  /** 替身爆彈：戴小丑帽的笑臉炸彈，引信已經點燃。 */
  SK058: () => (
    <>
      <Beam d="M29.6 16Q32.6 9.6 36.6 9.6" color={FX.wood.light} width={1.4} />
      <path d={star(38.4, 9.2, 8, 4.6, 1.8)} fill={FX.bolt.base} strokeWidth={1.1} />
      <circle cx="23" cy="28.4" r="11" fill={FX.bomb.base} />
      <Glint d="M15.6 24.6Q16.6 20.2 21 18.6" color={FX.bomb.light} width={1.8} />
      <path d={JESTER_CAP} fill={FX.mark} />
      <path d={dots([[15.6, 7, 1.7], [28, 9.4, 1.7]])} fill={FX.gold.base} strokeWidth={1.1} />
      <path d={dots([[19.4, 28.6, 1.4], [26.6, 28.6, 1.4]])} fill={FX.white} stroke="none" />
      <Glint d="M19.4 32.4Q23 35.6 26.6 32.4" width={1.5} />
    </>
  ),

  /** 戲法換位：魔術高帽上方一對雙向箭頭，舊幻影與新幻影交換位置。 */
  SK059: () => (
    <>
      <Beam d="M10 22Q11.6 9 24 9Q36.4 9 38 22" color={FX.gold.light} width={1.8} />
      <path d="M6.6 19.4L10.4 25L13.4 19.6ZM34.6 19.6L37.6 25L41.4 19.4Z" fill={FX.gold.light} strokeWidth={1.2} />
      <path d={HAT_CROWN} fill={FX.bomb.base} />
      <rect x="15.4" y="30" width="17.2" height="4" fill={FX.mark} strokeWidth={1.2} />
      <ellipse cx="24" cy="37.4" rx="13" ry="3.6" fill={FX.bomb.base} />
      <Glint d="M18.4 22V28" color={FX.bomb.light} width={1.6} />
      <path d={sparkle(24, 15.4, 3.6)} fill={FX.white} stroke="none" />
    </>
  ),

  /** 終幕禮炮：彩炮筒朝右上噴出爆光、彩紙與彩帶。 */
  SK060: () => (
    <>
      <path d={star(27, 21, 8, 9, 4)} fill={FX.holy.base} strokeWidth={1.2} />
      <Beam d="M27 17Q31 9.6 37 12Q41 13.6 41 7.6" color={FX.confettiBlue} width={1.6} />
      <path d={[at(TEMPLATE.diamond, 20, 9, 2.6, 30), at(TEMPLATE.diamond, 39, 28, 2.6, -20), at(TEMPLATE.diamond, 33, 35, 2.2, 40)].join('')} fill={FX.gold.base} strokeWidth={1} />
      <path d={[at(TEMPLATE.diamond, 30, 7, 2.2, -30), at(TEMPLATE.diamond, 41.4, 19, 2.2, 20)].join('')} fill={FX.confettiGreen} strokeWidth={1} />
      <path d="M7.6 41L13.4 25.4L23.6 35.6Z" fill={FX.gold.base} />
      <path d="M9.6 35.6L11.6 30.4L18.6 37.4L13.2 39.4Z" fill={FX.mark} stroke="none" />
      <path d="M7.6 41L13.4 25.4L23.6 35.6Z" fill="none" />
      <ellipse cx="18.5" cy="30.5" rx="2.4" ry="7.4" transform="rotate(-45 18.5 30.5)" fill={FX.bomb.shade} strokeWidth={1.4} />
    </>
  ),
};
