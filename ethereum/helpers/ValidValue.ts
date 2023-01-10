import type { FixedNumber } from 'ethers';

export type ValidValue = {
  value: FixedNumber;
  isInvalid: boolean;
};
