import type { ContentCatalog, QualityId } from '@qiwu/content';
import { memo, useEffect, useId, useRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode, type Ref } from 'react';
import { qualityName } from '../format/viewModels.ts';
import { formatCompact, formatFull } from '../format/format.ts';
import { CurrencyIcon, UiIcon, type CurrencyKind, type UiGlyphName } from '../../art/index.ts';
import styles from './primitives.module.css';

/**
 * 按鈕語氣：
 * - primary：實心黃銅，畫面上最重要的一個操作（鑑定、穿戴、開始挑戰）。
 * - secondary：一般操作。ghost：次要、取消。
 * - trade：交易（出售換金幣）。出售是唯一的金幣來源，不能長得像不可復原的危險操作。
 * - danger：只留給清除存檔、放棄挑戰這類不可復原的操作。
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'trade' | 'danger';

const VARIANT_CLASS: Readonly<Record<ButtonVariant, string | undefined>> = {
  primary: styles.primary,
  secondary: undefined,
  ghost: styles.ghost,
  trade: styles.trade,
  danger: styles.danger,
};

export interface ActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  readonly label: ReactNode;
  readonly variant?: ButtonVariant;
  readonly size?: 'm' | 'l';
  readonly block?: boolean;
  /** 次要說明；停用時應填入停用原因，不能只變灰讓玩家猜（規格 07）。 */
  readonly subLabel?: ReactNode;
  /** 標題前的輔助圖示（裝飾用，aria-hidden）；文字仍是主要資訊。 */
  readonly icon?: ReactNode;
  readonly ref?: Ref<HTMLButtonElement>;
}

export function ActionButton({ label, variant = 'secondary', size = 'm', block, subLabel, icon, className, ref, ...rest }: ActionButtonProps) {
  const classes = [styles.button, VARIANT_CLASS[variant], size === 'l' && styles.large, block && styles.block, className].filter(Boolean).join(' ');
  return (
    <button ref={ref} type="button" className={classes} {...rest}>
      {icon ? (
        <span className={styles.labelRow}>
          <span className={styles.labelIcon} aria-hidden="true">
            {icon}
          </span>
          <span className={styles.label}>{label}</span>
        </span>
      ) : (
        <span className={styles.label}>{label}</span>
      )}
      {subLabel ? <span className={styles.subLabel}>{subLabel}</span> : null}
    </button>
  );
}

export function IconButton({ label, children, className, ...rest }: { label: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={[styles.iconButton, className].filter(Boolean).join(' ')} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

/**
 * 面板操作列排法：
 * - even：每顆鍵等寬；放大字級放不下時自動換列，換到下一列的鍵會撐滿整列（不會硬擠三欄把詞拆斷）。
 * - primaryFirst：字體放大到 150% 以上時，主要鍵（variant="primary"）獨佔第一列，其餘並排在下一列。
 */
export type SheetFooterLayout = 'even' | 'primaryFirst';

export interface SheetProps {
  readonly title: ReactNode;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly footerLayout?: SheetFooterLayout;
  readonly headerExtra?: ReactNode;
  readonly compact?: boolean;
  readonly testId?: string;
}

/** 共用底部面板：固定表頭與操作列、內文可捲、Esc 關閉、開啟時移交焦點。 */
export function Sheet({ title, onClose, children, footer, footerLayout = 'even', headerExtra, compact, testId }: SheetProps) {
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
            <span className={styles.closeIcon}>
              <UiIcon name="close" />
            </span>
          </IconButton>
        </div>
        <div className={styles.sheetBody}>{children}</div>
        {footer ? <div className={[styles.sheetFooter, footerLayout === 'primaryFirst' && styles.footerPrimaryFirst].filter(Boolean).join(' ')}>{footer}</div> : null}
      </div>
    </div>
  );
}

/**
 * 外觀變體（語意一律是單選 radiogroup／radio，e2e 與截圖工具以此定位）：
 * - segmented：一般的單選與模式切換（配置、條件、策略），選中＝內框＋淡金底。
 * - tabs：頁面層級的分頁（角色分頁、圖鑑分頁），選中＝金字＋底部指示條，和下一層的模式切換分得出層級。
 */
export type SegmentedVariant = 'segmented' | 'tabs';

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  disabled,
  variant = 'segmented',
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  disabled?: boolean;
  variant?: SegmentedVariant;
}) {
  return (
    <div
      className={[variant === 'tabs' ? styles.tabs : styles.segmented, disabled && styles.segmentedDisabled].filter(Boolean).join(' ')}
      role="radiogroup"
      aria-label={label}
    >
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

/**
 * 進度條用途：決定高度、填色與無障礙角色。
 * - xp：經驗（--bar-m、金色漸層）。stage：地圖推進（--bar-thin）。relic：下一件古物（--bar-thin、紙色）。
 * - enemy：敵人血量（--bar-m）。boss：BOSS 血量（--bar-boss，可放置中文字）。
 * 角色沒有 HP／MP：這裡沒有、也不可以新增角色血條或魔力條的用途。
 */
export type MeterTone = 'xp' | 'stage' | 'relic' | 'enemy' | 'boss';

const METER_TONE_CLASS: Readonly<Record<MeterTone, string | undefined>> = {
  xp: styles.meter_xp,
  stage: styles.meter_stage,
  relic: styles.meter_relic,
  enemy: styles.meter_enemy,
  boss: styles.meter_boss,
};

// 血量是「量表」（目前剩多少），經驗與推進是「進度」（離目標多遠）。
const METER_ROLE: Readonly<Record<MeterTone, 'meter' | 'progressbar'>> = {
  xp: 'progressbar',
  stage: 'progressbar',
  relic: 'progressbar',
  enemy: 'meter',
  boss: 'meter',
};

export interface MeterProps {
  readonly value: number;
  readonly max: number;
  readonly tone?: MeterTone;
  /** 無障礙名稱。省略時整條對輔助技術隱藏（旁邊必須已有可見的數字或文字）。 */
  readonly label?: string;
  /** 讀屏念出的值（例如「42%」）；省略時念 value。 */
  readonly valueText?: string;
  readonly className?: string;
  /** 疊在條上置中的文字（只給 boss 這種夠高的條使用）。 */
  readonly children?: ReactNode;
}

/**
 * 共用進度條：取代各自實作的經驗條、推進條、古物條與血條。
 * 填色以 transform: scaleX 呈現（只動合成層，不觸發版面重排），可以放在每 100ms 重繪的戰場裡。
 */
export const Meter = memo(function Meter({ value, max, tone = 'xp', label, valueText, className, children }: MeterProps) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const a11y = label
    ? { role: METER_ROLE[tone], 'aria-label': label, 'aria-valuemin': 0, 'aria-valuemax': max, 'aria-valuenow': value, 'aria-valuetext': valueText }
    : { 'aria-hidden': true as const };
  return (
    <div className={[styles.meter, METER_TONE_CLASS[tone], className].filter(Boolean).join(' ')} {...a11y}>
      <span className={styles.meterFill} style={{ transform: `scaleX(${ratio})` }} />
      {children ? <span className={styles.meterLabel}>{children}</span> : null}
    </div>
  );
});

/** @deprecated 舊名，請改用 <Meter tone="xp" />。保留給尚未改寫的呼叫端。 */
export function ProgressBar({ value, max, label, color }: { value: number; max: number; label: string; color?: string }) {
  const meter = <Meter value={value} max={max} label={label} tone="xp" />;
  if (!color) return meter;
  return (
    <span className={styles.meterLegacy} style={{ '--legacy-fill': color } as CSSProperties}>
      {meter}
    </span>
  );
}

export function Toggle({ label, description, on, onChange, disabled }: { label: string; description?: string; on: boolean; onChange: (next: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      className={[styles.toggle, on && styles.toggleOn].filter(Boolean).join(' ')}
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      disabled={disabled}
    >
      <span className={styles.toggleText}>
        <span className={styles.rowTitle}>{label}</span>
        {description ? <span className={styles.rowSub}>{description}</span> : null}
      </span>
      {/* 「開／關」文字與圓鈕位置一起表示狀態，不只靠顏色。 */}
      <span className={styles.toggleControl}>
        <span className={styles.toggleStateText}>{on ? '開' : '關'}</span>
        <span className={styles.toggleTrack} aria-hidden="true">
          <span className={styles.toggleKnob} />
        </span>
      </span>
    </button>
  );
}

export function Chip({ label, on, onClick, disabled }: { label: string; on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className={[styles.chip, on && styles.chipOn].filter(Boolean).join(' ')} aria-pressed={on} onClick={onClick} disabled={disabled}>
      {on ? <UiIcon name="check" size="em" className={styles.chipCheck} /> : null}
      {label}
    </button>
  );
}

const CURRENCY_NAME: Readonly<Record<CurrencyKind, string>> = { gold: '金幣', relic: '古物' };

/**
 * 資源數量：彩色資源圖示＋數字，讀屏另外念出「金幣／古物」（圖示本身是裝飾）。
 * 用在鑑定區古物存量、出售鍵、升台費用等處；文字內容仍含數字（例如「+10」），e2e 可照常比對。
 */
export function CurrencyAmount({
  kind,
  value,
  signed,
  compact,
  iconAt = 'start',
  className,
}: {
  kind: CurrencyKind;
  value: number;
  /** 正數前加「+」（出售所得）。 */
  signed?: boolean;
  /** 以萬／億縮寫（空間小時）；完整值另由詳情顯示。 */
  compact?: boolean;
  iconAt?: 'start' | 'end';
  className?: string;
}) {
  const text = `${signed && value > 0 ? '+' : ''}${compact ? formatCompact(value) : formatFull(value)}`;
  const icon = <CurrencyIcon kind={kind} size="em" className={styles.currencyIcon} />;
  return (
    <span className={[styles.currency, className].filter(Boolean).join(' ')}>
      {iconAt === 'start' ? icon : null}
      <span className="numeric">{text}</span>
      {iconAt === 'end' ? icon : null}
      <span className="visually-hidden"> {CURRENCY_NAME[kind]}</span>
    </span>
  );
}

export type NoticeTone = 'info' | 'warning' | 'danger';

const NOTICE: Readonly<Record<NoticeTone, { className: string | undefined; icon: UiGlyphName }>> = {
  info: { className: styles.infoNote, icon: 'info' },
  warning: { className: styles.warning, icon: 'warning' },
  danger: { className: styles.dangerNote, icon: 'warning' },
};

/** 提醒框：語氣同時用圖示＋框色表示，不只靠顏色。外觀與既有的 ps.warning／ps.dangerNote 一致。 */
export function Notice({ tone = 'warning', children, className }: { tone?: NoticeTone; children: ReactNode; className?: string }) {
  return (
    <div className={[styles.notice, NOTICE[tone].className, className].filter(Boolean).join(' ')}>
      <UiIcon name={NOTICE[tone].icon} size="em" className={styles.noticeIcon} />
      <div className={styles.noticeBody}>{children}</div>
    </div>
  );
}

export { styles as primitiveStyles };
