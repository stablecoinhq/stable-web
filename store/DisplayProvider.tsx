import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { FixedNumber } from 'ethers';
import type { FC, ReactNode } from 'react';

type DisplayUnit = 'simple' | 'detailed';

const ROUND_AT = 2;
const ROUND_AT_DETAILED = 4;

export type DisplayContextType = {
  unit: DisplayUnit;
  toggleDisplayUnit: () => void;
  display: (n: FixedNumber) => FixedNumber;
};

const DisplayContext = createContext<DisplayContextType>({
  unit: 'simple',
  toggleDisplayUnit: () => {},
  display: (n) => n,
});

export const useDisplayContext = () => useContext(DisplayContext);

const round = (num: FixedNumber, decimals: number) => {
  const comps = num.toString().split('.');
  if (comps.length === 1) {
    comps.push('0');
  }
  if (comps[1]!.length <= decimals) {
    return num;
  }
  const nonZeroAt = comps[1]!.search(/[^0]/);
  const roundAt = nonZeroAt < decimals ? decimals : Math.min(nonZeroAt + ROUND_AT_DETAILED, num.format.decimals);
  return num.round(roundAt);
};

export const DisplayProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [unit, setDisplayUnit] = useState<DisplayUnit>('simple');

  const toggleDisplayUnit = useCallback(
    () =>
      setDisplayUnit((prev) => {
        const next = prev === 'detailed' ? 'simple' : 'detailed';
        localStorage.setItem('displayUnit', next);
        return next;
      }),
    [],
  );

  useEffect(() => {
    const u = localStorage.getItem('displayUnit') as DisplayUnit | null;
    setDisplayUnit(u || 'simple');
  }, []);

  const display = useCallback((n: FixedNumber) => (unit === 'simple' ? round(n, ROUND_AT) : n), [unit]);
  const values = useMemo(() => ({ unit, toggleDisplayUnit, display }), [toggleDisplayUnit, display, unit]);
  return <DisplayContext.Provider value={values}>{children}</DisplayContext.Provider>;
};
