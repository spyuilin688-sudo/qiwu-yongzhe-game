import type { CreatureDesign } from './kit.tsx';
import { COMMON } from './palette.ts';
import { AngryEye, Blush, Eye, Shadow, Shine, Smile } from './parts.tsx';
import { gumdrop } from './shapes.ts';

/** 未知 ID 的佔位怪依地圖編號換色，至少能和相鄰怪物區分。 */
const FALLBACK_TINTS = ['#8fb85a', '#e8a43a', '#c9703f', '#9d8fc4', '#d9a85a', '#3fa6b5', '#9fd8f0', '#e8592a', '#d8a948', '#7a7ad8', '#8cc8f0', '#a88ac8'] as const;

function tintFor(monsterId: string): string {
  const mapCode = Number.parseInt(monsterId.split('-')[1] ?? '', 10);
  return FALLBACK_TINTS[(Number.isFinite(mapCode) ? mapCode - 1 : 0) % FALLBACK_TINTS.length] ?? FALLBACK_TINTS[0];
}

/** 通用佔位怪：新增怪物資料但美術尚未補上時使用，不會出現空白格。 */
export function fallbackDesign(monsterId: string): CreatureDesign {
  const tint = tintFor(monsterId);
  const elite = monsterId.startsWith('ELT-');
  return (k) => (
    <>
      <Shadow w={elite ? 46 : 36} />
      <path d={elite ? gumdrop(32, 60, 24, 46) : gumdrop(32, 60, 18, 34)} fill={k.paint(tint)} />
      <Shine x={elite ? 20 : 23} y={elite ? 24 : 34} rx={3.6} ry={1.8} />
      {elite ? (
        <>
          <AngryEye x={22} y={36} r={3.4} inner="right" />
          <AngryEye x={34} y={36} r={3.4} inner="left" />
        </>
      ) : (
        <>
          <Eye x={24} y={42} />
          <Eye x={33} y={42} />
          <Blush x={20} y={47.5} />
          <Blush x={37} y={47.5} />
        </>
      )}
      <Smile x={28.5} y={elite ? 45 : 47} w={elite ? 6 : 4} />
      {elite ? <circle cx={32} cy={14} r={2.4} fill={COMMON.gold} /> : null}
    </>
  );
}
