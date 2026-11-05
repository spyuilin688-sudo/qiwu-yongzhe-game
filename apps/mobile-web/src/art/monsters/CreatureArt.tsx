import { useId } from 'react';
import { Svg } from '../Svg.tsx';
import type { ArtProps } from '../types.ts';
import { createKit } from './creatures/kit.tsx';
import { INK, OUTLINE_WIDTH } from './creatures/palette.ts';
import { CREATURE_DESIGNS, fallbackDesign } from './creatures/registry.ts';

/**
 * 普通怪（MON-xx-n）與小首領（ELT-xx-n）原創怪物圖（viewBox 0 0 64 64）。
 * 一律面向左、腳踩在 viewBox 底部中央；小首領輪廓較大並帶怒目與身分配件。
 */
export function CreatureArt({ monsterId, ...rest }: ArtProps & { readonly monsterId: string }) {
  const prefix = `cr${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const design = CREATURE_DESIGNS.get(monsterId) ?? fallbackDesign(monsterId);
  const { kit, defs } = createKit(prefix);
  const body = design(kit);
  return (
    <Svg viewBox="0 0 64 64" {...rest}>
      <defs>{defs()}</defs>
      <g stroke={INK} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" strokeLinecap="round">
        {body}
      </g>
    </Svg>
  );
}

/** 該怪物 ID 是否有專屬設計（未知 ID 會改畫通用佔位怪）。 */
export function hasCreatureDesign(monsterId: string): boolean {
  return CREATURE_DESIGNS.has(monsterId);
}
