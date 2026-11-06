import { useLayoutEffect, type RefObject } from 'react';

/**
 * 把舞台實際寬高寫成 --stage-w／--stage-h，CSS 以它們換算精靈尺寸與地面線。
 * 不用 container-type: size 的原因：實測（390×844、CPU 降速 4 倍、機械統帥戰鬥）尺寸容器讓
 * 每次戰況重繪的樣式計算時間約變 3 倍；這裡只在尺寸改變時寫一次自訂屬性，平常重繪不受影響。
 * 直接寫 DOM 樣式、不經過 React 狀態，所以不會因為量測而多重繪一次。
 */
export function useStageSize(ref: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const write = (width: number, height: number) => {
      element.style.setProperty('--stage-w', `${width}px`);
      element.style.setProperty('--stage-h', `${height}px`);
    };
    write(element.clientWidth, element.clientHeight);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) write(box.width, box.height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
}
