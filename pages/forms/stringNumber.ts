import { FixedNumber } from 'ethers';

import type { FixedFormat } from '@ethersproject/bignumber';

export const pickNumbers = (input: string) => {
  let output = input.replaceAll(/[^\d.]/g, '');

  let i: number;
  // eslint-disable-next-line no-cond-assign
  while (output.indexOf('.') !== (i = output.lastIndexOf('.'))) {
    output = output.substring(0, i) + output.substring(i + 1);
  }

  return output;
};

export const cutDecimals = (input: string, dec: number) => {
  const i = input.indexOf('.');
  if (i < 0) {
    return input;
  }

  if (dec === 0) {
    return input.substring(0, i);
  }

  if (i + dec + 1 < input.length) {
    return input.substring(0, i + dec + 1);
  }

  return input;
};

export const toFixedNumberOrUndefined = (input: string, format: FixedFormat) => {
  try {
    return FixedNumber.fromString(input, format);
  } catch {
    return undefined;
  }
};
