/**
 * 小首領共用模板與 12 張地圖 BOSS 機制（規格 05 章，全部 N）。
 * 機制以少數共用原語組合，避免每個 BOSS 各寫一套 AI；本體全程可攻擊、副目標不掉古物、
 * 角色沒有受傷規則，因此這裡只有「敵方護甲／易傷／副目標」三類效果。
 */

export type EliteTemplateDef =
  | { readonly localStage: 5; readonly kind: 'armorMult'; readonly label: string; readonly summary: string; readonly armorMultBp: number }
  | {
      readonly localStage: 10;
      readonly kind: 'periodicVulnerability';
      readonly label: string;
      readonly summary: string;
      readonly cycleMs: number;
      readonly windowMs: number;
      readonly takenBp: number;
    }
  | {
      readonly localStage: 15;
      readonly kind: 'armorDropBelowHp';
      readonly label: string;
      readonly summary: string;
      readonly hpBelowBp: number;
      readonly armorReductionBp: number;
    }
  | {
      readonly localStage: 20;
      readonly kind: 'reactiveCore';
      readonly label: string;
      readonly summary: string;
      readonly actionsPerTrigger: number;
      readonly takenBp: number;
      readonly durationMs: number;
    }
  | {
      readonly localStage: 25;
      readonly kind: 'shellUntilHpLoss';
      readonly label: string;
      readonly summary: string;
      readonly armorMultBp: number;
      readonly removeAfterHpLossBp: number;
    };

export const ELITE_TEMPLATES: readonly EliteTemplateDef[] = [
  { localStage: 5, kind: 'armorMult', label: '厚殼', summary: '護甲 ×1.25', armorMultBp: 12500 },
  {
    localStage: 10,
    kind: 'periodicVulnerability',
    label: '蓄勢',
    summary: '每 8 秒的最後 3 秒受到傷害 +15%',
    cycleMs: 8000,
    windowMs: 3000,
    takenBp: 1500,
  },
  {
    localStage: 15,
    kind: 'armorDropBelowHp',
    label: '裂甲',
    summary: '血量低於 50% 時護甲降低 20%',
    hpBelowBp: 5000,
    armorReductionBp: 2000,
  },
  {
    localStage: 20,
    kind: 'reactiveCore',
    label: '反應核心',
    summary: '每承受 10 次本體行動，受到傷害 +10% 持續 3 秒（按行動不按段數）',
    actionsPerTrigger: 10,
    takenBp: 1000,
    durationMs: 3000,
  },
  {
    localStage: 25,
    kind: 'shellUntilHpLoss',
    label: '耐久外殼',
    summary: '護甲 ×1.15；失去 30% 最大血量後外殼永久解除',
    armorMultBp: 11500,
    removeAfterHpLossBp: 3000,
  },
];

/** 時間區段：機制只在 [fromMs, toMs) 內生效（終焉書庫三段式使用）。 */
export interface ActiveWindow {
  readonly fromMs: number;
  readonly toMs: number;
}

export type AddDestroyedEffect =
  | { readonly kind: 'bodyArmorDown'; readonly pctBp: number; readonly durationMs: number }
  | { readonly kind: 'bodyVulnerable'; readonly pctBp: number; readonly durationMs: number }
  | { readonly kind: 'bodyFixedDamage'; readonly pctOfMaxHpBp: number };

export type BossMechanicDef =
  | {
      readonly kind: 'periodicAdds';
      readonly addName: string;
      readonly firstAtMs: number;
      /** null：只生成一輪。 */
      readonly everyMs: number | null;
      readonly count: number;
      readonly hpPctOfBodyBp: number;
      readonly maxAdds: number;
      readonly lifetimeMs?: number;
      readonly whilePresentBodyArmorBp?: number;
      readonly onDestroyed?: AddDestroyedEffect;
      /** 有效傷害（扣除過量）按比例回傳本體，回傳不暴擊、不觸發追加。 */
      readonly damageTransferBp?: number;
      readonly active?: ActiveWindow;
    }
  | {
      readonly kind: 'armorCycle';
      readonly cycleMs: number;
      readonly segments: readonly { readonly fromMs: number; readonly toMs: number; readonly armorMultBp: number; readonly label: string }[];
    }
  | {
      readonly kind: 'vulnerabilityCycle';
      readonly cycleMs: number;
      readonly windowFromMs: number;
      readonly windowToMs: number;
      readonly takenBp: number;
      readonly label: string;
      readonly active?: ActiveWindow;
    }
  | {
      readonly kind: 'armorWindow';
      readonly armorMultBp: number;
      readonly label: string;
      readonly active: ActiveWindow;
    }
  | {
      readonly kind: 'shell';
      readonly armorMultBp: number;
      readonly breakAfterDamagePctBp: number;
      readonly afterBreakTakenBp: number;
      readonly afterBreakDurationMs: number;
      readonly label: string;
    };

export const BOSS_MECHANICS_BY_MAP: ReadonlyMap<number, readonly BossMechanicDef[]> = new Map<number, readonly BossMechanicDef[]>([
  [
    1,
    [
      {
        kind: 'periodicAdds',
        addName: '枝芽',
        firstAtMs: 8000,
        everyMs: 12000,
        count: 2,
        hpPctOfBodyBp: 400,
        maxAdds: 2,
        whilePresentBodyArmorBp: 1000,
      },
    ],
  ],
  [
    2,
    [
      {
        kind: 'periodicAdds',
        addName: '蜂巢',
        firstAtMs: 6000,
        everyMs: 15000,
        count: 1,
        hpPctOfBodyBp: 500,
        maxAdds: 1,
        onDestroyed: { kind: 'bodyArmorDown', pctBp: 2500, durationMs: 8000 },
      },
    ],
  ],
  [
    3,
    [
      {
        kind: 'armorCycle',
        cycleMs: 10000,
        segments: [
          { fromMs: 0, toMs: 6000, armorMultBp: 13000, label: '硬殼' },
          { fromMs: 6000, toMs: 10000, armorMultBp: 7000, label: '鬆動' },
        ],
      },
    ],
  ],
  [
    4,
    [
      {
        kind: 'periodicAdds',
        addName: '幻影',
        firstAtMs: 8000,
        everyMs: 16000,
        count: 2,
        hpPctOfBodyBp: 400,
        maxAdds: 2,
        lifetimeMs: 8000,
        damageTransferBp: 3000,
      },
    ],
  ],
  [5, [{ kind: 'vulnerabilityCycle', cycleMs: 12000, windowFromMs: 8000, windowToMs: 12000, takenBp: 2500, label: '核心顯露' }]],
  [
    6,
    [
      {
        kind: 'periodicAdds',
        addName: '觸腕',
        firstAtMs: 8000,
        everyMs: 15000,
        count: 2,
        hpPctOfBodyBp: 500,
        maxAdds: 2,
        damageTransferBp: 2500,
      },
    ],
  ],
  [
    7,
    [
      {
        kind: 'shell',
        armorMultBp: 13000,
        breakAfterDamagePctBp: 2000,
        afterBreakTakenBp: 1500,
        afterBreakDurationMs: 8000,
        label: '冰殼',
      },
    ],
  ],
  [8, [{ kind: 'vulnerabilityCycle', cycleMs: 15000, windowFromMs: 10000, windowToMs: 15000, takenBp: 2500, label: '弱點暴露' }]],
  [
    9,
    [
      {
        kind: 'periodicAdds',
        addName: '機芯',
        firstAtMs: 5000,
        everyMs: 20000,
        count: 2,
        hpPctOfBodyBp: 500,
        maxAdds: 2,
        onDestroyed: { kind: 'bodyVulnerable', pctBp: 2500, durationMs: 8000 },
      },
    ],
  ],
  [
    10,
    [
      {
        kind: 'periodicAdds',
        addName: '星晶',
        firstAtMs: 7000,
        everyMs: 14000,
        count: 2,
        hpPctOfBodyBp: 400,
        maxAdds: 2,
        onDestroyed: { kind: 'bodyFixedDamage', pctOfMaxHpBp: 80 },
      },
    ],
  ],
  [11, [{ kind: 'vulnerabilityCycle', cycleMs: 12000, windowFromMs: 8000, windowToMs: 12000, takenBp: 2500, label: '聖印亮起' }]],
  [
    12,
    [
      { kind: 'armorWindow', armorMultBp: 12000, label: '書頁封甲', active: { fromMs: 0, toMs: 20000 } },
      {
        kind: 'vulnerabilityCycle',
        cycleMs: 10000,
        windowFromMs: 6000,
        windowToMs: 10000,
        takenBp: 2000,
        label: '易傷',
        active: { fromMs: 20000, toMs: 40000 },
      },
      {
        kind: 'periodicAdds',
        addName: '書頁',
        firstAtMs: 40000,
        everyMs: null,
        count: 2,
        hpPctOfBodyBp: 400,
        maxAdds: 2,
        damageTransferBp: 2500,
        active: { fromMs: 40000, toMs: 60000 },
      },
    ],
  ],
]);
