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

/**
 * Mintが可能か検証を行う。できない場合にはその理由をリストとして返す
 * @param balance ウォレットが保有する担保通貨の残高
 * @param lockedBalance 既にVaultにロックされている担保 (Vault.urn.ink)
 * @param debt Vaultが負っている負債 (Vault.urn.art)
 * @param collateralAmount 担保として入れる残高
 * @param collateralRatio 担保率
 * @param liquidationRatio 最低担保率 (Spot.ilk.mat)
 * @param ilkStatus 任意の担保に関する情報 (Vat.ilk)
 * @returns
 */
export const canMint = (
  balance: FixedNumber,
  lockedBalance: FixedNumber,
  debt: FixedNumber,
  collateralAmount: FixedNumber,
  collateralRatio: FixedNumber,
  liquidationRatio: FixedNumber,
  ilkStatus: IlkStatus,
): MintError[] => {
  const formats = UnitFormats.RAD;
  const { debtMultiplier, normalizedDebt, debtCeiling, debtFloor, price } = ilkStatus;
  const daiAmount = Vault.getDaiAmount(collateralAmount, collateralRatio, liquidationRatio, price);
  const errors = [];
  // Insufficient balance
  // (Amount to use as collateral) - (Amount available) < 0
  if (balance.subUnsafe(collateralAmount).isNegative()) {
    errors.push(MintError.insufficientBalance);
  }

  // CollateralizationRatio is below liquidation ratio
  // Vat.ilk.rate * (Vat.urn.art + daiAmount) < Vat.ilk.spot * (Vat.urn.ink + collateralAmount)
  if (!(debt.isZero() && daiAmount.isZero())) {
    const currentDebt = debtMultiplier
      .toFormat(formats)
      .mulUnsafe(debt.toFormat(formats).addUnsafe(daiAmount.toFormat(formats)));
    const currentSurplus = price
      .toFormat(formats)
      .mulUnsafe(lockedBalance.toFormat(formats).addUnsafe(collateralAmount.toFormat(formats)));

    if (currentSurplus.subUnsafe(currentDebt).isNegative()) {
      errors.push(MintError.collateralTooLow);
    }
  }

  // Amount of debt is below debt floor
  // Vat.ilk.rate * (urn.art + daiAmount) - Vat.ilk.dust < 0
  if (
    !daiAmount.isZero() &&
    debtMultiplier
      .toFormat(formats)
      .mulUnsafe(debt.toFormat(formats).addUnsafe(daiAmount.toFormat(formats)))
      .subUnsafe(debtFloor.toFormat(formats))
      .isNegative()
  ) {
    errors.push(MintError.debtTooLow);
  }

  // Amount of debt is above debt ceiling
  // Vat.ilk.line - (Vat.ilk.Art + daiAmount) * Vat.ilk.rate < 0
  const totalIssued = normalizedDebt
    .toFormat(formats)
    .addUnsafe(daiAmount.toFormat(formats))
    .mulUnsafe(debtMultiplier.toFormat(formats));
  if (debtCeiling.subUnsafe(totalIssued).isNegative()) {
    errors.push(MintError.issuingTooMuchCoins);
  }
  return errors;
};
