import type { BossDesign } from '../kit.tsx';
import { ROYAL } from '../palette.ts';
import { BossEye, Crown, FangMouth, Shadow, Shine } from '../parts.tsx';

/** 資料新增 BOSS 但美術尚未交付時的佔位：戴冠圓身，至少看得出是「王」而且面向勇者。 */
export const fallbackBoss: BossDesign = (k) => (
  <>
    <Shadow w={84} />
    <path d="M22 110Q18 60 64 50Q110 60 106 110Q106 120 64 120Q22 120 22 110Z" fill={k.paint('#a5523a')} />
    <Crown x={62} y={54} w={34} h={18} fill={k.paint(ROYAL.gold)} tilt={-6} />
    <BossEye x={44} y={82} r={8} inner="right" />
    <BossEye x={66} y={82} r={8.5} inner="left" />
    <FangMouth x={54} y={98} w={18} h={5} />
    <Shine x={42} y={66} rx={8} ry={3.5} opacity={0.35} />
  </>
);
