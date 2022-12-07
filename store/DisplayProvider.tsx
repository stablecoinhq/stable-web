import { FixedFormat } from '@ethersproject/bignumber';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { FixedNumber } from 'ethers';
import type { FC, ReactNode } from 'react';

type DisplayUnit = 'simple' | 'detailed';

export type DisplayContextType = {
  unit: DisplayUnit;
  toggleDisplayUnit: () => void;
  display: (n: FixedNumber) => FixedNumber;
};

const DisplayContext = createContext<DisplayContextType>({ unit: 'simple', toggleDisplayUnit: () => {}, display: (n) => n });

export const useConfigContext = () => useContext(DisplayContext);

export const DisplayProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [unit, setDisplayUnit] = useState<DisplayUnit>('simple');

  const toggleDisplayUnit = useCallback(() => setDisplayUnit((prev) => (prev === 'detailed' ? 'simple' : 'detailed')), []);
  // TODOもっと厳格にやる
  const display = useCallback((n: FixedNumber) => (unit === 'simple' ? n.round(2).toFormat(FixedFormat.from(2)) : n), [unit]);
  const values = useMemo(() => ({ unit, toggleDisplayUnit, display }), [toggleDisplayUnit, display, unit]);
  return <DisplayContext.Provider value={values}>{children}</DisplayContext.Provider>;
};
