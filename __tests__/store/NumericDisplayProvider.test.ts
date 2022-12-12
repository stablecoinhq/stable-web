import { FixedNumber } from 'ethers';

import { UnitFormats } from 'ethereum/helpers/math';
import { round } from 'store/NumericDisplayProvider';

const testRound = (toTest: string, expected: string) => {
  const num = FixedNumber.fromString(toTest, UnitFormats.WAD);
  const rounded = round(num, 2);
  expect(rounded.toString()).toBe(expected);
};
describe('round', () => {
  it('should not throw error on any number', () => {
    for (let i = 0; i < 100; i += 1) {
      const num = FixedNumber.fromString((Math.random() * 10 ** 6).toString(), UnitFormats.WAD);
      expect(round(num, 5)).toBeTruthy();
    }
  });
  it('should work on zero', () => {
    testRound('0', '0.0');
  });
  it('should round down number', () => {
    testRound('11.111', '11.11');
  });
  it('should round up number', () => {
    testRound('11.115', '11.12');
  });
  it('should work with int numbers', () => {
    testRound('11', '11.0');
  });
  it('should work with negative numbers', () => {
    testRound('-11.11', '-11.11');
  });
  it('should work when no decimal numbers', () => {
    testRound('11.000', '11.0');
  });
  it('should work when the number is small', () => {
    testRound('0.0000000123', '0.0000000123');
  });
  it('should round with small numbers', () => {
    testRound('0.0000000123001', '0.0000000123');
  });
  it('should round with small numbers', () => {
    testRound('0.0000000100001', '0.00000001');
  });
  it('should work when with small numbers', () => {
    testRound('0.0000000123001', '0.0000000123');
  });
  it('should work when with very small numbers', () => {
    const verySmallNumber = `0.${'0'.repeat(UnitFormats.WAD.decimals - 1)}1`;
    testRound(verySmallNumber, verySmallNumber);
  });
  it('should round when intger parts are present ', () => {
    testRound('140.0000000000123001', '140.0');
  });
  it('should work when round result is zero', () => {
    testRound('0.001913757549', '0.001914');
  });
});
