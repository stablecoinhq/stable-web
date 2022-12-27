import { UnitFormats } from 'ethereum/helpers/math';

import type { FixedNumber } from 'ethers';

const format = UnitFormats.WAD;

export enum WithdrawError {
  insufficientBalance,
  invalidAmount,
}

export default class WithdrawFormValidation {
  static canDeposit(daiBalance: FixedNumber, withdrawAmount: FixedNumber) {
    const errors: WithdrawError[] = [];

    if (WithdrawFormValidation.isInsufficientBalance(daiBalance, withdrawAmount)) {
      errors.push(WithdrawError.insufficientBalance);
    }

    if (WithdrawFormValidation.isInvalidWithdrawAmount(withdrawAmount)) {
      errors.push(WithdrawError.invalidAmount);
    }

    return errors;
  }

  // daiBalance - depositBalance < 0
  static isInsufficientBalance(daiBalance: FixedNumber, withdrawAmount: FixedNumber): boolean {
    return daiBalance.toFormat(format).subUnsafe(withdrawAmount.toFormat(format)).isNegative();
  }

  static isInvalidWithdrawAmount(withdrawAmount: FixedNumber) {
    return withdrawAmount.isZero();
  }
}
