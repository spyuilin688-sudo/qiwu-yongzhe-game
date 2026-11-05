import { z } from 'zod';

/**
 * 設計資料 docs/data_v0.2.json 的結構驗證。
 * 只驗證引擎會讀取的欄位；ui_layout_reference／ui_buttons 為介面參考，結構寬鬆但仍要求存在。
 */

const ClassSchema = z.object({
  id: z.string().regex(/^JOB\d{2}$/),
  family: z.string().min(1),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  name: z.string().min(1),
  parent: z.string().min(1),
  unlock_level: z.number().int().positive(),
  skill_ids: z.array(z.string().regex(/^SK\d{3}$/)).length(2),
  passive_id: z.string().regex(/^PS\d{3}$/),
});

const SkillSchema = z.object({
  id: z.string().regex(/^SK\d{3}$/),
  class_id: z.string().regex(/^JOB\d{2}$/),
  name: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['active', 'ultimate']),
  cooldown_ms: z.number().int().positive(),
  prototype_effect: z.string().min(1),
  auto_condition: z.string().min(1),
  tags: z.array(z.string()),
});

const PassiveSchema = z.object({
  id: z.string().regex(/^PS\d{3}$/),
  class_id: z.string().regex(/^JOB\d{2}$/),
  name: z.string().min(1),
  description: z.string().min(1),
  prototype_rule: z.string().min(1),
});

const EquipmentSchema = z.object({
  id: z.string().regex(/^EQ\d{3}$/),
  name: z.string().min(1),
  owner_class: z.string().min(1),
  tier: z.number().int().min(0).max(3),
  min_level: z.number().int().positive(),
  slot: z.enum(['主武器', '副手', '頭部', '身體', '手部', '腳部', '項鍊', '戒指']),
  type: z.string().min(1),
  base_stat_rule: z.string().min(1),
  affix_pool: z.string().min(1),
  quality_options: z.array(z.string()).length(5),
  legend_effect: z.string().min(1),
  family: z.string().min(1),
});

const QualitySchema = z.object({
  id: z.enum(['Q1', 'Q2', 'Q3', 'Q4', 'Q5']),
  name: z.string().min(1),
  multiplier: z.number().positive(),
  affixes: z.number().int().min(0),
});

const BenchLevelSchema = z.object({
  level: z.number().int().min(1),
  quality_weights_percent: z.array(z.number().min(0)).length(5),
  next_cost: z.number().int().positive().nullable(),
  status: z.string(),
});

const MapSchema = z.object({
  id: z.string().regex(/^MAP\d{2}$/),
  number: z.number().int().positive(),
  name: z.string().min(1),
  normal_monsters: z.array(z.string().min(1)).length(3),
  boss_feature: z.string().min(1),
  boss: z.string().min(1),
  elites: z.array(z.string().min(1)).length(5),
  stage_ids: z.array(z.string().regex(/^ST\d{3}$/)).length(30),
  boss_mechanic_prototype: z.array(z.string().min(1)).min(1),
});

const StageSchema = z.object({
  id: z.string().regex(/^ST\d{3}$/),
  number: z.number().int().positive(),
  map_id: z.string().regex(/^MAP\d{2}$/),
  local_number: z.number().int().min(1).max(30),
  display_code: z.string().regex(/^\d{2}-\d{2}$/),
  name: z.string().min(1),
  type: z.enum(['normal', 'elite', 'boss']),
  type_name: z.string().min(1),
  encounter: z.string().min(1),
});

const PrototypeGlobalsSchema = z.object({
  tick_ms: z.number().int().positive(),
  boss_duration_ms: z.number().int().positive(),
  backpack_capacity: z.number().int().positive(),
  max_enemies: z.number().int().positive(),
  max_normal_skills: z.number().int().positive(),
  max_ultimate_skills: z.number().int().positive(),
  quality_weights_sum: z.number().int().positive(),
  no_player_hp_mp: z.literal(true),
  xp_source: z.literal('IDENTIFIED'),
  gold_source: z.literal('ITEM_SOLD'),
  offline_rewards: z.literal(false),
});

export const DesignDataSchema = z.object({
  meta: z.object({
    title: z.string(),
    version: z.string(),
    date: z.string(),
    status: z.string(),
    count: z.object({
      classes: z.number().int(),
      active_skills: z.number().int(),
      passives: z.number().int(),
      equipment_bases: z.number().int(),
      maps: z.number().int(),
      stages: z.number().int(),
    }),
  }),
  classes: z.array(ClassSchema),
  skills: z.array(SkillSchema),
  passives: z.array(PassiveSchema),
  equipment: z.array(EquipmentSchema),
  qualities: z.array(QualitySchema).length(5),
  bench_levels: z.array(BenchLevelSchema),
  maps: z.array(MapSchema),
  stages: z.array(StageSchema),
  ui_layout_reference: z.array(z.looseObject({ region: z.string() })),
  ui_buttons: z.array(z.looseObject({ id: z.string(), label: z.string() })),
  prototype_globals: PrototypeGlobalsSchema,
});

export type DesignData = z.infer<typeof DesignDataSchema>;
export type DesignClass = z.infer<typeof ClassSchema>;
export type DesignSkill = z.infer<typeof SkillSchema>;
export type DesignPassive = z.infer<typeof PassiveSchema>;
export type DesignEquipment = z.infer<typeof EquipmentSchema>;
export type DesignMap = z.infer<typeof MapSchema>;
export type DesignStage = z.infer<typeof StageSchema>;
