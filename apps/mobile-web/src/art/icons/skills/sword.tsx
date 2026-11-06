import { crescent, polar, sparkle, star, strokes } from './geometry.ts';
import { Beam, Glint, MiniSword, Place, Sword, TEMPLATE, at, type SkillGlyph } from './kit.tsx';
import { FX } from './palette.ts';

const SHIELD_FIELD = '#2d4f86';
const RUNE_STONE = '#5f6f8a';
const QI = '#d8f8ff';

/** 劍士系（藍底）：狂劍士走刀光與重斬，破陣騎士走盾與符文，三轉絕招以多劍、聖劍收尾。 */
export const SWORD_GLYPHS: Readonly<Record<string, SkillGlyph>> = {
  /** 橫掃斬：一道向上鼓起的大弧形刀光掃過前方，劍停在弧線尾端。 */
  SK001: () => (
    <>
      <path d={crescent(6.6, 34, 41, 28, 11, 6)} fill={QI} />
      <path d={crescent(11, 32, 37, 27.6, 8, 2.6)} fill={FX.white} stroke="none" />
      <Place x={34} y={20} angle={62} scale={0.64}>
        <Sword />
      </Place>
      <path d={sparkle(11.6, 21, 3)} fill={FX.gold.base} strokeWidth={1.1} />
    </>
  ),

  /** 破甲斬：一刀把鐵甲劈成兩半，裂口迸出火花。 */
  SK002: () => (
    <>
      <path d="M9.4 14.6L24.4 10.6L19.4 38L13.4 33.6Q8.6 25 9.4 14.6Z" fill={FX.iron.base} />
      <path d="M27.8 10.6L38.6 14.6Q39.4 25 34.6 33.6L23.8 40.4Z" fill={FX.iron.shade} />
      <path d={strokes([[13.4, 17, 16.6, 21.4], [16.6, 21.4, 14.6, 26], [34.6, 18, 31.4, 23], [31.4, 23, 34, 27.4]])} fill="none" strokeWidth={1.1} />
      <path d={crescent(31, 5.4, 17.4, 42.6, 2.4, 3.4)} fill={FX.white} />
      <path d={[sparkle(36.4, 8.6, 3.4), sparkle(11.6, 40, 2.6)].join('')} fill={FX.gold.base} strokeWidth={1.1} />
    </>
  ),

  /** 旋風連斬：三道刀光繞中心旋轉成風車，內圈再一層淡色殘影。 */
  SK003: () => (
    <>
      <path
        d={[0, 120, 240]
          .map((k) => {
            const [x1, y1] = polar(24, 24, 14.6, -90 + k);
            const [x2, y2] = polar(24, 24, 14.6, -90 + k + 108);
            return crescent(x1, y1, x2, y2, 4.4, 4.8);
          })
          .join('')}
        fill={FX.white}
      />
      <path
        d={[60, 180, 300]
          .map((k) => {
            const [x1, y1] = polar(24, 24, 8.4, -90 + k);
            const [x2, y2] = polar(24, 24, 8.4, -90 + k + 100);
            return crescent(x1, y1, x2, y2, 2.6, 2.2);
          })
          .join('')}
        fill={QI}
        strokeWidth={1.2}
      />
      <path d={sparkle(24, 24, 4.4)} fill={FX.gold.base} strokeWidth={1.1} />
    </>
  ),

  /** 斷鋼重斬：劍尖朝下劈斷鋼條，衝擊處爆開，兩側燃起戰意火焰。 */
  SK004: () => (
    <>
      <path d={star(24, 35, 9, 10.4, 5)} fill={FX.fire.light} strokeWidth={1.4} />
      <path d="M6.4 33.4L19.6 30.6L20.6 35.4L7.6 38.4Z" fill={FX.iron.base} />
      <path d="M28 30.6L41.6 33.4L40.4 38.4L27 35.4Z" fill={FX.iron.shade} />
      <path d={[at(TEMPLATE.flame, 12.6, 14, 4.6), at(TEMPLATE.flame, 35.4, 14, 4.6)].join('')} fill={FX.fire.base} strokeWidth={1.4} />
      <Place x={24} y={18} angle={180} scale={0.8}>
        <Sword />
      </Place>
    </>
  ),

  /** 劍氣縱橫：兩道青白劍氣交叉成 X，穿透前方多個目標。 */
  SK005: () => (
    <>
      <path d={[crescent(7.6, 38.4, 40.4, 9.6, 5.6, 4.2), crescent(7.6, 9.6, 40.4, 38.4, -5.6, 4.2)].join('')} fill={QI} />
      <Glint d="M12 33Q22 22.4 36 13M12 15Q22 25.6 36 35" opacity={0.9} />
      <path d={sparkle(24, 24, 6)} fill={FX.white} strokeWidth={1.2} />
      <path d={[sparkle(41, 9, 2.6), sparkle(41, 39, 2.6)].join('')} fill={FX.gold.base} strokeWidth={1} />
    </>
  ),

  /** 萬劍歸流：五把劍從上方扇形落下，劍尖匯聚到同一點炸開金光。 */
  SK006: () => (
    <>
      <path d={star(24, 36, 8, 9, 4)} fill={FX.holy.base} strokeWidth={1.4} />
      {[-150, -120, -90, -60, -30].map((deg) => {
        const [x, y] = polar(24, 36, deg === -90 ? 19 : 17, deg);
        return (
          <Place key={deg} x={x} y={y} angle={deg - 90} scale={deg === -90 ? 1.02 : 0.86}>
            <MiniSword />
          </Place>
        );
      })}
      <path d={sparkle(24, 36, 4)} fill={FX.gold.base} strokeWidth={1.1} />
    </>
  ),

  /** 盾刃突擊：圓盾前伸出刀刃向右衝刺，前方留下紅色破陣標記。 */
  SK007: () => (
    <>
      <Beam d={strokes([[5.6, 16.6, 10.6, 16.6], [4.6, 24, 8.6, 24], [5.6, 31.4, 10.6, 31.4]])} color={FX.white} width={1.4} />
      <path d="M24 21.4H37.4L42 24L37.4 26.6H24Z" fill={FX.steel.base} />
      <circle cx="19.4" cy="24" r="10" fill={FX.gold.base} />
      <circle cx="19.4" cy="24" r="6.4" fill={SHIELD_FIELD} strokeWidth={1.4} />
      <circle cx="19.4" cy="24" r="2.4" fill={FX.gold.light} strokeWidth={1.2} />
      <path d={at(TEMPLATE.diamond, 38.6, 12.4, 4.2)} fill={FX.mark} strokeWidth={1.4} />
    </>
  ),

  /** 震地盾擊：鳶形盾砸向地面，兩側掀起震波。 */
  SK008: () => (
    <>
      <rect x="5.4" y="35" width="37.2" height="5" rx="2" fill={FX.stone.base} />
      <path d="M24 35L22 37.6L25 40" fill="none" strokeWidth={1.2} />
      <Beam d="M13.6 33Q8.6 27.4 12.4 21.4M8.4 34.4Q2.8 27 7.6 18.8M34.4 33Q39.4 27.4 35.6 21.4M39.6 34.4Q45.2 27 40.4 18.8" color={FX.white} width={1.6} />
      <path d="M24 7Q30 9.4 35 9.4Q35.6 21.4 30.4 28.4Q27.4 32 24 34Q20.6 32 17.6 28.4Q12.4 21.4 13 9.4Q18 9.4 24 7Z" fill={FX.gold.base} />
      <path d="M24 11Q28.6 12.8 31.6 12.8Q31.8 21 28 26Q26 28.6 24 29.8Q22 28.6 20 26Q16.2 21 16.4 12.8Q19.4 12.8 24 11Z" fill={SHIELD_FIELD} strokeWidth={1.2} />
      <path d={sparkle(24, 19.6, 4.4)} fill={FX.gold.light} strokeWidth={1} />
    </>
  ),

  /** 符文刻印：石板上亮起青色符文，旁邊三枚充能點代表三次追加。 */
  SK009: () => (
    <>
      <path d="M21.6 8.6L33 15V31.4L21.6 38.6L10.2 31.4V15Z" fill={RUNE_STONE} />
      <path d="M21.6 8.6L33 15L21.6 21.4L10.2 15Z" fill={FX.stone.light} fillOpacity={0.35} strokeWidth={1.2} />
      <Beam d="M21.6 14.4V33M16.8 19L21.6 15L26.4 19M21.6 21L25 24.6L21.6 28.2L18.2 24.6ZM17.6 33H25.6" color={FX.rune.base} width={2} />
      <path d={[at(TEMPLATE.diamond, 38.6, 15.4, 3), at(TEMPLATE.diamond, 38.6, 23.4, 3), at(TEMPLATE.diamond, 38.6, 31.4, 3)].join('')} fill={FX.rune.light} strokeWidth={1.3} />
    </>
  ),

  /** 破城聖裁：聖劍從天而降刺入城牆，背後放出聖光。 */
  SK010: () => (
    <>
      <path d={star(24, 22, 12, 19.4, 10)} fill={FX.holy.base} fillOpacity={0.9} strokeWidth={1.2} />
      <path d="M7 41V31H11V27.6H15.6V31H20V27.6H28V31H32.4V27.6H37V31H41V41Z" fill={FX.stone.base} />
      <path d={strokes([[7, 35.8, 41, 35.8], [15.4, 35.8, 15.4, 41], [32.6, 35.8, 32.6, 41]])} fill="none" stroke={FX.stone.shade} strokeWidth={1.2} />
      <path d="M24 27.6L22.4 31L25 33.6L23.4 37" fill="none" strokeWidth={1.4} />
      <Place x={24} y={13.6} angle={180} scale={0.84}>
        <Sword blade={FX.holy} />
      </Place>
    </>
  ),
};
