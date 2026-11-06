/**
 * 美術資產契約（第一階段 SVG 版）。所有圖都是程式內嵌的原創向量圖：
 * 不載入外部圖片、不使用點陣圖；換正式美術時只需替換此資料夾內的實作，呼叫端介面不變。
 */
export interface ArtProps {
  /** 顯示寬度（CSS px）；高度依各圖 viewBox 比例。省略時填滿容器寬度。 */
  readonly size?: number;
  readonly className?: string;
  /** 提供時以 role="img" + <title> 呈現；省略時視為裝飾（aria-hidden）。 */
  readonly title?: string;
}

export type FamilyKey = 'novice' | 'sword' | 'bow' | 'mage' | 'rogue' | 'priest' | 'jester' | 'artisan';
export type JobTier = 0 | 1 | 2 | 3;
/** 二、三轉的兩條分支；一轉與見習者為 null。 */
export type RouteBranch = 'A' | 'B' | null;

export type UiIconName =
  | 'adventure'
  | 'character'
  | 'skills'
  | 'codex'
  | 'more'
  | 'coin'
  | 'relic'
  | 'lens'
  | 'lock'
  | 'boss'
  | 'filter'
  | 'route'
  | 'bag'
  | 'close'
  | 'up'
  | 'down'
  | 'check'
  | 'warning'
  | 'timer'
  | 'star';
