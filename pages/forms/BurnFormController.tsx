import { FixedNumber } from 'ethers';
import { useCallback, useMemo, useState } from 'react';

import Vault from 'ethereum/Vault';
import { UnitFormats } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers, toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import BurnForm from 'pages/forms/BurnForm';
import { BurnFormValidation } from 'pages/forms/BurnFormValidation';

import FormLayout from './FormLayout';

import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus, UrnStatus } from 'ethereum/contracts/VatHelper';
import type { CurrentVaultStatus } from 'ethereum/react/cards/VaultStatusCard';
import type { FC } from 'react';

type TabValue = 'mint' | 'burn';

const formats = UnitFormats.RAD;

type BurnFormControllerProps = {
  ilkInfo: IlkInfo;
  ilkStatus: IlkStatus;
  urnStatus: UrnStatus;
  liquidationRatio: FixedNumber;
  balance: FixedNumber;
  buttonContent: string;
  proxyAddress: string | undefined;
  increaseAllowance: (address: string, spendingAmount: FixedNumber) => Promise<void>;
  ensureProxy: () => Promise<string>;
  allowance: FixedNumber;
  selectedTab: TabValue;
  onSelectTab: (_: unknown, value: TabValue) => void;
  onDialogClose: () => void;
  burn: (daiAmount: FixedNumber, colAmount: FixedNumber) => Promise<void>;
  burnAll: (daiAmount: FixedNumber, colAmount: FixedNumber) => Promise<void>;
};

const BurnFormController: FC<BurnFormControllerProps> = ({
  ilkInfo,
  ilkStatus,
  liquidationRatio,
  balance,
  buttonContent,
  urnStatus,
  selectedTab,
  onSelectTab,
  burn,
  burnAll,
  proxyAddress,
  increaseAllowance,
  ensureProxy,
  allowance,
  onDialogClose,
}) => {
  const [daiText, setDaiText] = useState('');
  const [colText, setColText] = useState('');

  const onAmountChange = useCallback(
    (value: string) => setDaiText(cutDecimals(pickNumbers(value), UnitFormats.WAD.decimals)),
    [],
  );
  const onColChange = useCallback(
    (value: string) => setColText(cutDecimals(pickNumbers(value), ilkInfo.gem.format.decimals)),
    [ilkInfo.gem.format.decimals],
  );

  const burnForm = useMemo(
    () => (
      <BurnForm
        ilkInfo={ilkInfo}
        ilkStatus={ilkStatus}
        buttonContent={buttonContent}
        daiBalance={balance}
        lockedBalance={urnStatus.lockedBalance}
        debt={urnStatus.debt}
        burn={burn}
        burnAll={burnAll}
        onAmountChange={onAmountChange}
        onColChange={onColChange}
        daiText={daiText}
        colText={colText}
        proxyAddress={proxyAddress}
        increaseAllowance={increaseAllowance}
        ensureProxy={ensureProxy}
        allowance={allowance}
        onDialogClose={() => {
          onDialogClose();
          setDaiText('');
          setColText('');
        }}
      />
    ),
    [
      allowance,
      balance,
      burn,
      burnAll,
      buttonContent,
      colText,
      daiText,
      ensureProxy,
      ilkInfo,
      ilkStatus,
      increaseAllowance,
      onAmountChange,
      onColChange,
      onDialogClose,
      proxyAddress,
      urnStatus.debt,
      urnStatus.lockedBalance,
    ],
  );

  const current: CurrentVaultStatus | undefined = useMemo(() => {
    const daiAmount = toFixedNumberOrUndefined(daiText, UnitFormats.WAD);
    const collateralAmount = toFixedNumberOrUndefined(colText, ilkInfo.gem.format);
    if (daiAmount && collateralAmount) {
      // Vat.urn.art * Var.urn.rate - daiAmount
      const currentCollateralAmount = urnStatus.lockedBalance.subUnsafe(collateralAmount);
      const currentDebt = Vault.getDebt(
        urnStatus.debt,
        ilkStatus.debtMultiplier,
        daiAmount.mulUnsafe(FixedNumber.fromString('-1', UnitFormats.WAD)),
      );
      const normalizedDebt = urnStatus.debt
        .toFormat(formats)
        .subUnsafe(daiAmount.toFormat(formats).divUnsafe(ilkStatus.debtMultiplier.toFormat(formats)));
      const collateralizationRatio = Vault.getCollateralizationRatio(
        currentCollateralAmount,
        normalizedDebt,
        liquidationRatio,
        ilkStatus,
      );
      const liquidationPrice = Vault.getLiquidationPrice(
        currentCollateralAmount,
        normalizedDebt,
        ilkStatus.debtMultiplier,
        liquidationRatio,
      );
      return {
        debt: {
          value: currentDebt,
          isInvalid:
            BurnFormValidation.isBelowDebtFloor(currentDebt, ilkStatus.debtFloor) ||
            BurnFormValidation.isOverRepaying(urnStatus.debt, daiAmount, ilkStatus.debtMultiplier),
        },
        collateralizationRatio: {
          value: collateralizationRatio,
          isInvalid:
            BurnFormValidation.isCollateralizationRatioTooLow(
              urnStatus.lockedBalance,
              collateralAmount,
              currentDebt,
              ilkStatus.price,
            ) || collateralizationRatio.isNegative(),
        },
        collateralAmount: {
          value: currentCollateralAmount,
          isInvalid: BurnFormValidation.isInvalidCollateralFreeAmount(urnStatus.lockedBalance, collateralAmount),
        },
        liquidationPrice: {
          value: liquidationPrice,
          isInvalid: liquidationPrice.isNegative(),
        },
      };
    }
  }, [colText, daiText, ilkInfo.gem.format, ilkStatus, liquidationRatio, urnStatus.debt, urnStatus.lockedBalance]);

  return (
    <FormLayout
      ilkInfo={ilkInfo}
      ilkStatus={ilkStatus}
      current={current}
      liquidationRatio={liquidationRatio}
      urnStatus={urnStatus}
      selectedTab={selectedTab}
      onSelectTab={onSelectTab}
      form={burnForm}
    />
  );
};
export default BurnFormController;
