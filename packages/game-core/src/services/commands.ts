import { PROTOTYPE_TUNING, QUALITY_IDS, SLOT_IDS, STAT_KEYS } from '@qiwu/content';
import { z } from 'zod';

/**
 * 玩家命令契約（對應規格 09 API）。所有 payload 為嚴格物件：拒絕未知欄位與超長陣列，
 * 因此無法夾帶 sellPrice、qualityRoll、rewardAmount、playerId 之類的欄位控制結果（T-32）。
 */

const ItemId = z.string().min(1).max(64);
const JobId = z.string().regex(/^(JOB\d{2}|NOVICE)$/);
const SkillId = z.string().regex(/^SK\d{3}$/);
const Purpose = z.enum(['farm', 'boss']);
const QualityIdSchema = z.enum(QUALITY_IDS);
const SlotIdSchema = z.enum(SLOT_IDS);
const StatKeySchema = z.enum(STAT_KEYS);

export const CommandSchemas = {
  identify: z.strictObject({}),
  sellItems: z.strictObject({
    itemIds: z.array(ItemId).min(1).max(PROTOTYPE_TUNING.economy.maxSellBatch),
    origin: z.enum(['manual', 'auto']),
    sourceOperationId: z.string().min(1).max(80).optional(),
  }),
  lockItem: z.strictObject({ itemId: ItemId, locked: z.boolean() }),
  equipItem: z.strictObject({ itemId: ItemId, purpose: Purpose }),
  unequipSlot: z.strictObject({ slot: SlotIdSchema, purpose: Purpose }),
  upgradeBench: z.strictObject({ expectedBenchLevel: z.number().int().min(1).max(99) }),
  unlockJob: z.strictObject({ jobId: JobId }),
  switchJob: z.strictObject({ jobId: JobId, ackUnequipItemIds: z.array(ItemId).max(16) }),
  saveLoadoutSkills: z.strictObject({
    purpose: Purpose,
    skillIds: z.array(SkillId).max(3),
    conditions: z.record(SkillId, z.enum(['default', 'immediate'])),
    targetPolicy: z.enum(['default', 'mechanicFirst']),
  }),
  copyLoadout: z.strictObject({ from: Purpose, to: Purpose }),
  updateIdentifySettings: z.strictObject({
    targetJobId: JobId,
    keep: z.strictObject({
      minQuality: QualityIdSchema,
      slots: z.array(SlotIdSchema).max(SLOT_IDS.length),
      affixStats: z.array(StatKeySchema).max(STAT_KEYS.length),
      upgradesOverEquipped: z.boolean(),
    }),
    autoSell: z.strictObject({
      enabled: z.boolean(),
      maxQuality: QualityIdSchema,
      slots: z.array(SlotIdSchema).max(SLOT_IDS.length),
    }),
    /** 開啟自動出售時必須為 true，代表玩家已看過並確認條件。 */
    confirmAutoSell: z.boolean(),
  }),
  setAutoIdentify: z.strictObject({ enabled: z.boolean() }),
  updateGameSettings: z.strictObject({ firstBossAuto: z.boolean() }),
  startBossAttempt: z.strictObject({ stageId: z.string().regex(/^ST\d{3}$/) }),
  abortBossAttempt: z.strictObject({ attemptId: z.string().min(1).max(64) }),
} as const;

export type CommandType = keyof typeof CommandSchemas;
export type CommandPayload<T extends CommandType> = z.infer<(typeof CommandSchemas)[T]>;

export type Command = {
  [T in CommandType]: { type: T; payload: CommandPayload<T> };
}[CommandType];

export interface CommandEnvelope {
  /** 不可重複的操作 ID；傳輸逾時先以原 ID 查詢，不得換新 ID 重做。 */
  readonly operationId: string;
  /** 若提供則必須等於目前 revision，否則 409 REVISION_MISMATCH。 */
  readonly expectedRevision?: number;
  readonly contentVersion?: string;
  readonly command: Command;
}

export function isCommandType(value: string): value is CommandType {
  return Object.hasOwn(CommandSchemas, value);
}
