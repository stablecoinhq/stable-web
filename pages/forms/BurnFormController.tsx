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
import type { SubmitFormProps } from 'ethereum/react/form/SubmitForm';
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
  helperText: string;
  address: string;
  selectedTab: TabValue;
  onSelectTab: (_: unknown, value: TabValue) => void;
  burn: (daiAmount: FixedNumber, colAmount: FixedNumber) => Promise<void>;
  burnAll: (daiAmount: FixedNumber, colAmount: FixedNumber) => Promise<void>;
  submitFormProps: SubmitFormProps;
};

const BurnFormController: FC<BurnFormControllerProps> = ({
  ilkInfo,
  ilkStatus,
  liquidationRatio,
  balance,
  buttonContent,
  helperText,
  urnStatus,
  address,
  selectedTab,
  onSelectTab,
  burn,
  burnAll,
  submitFormProps,
}) => {
  const [daiText, setDaiText] = useState('');
  const [colText, setColText] = useState('');

  const onBurn = useCallback(
    async (daiAmount: FixedNumber, colAmount: FixedNumber) => {
      await burn(daiAmount, colAmount).then(() => {
        setColText('');
        setDaiText('');
      });
    },
    [burn],
  );

  const onBurnAll = useCallback(
    async (daiAmount: FixedNumber, colAmount: FixedNumber) => {
      await burnAll(daiAmount, colAmount).then(() => {
        setColText('');
        setDaiText('');
      });
    },
    [burnAll],
  );
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
        helperText={helperText}
        daiBalance={balance}
        lockedBalance={urnStatus.lockedBalance}
        debt={urnStatus.debt}
        onBurn={onBurn}
        onBurnAll={onBurnAll}
        onAmountChange={onAmountChange}
        onColChange={onColChange}
        daiText={daiText}
        colText={colText}
        submitFormProps={submitFormProps}
      />
    ),
    [balance, buttonContent, colText, daiText, helperText, ilkInfo, ilkStatus, onAmountChange, onBurn, onBurnAll, onColChange, submitFormProps, urnStatus.debt, urnStatus.lockedBalance],
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
          isValid:
            BurnFormValidation.isBelowDebtFloor(currentDebt, ilkStatus.debtFloor) ||
            BurnFormValidation.isOverRepaying(urnStatus.debt, daiAmount, ilkStatus.debtMultiplier),
        },
        collateralizationRatio: {
          value: collateralizationRatio,
          isValid:
            BurnFormValidation.isCollateralizationRatioTooLow(
              urnStatus.lockedBalance,
              collateralAmount,
              currentDebt,
              ilkStatus.price,
            ) || collateralizationRatio.isNegative(),
        },
        collateralAmount: {
          value: currentCollateralAmount,
          isValid: BurnFormValidation.isInvalidCollateralFreeAmount(urnStatus.lockedBalance, collateralAmount),
        },
        liquidationPrice: {
          value: liquidationPrice,
          isValid: liquidationPrice.isNegative(),
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
      balance={balance}
      address={address}
      urnStatus={urnStatus}
      selectedTab={selectedTab}
      onSelectTab={onSelectTab}
      form={burnForm}
    />
  );
};
export default BurnFormController;
