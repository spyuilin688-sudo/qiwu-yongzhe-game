import type { HeroDesign } from './rig.tsx';

/** 已正規化的轉職階段：一轉的 branch 不影響外觀，但仍給定值讓各職業不必處理 null。 */
export interface HeroStage {
  readonly tier: 1 | 2 | 3;
  readonly branch: 'A' | 'B';
  /** 本實例的 SVG id 前綴（漸層用）。 */
  readonly uid: string;
}

export type FamilyDesigner = (stage: HeroStage) => HeroDesign;
