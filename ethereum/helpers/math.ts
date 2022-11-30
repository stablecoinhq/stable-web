import { FixedFormat, parseFixed } from '@ethersproject/bignumber';
import { parseUnits } from '@ethersproject/units';
import { FixedNumber } from 'ethers';

import type { BigNumber } from 'ethers';

/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Number formats of Maker Protocol
 *
 * @see https://docs.makerdao.com/smart-contract-modules/proxy-module/dsr-manager-detailed-documentation#math
 */
export const UnitFormats = {
  WAD: FixedFormat.from(18),
  RAY: FixedFormat.from(27),
  RAD: FixedFormat.from(45),
};

export const COL_RATIO_FORMAT = FixedFormat.from(2);
export const CENT = FixedNumber.fromString('100', COL_RATIO_FORMAT).toFormat(UnitFormats.RAY);

export const YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
export const INT_FORMAT = FixedFormat.from(0);

/* eslint-enable @typescript-eslint/naming-convention */

export const InvalidFixedFormatError = new Error('Invalid FixedFormat passed');

export const assertFixedFormat = (value: FixedNumber, format: FixedFormat) => {
  if (value.format.name !== format.name) {
    throw InvalidFixedFormatError;
  }
  return value;
};

export const toFixedNumber = (value: BigNumber, format: FixedFormat) => FixedNumber.fromValue(value, format.decimals, format);

export const toBigNumber = (value: FixedNumber, format: FixedFormat) =>
  parseFixed(assertFixedFormat(value, format).toString(), format.decimals);

/**
 * Returns FixedFormat with the biggest decimals from arguments.
 */
export const getBiggestDecimalsFormat = (...formats: FixedFormat[]) =>
  FixedFormat.from(formats.reduce((acc, cur) => Math.max(acc, cur.decimals), 0));

/**
 * Calculate pow of `FixedNumber` faster than `BigNumber` implementation.
 */
export const pow = (base: FixedNumber, exp: number) => {
  const unit = parseUnits('1', base.format.decimals);
  let result = unit;
  let b = toBigNumber(base, base.format);

  // eslint-disable-next-line no-bitwise
  for (let tmp = exp; tmp > 0; tmp >>= 1) {
    // eslint-disable-next-line no-bitwise
    if (tmp & 1) {
      result = result.mul(b).div(unit);
    }

    b = b.mul(b).div(unit);
  }

  return toFixedNumber(result, base.format);
};

export function multiplyGasLimit(estimatedGasLimit: BigNumber) {
  const GAS_LIMIT_MULTIPLIER = 120;
  return estimatedGasLimit.mul(GAS_LIMIT_MULTIPLIER).div(100);
}
