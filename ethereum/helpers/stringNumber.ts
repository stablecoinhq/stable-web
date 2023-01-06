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

export const toFixedNumberOrUndefined = (input: string | undefined, format: FixedFormat) => {
  try {
    return input === undefined ? undefined : FixedNumber.fromString(input, format);
  } catch {
    return undefined;
  }
};

// https://stackoverflow.com/questions/149055/how-to-format-numbers-as-currency-strings
export function displayCommas(n: string | FixedNumber) {
  if (typeof n === 'string') {
    if (n === '' || n === undefined) {
      return n;
    }
    return n.replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }
  return n.toString().replace(/\d(?=(\d{3})+\.)/g, '$&,');
}
