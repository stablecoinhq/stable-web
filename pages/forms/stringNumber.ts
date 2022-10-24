import { parseUnits } from '@ethersproject/units';

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
  if (i > -1 && i + dec + 1 < input.length) {
    return input.substring(0, i + dec + 1);
  }
  return input;
};

export const toBigNumberOrUndefined = (input: string, dec: number) => {
  try {
    return parseUnits(input, dec);
  } catch {
    return undefined;
  }
};
