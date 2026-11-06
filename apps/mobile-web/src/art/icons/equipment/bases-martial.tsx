import { circle, dots, leaf, rays, shape, sparkle, star, strokes } from '../skills/geometry.ts';
import { Diagonal, Grow, Ink, Shine, Tube, type EquipDesign } from './kit.tsx';
import { DETAIL, INK, MAT } from './palette.ts';

/** 箭羽範本（與 ranged.tsx 的箭袋同一款）：上尖下開的山形，單位座標。 */
const FLETCH = 'M0 -1L0.55 -0.35L0.55 0.75L0 0.4L-0.55 0.75L-0.55 -0.35Z';

/**
 * 破城符盾的符文：一根直刻痕上分出兩道上揚的叉（守護符文的意象），以墨線刻在發光的符印圓盤上。
 * 用實心圓盤而非空心符環：環的墨線內緣很厚，環內再放符號會成「同心圓靶」；筆畫穿出環又會把環切成 Φ。
 * 也不用箭頭或十字，免得縮小後被讀成介面按鈕或準星。
 */
const RUNE_GLYPH = 'M24 17.4V26.4M24 21.4L27 18.4M24 21.4L21 18.4';

/** 弓弦（與 ranged.tsx 同規格）：深色底線加亮色細線；color 可換成發光弦。 */
function BowString({ d, color = MAT.cloth.base }: { readonly d: string; readonly color?: string }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={2.4} />
      <path d={d} fill="none" stroke={color} strokeWidth={0.9} />
    </>
  );
}

/**
 * 劍士系與弓手系的進階武器／副手（各職業二、三階）。依「裝備基底 ID」索引，
 * 與同種類的代表圖（ranged.tsx、blades.tsx、tools.tsx）共用同一套擺放角度與描邊，
 * 只靠材質、配件與剪影區分：二階較厚重、多一個重點配件；三階用金、寶石與光點。
 */
export const MARTIAL_BASE_DESIGNS: Readonly<Record<string, EquipDesign>> = {
  /**
   * 赤鐵劍鞘：赤銅金屬鞘、平頭方角的黑鐵鞘靴，鞘口套一截高的鉚釘黑鐵護套（二階唯一的重點配件），
   * 亮鐵護手兩端上翹成牛角尖、紅皮握柄配鐵菱柄頭；木紋劍鞘是圓頭紅皮鞘、平直鐵護手、深木握柄。
   * 鐵件集中在兩端、中段赤銅不切斷：多道鐵箍會切成深淺條紋，縮小後像鑽頭；鞘尖削平，免得橘身黑尖像鉛筆。
   */
  EQ016: (p) => (
    <Diagonal mid={25.2}>
      <path d="M18 31L19 9L20.4 3.6H27.6L29 9L30 31Z" fill={p.split(MAT.copper)} />
      <Shine d="M21.4 13.2V21.6" color={MAT.copper.light} width={1.6} />
      <path d="M18.6 11.6L19.6 2.6H28.4L29.4 11.6L24 8.8Z" fill={p.split(MAT.darkIron)} />
      <rect x="17.2" y="23.2" width="13.6" height="8.4" rx="1.6" fill={p.split(MAT.darkIron)} />
      <path d={dots([[20.4, 27.4, 1], [27.6, 27.4, 1]])} fill={MAT.iron.light} strokeWidth={0.8} />
      <path d="M10.4 26.6L16.6 31.6H31.4L37.6 26.6L35.4 36.4H12.6Z" fill={p.split(MAT.iron)} />
      <path d="M24 31.8L26.2 34.1L24 36.4L21.8 34.1Z" fill={MAT.ember.base} strokeWidth={1.2} />
      <rect x="21.2" y="36.4" width="5.6" height="9" rx="1.6" fill={MAT.redLeather.base} />
      <Ink d={strokes([[21.5, 38.6, 26.5, 41], [21.5, 42, 26.5, 44.4]])} width={1.1} />
      <path d="M24 45L27.4 48.4L24 52.6L20.6 48.4Z" fill={p.split(MAT.iron)} />
    </Diagonal>
  ),

  /** 不滅劍鞘：銀白長鞘配金色火焰形鞘尖，鞘身中段小金座嵌著不熄的火苗，細金翼護手、白絲握柄與垂掛紅流蘇；紅、橙兩把鞘之外唯一的銀白色。 */
  EQ018: (p) => (
    <>
      <Tube d="M26.6 31.4Q31.6 33 31 38.6" width={1.8} core={1.2} color={MAT.gold.base} />
      <path d="M31 37.6Q34 38.2 33.6 41L34.4 45.6H27.6L28.4 41Q28 38.2 31 37.6Z" fill={p.split(MAT.ruby)} strokeWidth={1.6} />
      <Diagonal mid={25.2}>
        <path d="M18.8 30.8L19.6 8.6Q24 2.8 28.4 8.6L29.2 30.8Z" fill={p.split(MAT.silver)} />
        <Shine d="M21.6 12V27.4" color={MAT.silver.light} width={1.6} />
        <path d="M20 9.8Q19.8 5 24 1.2Q28.2 5 28 9.8L26 12L24 10.2L22 12Z" fill={p.split(MAT.gold)} />
        <path d="M24 15.2L27.4 19.6L24 24L20.6 19.6Z" fill={p.split(MAT.gold)} strokeWidth={1.5} />
        <path d="M24 16.8Q26.2 19.6 25.2 21.2Q24 22.2 22.8 21.2Q21.8 19.6 24 16.8Z" fill={MAT.ember.base} strokeWidth={1} />
        <rect x="18.2" y="26.8" width="11.6" height="4.4" rx="1.6" fill={p.split(MAT.gold)} />
        <path d="M12.6 29.4Q15 32.2 18.6 31.8H29.4Q33 32.2 35.4 29.4Q36.8 35.8 30.6 35.8H17.4Q11.2 35.8 12.6 29.4Z" fill={p.split(MAT.gold)} />
        <circle cx="24" cy="33.8" r="2" fill={p.ball(MAT.sapphire)} strokeWidth={1.2} />
        <rect x="21.4" y="35.8" width="5.2" height="9.4" rx="1.6" fill={MAT.cloth.base} />
        <Ink d={strokes([[21.7, 38, 26.3, 40.4], [21.7, 41.6, 26.3, 44]])} width={1.1} color={MAT.cloth.shade} />
        <circle cx="24" cy="47.8" r="3" fill={p.ball(MAT.gold)} />
      </Diagonal>
      <path d={sparkle(41, 5.4, 3)} fill={DETAIL.white} stroke="none" />
    </>
  ),

  /** 鷹眼箭袋：反向傾斜的青綠皮筒、鐵口環，正面鐵盤嵌一隻琥珀色鷹眼（銳利眉骨），袋口插藍白羽箭，側邊綁一根鷹羽。 */
  EQ024: (p) => (
    <g transform="rotate(14 24 26)">
      <Ink d={strokes([[19.4, 15, 17.8, 8.6], [24, 15, 24, 7.4], [28.6, 15, 30.2, 8.6]])} width={1.8} color={MAT.darkWood.base} />
      <path d={[shape(FLETCH, 17.4, 7.8, 2.6, 4.4, -12), shape(FLETCH, 30.6, 7.8, 2.6, 4.4, 12)].join('')} fill={MAT.cloth.base} strokeWidth={1.5} />
      <path d={shape(FLETCH, 24, 6.4, 2.8, 4.8)} fill={MAT.plume.base} strokeWidth={1.5} />
      <path d="M15 19Q7 28 16.4 38" fill="none" stroke={INK} strokeWidth={4} />
      <path d="M15 19Q7 28 16.4 38" fill="none" stroke={MAT.leather.light} strokeWidth={1.8} />
      <path d="M15.2 15.5H32.8L31.6 43Q24 46.4 16.4 43Z" fill={p.split(MAT.tealCloth)} />
      <Shine d="M18 20V36" color={MAT.tealCloth.light} />
      <rect x="13.8" y="13.4" width="20.4" height="5" rx="2" fill={p.split(MAT.iron)} />
      <path d="M16.6 38.4H31.4L31.2 43Q24 46.8 16.8 43Z" fill={p.split(MAT.iron)} />
      <circle cx="24" cy="28" r="6" fill={p.ball(MAT.brass)} strokeWidth={1.6} />
      <path d={leaf(24, 28.4, 9, 4.4, 0)} fill={MAT.amber.light} strokeWidth={1.3} />
      <circle cx="24" cy="28.4" r="1.6" fill={INK} stroke="none" />
      <Ink d="M18.6 26Q23 23 29.4 25.6" width={1.8} />
      <path d={leaf(36.4, 34.4, 13, 3.8, 104)} fill={p.split(MAT.cloth)} strokeWidth={1.5} />
      <path d={leaf(37.4, 39.6, 4.2, 3.4, 104)} fill={MAT.leather.shade} stroke="none" />
      <Ink d="M35.4 29.2L37.6 39.4" width={0.9} color={MAT.cloth.shade} />
    </g>
  ),

  /**
   * 天隼箭匣：正面直立的深藍箭匣，金邊金底，匣身兩側各展開一片三羽尖的金色隼翼，正面一顆星芒藍寶石；
   * 不傾斜、有翅膀的剪影與兩只皮筒箭袋明顯不同。翅膀做成寬的三段羽片、接在匣身中段：
   * 細長單弧翼縮到 22px 只剩兩點金屑，直筒金頭金底就像電池或卷軸筒。
   */
  EQ026: (p) => (
    <>
      <Ink d={strokes([[20, 15, 18.8, 8.4], [24, 15, 24, 7.2], [28, 15, 29.2, 8.4]])} width={1.8} color={MAT.darkWood.base} />
      <path d={[shape(FLETCH, 18.6, 7.8, 2.4, 4.2, -8), shape(FLETCH, 29.4, 7.8, 2.4, 4.2, 8)].join('')} fill={MAT.plume.base} strokeWidth={1.5} />
      <path d={shape(FLETCH, 24, 6.4, 2.6, 4.6)} fill={MAT.gold.light} strokeWidth={1.5} />
      <path
        d="M16.4 17Q10.6 12 4.6 9.6L9.2 15.4L5.4 18.2L10.2 20.6L7.4 24.6L16.6 25.4ZM31.6 17Q37.4 12 43.4 9.6L38.8 15.4L42.6 18.2L37.8 20.6L40.6 24.6L31.4 25.4Z"
        fill={p.split(MAT.gold)}
      />
      <Ink d={strokes([[15.4, 19.4, 10.2, 16], [15.6, 23, 11, 21.2], [32.6, 19.4, 37.8, 16], [32.4, 23, 37, 21.2]])} width={1.1} color={MAT.gold.shade} />
      <path d="M15.2 15.6H32.8L31.2 42.4L28.4 44.6H19.6L16.8 42.4Z" fill={p.split(MAT.cosmos)} />
      <Shine d="M18.4 20V38" color={MAT.cosmos.light} />
      <rect x="13.6" y="13.2" width="20.8" height="5" rx="2" fill={p.split(MAT.gold)} />
      <path d="M16.6 38.6H31.4L31.2 42.4L28.4 45H19.6L16.8 42.4Z" fill={p.split(MAT.gold)} />
      <path d={star(24, 28.2, 4, 7.4, 2.6)} fill={p.split(MAT.gold)} strokeWidth={1.5} />
      <circle cx="24" cy="28.2" r="2.6" fill={p.ball(MAT.sapphire)} strokeWidth={1.3} />
      <path d={[sparkle(9.6, 30, 2.6), sparkle(39.4, 36, 2.2)].join('')} fill={DETAIL.white} stroke="none" />
    </>
  ),

  /** 破曉巨劍：寬直刃（無豁口），金色直護手上升起半輪琥珀朝陽、金色光芒沿刃根放射，白布握柄、金柄頭，刃尖一點晨光；斷牙巨劍則是黑鐵翼護手與紅柄。 */
  EQ017: (p) => (
    <Diagonal mid={27}>
      <path d="M24 0L30.2 7.4V33H17.8V7.4Z" fill={p.split(MAT.steel)} />
      <rect x="22.7" y="7.4" width="2.6" height="20" rx="1.3" fill={MAT.steel.shade} strokeWidth={1.1} />
      <Shine d="M20 8.4V26" color={MAT.steel.light} />
      <path d={rays(24, 34, 7.4, 14, [-164, -132, -100, -80, -48, -16], 8)} fill={p.split(MAT.gold)} strokeWidth={1.4} />
      <path d="M15.4 34A8.6 8.6 0 0 1 32.6 34Z" fill={p.split(MAT.amber)} />
      <rect x="11.8" y="33" width="24.4" height="4.8" rx="2.2" fill={p.split(MAT.gold)} />
      <rect x="21.4" y="37.8" width="5.2" height="11" rx="1.6" fill={MAT.cloth.base} />
      <Ink d={strokes([[21.8, 40.4, 26.2, 42.6], [21.8, 44, 26.2, 46.2]])} width={1.1} color={MAT.cloth.shade} />
      <circle cx="24" cy="51" r="2.8" fill={p.ball(MAT.gold)} />
      <path d={[sparkle(28.6, 3.2, 3), sparkle(21.4, 30.4, 2)].join('')} fill={DETAIL.holyGlow} stroke="none" />
    </Diagonal>
  ),

  /** 赫紋聖劍：刃心一道赤橙發光的符文槽，十字直護手外套一圈金環、中央紅寶石，紅皮握柄配金柄頭；鐵脊長劍則是上翹翼護手與藍柄。 */
  EQ021: (p) => (
    <Diagonal mid={25.6}>
      <path d="M24 0L28.8 5.6V31H19.2V5.6Z" fill={p.split(MAT.steel)} />
      <rect x="22.2" y="6.2" width="3.6" height="22.8" rx="1.4" fill={MAT.ember.base} strokeWidth={1.1} />
      <Ink d="M23.2 9L24.8 10.6L23.2 12.2M24 15V19.4M23 17.2H25M23.2 21.6L24.8 23.2M24.8 21.6L23.2 23.2M23.2 25.6L24 27L24.8 25.6" width={0.9} color={DETAIL.holyGlow} />
      <Shine d="M20.8 8V28.4" color={MAT.steel.light} />
      <Tube d={circle(24, 33.4, 5.6)} width={3.8} color={MAT.gold.base} />
      <path d="M10.6 30.4L14 31.6H34L37.4 30.4V36.4L34 35.2H14L10.6 36.4Z" fill={p.split(MAT.gold)} />
      <circle cx="24" cy="33.4" r="2.6" fill={p.ball(MAT.ruby)} strokeWidth={1.3} />
      <rect x="21.4" y="38.6" width="5.2" height="7.8" rx="1.6" fill={MAT.redLeather.base} />
      <Ink d={strokes([[21.7, 41, 26.3, 41], [21.7, 43.8, 26.3, 43.8]])} width={1.1} />
      <path d="M24 46.2L27.4 49L24 51.8L20.6 49Z" fill={p.split(MAT.gold)} />
      <path d={sparkle(31.4, 12, 2.6)} fill={MAT.ember.light} stroke="none" />
    </Diagonal>
  ),

  /** 破城符盾：直邊切角的大塔盾，金框黑鐵盾面，中央一枚發光的赤橙符印圓盤、盤上刻著分叉的守護符文，頂緣嵌紅寶石，盾底伸出一截鋼刃（盾刃突擊）；銅獅戰盾則是藍底鳶形盾。 */
  EQ022: (p) => (
    <>
      <path d="M18 35.4L24 46.4L30 35.4Z" fill={p.split(MAT.steel)} />
      <path d="M8.6 9.4L13.4 4.6H34.6L39.4 9.4V31.4L24 41L8.6 31.4Z" fill={p.split(MAT.gold)} />
      <path d="M12.4 10.8L15.2 8.2H32.8L35.6 10.8V29.6L24 37.2L12.4 29.6Z" fill={p.split(MAT.darkIron)} strokeWidth={1.6} />
      <Shine d="M15 13V27.6" color={MAT.darkIron.light} />
      <circle cx="24" cy="21.8" r="8" fill={p.ball(MAT.ember)} strokeWidth={1.6} />
      <Ink d={circle(24, 21.8, 6)} width={1} color={MAT.ember.light} />
      <Ink d={RUNE_GLYPH} width={1.8} />
      <circle cx="24" cy="6.4" r="2.1" fill={p.ball(MAT.ruby)} strokeWidth={1.3} />
      <path d={dots([[12.2, 8.4, 0.9], [35.8, 8.4, 0.9], [10.8, 30.2, 0.9], [37.2, 30.2, 0.9]])} fill={MAT.gold.light} strokeWidth={0.8} />
    </>
  ),

  /** 逐星長弓：深藍星空色的修長弓身，兩端弓梢頂著金色五角星，金色握把嵌星芒，弓弦泛冰藍光；蒼羽長弓則是深木色掛藍羽。 */
  EQ025: (p) => (
    <Diagonal mid={24} offset={-4}>
      <BowString d="M29.4 5V43" color={MAT.ice.base} />
      <path d="M28.6 4.4Q4.4 24 28.6 43.6L30.6 41.8Q12.8 24 30.6 6.2Z" fill={p.split(MAT.cosmos)} />
      <Shine d="M21.8 10Q14 16.4 13.6 22" color={MAT.cosmos.light} width={1.2} />
      <rect x="13.2" y="19.6" width="7.6" height="8.8" rx="1.8" fill={p.split(MAT.gold)} />
      <path d={sparkle(17, 24, 3)} fill={DETAIL.white} strokeWidth={0.9} />
      <path d={[star(29.6, 4.6, 5, 4.6, 2), star(29.6, 43.4, 5, 4.6, 2, 90)].join('')} fill={p.split(MAT.gold)} strokeWidth={1.5} />
      <path d={[sparkle(36.4, 14, 2.4), sparkle(37.6, 32, 1.8)].join('')} fill={MAT.gold.light} stroke="none" />
    </Diagonal>
  ),

  /** 百獸獵弓：象牙白的骨製反曲弓，弓背一排獸牙、弓梢套金爪，握把纏獸毛並嵌金色獸首章；荊棘獵弓則是深木色帶綠藤荊棘。 */
  EQ029: (p) => (
    <Diagonal mid={24} offset={-4.4}>
      <BowString d="M32.4 4.6V43.4" />
      <path d="M22.6 11.6L14.8 9.4L19.4 17.4ZM18.4 17.2L10.8 16.8L16.4 23ZM18.4 30.8L10.8 31.2L16.4 25ZM22.6 36.4L14.8 38.6L19.4 30.6Z" fill={MAT.bone.light} strokeWidth={1.4} />
      <Tube d="M33 3C28 2 27.5 7 24.5 11.5Q14.5 24 24.5 36.5C27.5 41 28 46 33 45" width={5.8} color={MAT.bone.base} />
      <Ink d="M25.2 9.4L28.4 11.6M25.2 38.6L28.4 36.4" width={1.4} color={MAT.bone.shade} />
      <path d="M31.6 0.6L36.4 3.2L32.6 5.8ZM31.6 47.4L36.4 44.8L32.6 42.2Z" fill={p.split(MAT.gold)} strokeWidth={1.4} />
      <rect x="15.8" y="19.4" width="7.4" height="9.2" rx="1.6" fill={MAT.leather.base} />
      <path d="M15 19.4L16.4 17.4L17.8 19.4L19.2 17.2L20.6 19.4L22 17.4L23.8 19.6ZM15 28.6L16.4 30.6L17.8 28.6L19.2 30.8L20.6 28.6L22 30.6L23.8 28.4Z" fill={MAT.rag.base} strokeWidth={1.2} />
      <path d="M16.4 21.4L15.8 18.8L18.2 20.4H20.8L23.2 18.8L22.6 21.4Q23.4 26.8 19.5 27.8Q15.6 26.8 16.4 21.4Z" fill={p.split(MAT.gold)} strokeWidth={1.4} />
      <path d={dots([[18.2, 23.2, 0.7], [20.8, 23.2, 0.7]])} fill={INK} stroke="none" />
      <Ink d="M18.6 25.6L19.5 26.2L20.4 25.6" width={0.9} />
    </Diagonal>
  ),

  /**
   * 獸王號角：向上捲的黃褐大獸角號，兩道金箍、朝右上張開的大金號口，角身鑲一枚嵌紅寶石的金冠徽（獸王的「王」），
   * 掛紅皮背帶；狼牙骨笛則是向下彎的白骨號。只留兩道箍：三道會把細長彎角切成一節一節，縮小後像可頌；
   * 號口外不加一圈鬃毛：放射狀的毛簇描邊後成尖刺，縮小後讀成齒輪或荊棘冠。
   */
  EQ030: (p) => (
    <Grow by={1.12} cx={23.4} cy={25.4} dx={-0.6} dy={-2.4}>
      <Tube d="M13.4 37.6Q22 46.4 32 30.4" width={2.4} color={MAT.redLeather.base} />
      <path d="M8.6 40.4C7.4 23.2 16.8 12.4 31.4 11.6L36 25.6C25.4 23.4 16.4 28.4 14 40.4Z" fill={p.split(MAT.wood)} />
      <Shine d="M10.8 35.4Q10.6 30 11.4 26.8M15.8 19.4Q17.2 18.2 19 17.2" color={MAT.wood.light} />
      <Tube d="M8.8 33.8L14.6 34.6M20 15L23.4 21.8" width={3.4} color={MAT.gold.base} />
      <ellipse cx="35.6" cy="18.4" rx="4.6" ry="8.8" transform="rotate(-22 35.6 18.4)" fill={p.split(MAT.gold)} />
      <ellipse cx="36.1" cy="18.2" rx="2.2" ry="6" transform="rotate(-22 36.1 18.2)" fill={DETAIL.hollow} strokeWidth={1.2} />
      <path d="M8 39.4L14.6 39.6L14.4 43.6L8.4 43.4Z" fill={p.split(MAT.gold)} strokeWidth={1.5} />
      <path d="M12 30L11.8 24.8L13.8 26.6L15.6 23.6L17.4 26.6L19.4 24.8L19.2 30Z" fill={p.split(MAT.gold)} strokeWidth={1.4} />
      <circle cx="15.6" cy="28.2" r="1.5" fill={p.ball(MAT.ruby)} strokeWidth={1.1} />
    </Grow>
  ),
};
