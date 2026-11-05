import { dots, leaf, shape, strokes } from '../skills/geometry.ts';
import { Diagonal, Ink, Shine, Tube, type EquipDesign } from './kit.tsx';
import { DETAIL, INK, MAT } from './palette.ts';

/** 箭羽範本：上尖下開的山形，單位座標。 */
const FLETCH = 'M0 -1L0.55 -0.35L0.55 0.75L0 0.4L-0.55 0.75L-0.55 -0.35Z';

/** 弓弦：深色底線加亮色細線，在深底卡框上也看得到。 */
function BowString({ d }: { readonly d: string }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={2.4} />
      <path d={d} fill="none" stroke={MAT.cloth.base} strokeWidth={0.9} />
    </>
  );
}

/**
 * 弓、箭袋、號角與砲：弓類一律弓臂朝左上、弦在右下；
 * 短弓小而青綠、長弓深色修長掛藍羽、獵弓為反曲造型帶荊棘，三者剪影不同。
 */
export const RANGED_DESIGNS: Readonly<Record<string, EquipDesign>> = {
  /** 短弓：青枝削成的小弓，握把纏皮並冒出一片嫩葉。 */
  短弓: (p) => (
    <Diagonal mid={24}>
      <BowString d="M30 6V42" />
      <path d="M29 5Q5 24 29 43L31 41.4Q12 24 31 6.6Z" fill={p.split(MAT.greenWood)} />
      <rect x="15.4" y="20.4" width="7.4" height="7.2" rx="1.6" fill={MAT.leather.base} />
      <Ink d={strokes([[15.8, 22.8, 22.4, 22.8], [15.8, 25.2, 22.4, 25.2]])} width={1} />
      <path d={leaf(12.6, 18.2, 8, 3.6, -125)} fill={MAT.emerald.base} strokeWidth={1.5} />
      <path d={dots([[30, 5.6, 1.6], [30, 42.4, 1.6]])} fill={MAT.bone.base} strokeWidth={1.3} />
    </Diagonal>
  ),

  /** 長弓：深色木的修長弓身、黃銅弓梢、藍布握把垂著一根藍羽。 */
  長弓: (p) => (
    <Diagonal mid={24}>
      <BowString d="M29 3.4V44.6" />
      <path d="M28 2Q3 24 28 46L30 44.5Q9 24 30 3.5Z" fill={p.split(MAT.darkWood)} />
      <Shine d="M21 8Q12 15 11.6 22" color={MAT.darkWood.light} width={1.2} />
      <rect x="13.4" y="20" width="7.4" height="8" rx="1.5" fill={MAT.blueCloth.base} />
      <path d={dots([[29, 2.8, 1.9], [29, 45.2, 1.9]])} fill={MAT.brass.base} strokeWidth={1.3} />
      <Ink d="M16.4 28Q15.2 31.4 16.8 34" width={1.2} />
      <path d={leaf(17.6, 38.6, 10, 4, 78)} fill={p.split(MAT.plume)} strokeWidth={1.5} />
      <Ink d="M16.6 33.8L18.6 43.4" width={0.9} color={MAT.plume.light} />
    </Diagonal>
  ),

  /** 獵弓：反曲弓，弓梢外翻、弓臂長出荊棘，綠藤纏住握把。 */
  獵弓: () => (
    <Diagonal mid={24}>
      <BowString d="M32.4 4V44" />
      <path d="M18.4 15.8L13.8 14.4L17 19.4ZM18.4 32.2L13.8 33.6L17 28.6Z" fill={MAT.emerald.shade} strokeWidth={1.4} />
      <Tube d="M33 3C28 2 27.5 7 24.5 11.5Q14.5 24 24.5 36.5C27.5 41 28 46 33 45" width={5} color={MAT.darkWood.base} />
      <Shine d="M23.6 13Q18.6 19 18.4 23" color={MAT.darkWood.light} width={1.1} />
      <rect x="16" y="20" width="7" height="8" rx="1.5" fill={MAT.leather.base} />
      <Tube d="M16.4 21.6Q19.6 20.4 22.6 23.2M16.4 26.4Q19.6 25.2 22.6 27.6" width={2.2} color={MAT.emerald.base} />
      <path d={leaf(12.4, 24.4, 6.4, 3, 200)} fill={MAT.emerald.base} strokeWidth={1.4} />
    </Diagonal>
  ),

  /** 箭袋：皮革筒身、黃銅口環與底蓋，三支紅白羽箭露出袋口，鷹眼寶石鈕扣。 */
  箭袋: (p) => (
    <g transform="rotate(-16 24 26)">
      <Ink d={strokes([[19.4, 15, 17.6, 9], [24, 15, 24, 8], [28.6, 15, 30.4, 9]])} width={1.8} color={MAT.darkWood.base} />
      <path
        d={[shape(FLETCH, 17.2, 8.2, 2.6, 4.4, -14), shape(FLETCH, 30.8, 8.2, 2.6, 4.4, 14)].join('')}
        fill={MAT.cloth.base}
        strokeWidth={1.5}
      />
      <path d={shape(FLETCH, 24, 6.6, 2.8, 4.8)} fill={MAT.feather.base} strokeWidth={1.5} />
      <path d="M33 19Q41 28 31.6 38" fill="none" stroke={INK} strokeWidth={4} />
      <path d="M33 19Q41 28 31.6 38" fill="none" stroke={MAT.leather.light} strokeWidth={1.8} />
      <path d="M15 15.5H33L31 43Q24 46.5 17 43Z" fill={p.split(MAT.leather)} />
      <Shine d="M17.8 20V35.6" color={MAT.leather.light} />
      <rect x="13.8" y="13.4" width="20.4" height="5" rx="2" fill={p.split(MAT.brass)} />
      <path d="M16.6 37.6H31.4L31 43Q24 46.8 17 43Z" fill={p.split(MAT.brass)} />
      <circle cx="24" cy="27.6" r="2.6" fill={p.ball(MAT.sapphire)} strokeWidth={1.5} />
    </g>
  ),

  /** 獸笛／號角：彎曲的獸角號，兩道黃銅箍、喇叭口內暗，口端垂著紅流蘇。 */
  '獸笛／號角': (p) => (
    <g transform="translate(0 4)">
      <Tube d="M12.6 25.2L11 31.8M15 25.6L15 32.4" width={2.2} color={MAT.feather.base} />
      <path d="M10 10C9 26 18 36 34 35L38 21C26 24 15 20 13 10Z" fill={p.ball(MAT.bone)} />
      <Shine d="M12.4 14Q12.6 23.6 17.6 29.4" color={MAT.bone.light} />
      <Tube d="M12 24.8L18.6 17.6M21 33.8L28.2 21.2" width={3} color={MAT.brass.base} />
      <ellipse cx="36" cy="28" rx="3.4" ry="7.6" transform="rotate(16 36 28)" fill={p.split(MAT.brass)} />
      <ellipse cx="36.4" cy="28" rx="1.7" ry="5.2" transform="rotate(16 36.4 28)" fill={DETAIL.hollow} strokeWidth={1.2} />
      <path d="M9.4 11.2L13.6 10.8L13.2 7.2L9.8 7.6Z" fill={MAT.brass.base} strokeWidth={1.5} />
    </g>
  ),

  /** 手砲／機砲：黃銅砲管朝右（與角色朝向一致）、喇叭形砲口、木製握把與鐵製後膛。 */
  '手砲／機砲': (p) => (
    <g transform="rotate(-12 24 26)">
      <path d="M7 29Q5 38 9 42H16Q14.6 35.6 18.6 30Z" fill={p.split(MAT.wood)} />
      <path d="M13 20.6H35L41 17V35L35 31.4H13Z" fill={p.fall(MAT.brass)} />
      <Shine d="M15 23H33" color={MAT.brass.light} />
      <rect x="19" y="19.6" width="3.4" height="12.8" rx="1" fill={p.fall(MAT.copper)} />
      <rect x="28" y="19.2" width="3.4" height="13.6" rx="1" fill={p.fall(MAT.copper)} />
      <ellipse cx="41" cy="26" rx="2.4" ry="9" fill={p.fall(MAT.brass)} />
      <ellipse cx="41.3" cy="26" rx="1.1" ry="5.6" fill={DETAIL.hollow} strokeWidth={1.2} />
      <rect x="9.4" y="19.4" width="6" height="13.2" rx="2.4" fill={p.fall(MAT.darkIron)} />
      <circle cx="12.4" cy="26" r="2.2" fill={MAT.brass.base} strokeWidth={1.4} />
      <rect x="24.2" y="16.6" width="3" height="4.4" rx="0.8" fill={MAT.darkIron.base} strokeWidth={1.4} />
      <Ink d="M18.6 31.6Q18.4 36 21.6 36.4" width={1.6} />
    </g>
  ),
};
