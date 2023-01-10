import { useNumericDisplayContext } from 'store/NumericDisplayProvider';

import type { FixedNumber } from 'ethers';
import type { FC } from 'react';

export type BnHelperTextProps = {
  num: FixedNumber | undefined;
  unit: string;
  noComma?: boolean;
};
const BnHelperText: FC<BnHelperTextProps> = ({ num, unit, noComma }) => {
  const { format } = useNumericDisplayContext();

  return num ? <span>{`${format(num, noComma)} ${unit}`}</span> : <span>&nbsp;</span>;
};

export default BnHelperText;
