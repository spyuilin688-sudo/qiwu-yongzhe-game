import { memo, type ReactNode } from 'react';
import { Meter } from '../../components/primitives.tsx';
import styles from '../battle.module.css';

export type HpBarTone = 'enemy' | 'boss';

/**
 * 敵方血條：共用 Meter（role=meter、填色用 transform）外加一層扣血殘影。
 * 殘影與填色比例相同，只是 CSS 過渡較慢、稍晚才開始，扣血時會看到淡色殘段縮回。
 * 角色沒有血條或魔條（C 規則），這個元件只給敵人使用。
 */
export const HpBar = memo(function HpBar({
  value,
  max,
  tone,
  label,
  valueText,
  className,
  children,
}: {
  readonly value: number;
  readonly max: number;
  readonly tone: HpBarTone;
  readonly label: string;
  readonly valueText?: string;
  readonly className?: string;
  readonly children?: ReactNode;
}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div className={[styles.hpBar, className].filter(Boolean).join(' ')} data-tone={tone}>
      <span className={styles.hpTrail} style={{ transform: `scaleX(${ratio})` }} aria-hidden="true" />
      <Meter value={value} max={max} tone={tone} label={label} valueText={valueText} className={styles.hpMeter}>
        {children}
      </Meter>
    </div>
  );
});
