import { NOVICE_JOB_ID, type QualityId } from '@qiwu/content';
import type { GameState, ItemInstance } from '../model/types.ts';
import { loadoutsReferencingItem, ownedItemCount } from '../rules/equipment.ts';
import { applyXpGain, identifyXp, sellPrice } from '../rules/formulas.ts';
import { classifyIdentified, type IdentifyClassification } from '../rules/identifyFilter.ts';
import { rollItem } from '../rules/itemGeneration.ts';
import type { DeepReadonly } from '../util/clone.ts';
import { assertSafeNonNegativeInt } from '../util/math.ts';
import { SeededRandom } from '../util/rng.ts';
import type { CommandPayload } from './commands.ts';
import { assertNotInBossFight, type ReadState, type ServiceContext } from './context.ts';
import { reject } from './errors.ts';
import { appendLedger } from './ledger.ts';

// ───────────── 鑑定 ─────────────

export interface IdentifyResult {
  item: ItemInstance;
  xpGained: number;
  levelBefore: number;
  levelAfter: number;
  levelsGained: number;
  relicsAfter: number;
  isFirstLegendBase: boolean;
  classification: IdentifyClassification;
}

export function assertCanIdentify(state: ReadState, ctx: Pick<ServiceContext, 'catalog'>): void {
  assertNotInBossFight(state);
  const target = state.identifySettings.targetJobId;
  const targetValid =
    target === NOVICE_JOB_ID ? state.player.unlockedJobIds.length === 0 : state.player.unlockedJobIds.includes(target);
  if (!targetValid) reject('ROUTE_INVALID', '產出路線無效，請重新選擇已解鎖職業。');
  if (state.wallet.relics < 1) reject('NO_RELIC', '沒有未鑑定古物；繼續清怪即可累積。', { retryable: true });
  if (ownedItemCount(state) >= ctx.catalog.globals.backpackCapacity) {
    reject('BAG_FULL', `背包已滿（${ctx.catalog.globals.backpackCapacity} 件）；請先出售不用的裝備。`, { retryable: true });
  }
}

/**
 * IdentifyService.identifyOnce（規格 09）：
 * 驗證模式與容量 → 讀操作前快照 → 扣 1 古物 → 依操作前等級抽裝 → 加經驗與升級 → 寫帳本。
 * 金幣不變（T-03）；古物不足或滿包時整筆不變、不給經驗（T-07）。
 */
export function identifyOnce(draft: GameState, _payload: CommandPayload<'identify'>, ctx: ServiceContext): IdentifyResult {
  const { catalog } = ctx;
  assertCanIdentify(draft, ctx);
  const levelBefore = draft.player.level;
  const targetJobId = draft.identifySettings.targetJobId;

  const rng = new SeededRandom(draft.rng.identifyState);
  draft.counters.itemSerial += 1;
  const item = rollItem({
    catalog,
    rng,
    targetJobId,
    itemLevel: levelBefore,
    benchLevel: draft.wallet.benchLevel,
    itemId: `it${draft.counters.itemSerial}-${rng.nextUint32().toString(36)}`,
    serial: draft.counters.itemSerial,
    operationId: ctx.operationId,
  });
  draft.rng.identifyState = rng.getState();

  draft.wallet.relics -= 1;
  appendLedger(
    draft,
    {
      operationId: ctx.operationId,
      eventType: 'RELIC_CONSUMED',
      resource: 'RELIC',
      delta: -1,
      balanceAfter: draft.wallet.relics,
      entityRef: item.id,
      atMs: ctx.nowMs,
    },
    catalog.tuning.persistence.maxLedgerEntries,
  );

  const xpGained = identifyXp(catalog, levelBefore);
  const xpResult = applyXpGain(catalog, draft.player.level, draft.player.xp, xpGained);
  draft.player.level = xpResult.level;
  draft.player.xp = xpResult.xp;
  appendLedger(
    draft,
    {
      operationId: ctx.operationId,
      eventType: 'IDENTIFIED',
      resource: 'XP',
      delta: xpGained,
      balanceAfter: draft.player.xp,
      entityRef: item.id,
      atMs: ctx.nowMs,
    },
    catalog.tuning.persistence.maxLedgerEntries,
  );

  const isFirstLegendBase = item.hasLegendEffect && !draft.discovered.legendBaseIds.includes(item.baseId);
  const classification = classifyIdentified(draft, catalog, item, draft.identifySettings, isFirstLegendBase);

  draft.items[item.id] = item;
  if (!draft.discovered.baseIds.includes(item.baseId)) draft.discovered.baseIds.push(item.baseId);
  if (isFirstLegendBase) draft.discovered.legendBaseIds.push(item.baseId);
  draft.totals.identified += 1;

  return {
    item,
    xpGained,
    levelBefore,
    levelAfter: xpResult.level,
    levelsGained: xpResult.levelsGained,
    relicsAfter: draft.wallet.relics,
    isFirstLegendBase,
    classification,
  };
}

// ───────────── 出售 ─────────────

export interface SellResult {
  soldItemIds: string[];
  goldGained: number;
  goldAfter: number;
  origin: 'manual' | 'auto';
}

export function sellPriceOf(ctx: Pick<ServiceContext, 'catalog'>, item: { level: number; qualityId: QualityId }): number {
  return sellPrice(ctx.catalog, item.level, item.qualityId);
}

/** 單件可否出售；回傳拒絕原因或 null。與批次出售共用同一判斷。 */
export function sellBlockReason(state: ReadState, itemId: string): { code: 'ITEM_NOT_FOUND' | 'ITEM_ALREADY_SOLD' | 'ITEM_LOCKED' | 'ITEM_REFERENCED'; message: string } | null {
  const item = state.items[itemId];
  if (!item) {
    const sold = state.soldArchive.some((archived) => archived.id === itemId);
    return sold
      ? { code: 'ITEM_ALREADY_SOLD', message: '這件裝備已經出售，不能重複出售。' }
      : { code: 'ITEM_NOT_FOUND', message: '找不到這件裝備。' };
  }
  if (item.locked) return { code: 'ITEM_LOCKED', message: '已鎖定的裝備不能出售；請先解除鎖定。' };
  if (loadoutsReferencingItem(state, itemId).length > 0) {
    return { code: 'ITEM_REFERENCED', message: '這件裝備正在清怪或打王配置中使用；請先卸下。' };
  }
  return null;
}

/**
 * InventoryService.sellItems（規格 09）：依 ID 排序逐件驗證，任一件失敗整筆不賣，
 * 錯誤指出衝突項目；售價由保存的物品等級／品質計算，不接受外部售價。只有這裡會增加金幣（C-08）。
 */
export function sellItems(draft: GameState, payload: CommandPayload<'sellItems'>, ctx: ServiceContext): SellResult {
  const { catalog } = ctx;
  assertNotInBossFight(draft);
  const itemIds = [...payload.itemIds].sort();
  if (new Set(itemIds).size !== itemIds.length) reject('INVALID_PAYLOAD', '同一件裝備在清單中重複。');

  const fieldErrors: Record<string, string> = {};
  let firstCode: ReturnType<typeof sellBlockReason> = null;
  for (const itemId of itemIds) {
    const blocked = sellBlockReason(draft, itemId);
    if (blocked) {
      fieldErrors[itemId] = blocked.message;
      firstCode ??= blocked;
    }
  }
  if (firstCode) {
    const count = Object.keys(fieldErrors).length;
    reject(firstCode.code, itemIds.length > 1 ? `${count} 件裝備不能出售，整筆未執行：${firstCode.message}` : firstCode.message, {
      fieldErrors,
    });
  }

  let goldGained = 0;
  for (const itemId of itemIds) {
    const item = draft.items[itemId]!;
    const price = sellPriceOf(ctx, item);
    goldGained += price;
    draft.wallet.gold = assertSafeNonNegativeInt(draft.wallet.gold + price, '金幣');
    appendLedger(
      draft,
      {
        operationId: ctx.operationId,
        eventType: 'ITEM_SOLD',
        resource: 'GOLD',
        delta: price,
        balanceAfter: draft.wallet.gold,
        entityRef: itemId,
        atMs: ctx.nowMs,
      },
      catalog.tuning.persistence.maxLedgerEntries,
    );
    delete draft.items[itemId];
    draft.soldArchive.push({ ...item, status: 'sold' });
  }
  const maxArchive = catalog.tuning.persistence.maxSoldArchive;
  if (draft.soldArchive.length > maxArchive) draft.soldArchive.splice(0, draft.soldArchive.length - maxArchive);
  draft.totals.itemsSold += itemIds.length;
  draft.totals.goldEarned += goldGained;

  return { soldItemIds: itemIds, goldGained, goldAfter: draft.wallet.gold, origin: payload.origin };
}

// ───────────── 鎖定 ─────────────

export interface LockResult {
  itemId: string;
  locked: boolean;
}

/** 保留與鎖定分開：鎖定只禁止出售；BOSS 中也允許，因為不影響戰力或資源。 */
export function lockItem(draft: GameState, payload: CommandPayload<'lockItem'>): LockResult {
  const item = draft.items[payload.itemId];
  if (!item) {
    const sold = draft.soldArchive.some((archived) => archived.id === payload.itemId);
    reject(sold ? 'ITEM_ALREADY_SOLD' : 'ITEM_NOT_FOUND', sold ? '已出售的裝備不能鎖定。' : '找不到這件裝備。');
  }
  item.locked = payload.locked;
  return { itemId: item.id, locked: item.locked };
}

// ───────────── 鑑定台升級 ─────────────

export interface BenchUpgradeResult {
  levelBefore: number;
  levelAfter: number;
  cost: number;
  goldAfter: number;
}

export function benchUpgradeCost(state: ReadState, ctx: Pick<ServiceContext, 'catalog'>): number | null {
  return ctx.catalog.bench[state.wallet.benchLevel - 1]?.nextCost ?? null;
}

export function assertCanUpgradeBench(state: ReadState, ctx: Pick<ServiceContext, 'catalog'>): number {
  assertNotInBossFight(state);
  const cost = benchUpgradeCost(state, ctx);
  if (cost === null) reject('BENCH_MAX_LEVEL', '鑑定台已達本版上限。');
  if (state.wallet.gold < cost) {
    const shortfall = cost - state.wallet.gold;
    reject('INSUFFICIENT_GOLD', `金幣不足，還差 ${shortfall.toLocaleString('zh-TW')}；出售不用的裝備可取得金幣。`, {
      retryable: true,
      details: { cost, shortfall },
    });
  }
  return cost;
}

/** BenchService.upgradeOnce（規格 09）：以目前台等重新計價，扣款與台等 +1 同交易；不發經驗、不重抽舊裝。 */
export function upgradeBench(draft: GameState, payload: CommandPayload<'upgradeBench'>, ctx: ServiceContext): BenchUpgradeResult {
  if (payload.expectedBenchLevel !== draft.wallet.benchLevel) {
    reject('BENCH_LEVEL_MISMATCH', `鑑定台等級已變更為 Lv${draft.wallet.benchLevel}，請確認新的費用後再升級。`, {
      details: { currentLevel: draft.wallet.benchLevel },
    });
  }
  const cost = assertCanUpgradeBench(draft, ctx);
  const levelBefore = draft.wallet.benchLevel;
  draft.wallet.gold = assertSafeNonNegativeInt(draft.wallet.gold - cost, '金幣');
  draft.wallet.benchLevel += 1;
  appendLedger(
    draft,
    {
      operationId: ctx.operationId,
      eventType: 'BENCH_UPGRADED',
      resource: 'GOLD',
      delta: -cost,
      balanceAfter: draft.wallet.gold,
      entityRef: `bench:${draft.wallet.benchLevel}`,
      atMs: ctx.nowMs,
    },
    ctx.catalog.tuning.persistence.maxLedgerEntries,
  );
  return { levelBefore, levelAfter: draft.wallet.benchLevel, cost, goldAfter: draft.wallet.gold };
}

export type ReadonlyItem = DeepReadonly<ItemInstance>;
