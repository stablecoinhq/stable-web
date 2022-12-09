import Vault from 'ethereum/Vault';
import { UnitFormats } from 'ethereum/helpers/math';

import type { IlkStatus } from 'ethereum/contracts/VatHelper';
import type { FixedNumber } from 'ethers';

export enum MintError {
  // 残高不足
  insufficientBalance,
  // 担保率が最低担保率を下回っている
  collateralTooLow,
  // vaultにある負債が下限値を下回る
  debtTooLow,
  // 発行上限を上回っている
  issuingTooMuchCoins,
}

const format = UnitFormats.RAD;
export class MintFormValidation {
  /**
   * Mintが可能か検証を行う。できない場合にはその理由をリストとして返す
   * @param balance ウォレットが保有する担保通貨の残高
   * @param lockedBalance 既にVaultにロックされている担保 (Vault.urn.ink)
   * @param debt Vaultが負っている負債 (Vault.urn.art)
   * @param collateralAmount 担保として入れる残高
   * @param ilkStatus 任意の担保に関する情報 (Vat.ilk)
   * @returns
   */
  static canMint(
    balance: FixedNumber,
    collateralAmount: FixedNumber,
    daiAmount: FixedNumber,
    lockedBalance: FixedNumber,
    debt: FixedNumber,
    ilkStatus: IlkStatus,
  ) {
    const errors = [];
    if (MintFormValidation.isInsufficientBalance(balance, collateralAmount)) {
      errors.push(MintError.insufficientBalance);
    }

    if (MintFormValidation.isBelowLiquidationRatio(daiAmount, debt, lockedBalance, collateralAmount, ilkStatus)) {
      errors.push(MintError.collateralTooLow);
    }

    if (MintFormValidation.isBelowDebtFloor(daiAmount, debt, ilkStatus)) {
      errors.push(MintError.debtTooLow);
    }
    if (MintFormValidation.isAboveDebtCeiling(daiAmount, ilkStatus)) {
      errors.push(MintError.issuingTooMuchCoins);
    }
    return errors;
  }

  // Insufficient balance
  static isInsufficientBalance(balance: FixedNumber, collateralAmount: FixedNumber): boolean {
    return balance.toFormat(format).subUnsafe(collateralAmount.toFormat(format)).isNegative();
  }

  /**
   * CollateralizationRatio is below liquidation ratio
   * Vat.ilk.rate * (Vat.urn.art + daiAmount) < Vat.ilk.spot * (Vat.urn.ink + collateralAmount)
   */
  static isBelowLiquidationRatio(
    daiAmount: FixedNumber,
    debt: FixedNumber,
    lockedBalance: FixedNumber,
    collateralAmount: FixedNumber,
    ilkStatus: IlkStatus,
  ): boolean {
    const { debtMultiplier, price } = ilkStatus;
    if (!(debt.isZero() && daiAmount.isZero())) {
      const currentDebt = Vault.getDebt(debt, debtMultiplier, daiAmount);
      const currentSurplus = price
        .toFormat(format)
        .mulUnsafe(lockedBalance.toFormat(format).addUnsafe(collateralAmount.toFormat(format)));

      return currentSurplus.subUnsafe(currentDebt.toFormat(format)).isNegative();
    }
    return false;
  }

  /**
   * Amount of debt is below debt floor
   * Vat.ilk.rate * (urn.art + daiAmount) - Vat.ilk.dust < 0
   */
  static isBelowDebtFloor(daiAmount: FixedNumber, debt: FixedNumber, ilkStatus: IlkStatus): boolean {
    const { debtMultiplier, debtFloor } = ilkStatus;
    return (
      !daiAmount.isZero() &&
      debtMultiplier
        .toFormat(format)
        .mulUnsafe(debt.toFormat(format).addUnsafe(daiAmount.toFormat(format)))
        .subUnsafe(debtFloor.toFormat(format))
        .isNegative()
    );
  }

  /**
   * Amount of debt is above debt ceiling
   * Vat.ilk.line - (Vat.ilk.Art + daiAmount) * Vat.ilk.rate < 0
   */
  static isAboveDebtCeiling(daiAmount: FixedNumber, ilkStatus: IlkStatus): boolean {
    const { debtMultiplier, debtCeiling, normalizedDebt } = ilkStatus;
    const totalIssued = normalizedDebt
      .toFormat(format)
      .addUnsafe(daiAmount.toFormat(format))
      .mulUnsafe(debtMultiplier.toFormat(format));
    return debtCeiling.subUnsafe(totalIssued).isNegative();
  }
}
