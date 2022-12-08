import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { FixedNumber } from 'ethers';
import type { FC, ReactNode } from 'react';

type DisplayMode = 'simple' | 'detailed';

/**
 * 通常の有効少数点
 */
const ROUND_AT = 2;
/**
 * 与えられた数値が有効小数点ROUND_ATよりも小さい場合(x)の有効小数点(x + ROUND_AT_DETAIL)
 */
const ROUND_AT_DETAIL = 4;

/**
 * 数字の表示形式に関するContext
 */
export type NumericDisplayContextType = {
  /**
   * 現在の表示形式モード
   */
  displayMode: DisplayMode;
  /**
   * 表示形式を切り替える
   */
  toggleDisplay: (checked: boolean) => void;
  /**
   * 任意のFixedNumberの表示形式を変更する
   */
  format: (n: FixedNumber) => FixedNumber;
};

const NumericDisplayContext = createContext<NumericDisplayContextType>({
  displayMode: 'simple',
  toggleDisplay: (_b) => {},
  format: (n) => n,
});

export const useNumericDisplayContext = () => useContext(NumericDisplayContext);

/**
 * 与えられた数値の四捨五入を行う。値の有効小数点がdecimalsよりも小さい場合、そちらを優先する。
 */
export const round = (num: FixedNumber, decimals: number) => {
  const comps = num.toString().split('.');
  if (comps.length === 1) {
    comps.push('0');
  }
  if (comps[1]!.length <= decimals) {
    return num;
  }
  const nonZeroAt = comps[1]!.search(/[^0]/);
  const roundAt = nonZeroAt < decimals ? decimals : Math.min(nonZeroAt + ROUND_AT_DETAIL, num.format.decimals);
  return num.round(roundAt);
};

export const NumericDisplayProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('simple');

  const toggleDisplay = useCallback(
    (isChecked: boolean) =>
      setDisplayMode(() => {
        const next = isChecked ? 'detailed' : 'simple';
        localStorage.setItem('displayUnit', next);
        return next;
      }),
    [],
  );

  useEffect(() => {
    const u = localStorage.getItem('displayUnit') as DisplayMode | null;
    setDisplayMode(u || 'simple');
  }, []);

  const format = useCallback((n: FixedNumber) => (displayMode === 'simple' ? round(n, ROUND_AT) : n), [displayMode]);
  const values: NumericDisplayContextType = useMemo(
    () => ({ displayMode, toggleDisplay, format }),
    [toggleDisplay, format, displayMode],
  );
  return <NumericDisplayContext.Provider value={values}>{children}</NumericDisplayContext.Provider>;
};
