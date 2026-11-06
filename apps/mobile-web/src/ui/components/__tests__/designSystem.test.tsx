import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { parseStoredPrefs, resolveReducedMotion } from '../../../app/prefs.tsx';
import { ActionButton, CurrencyAmount, Meter, Notice, Segmented, Toggle, primitiveStyles } from '../primitives.tsx';

const noop = () => undefined;

describe('減少動態效果偏好（跟隨系統／開／關）', () => {
  it('相容舊版布林值：true → 開；false 或缺少 → 跟隨系統', () => {
    expect(parseStoredPrefs(JSON.stringify({ textScale: 2, reducedMotion: true }))).toEqual({ textScale: 2, motion: 'on' });
    expect(parseStoredPrefs(JSON.stringify({ textScale: 1, reducedMotion: false }))).toEqual({ textScale: 1, motion: 'system' });
    expect(parseStoredPrefs(JSON.stringify({ textScale: 1.5 }))).toEqual({ textScale: 1.5, motion: 'system' });
  });

  it('新格式優先於舊欄位；不合法的值退回預設', () => {
    expect(parseStoredPrefs(JSON.stringify({ textScale: 1, motion: 'off', reducedMotion: true }))).toEqual({ textScale: 1, motion: 'off' });
    expect(parseStoredPrefs(JSON.stringify({ textScale: 3, motion: 'sometimes' }))).toEqual({ textScale: 1, motion: 'system' });
    expect(parseStoredPrefs('不是 JSON')).toEqual({ textScale: 1, motion: 'system' });
    expect(parseStoredPrefs(null)).toEqual({ textScale: 1, motion: 'system' });
  });

  it('實際是否減少：開＝一律減少、關＝一律不減少、跟隨系統＝依系統', () => {
    expect(resolveReducedMotion('on', false)).toBe(true);
    expect(resolveReducedMotion('off', true)).toBe(false);
    expect(resolveReducedMotion('system', true)).toBe(true);
    expect(resolveReducedMotion('system', false)).toBe(false);
  });
});

describe('共用進度條 Meter', () => {
  it('經驗條是 progressbar，填色以 scaleX 表示比例', () => {
    const markup = renderToStaticMarkup(<Meter tone="xp" value={30} max={120} label="經驗" />);
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain('aria-label="經驗"');
    expect(markup).toContain('aria-valuenow="30"');
    expect(markup).toContain('scaleX(0.25)');
  });

  it('血量是 meter；超出範圍會夾在 0～1；max 為 0 不會除以零', () => {
    expect(renderToStaticMarkup(<Meter tone="enemy" value={5} max={10} label="血量" />)).toContain('role="meter"');
    expect(renderToStaticMarkup(<Meter tone="boss" value={150} max={100} label="BOSS" />)).toContain('scaleX(1)');
    expect(renderToStaticMarkup(<Meter tone="stage" value={-3} max={10} label="推進" />)).toContain('scaleX(0)');
    expect(renderToStaticMarkup(<Meter tone="relic" value={3} max={0} label="古物" />)).toContain('scaleX(0)');
  });

  it('沒有名稱時是裝飾（aria-hidden），不產生無名稱的進度條', () => {
    const markup = renderToStaticMarkup(<Meter tone="relic" value={1} max={2} />);
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toContain('role=');
  });
});

describe('共用元件', () => {
  it('出售用 trade 樣式，不是危險樣式', () => {
    const markup = renderToStaticMarkup(<ActionButton label="出售" variant="trade" />);
    expect(markup).toContain(primitiveStyles.trade);
    expect(markup).not.toContain(primitiveStyles.danger);
  });

  it('資源數量：文字含帶正負號的數字，讀屏另念出資源名稱', () => {
    const markup = renderToStaticMarkup(<CurrencyAmount kind="gold" value={10} signed />);
    expect(markup).toContain('+10');
    expect(markup).toContain('金幣');
    expect(renderToStaticMarkup(<CurrencyAmount kind="relic" value={20000} compact />)).toContain('2萬');
  });

  it('開關保留 switch 語意與「開／關」文字（不只靠顏色）', () => {
    const on = renderToStaticMarkup(<Toggle label="首次自動挑戰" on onChange={noop} />);
    expect(on).toContain('role="switch"');
    expect(on).toContain('aria-checked="true"');
    expect(on).toContain('>開<');
    expect(renderToStaticMarkup(<Toggle label="聲音" on={false} onChange={noop} disabled />)).toContain('>關<');
  });

  it('分頁變體仍是 radiogroup／radio（e2e 與截圖工具依此定位）', () => {
    const markup = renderToStaticMarkup(
      <Segmented
        variant="tabs"
        label="角色分頁"
        options={[
          { value: 'equipment', label: '裝備' },
          { value: 'bag', label: '背包' },
        ]}
        value="bag"
        onChange={noop}
      />,
    );
    expect(markup).toContain('role="radiogroup"');
    expect(markup).toContain('aria-label="角色分頁"');
    expect(markup.match(/role="radio"/g)).toHaveLength(2);
    expect(markup).toContain('aria-checked="true"');
  });

  it('提醒框以圖示＋文字表示語氣', () => {
    const markup = renderToStaticMarkup(<Notice tone="danger">不可復原</Notice>);
    expect(markup).toContain('<svg');
    expect(markup).toContain('不可復原');
  });
});
