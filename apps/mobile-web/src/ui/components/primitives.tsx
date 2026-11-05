import type { ContentCatalog, QualityId } from '@qiwu/content';
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode, type Ref } from 'react';
import { qualityName } from '../format/viewModels.ts';
import styles from './primitives.module.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  readonly label: ReactNode;
  readonly variant?: Variant;
  readonly size?: 'm' | 'l';
  readonly block?: boolean;
  /** 次要說明；停用時應填入停用原因，不能只變灰讓玩家猜（規格 07）。 */
  readonly subLabel?: ReactNode;
  readonly ref?: Ref<HTMLButtonElement>;
}

export function ActionButton({ label, variant = 'secondary', size = 'm', block, subLabel, className, ref, ...rest }: ActionButtonProps) {
  const classes = [
    styles.button,
    variant === 'primary' && styles.primary,
    variant === 'danger' && styles.danger,
    variant === 'ghost' && styles.ghost,
    size === 'l' && styles.large,
    block && styles.block,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button ref={ref} type="button" className={classes} {...rest}>
      <span>{label}</span>
      {subLabel ? <span className={styles.subLabel}>{subLabel}</span> : null}
    </button>
  );
}

export function IconButton({ label, children, ...rest }: { label: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={styles.iconButton} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

export interface SheetProps {
  readonly title: ReactNode;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly headerExtra?: ReactNode;
  readonly compact?: boolean;
  readonly testId?: string;
}

/** 共用底部面板：固定表頭與操作列、內文可捲、Esc 關閉、開啟時移交焦點。 */
export function Sheet({ title, onClose, children, footer, headerExtra, compact, testId }: SheetProps) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className={styles.sheetLayer}>
      <button type="button" className={styles.sheetBackdrop} aria-label="關閉面板" onClick={onClose} tabIndex={-1} />
      <div
        ref={ref}
        className={[styles.sheet, compact && styles.sheetCompact].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid={testId}
      >
        <div className={styles.sheetHeader}>
          <h2 id={titleId} className={styles.sheetTitle}>
            {title}
          </h2>
          {headerExtra}
          <IconButton label="關閉" onClick={onClose}>
            ✕
          </IconButton>
        </div>
        <div className={styles.sheetBody}>{children}</div>
        {footer ? <div className={styles.sheetFooter}>{footer}</div> : null}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  disabled,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className={[styles.segment, option.value === value && styles.segmentActive].filter(Boolean).join(' ')}
          onClick={() => onChange(option.value)}
          disabled={disabled}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function QualityBadge({ catalog, qualityId }: { catalog: ContentCatalog; qualityId: QualityId }) {
  return <span className={`${styles.quality} q-${qualityId}`}>{qualityName(catalog, qualityId)}</span>;
}

export function ProgressBar({ value, max, label, color }: { value: number; max: number; label: string; color?: string }) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={styles.progress} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <div className={styles.progressFill} style={{ width: `${percent}%`, ...(color ? { background: color } : {}) }} />
    </div>
  );
}

export function Toggle({ label, description, on, onChange, disabled }: { label: string; description?: string; on: boolean; onChange: (next: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" className={styles.toggle} role="switch" aria-checked={on} onClick={() => onChange(!on)} disabled={disabled}>
      <span>
        <span className={styles.rowTitle}>{label}</span>
        {description ? <span className={styles.rowSub} style={{ display: 'block' }}>{description}</span> : null}
      </span>
      <span className={[styles.toggleState, on && styles.toggleOn].filter(Boolean).join(' ')}>{on ? '開' : '關'}</span>
    </button>
  );
}

export function Chip({ label, on, onClick, disabled }: { label: string; on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className={[styles.chip, on && styles.chipOn].filter(Boolean).join(' ')} aria-pressed={on} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

export { styles as primitiveStyles };
