import { ARTISAN_GLYPHS } from './artisan.tsx';
import { BOW_GLYPHS } from './bow.tsx';
import { JESTER_GLYPHS } from './jester.tsx';
import type { SkillGlyph } from './kit.tsx';
import { MAGE_GLYPHS } from './mage.tsx';
import type { SkillFamily } from './palette.ts';
import { PRIEST_GLYPHS } from './priest.tsx';
import { ROGUE_GLYPHS } from './rogue.tsx';
import { SWORD_GLYPHS } from './sword.tsx';

export interface SkillIconSpec {
  readonly family: SkillFamily;
  readonly ultimate: boolean;
  readonly glyph: SkillGlyph;
}

/**
 * 絕招 ID（設計資料 skills[].type = ultimate）。圖示只拿得到技能 ID，
 * 所以在這裡登記；測試會與目錄比對，資料改動時立刻發現不一致。
 */
export const ULTIMATE_SKILL_IDS: ReadonlySet<string> = new Set([
  'SK006', 'SK010', 'SK016', 'SK020', 'SK026', 'SK030', 'SK036',
  'SK040', 'SK046', 'SK050', 'SK056', 'SK060', 'SK066', 'SK070',
]);

const FAMILY_GLYPHS: readonly (readonly [SkillFamily, Readonly<Record<string, SkillGlyph>>])[] = [
  ['sword', SWORD_GLYPHS],
  ['bow', BOW_GLYPHS],
  ['mage', MAGE_GLYPHS],
  ['rogue', ROGUE_GLYPHS],
  ['priest', PRIEST_GLYPHS],
  ['jester', JESTER_GLYPHS],
  ['artisan', ARTISAN_GLYPHS],
];

const SPECS: ReadonlyMap<string, SkillIconSpec> = new Map(
  FAMILY_GLYPHS.flatMap(([family, glyphs]) =>
    Object.entries(glyphs).map(([skillId, glyph]) => [skillId, { family, ultimate: ULTIMATE_SKILL_IDS.has(skillId), glyph }] as const),
  ),
);

export const skillIconSpec = (skillId: string): SkillIconSpec | undefined => SPECS.get(skillId);
export const hasSkillDesign = (skillId: string): boolean => SPECS.has(skillId);
