import { FixedNumber } from 'ethers';

import Vault from 'ethereum/Vault';
import { UnitFormats } from 'ethereum/helpers/math';

import type { IlkStatus } from 'ethereum/contracts/VatHelper';

export enum BurnError {
  // ウォレットのDAIの残高が不足している
  insufficientBalance,
  // 過剰返済。返済額が負債額を超えていないか
  invalidRepayAmount,
  // 引き出す担保がロックされている担保を上回っている
  invalidCollateralFreeAmount,
  // vaultの負債が下限値を下回っている
  debtTooLow,
  // vaultの担保率が最低担保率を下回っている
  collateralTooLow,
}

const format = UnitFormats.RAD;

export class Validation {
  /**
   * Burnが可能か検証を行う。できない場合にはその理由をリストとして返す
   * @param daiBalance ウォレットに保有するDAIの数量
   * @param lockedBalance 既にVaultにロックされている担保 (Vault.urn.ink)
   * @param debt Vaultが負っている負債 (Vault.urn.art)
   * @param collateralToFree 引き出そうとしている担保の数量
   * @param daiToRepay 返済しようとしているDAIの数量
   * @param ilkStatus 任意の担保に関する情報 (Vat.ilk)
   */
  static canBurn(
    daiBalance: FixedNumber,
    lockedBalance: FixedNumber,
    debt: FixedNumber,
    collateralToFree: FixedNumber,
    daiToRepay: FixedNumber,
    ilkStatus: IlkStatus,
  ): BurnError[] {
    const { debtMultiplier, price, debtFloor } = ilkStatus;

    const errors: BurnError[] = [];

    if (Validation.isInsufficientBalance(daiBalance, daiToRepay)) {
      errors.push(BurnError.insufficientBalance);
    }

    const currentDebt = Vault.getDebt(
      debt,
      debtMultiplier,
      daiToRepay.mulUnsafe(FixedNumber.fromString('-1', UnitFormats.WAD)),
    );
    if (Validation.isOverRepaying(debt, daiToRepay, debtMultiplier)) {
      errors.push(BurnError.invalidRepayAmount);
    }

    if (Validation.isInvalidCollateralFreeAmount(lockedBalance, collateralToFree)) {
      errors.push(BurnError.invalidCollateralFreeAmount);
    }

    if (Validation.isCollateralizationRatioTooLow(lockedBalance, collateralToFree, currentDebt, price)) {
      errors.push(BurnError.collateralTooLow);
    }

    if (Validation.isBelowDebtFloor(currentDebt, debtFloor)) {
      errors.push(BurnError.debtTooLow);
    }

    return errors;
  }

  // daiBalance - daiToRepay < 0
  static isInsufficientBalance(daiBalance: FixedNumber, daiToRepay: FixedNumber): boolean {
    return daiBalance.toFormat(format).subUnsafe(daiToRepay.toFormat(format)).isNegative();
  }

  // normalizedDebt - daiToRepay < 0
  // 有効小数点18桁にしてから計算する
  static isOverRepaying(debt: FixedNumber, daiToRepay: FixedNumber, debtMultiplier: FixedNumber): boolean {
    // ここのroundは繰上げだから大丈夫
    const normalizedDebt = Vault.getDebt(debt, debtMultiplier);
    return normalizedDebt.subUnsafe(daiToRepay.toFormat(UnitFormats.WAD)).isNegative();
  }

  // Vat.urn.ink < collateralToFree
  static isInvalidCollateralFreeAmount(lockedBalance: FixedNumber, collateralToFree: FixedNumber): boolean {
    return lockedBalance.toFormat(format).subUnsafe(collateralToFree.toFormat(format)).isNegative();
  }

  // currentDebt !== 0 && currentDebt < Vat.ilk.spot * (Vat.urn.ink + collateralAmount)
  static isCollateralizationRatioTooLow(
    lockedBalance: FixedNumber,
    collateralToFree: FixedNumber,
    currentDebt: FixedNumber,
    price: FixedNumber,
  ) {
    const currentCollateralInDai = price
      .toFormat(format)
      .mulUnsafe(lockedBalance.toFormat(format).subUnsafe(collateralToFree.toFormat(format)));
    return currentCollateralInDai.subUnsafe(currentDebt.toFormat(format)).isNegative();
  }

  // 0 < currentDebt < debtFloor
  static isBelowDebtFloor(currentDebt: FixedNumber, debtFloor: FixedNumber) {
    return (
      !currentDebt.isNegative() &&
      !currentDebt.isZero() &&
      currentDebt.toFormat(format).subUnsafe(debtFloor.toFormat(format)).isNegative()
    );
  }
}
