import { UnitFormats } from 'ethereum/helpers/math';

import type { FixedNumber } from 'ethers';

const format = UnitFormats.WAD;

export enum DepositError {
  insufficientBalance,
  invalidAmount,
}
export default class DepositFormValidation {
  static canDeposit(daiBalance: FixedNumber, depositAmount: FixedNumber) {
    const errors: DepositError[] = [];

    if (DepositFormValidation.isInsufficientBalance(daiBalance, depositAmount)) {
      errors.push(DepositError.insufficientBalance);
    }

    if (DepositFormValidation.isInvalidDepositAmount(depositAmount)) {
      errors.push(DepositError.invalidAmount);
    }

    return errors;
  }

  // daiBalance - depositBalance < 0
  static isInsufficientBalance(daiBalance: FixedNumber, depositAmount: FixedNumber): boolean {
    return daiBalance.toFormat(format).subUnsafe(depositAmount.toFormat(format)).isNegative();
  }

  static isInvalidDepositAmount(depositAmount: FixedNumber) {
    return depositAmount.isZero();
  }
}
