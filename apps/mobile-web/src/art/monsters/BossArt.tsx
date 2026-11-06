import { useId } from 'react';
import { Svg } from '../Svg.tsx';
import type { ArtProps } from '../types.ts';
import { ADD_DESIGNS, fallbackAdd } from './bosses/adds.tsx';
import { createBossKit } from './bosses/kit.tsx';
import { ADD_OUTLINE, BOSS_OUTLINE, INK } from './bosses/palette.ts';
import { BOSS_DESIGNS, fallbackBoss } from './bosses/registry.ts';

/** React 的 useId 含 ':' 等字元，放進 url(#…) 會失效，必須先清掉。 */
function useArtPrefix(kind: string): string {
  return `${kind}${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

/**
 * 12 張地圖 BOSS（BOSS-xx，viewBox 0 0 128 128）。
 * 一律面向左（朝向勇者）、腳踩底部中央；未知 ID 畫通用的戴冠佔位 BOSS，不會出現空白。
 */
export function BossArt({ monsterId, ...rest }: ArtProps & { readonly monsterId: string }) {
  const prefix = useArtPrefix('boss');
  const design = BOSS_DESIGNS.get(monsterId) ?? fallbackBoss;
  const { kit, defs } = createBossKit(prefix);
  const body = design(kit);
  return (
    <Svg viewBox="0 0 128 128" {...rest}>
      <defs>{defs()}</defs>
      <g stroke={INK} strokeWidth={BOSS_OUTLINE} strokeLinejoin="round" strokeLinecap="round">
        {body}
      </g>
    </Svg>
  );
}

/**
 * BOSS 副目標（枝芽、蜂巢、幻影、觸腕、機芯、星晶、書頁…，viewBox 0 0 48 48）。
 * 沒有副目標機制的地圖也畫一個同主題的小物件（碎岩、核心碎片、冰殼、火星、聖印），
 * 讓圖鑑與測試頁每張地圖都有對應圖，而不是空格。
 */
export function AddArt({ mapNumber, ...rest }: ArtProps & { readonly mapNumber: number }) {
  const prefix = useArtPrefix('add');
  const design = ADD_DESIGNS.get(mapNumber) ?? fallbackAdd;
  const { kit, defs } = createBossKit(prefix);
  const body = design(kit);
  return (
    <Svg viewBox="0 0 48 48" {...rest}>
      <defs>{defs()}</defs>
      <g stroke={INK} strokeWidth={ADD_OUTLINE} strokeLinejoin="round" strokeLinecap="round">
        {body}
      </g>
    </Svg>
  );
}
