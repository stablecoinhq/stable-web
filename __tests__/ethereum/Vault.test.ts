import { FixedNumber } from 'ethers';

import { roundUp } from 'ethereum/Vault';
import { UnitFormats } from 'ethereum/helpers/math';

const format = UnitFormats.WAD;

const test = (expected: FixedNumber, actual: string) => {
  const rounded = roundUp(expected, format.decimals);
  expect(rounded.toString()).toBe(actual);
};

describe('roundUp', () => {
  it('should roundup', () => {
    const expected = FixedNumber.from(`1.${'0'.repeat(UnitFormats.WAD.decimals)}1`, UnitFormats.RAY);
    const actual = `1.${'0'.repeat(UnitFormats.WAD.decimals - 1)}1`;
    test(expected, actual);
  });

  it('should not roundup', () => {
    const expected = FixedNumber.from(`1.${'0'.repeat(UnitFormats.WAD.decimals)}0`, UnitFormats.RAY);
    const actual = '1.0';
    test(expected, actual);
  });

  it('should roundup', () => {
    const expected = FixedNumber.from(`1.${'0'.repeat(UnitFormats.WAD.decimals)}1234242`, UnitFormats.RAY);
    const actual = `1.${'0'.repeat(UnitFormats.WAD.decimals - 1)}1`;
    test(expected, actual);
  });

  it('should do nothing', () => {
    const expected = FixedNumber.from('1.123123', UnitFormats.RAY);
    const actual = '1.123123';
    test(expected, actual);
  });
});
