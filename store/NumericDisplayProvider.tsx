import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { displayCommas } from 'ethereum/helpers/stringNumber';

import type { FixedNumber } from 'ethers';
import type { FC, ReactNode } from 'react';

type DisplayMode = 'simple' | 'detailed';

/**
 * 通常の有効少数点
 */
const ROUND_AT = 2;
/**
 * 与えられた数値が有効小数点ROUND_ATよりも小さい場合(n桁)の有効小数点(n + ROUND_AT_DETAIL)
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
  format: (n: FixedNumber, noCommas?: boolean) => string;
};

const NumericDisplayContext = createContext<NumericDisplayContextType>({
  displayMode: 'simple',
  toggleDisplay: (_b) => {},
  format: (n, _b) => n.toString(),
});

export const useNumericDisplayContext = () => useContext(NumericDisplayContext);
/**
 * 与えられた数値の四捨五入を行う。値の有効小数点がdecimalsよりも小さい場合、そちらを優先する。
 */
export const round = (num: FixedNumber, decimals: number, noCommas?: boolean) => {
  const comps = num.toString().split('.');
  if (comps.length === 1) {
    comps.push('0');
  }
  if (comps[1]!.length <= decimals) {
    return noCommas ? num.toString() : displayCommas(num);
  }
  const nonZeroAt = comps[1]!.search(/[^0]/);
  // 整数部が0、かつ有効小数点が指定された桁数より小さい場合には、有効小数点を変更する
  // decimalで四捨五入した結果0になる場合には変更する
  const roundAt =
    (nonZeroAt > decimals && comps[0]! === '0') || num.round(decimals).isZero()
      ? Math.min(nonZeroAt + ROUND_AT_DETAIL, num.format.decimals)
      : decimals;
  const rounded = num.round(roundAt);
  return noCommas ? rounded.toString() : displayCommas(rounded);
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

  const format = useCallback(
    (n: FixedNumber, noCommas?: boolean) => {
      if (displayMode === 'simple') {
        return round(n, ROUND_AT, noCommas);
      }
      if (noCommas) {
        return n.toString();
      }
      return displayCommas(n);
    },
    [displayMode],
  );
  const values: NumericDisplayContextType = useMemo(
    () => ({ displayMode, toggleDisplay, format }),
    [toggleDisplay, format, displayMode],
  );
  return <NumericDisplayContext.Provider value={values}>{children}</NumericDisplayContext.Provider>;
};
