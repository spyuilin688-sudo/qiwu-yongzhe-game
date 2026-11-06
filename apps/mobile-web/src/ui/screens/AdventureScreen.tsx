import { BattleViewport } from '../adventure/BattleViewport.tsx';
import { EquipmentGrid } from '../adventure/EquipmentGrid.tsx';
import { BagFullNotice, BenchRow, MainActions, SecondaryActions } from '../adventure/IdentifyDock.tsx';
import { SkillBar } from '../adventure/SkillBar.tsx';
import { StageBar } from '../adventure/StageBar.tsx';
import styles from '../adventure/adventure.module.css';

/**
 * 冒險頁：StageProgress → BattleViewport → SkillBar → EquipmentGrid → IdentifyDock（規格 07 元件樹）。
 * 高度 ≥ 720 時全部同一欄、不捲動；較矮時上方內容在內層捲動，鑑定主操作列固定在底部。
 */
export function AdventureScreen() {
  return (
    <div className={styles.adventure}>
      <div className={styles.adventureScroll}>
        <StageBar />
        <BattleViewport />
        <SkillBar />
        <EquipmentGrid />
        <BagFullNotice />
        <BenchRow />
        <SecondaryActions />
      </div>
      <MainActions />
    </div>
  );
}
