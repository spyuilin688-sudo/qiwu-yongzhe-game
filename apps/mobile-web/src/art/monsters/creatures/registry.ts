import type { CreatureDesign } from './kit.tsx';
import { MAP01_DESIGNS } from './maps/map01.tsx';
import { MAP02_DESIGNS } from './maps/map02.tsx';
import { MAP03_DESIGNS } from './maps/map03.tsx';
import { MAP04_DESIGNS } from './maps/map04.tsx';
import { MAP05_DESIGNS } from './maps/map05.tsx';
import { MAP06_DESIGNS } from './maps/map06.tsx';
import { MAP07_DESIGNS } from './maps/map07.tsx';
import { MAP08_DESIGNS } from './maps/map08.tsx';
import { MAP09_DESIGNS } from './maps/map09.tsx';
import { MAP10_DESIGNS } from './maps/map10.tsx';
import { MAP11_DESIGNS } from './maps/map11.tsx';
import { MAP12_DESIGNS } from './maps/map12.tsx';

export { fallbackDesign } from './fallback.tsx';

/** 全部專屬設計：鍵為內容目錄產生的怪物 ID（MON-xx-n／ELT-xx-n）。 */
export const CREATURE_DESIGNS: ReadonlyMap<string, CreatureDesign> = new Map(
  [
    MAP01_DESIGNS, MAP02_DESIGNS, MAP03_DESIGNS, MAP04_DESIGNS, MAP05_DESIGNS, MAP06_DESIGNS,
    MAP07_DESIGNS, MAP08_DESIGNS, MAP09_DESIGNS, MAP10_DESIGNS, MAP11_DESIGNS, MAP12_DESIGNS,
  ].flatMap((table) => Object.entries(table)),
);
