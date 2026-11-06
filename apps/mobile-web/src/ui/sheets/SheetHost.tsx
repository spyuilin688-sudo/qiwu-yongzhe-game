import { useCallback, useEffect, useRef } from 'react';
import { useHost } from '../../app/GameContext.tsx';
import { useUi } from '../../app/uiStore.tsx';
import { BenchUpgradeSheet } from './BenchUpgradeSheet.tsx';
import { BossResultSheet, BossSummonSheet } from './BossSheets.tsx';
import { FilterSheet } from './FilterSheet.tsx';
import { ItemSheet } from './ItemSheet.tsx';
import { JobSwitchSheet } from './JobSwitchSheet.tsx';
import { MapInfoSheet, ResourceSheet, SkillDetailSheet } from './InfoSheets.tsx';
import { RoutePickerSheet } from './RoutePickerSheet.tsx';
import { SettingsSheet } from './SettingsSheet.tsx';
import { SlotSheet } from './SlotSheet.tsx';

/**
 * 面板宿主：同時一個主面板；手機返回鍵先關最上層面板，不會誤退遊戲（規格 07）。
 */
export function SheetHost() {
  const { state, dispatch } = useUi();
  const host = useHost();
  const sheet = state.sheet;

  const close = useCallback(() => dispatch({ type: 'closeSheet' }), [dispatch]);

  // 任何方式關閉「正在暫停自動鑑定的那件裝備」（返回鍵、從背包開啟後關閉）都恢復自動鑑定。
  const lastSheet = useRef(sheet);
  useEffect(() => {
    const previous = lastSheet.current;
    const reviewing = previous && (previous.kind === 'identifyResult' || previous.kind === 'itemDetail') ? previous.itemId : null;
    if (reviewing && reviewing === host.getSnapshot().auto.reviewItemId && sheet !== previous) host.resolveReview();
    lastSheet.current = sheet;
  }, [sheet, host]);

  if (!sheet) return null;
  switch (sheet.kind) {
    case 'identifyResult':
      return <ItemSheet itemId={sheet.itemId} mode="identify" identify={sheet} onClose={close} />;
    case 'itemDetail':
      return <ItemSheet itemId={sheet.itemId} mode="detail" onClose={close} />;
    case 'slot':
      return <SlotSheet slot={sheet.slot} onClose={close} />;
    case 'benchUpgrade':
      return <BenchUpgradeSheet onClose={close} />;
    case 'filter':
      return <FilterSheet onClose={close} />;
    case 'routePicker':
      return <RoutePickerSheet onClose={close} />;
    case 'bossSummon':
      return <BossSummonSheet onClose={close} />;
    case 'bossResult':
      return <BossResultSheet attemptId={sheet.attemptId} onClose={close} />;
    case 'skillDetail':
      return <SkillDetailSheet skillId={sheet.skillId} onClose={close} />;
    case 'mapInfo':
      return <MapInfoSheet onClose={close} />;
    case 'settings':
      return <SettingsSheet onClose={close} />;
    case 'resource':
      return <ResourceSheet resource={sheet.resource} onClose={close} />;
    case 'jobSwitch':
      return <JobSwitchSheet jobId={sheet.jobId} onClose={close} />;
  }
}
