import { circle, dots, ellipse, gear, leaf, sparkle, star, strokes } from '../skills/geometry.ts';
import { Grow, Ink, Shine, Tube, type EquipDesign } from './kit.tsx';
import { DETAIL, INK, MAT } from './palette.ts';

/** 戒指本體：外、內兩個橢圓配 evenodd，中間鏤空透出卡框底色（與 wearables.tsx 的代表戒指同一種畫法）。 */
function bandRing(cx: number, cy: number, rx: number, ry: number, innerRx: number, innerRy: number, innerDy: number): string {
  return ellipse(cx, cy, rx, ry) + ellipse(cx, cy + innerDy, innerRx, innerRy);
}

/**
 * 共用部位（任何職業可穿）的其餘基底。每個部位的第一件（旅人軟帽、亞麻旅衣、縫皮手套、軟底旅靴、木牙墜飾、銅環戒指）
 * 沿用 wearables.tsx 的部位代表圖；這裡的兩件各換一種剪影與主材質，仍維持同一部位的讀法：
 * 帽子仍是帽子、靴子仍朝右，只靠外形、材質與一個重點配件拉開差異。
 */
export const SHARED_BASE_DESIGNS: Readonly<Record<string, EquipDesign>> = {
  /** 羽飾獵帽：橄欖綠的窄簷尖頂獵帽，後簷上翻、前簷下壓，帽帶黃銅扣插著一藍一白兩根長羽往左後方掃；代表圖是寬簷圓頂青布帽與單根紅羽。 */
  EQ072: (p) => (
    <g transform="translate(0 2.4)">
      <path d={leaf(11.6, 15.4, 25, 7.2, -116)} fill={p.split(MAT.plume)} />
      <Ink d="M17 26L6.2 4.6" width={1.1} color={MAT.plume.light} />
      <path d={leaf(18.2, 10.8, 18, 6, -98)} fill={p.split(MAT.cloth)} />
      <Ink d="M19.2 18.6L17.4 3.6" width={1.1} color={MAT.cloth.shade} />
      <path d="M13.6 30.4L15.6 17.6Q16.8 11.8 22.6 11.6L25 13.4L28.4 11.2Q34.2 11 35.4 17L37 30.4Z" fill={p.split(MAT.greenWood)} />
      <Shine d="M18.6 26.4V19Q19 15.8 21.4 14.8" color={MAT.greenWood.light} />
      <path d="M14.2 24.8Q25 27.2 36.2 24.8L36.8 30Q25 32.4 13.6 30Z" fill={MAT.darkWood.base} strokeWidth={1.6} />
      <circle cx="18.4" cy="27.6" r="2.7" fill={p.ball(MAT.brass)} strokeWidth={1.4} />
      <path d="M5 25.6Q8 30.8 14 31Q25 32 36 30.4Q41.8 29.8 44 33.4Q40.6 36.6 25 36.4Q12.4 36.2 8.4 32.6Q5.2 29.8 5 25.6Z" fill={p.fall(MAT.greenWood)} />
    </g>
  ),

  /** 星紋頭冠：正面的金色頭冠，中央高聳的尖峰托著圓座藍星寶石，兩側小尖峰嵌冰藍小石，冠環內嵌一圈深藍琺瑯星紋；硬金屬的冠形，與軟布帽一眼可分。 */
  EQ073: (p) => (
    <>
      <Tube d="M8.6 28.4Q24 20.4 39.4 28.4" width={2.6} color={MAT.gold.shade} />
      <path d="M6.2 27.4L12.4 30.2L14.8 20.6L18.4 31.8L21 32.2L24 6.4L27 32.2L29.6 31.8L33.2 20.6L35.6 30.2L41.8 27.4L42 33.6Q24 43.6 6 33.6Z" fill={p.split(MAT.gold)} />
      <Shine d="M9.6 31.6Q14 34 17.6 34.8" color={MAT.gold.light} />
      <path d="M9 32.4Q24 41 39 32.4L39.2 35Q24 43.2 8.8 35Z" fill={MAT.cosmos.base} strokeWidth={1.2} />
      <path d={[sparkle(15.4, 36.4, 1.8), sparkle(24, 39, 2), sparkle(32.6, 36.4, 1.8)].join('')} fill={MAT.gold.light} stroke="none" />
      <circle cx="24" cy="19.4" r="6" fill={p.ball(MAT.gold)} />
      <path d={star(24, 19.6, 5, 4.6, 2)} fill={p.split(MAT.sapphire)} strokeWidth={1.2} />
      <path d={dots([[14.8, 25.4, 1.8], [33.2, 25.4, 1.8]])} fill={MAT.ice.base} strokeWidth={1.2} />
      <path d={[sparkle(36.6, 11.4, 3), sparkle(10.8, 15, 2.2)].join('')} fill={DETAIL.white} stroke="none" />
    </>
  ),

  /** 赤銅胸甲：正面的赤銅無袖胸甲，圓弧肩甲、胸口一道中脊、黑鐵護頸與兩層腰甲片，黃銅鉚釘；硬殼甲沒有袖子，與代表圖的藍布 T 形旅衣剪影不同。 */
  EQ075: (p) => (
    <>
      <path d="M4.8 21Q3.6 10.8 12.4 9.2Q17.4 8.8 18.6 12.8L16 22.4Q10 20 4.8 21Z" fill={p.ball(MAT.copper)} />
      <path d="M43.2 21Q44.4 10.8 35.6 9.2Q30.6 8.8 29.4 12.8L32 22.4Q38 20 43.2 21Z" fill={p.ball(MAT.copper)} />
      <path d="M12.2 37.4Q24 41.6 35.8 37.4L36.8 42.4Q24 47 11.2 42.4Z" fill={p.fall(MAT.darkIron)} />
      <path d="M13.2 33Q24 37.2 34.8 33L35.8 38.2Q24 42.6 12.2 38.2Z" fill={p.fall(MAT.copper)} />
      <path d="M15.6 8.4Q24 15.6 32.4 8.4L37.4 13Q34.8 20 36.2 26Q33.6 30 34 33.4Q24 37.4 14 33.4Q14.4 30 11.8 26Q13.2 20 10.6 13Z" fill={p.split(MAT.copper)} />
      <Ink d="M24 15.6V35" width={1.6} color={MAT.copper.shade} />
      <Ink d="M14.6 21.4Q19 25 23 22M33.4 21.4Q29 25 25 22" width={1.2} color={MAT.copper.shade} />
      <Shine d="M14.6 15.4Q15.6 20.4 14.6 26" color={MAT.copper.light} />
      <Tube d="M15.6 8.4Q24 15.6 32.4 8.4" width={2.8} color={MAT.darkIron.base} />
      <path d={dots([[13.6, 14.8, 1.1], [34.4, 14.8, 1.1], [16, 31.4, 1.1], [32, 31.4, 1.1], [24, 35.6, 1.1]])} fill={MAT.brass.light} strokeWidth={0.8} />
    </>
  ),

  /** 月紋長袍：拖到腳邊的紫色 A 字長袍，寬大鐘形袖、背後兜帽，銀色門襟與袖口滾邊，胸前一彎金色新月、下襬點綴星光；長而寬的剪影，與短版旅衣、硬殼胸甲都不同。 */
  EQ076: (p) => (
    <>
      <path d="M15.6 9.6Q15.4 2.4 24 2.4Q32.6 2.4 32.4 9.6Z" fill={MAT.purple.shade} />
      <path d="M18.4 6.4L24 10.6L29.6 6.4L33.2 8.8L33.6 16Q35.2 30 40 43.4Q24 46.8 8 43.4Q12.8 30 14.4 16L14.8 8.8Z" fill={p.split(MAT.purple)} />
      <path d="M22.4 10.4L24 11.4L25.6 10.4V45.6H22.4Z" fill={MAT.silver.base} strokeWidth={1.2} />
      <Tube d="M8.6 42.8Q24 46 39.4 42.8" width={2.2} color={MAT.silver.base} />
      <path d="M15 8.8L9.4 11.2Q5.4 20 3.6 31.6Q8.6 34 13.6 31.4L15.2 18Z" fill={p.split(MAT.purple)} />
      <path d="M33 8.8L38.6 11.2Q42.6 20 44.4 31.6Q39.4 34 34.4 31.4L32.8 18Z" fill={p.split(MAT.purple)} />
      <Tube d="M4.2 31.4Q8.6 33.4 13.2 31.2M34.8 31.2Q39.4 33.4 43.8 31.4" width={2.2} color={MAT.silver.base} />
      <path d="M18.4 6.4L24 13L29.6 6.4L27.8 5.6Q24 9 20.2 5.6Z" fill={MAT.silver.light} strokeWidth={1.4} />
      <Shine d="M16.6 20V31" color={MAT.purple.light} />
      <path d="M26.4 16.6A5.8 5.8 0 1 0 26.4 27.4A4.4 4.4 0 1 1 26.4 16.6Z" fill={p.split(MAT.gold)} strokeWidth={1.5} />
      <path d={[sparkle(15.8, 37, 2.2), sparkle(32.4, 35.4, 1.8), sparkle(29.2, 39.8, 1.4)].join('')} fill={MAT.gold.light} stroke="none" />
    </>
  ),

  /** 銀扣護手：直立微右傾的夜藍皮護手，四指併攏成階梯狀指尖、拇指往右上翹，指根橫一片銀甲，腕上皮帶扣著一枚大方形銀扣，喇叭形短護腕口滾銀邊；冷色併指加銀扣，與攤開五指的棕色縫皮手套、鐵指黃銅的發條手甲都不同。 */
  EQ078: (p) => (
    <g transform="translate(-1 0) rotate(7 24 25)">
      <path d="M32.4 26Q38.4 24.6 40.2 18.4Q41.2 14.6 38.6 14Q36.2 13.6 35 16.6L32.4 20.4Z" fill={p.split(MAT.night)} strokeWidth={1.8} />
      <path d="M14 30V12.4Q14 9.6 16.5 9.6Q19 9.6 19 12V8.6Q19 6 21.5 6Q24 6 24 8.6V7.2Q24 4.4 26.5 4.4Q29 4.4 29 7.2V9.4Q29 6.8 31.5 6.8Q34 6.8 34 9.4V30Z" fill={p.split(MAT.night)} />
      <Ink d={strokes([[19, 12.2, 19, 17], [24, 8.8, 24, 17], [29, 9.6, 29, 17]])} width={1.3} />
      <Shine d="M16.4 12.6V15.4M16.4 22.4V27" color={MAT.night.light} />
      <path d="M13.4 16.4Q24 14.2 34.6 16.4V21Q24 18.8 13.4 21Z" fill={p.split(MAT.silver)} />
      <path d="M14.6 29.4H33.4L36.8 41.2Q24 44.2 11.2 41.2Z" fill={p.split(MAT.night)} />
      <Tube d="M11.8 41.4Q24 44.2 36.2 41.4" width={2.4} color={MAT.silver.base} />
      <rect x="13.4" y="28.4" width="21.2" height="4.6" rx="1" fill={MAT.leather.base} strokeWidth={1.5} />
      <path d="M19.2 26.4H28.8V35.4H19.2ZM21.8 29V32.8H26.2V29Z" fill={p.split(MAT.silver)} fillRule="evenodd" strokeWidth={1.5} />
      <Ink d="M24 29.2V32.6" width={1.5} />
    </g>
  ),

  /** 發條手甲：黃銅手背甲板配分節鐵指，手背嵌一枚紅銅大齒輪、中心是黃銅軸心，黑鐵腕甲側面插著一支上發條的蝶形鑰匙；灰鐵指節＋齒輪＋鑰匙的鐘錶機械感，與皮手套材質完全不同，也刻意不用發光核心。 */
  EQ079: (p) => (
    <g transform="translate(1.2 0)">
      <Tube d="M15.6 21V11.4M20.6 21V7.6M25.6 21V8.2M30.6 21V11.8M34.4 26.4L39.8 19.8" width={4.4} color={MAT.iron.base} />
      <Ink d={strokes([[13.4, 15.4, 17.8, 15.4], [18.4, 12.8, 22.8, 12.8], [23.4, 13.4, 27.8, 13.4], [28.4, 16, 32.8, 16], [35.4, 22.6, 38.6, 25]])} width={1.3} />
      <path d="M12.8 19.4H35.2Q36.8 19.4 36.4 21.2L34.6 34.4H13.4L11.6 21.2Q11.2 19.4 12.8 19.4Z" fill={p.split(MAT.brass)} />
      <path d={gear(24, 26.6, 8.2, 6.2, 8, 10)} fill={p.split(MAT.copper)} strokeWidth={1.6} />
      <circle cx="24" cy="26.6" r="3" fill={p.ball(MAT.brass)} strokeWidth={1.3} />
      <circle cx="24" cy="26.6" r="1" fill={INK} stroke="none" />
      <rect x="13.6" y="33.6" width="20.8" height="10" rx="2.2" fill={p.split(MAT.darkIron)} />
      <path d={dots([[16.6, 38.6, 1.1], [31.4, 38.6, 1.1]])} fill={MAT.brass.light} strokeWidth={0.8} />
      <Tube d="M13.6 38.6H8.6" width={2.4} color={MAT.brass.base} />
      <path d="M8.6 38.6Q6 31.6 3.6 33.6Q2.4 36 4.2 38.6Q2.4 41.2 3.6 43.6Q6 45.6 8.6 38.6Z" fill={p.split(MAT.brass)} strokeWidth={1.6} />
    </g>
  ),

  /** 追風長靴：朝右的青綠高筒長靴，斜切的銀邊靴口、尖頭靴尖，腳踝後方展開一副白色三片羽翼；高筒加羽翼的剪影，與代表圖的翻口皮靴不同。 */
  EQ081: (p) => (
    <g transform="translate(1.2 0)">
      <path d={leaf(9.2, 17.4, 13, 4.4, -145)} fill={p.split(MAT.cloth)} strokeWidth={1.6} />
      <path d={leaf(7.6, 23.4, 13, 4.2, -175)} fill={p.split(MAT.cloth)} strokeWidth={1.6} />
      <path d={leaf(9.4, 29, 10.6, 3.8, 160)} fill={p.split(MAT.cloth)} strokeWidth={1.6} />
      <path d="M15.4 9.6L27.6 5.4L26.8 27.6L36.6 31Q43.6 33.6 43 38.6V40.4H14.6Q13 27 15.4 9.6Z" fill={p.split(MAT.tealCloth)} />
      <Shine d="M17.8 14V30M32.6 32.4Q37.6 33.8 40.2 36.4" color={MAT.tealCloth.light} />
      <path d="M14.6 8.8L28.4 4L28.6 8.8L15 13.4Z" fill={p.split(MAT.silver)} strokeWidth={1.6} />
      <circle cx="15.4" cy="25.4" r="2.6" fill={p.ball(MAT.silver)} strokeWidth={1.4} />
      <rect x="13.6" y="39" width="30.4" height="4.4" rx="1.8" fill={MAT.darkWood.base} />
    </g>
  ),

  /** 流星短靴：朝右的深藍短筒靴，金色翻口與金色靴尖包片，腳踝一顆金星拖著從左上劃下的流星尾；矮而寬的短靴，與兩雙高筒靴不同。 */
  EQ082: (p) => (
    <g transform="translate(-0.6 -1.6)">
      <path d="M13.6 19.6H28.4L28 28.6L36.6 31.2Q42.8 33.2 42.2 38.4V41.4H12.6Q11.8 30 13.6 19.6Z" fill={p.split(MAT.cosmos)} />
      <Shine d="M16 24V36" color={MAT.cosmos.light} />
      <path d="M32.6 30.2L36.6 31.2Q42.8 33.2 42.2 38.4H37.4Q37.4 33.6 31.6 32.6Z" fill={p.split(MAT.gold)} strokeWidth={1.6} />
      <rect x="11.8" y="16.4" width="18" height="5.6" rx="2" fill={p.split(MAT.gold)} />
      <rect x="11.6" y="39.8" width="31.4" height="4.2" rx="1.8" fill={MAT.darkIron.base} />
      <path d="M24.4 24.6Q13 21.4 6 8.2Q8.8 22.8 19.2 30.2Z" fill={MAT.amber.light} strokeWidth={1.5} />
      <Ink d="M8.6 13Q12.6 22 20.4 26.6" width={1.4} color={MAT.ember.base} />
      <path d={star(21.6, 27.4, 5, 5.2, 2.4)} fill={p.split(MAT.gold)} strokeWidth={1.5} />
      <path d={[sparkle(8.6, 15, 2.2), sparkle(34.6, 24.6, 2.4)].join('')} fill={DETAIL.white} stroke="none" />
    </g>
  ),

  /** 琥珀項鍊：深色皮繩串兩顆黃銅隔珠，下方黃銅框四點鑲著一大顆橢圓琥珀、裡面封著一隻小蟲；方框圓墊的鑲嵌，與代表圖的金鍊水滴墜不同。 */
  EQ084: (p) => (
    <>
      <Tube d="M8.6 4.4Q9 17 21.6 20.6M39.4 4.4Q39 17 26.4 20.6" width={2.2} color={MAT.darkWood.base} />
      <path d={dots([[10.2, 13.2, 2], [37.8, 13.2, 2]])} fill={p.ball(MAT.brass)} strokeWidth={1.3} />
      <rect x="21" y="18" width="6" height="5" rx="1.4" fill={p.split(MAT.brass)} strokeWidth={1.5} />
      <ellipse cx="24" cy="33.4" rx="10" ry="11.2" fill={p.split(MAT.brass)} />
      <ellipse cx="24" cy="33.4" rx="7.2" ry="8.4" fill={p.ball(MAT.amber)} strokeWidth={1.5} />
      <path d="M24.4 31.2Q27.6 32.6 26.4 36.6Q25 37.8 23.6 36.4Q22.4 33 24.4 31.2Z" fill={MAT.copper.shade} stroke="none" />
      <Ink d="M22.6 33.4L20.8 32.4M22.8 35.4L20.8 36M27.6 33L29 31.8" width={0.9} color={MAT.copper.shade} />
      <ellipse cx="20.6" cy="29.2" rx="1.6" ry="2.6" transform="rotate(28 20.6 29.2)" fill={DETAIL.white} stroke="none" opacity={0.85} />
      <path d={dots([[24, 22.2, 1.4], [34, 33.4, 1.4], [24, 44.6, 1.4], [14, 33.4, 1.4]])} fill={MAT.brass.light} strokeWidth={1} />
    </>
  ),

  /** 星核墜飾：金色鏈節項鍊垂著一枚八芒金星墜，星心封著發光的深藍星核，周圍閃著星光；尖角星形墜與代表圖的圓潤琥珀水滴、琥珀項鍊的橢圓框都不同。 */
  EQ085: (p) => (
    <>
      <Tube d="M9.4 4Q10 15.4 21.8 18.6M38.6 4Q38 15.4 26.2 18.6" width={2.6} color={MAT.gold.base} dash="2.2 1.2" />
      <Tube d={circle(24, 18.8, 2.2)} width={2.2} color={MAT.gold.base} />
      <path d={star(24, 31.4, 8, 12.4, 6.6, -90)} fill={p.split(MAT.gold)} />
      <Ink d={strokes([[24, 21.6, 24, 25], [24, 37.8, 24, 41.2], [14.2, 31.4, 17.6, 31.4], [30.4, 31.4, 33.8, 31.4]])} width={1} color={MAT.gold.shade} />
      <circle cx="24" cy="31.4" r="5.6" fill={p.ball(MAT.cosmos)} strokeWidth={1.6} />
      <path d={sparkle(24, 31.4, 3.6)} fill={MAT.ice.base} stroke="none" />
      <path d={[sparkle(37.4, 22.6, 2.8), sparkle(10.4, 40.6, 2.4), sparkle(38.8, 42, 1.8)].join('')} fill={DETAIL.white} stroke="none" />
    </>
  ),

  /** 月銀指環：較細的銀色指環，頂端立著一彎尖角朝上、微微傾斜的銀色新月，月彎裡托著一顆冰藍月光石，旁邊一點星光；銀與冰藍，與代表圖的金環紅寶石完全不同色。 */
  EQ087: (p) => (
    <Grow by={1.14} cy={22.9} dy={2.2}>
      <path d={bandRing(24, 31, 12.4, 9.2, 9.4, 6.6, 0.8)} fill={p.ball(MAT.silver)} fillRule="evenodd" />
      <Shine d="M13.4 28.4Q15 24.6 19.4 23.2" color={MAT.silver.light} />
      <rect x="20.2" y="19.6" width="7.6" height="4.2" rx="1.4" fill={p.split(MAT.silver)} />
      <g transform="translate(0 1.4) rotate(-16 24 10)">
        <circle cx="24" cy="7.6" r="5.2" fill={p.ball(MAT.ice)} />
        {/* 新月＝大圓（圓心 24,8）扣掉往上偏的小圓（圓心 24,4.6），兩圓交點即月尖。 */}
        <path d="M15.41 4.18A9.4 9.4 0 1 0 32.59 4.18A8.6 8.6 0 1 1 15.41 4.18Z" fill={p.split(MAT.silver)} />
        <ellipse cx="22.2" cy="5.8" rx="1.6" ry="1" fill={DETAIL.white} stroke="none" />
      </g>
      <path d={sparkle(36.2, 6.4, 2.6)} fill={DETAIL.white} stroke="none" />
    </Grow>
  ),

  /** 王冠印戒：粗金指環帶加寬的戒肩，頂端一面寬大的橢圓印面，深藍琺瑯底上浮著金色三尖王冠；平面印台與代表圖的立體刻面紅寶石剪影不同。 */
  EQ088: (p) => (
    <Grow by={1.14} cy={22.9} dy={1.6}>
      <path d={bandRing(24, 31, 13.2, 9.8, 9, 6.2, 1)} fill={p.ball(MAT.gold)} fillRule="evenodd" />
      <Shine d="M12.8 28.4Q14.6 24 19.4 22.6" color={MAT.gold.light} />
      <path d="M13.6 23.4L17.4 17.2H30.6L34.4 23.4Q24 26.6 13.6 23.4Z" fill={p.split(MAT.gold)} />
      <ellipse cx="24" cy="13.4" rx="11.4" ry="8.4" fill={p.split(MAT.gold)} />
      <ellipse cx="24" cy="13.4" rx="8.6" ry="6" fill={p.ball(MAT.cosmos)} strokeWidth={1.4} />
      <path d="M18.2 17.2L17.4 10L21 12.6L24 7.6L27 12.6L30.6 10L29.8 17.2Z" fill={p.split(MAT.gold)} strokeWidth={1.2} />
      <path d={dots([[17.4, 9.6, 1], [24, 7.2, 1], [30.6, 9.6, 1]])} fill={MAT.gold.light} strokeWidth={0.8} />
    </Grow>
  ),
};
