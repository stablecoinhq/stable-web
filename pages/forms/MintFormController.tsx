import { useCallback, useMemo, useState } from 'react';

import Vault from 'ethereum/Vault';
import { UnitFormats } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers, toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import MintForm from 'pages/forms/MintForm';
import { MintFormValidation } from 'pages/forms/MintFormValidation';

import FormLayout from './FormLayout';

import type { TabValue } from './FormLayout';
import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus, UrnStatus } from 'ethereum/contracts/VatHelper';
import type { CurrentVaultStatus } from 'ethereum/react/cards/VaultStatusCard';
import type { SubmitFormProps } from 'ethereum/react/form/SubmitForm';
import type { FixedNumber } from 'ethers';
import type { FC, ReactNode } from 'react';

type MintFormControllerProps = {
  ilkInfo: IlkInfo;
  ilkStatus: IlkStatus;
  urnStatus: UrnStatus;
  liquidationRatio: FixedNumber;
  balance: FixedNumber;
  address: string;
  buttonContent: string;
  loadingText: ReactNode;
  selectedTab?: TabValue;
  onSelectTab?: (_: unknown, value: TabValue) => void;
  mint: (amount: FixedNumber, daiAmount: FixedNumber) => Promise<void>;
  submitFormProps: SubmitFormProps;
};

const MintFormController: FC<MintFormControllerProps> = ({
  ilkInfo,
  ilkStatus,
  liquidationRatio,
  balance,
  urnStatus,
  selectedTab,
  onSelectTab,
  mint,
  address,
  buttonContent,
  loadingText,
  submitFormProps,
}) => {
  const [amountText, setAmountText] = useState('');
  const [daiAmountText, setDaiAmountText] = useState('');

  const onAmountChange = useCallback(
    (value: string) => setAmountText(cutDecimals(pickNumbers(value), ilkInfo.gem.format.decimals)),
    [ilkInfo.gem.format.decimals],
  );

  const onMint = useCallback(
    (amount: FixedNumber, daiAmount: FixedNumber) =>
      mint(amount, daiAmount).finally(() => {
        setAmountText('');
        setDaiAmountText('');
      }),
    [mint],
  );

  const onDaiAmountChange = useCallback(
    (value: string) => setDaiAmountText(cutDecimals(pickNumbers(value), UnitFormats.WAD.decimals)),
    [],
  );

  const current: CurrentVaultStatus | undefined = useMemo(() => {
    const collateralAmount = toFixedNumberOrUndefined(amountText, ilkInfo.gem.format);
    const daiAmount = toFixedNumberOrUndefined(daiAmountText, UnitFormats.WAD);

    const format = UnitFormats.RAD;
    if (daiAmount && collateralAmount) {
      const currentCollateralAmount = urnStatus.lockedBalance.addUnsafe(collateralAmount);
      const currentUrnDebt = Vault.getDebt(urnStatus.debt, ilkStatus.debtMultiplier, daiAmount);

      const collateralizationRatio = Vault.getCollateralizationRatio(
        currentCollateralAmount,
        currentUrnDebt.toFormat(format).divUnsafe(ilkStatus.debtMultiplier.toFormat(format)),
        liquidationRatio,
        ilkStatus,
      );
      const liquidationPrice = Vault.getLiquidationPrice(
        currentCollateralAmount,
        currentUrnDebt.toFormat(format).divUnsafe(ilkStatus.debtMultiplier.toFormat(format)),
        ilkStatus.debtMultiplier,
        liquidationRatio,
      );

      return {
        collateralizationRatio: {
          value: collateralizationRatio,
          isValid: MintFormValidation.isBelowLiquidationRatio(
            daiAmount,
            urnStatus.debt,
            urnStatus.lockedBalance,
            collateralAmount,
            ilkStatus,
          ),
        },
        collateralAmount: { value: currentCollateralAmount, isValid: false },
        debt: {
          value: currentUrnDebt,
          isValid:
            MintFormValidation.isAboveDebtCeiling(daiAmount, ilkStatus) ||
            MintFormValidation.isBelowDebtFloor(daiAmount, urnStatus.debt, ilkStatus),
        },
        liquidationPrice: {
          value: liquidationPrice,
          isValid: liquidationPrice.isNegative(),
        },
      };
    }
  }, [amountText, daiAmountText, ilkInfo.gem.format, ilkStatus, liquidationRatio, urnStatus.debt, urnStatus.lockedBalance]);

  const mintForm: ReactNode = useMemo(
    () => (
      <MintForm
        ilkInfo={ilkInfo}
        ilkStatus={ilkStatus}
        buttonContent={buttonContent}
        loadingText={loadingText}
        onMint={onMint}
        balance={balance}
        submitFormProps={submitFormProps}
        lockedBalance={urnStatus.lockedBalance}
        debt={urnStatus.debt}
        onAmountChange={onAmountChange}
        amountText={amountText}
        daiAmountText={daiAmountText}
        onDaiAmountChange={onDaiAmountChange}
      />
    ),
    [
      amountText,
      balance,
      buttonContent,
      daiAmountText,
      loadingText,
      ilkInfo,
      ilkStatus,
      onAmountChange,
      onDaiAmountChange,
      onMint,
      submitFormProps,
      urnStatus.debt,
      urnStatus.lockedBalance,
    ],
  );
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
      form={mintForm}
    />
  );
};
export default MintFormController;
