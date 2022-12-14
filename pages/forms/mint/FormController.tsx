import { useCallback, useMemo, useState } from 'react';

import Vault from 'ethereum/Vault';
import { UnitFormats } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers, toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import Form from 'pages/forms/mint/Form';
import { MintFormValidation } from 'pages/forms/mint/Validation';

import FormLayout from '../FormLayout';

import type { TabValue } from '../FormLayout';
import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus, UrnStatus } from 'ethereum/contracts/VatHelper';
import type { CurrentVaultStatus } from 'ethereum/react/cards/VaultStatusCard';
import type { FixedNumber } from 'ethers';
import type { FC, ReactNode } from 'react';

type FormControllerProps = {
  ilkInfo: IlkInfo;
  ilkStatus: IlkStatus;
  urnStatus: UrnStatus;
  liquidationRatio: FixedNumber;
  balance: FixedNumber;
  allowance: FixedNumber;
  proxyAddress: string | undefined;
  increaseAllowance: (address: string, spendingAmount: FixedNumber) => Promise<void>;
  ensureProxy: () => Promise<string>;
  buttonContent: string;
  mintMessage: string;
  errorMessage: string;
  doneMessage: string;
  selectedTab?: TabValue;
  onSelectTab?: (_: unknown, value: TabValue) => void;
  onDialogClose: () => void;
  mint: (colAmount: FixedNumber, daiAmount: FixedNumber) => Promise<void>;
};

const FormController: FC<FormControllerProps> = ({
  ilkInfo,
  ilkStatus,
  liquidationRatio,
  balance,
  allowance,
  proxyAddress,
  increaseAllowance,
  ensureProxy,
  mintMessage,
  urnStatus,
  selectedTab,
  onSelectTab,
  onDialogClose,
  errorMessage,
  mint,
  buttonContent,
  doneMessage,
}) => {
  const [amountText, setAmountText] = useState('');
  const [daiAmountText, setDaiAmountText] = useState('');

  const onAmountChange = useCallback(
    (value: string) => setAmountText(cutDecimals(pickNumbers(value), ilkInfo.gem.format.decimals)),
    [ilkInfo.gem.format.decimals],
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
          isInvalid: MintFormValidation.isBelowLiquidationRatio(
            daiAmount,
            urnStatus.debt,
            urnStatus.lockedBalance,
            collateralAmount,
            ilkStatus,
          ),
        },
        collateralAmount: { value: currentCollateralAmount, isInvalid: false },
        debt: {
          value: currentUrnDebt,
          isInvalid:
            MintFormValidation.isAboveDebtCeiling(daiAmount, ilkStatus) ||
            MintFormValidation.isBelowDebtFloor(daiAmount, urnStatus.debt, ilkStatus),
        },
        liquidationPrice: {
          value: liquidationPrice,
          isInvalid: liquidationPrice.isNegative(),
        },
      };
    }
  }, [amountText, daiAmountText, ilkInfo.gem.format, ilkStatus, liquidationRatio, urnStatus.debt, urnStatus.lockedBalance]);

  const mintForm: ReactNode = useMemo(
    () => (
      <Form
        ilkInfo={ilkInfo}
        ilkStatus={ilkStatus}
        buttonContent={buttonContent}
        mint={mint}
        balance={balance}
        lockedBalance={urnStatus.lockedBalance}
        debt={urnStatus.debt}
        onAmountChange={onAmountChange}
        amountText={amountText}
        daiAmountText={daiAmountText}
        onDaiAmountChange={onDaiAmountChange}
        allowance={allowance}
        proxyAddress={proxyAddress}
        increaseAllowance={increaseAllowance}
        ensureProxy={ensureProxy}
        onDialogClose={() => {
          onDialogClose();
          setAmountText('');
          setDaiAmountText('');
        }}
        mintMessage={mintMessage}
        errorMessage={errorMessage}
        doneMessage={doneMessage}
      />
    ),
    [
      ilkInfo,
      ilkStatus,
      buttonContent,
      mint,
      balance,
      urnStatus.lockedBalance,
      urnStatus.debt,
      onAmountChange,
      amountText,
      daiAmountText,
      onDaiAmountChange,
      allowance,
      proxyAddress,
      increaseAllowance,
      ensureProxy,
      mintMessage,
      errorMessage,
      doneMessage,
      onDialogClose,
    ],
  );
  return (
    <FormLayout
      ilkInfo={ilkInfo}
      ilkStatus={ilkStatus}
      current={current}
      liquidationRatio={liquidationRatio}
      urnStatus={urnStatus}
      selectedTab={selectedTab}
      onSelectTab={onSelectTab}
      form={mintForm}
    />
  );
};
export default FormController;
