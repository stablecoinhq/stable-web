import { FixedFormat, parseFixed } from '@ethersproject/bignumber';

import {
  assertFixedFormat,
  getBiggestDecimalsFormat,
  INT_FORMAT,
  InvalidFixedFormatError,
  pow,
  toFixedNumber,
  UnitFormats,
} from 'ethereum/helpers/math';
import { toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';

describe('assertFixedFormat', () => {
  it('returns original value if the format matches', () => {
    const value1 = toFixedNumberOrUndefined('1.234567', UnitFormats.RAY)!;
    expect(assertFixedFormat(value1, UnitFormats.RAY)).toBe(value1);

    const value2 = toFixedNumberOrUndefined('123', INT_FORMAT)!;
    expect(assertFixedFormat(value2, INT_FORMAT)).toBe(value2);

    const myIntFormat = FixedFormat.from(0);
    expect(assertFixedFormat(value2, myIntFormat)).toBe(value2);
  });

  it('should throw InvalidFixedFormatError if the format of the value does not match to format', () => {
    const value = toFixedNumberOrUndefined('1.234567', UnitFormats.RAY)!;
    expect(() => {
      assertFixedFormat(value, UnitFormats.WAD);
    }).toThrow(InvalidFixedFormatError);
  });
});

describe('toFixedNumber', () => {
  it('should convert BigNumber into FixedNumber', () => {
    const bn = parseFixed('123.456', UnitFormats.RAY.decimals);
    const fn = toFixedNumber(bn, UnitFormats.RAY);
    expect(fn.toString()).toBe('123.456');
  });
});

describe('getBiggestDecimalsFormat', () => {
  it('should return the format which has the biggest decimals', () => {
    expect(getBiggestDecimalsFormat(INT_FORMAT, UnitFormats.RAY, UnitFormats.WAD).name).toBe(UnitFormats.RAY.name);
  });

  it('returns INT_FORMAT if nothing passed', () => {
    expect(getBiggestDecimalsFormat().name).toBe(INT_FORMAT.name);
  });
});

describe('pow', () => {
  it('should return power of given values', () => {
    const value1 = toFixedNumberOrUndefined('7', INT_FORMAT)!;

    expect(pow(value1, 4).toString()).toBe('2401');
    expect(pow(value1, 1).toString()).toBe('7');
    expect(pow(value1, 0).toString()).toBe('1');

    const value2 = toFixedNumberOrUndefined('0.1', UnitFormats.RAD)!;

    expect(pow(value2, 45).toString()).toBe('0.000000000000000000000000000000000000000000001');

    const value3 = toFixedNumberOrUndefined('1.0000001', UnitFormats.RAD)!;

    // Correct value: 23.420222119856594140920793292304717595882616608068533428687966078...
    expect(pow(value3, 365 * 24 * 60 * 60).toString()).toContain('23.4202221198565941409207932923047175958');
    // Correct value: 19468.298548342917435009031280896007646666419989567456228496005657...
    expect(pow(value3, 98765432).toString()).toContain('19468.2985483429174350090312808960076466');

    const value4 = toFixedNumberOrUndefined('0', UnitFormats.WAD)!;

    expect(pow(value4, 5).toString()).toBe('0.0');
    expect(pow(value4, 0).toString()).toBe('1.0');
  });
});
