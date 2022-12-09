import { FixedFormat } from '@ethersproject/bignumber';
import { useCallback, useMemo, useState } from 'react';

import Vault from 'ethereum/Vault';
import { CENT, COL_RATIO_FORMAT, UnitFormats } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers, toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import MintForm from 'pages/forms/MintForm';
import { MintFormValidation } from 'pages/forms/MintFormValidation';

import FormLayout from './FormLayout';

import type { TabValue } from './FormLayout';
import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus, UrnStatus } from 'ethereum/contracts/VatHelper';
import type { CurrentVaultStatus } from 'ethereum/react/cards/VaultStatusCard';
import type { FixedNumber } from 'ethers';
import type { FC, ReactNode } from 'react';

type MintFormControllerProps = {
  ilkInfo: IlkInfo;
  ilkStatus: IlkStatus;
  urnStatus: UrnStatus;
  liquidationRatio: FixedNumber;
  balance: FixedNumber;
  lockedBalance: FixedNumber;
  debt: FixedNumber;
  address: string;
  buttonContent: string;
  selectedTab: TabValue;
  onSelectTab: (_: unknown, value: TabValue) => void;
  mint: (amount: FixedNumber, ratio: FixedNumber) => Promise<void>;
};

const MintFormController: FC<MintFormControllerProps> = ({
  ilkInfo,
  ilkStatus,
  liquidationRatio,
  balance,
  lockedBalance,
  debt,
  urnStatus,
  selectedTab,
  onSelectTab,
  mint,
  address,
  buttonContent,
}) => {
  const [amountText, setAmountText] = useState('');
  const [ratioText, setRatioText] = useState(() => {
    const initialRatio = liquidationRatio
      .toFormat(COL_RATIO_FORMAT)
      .mulUnsafe(CENT.toFormat(COL_RATIO_FORMAT))
      .toFormat(FixedFormat.from(0));
    return initialRatio.toString();
  });

  const onAmountChange = useCallback(
    (value: string) => setAmountText(cutDecimals(pickNumbers(value), ilkInfo.gem.format.decimals)),
    [ilkInfo.gem.format.decimals],
  );
  const onRatioChange = useCallback((value: string) => setRatioText(cutDecimals(pickNumbers(value), 0)), []);

  const current: CurrentVaultStatus | undefined = useMemo(() => {
    const ratio = toFixedNumberOrUndefined(ratioText, COL_RATIO_FORMAT)?.divUnsafe(CENT.toFormat(COL_RATIO_FORMAT));
    const collateralAmount = toFixedNumberOrUndefined(amountText, ilkInfo.gem.format);
    const format = UnitFormats.RAD;
    if (ratio && collateralAmount) {
      const daiAmount = Vault.getDaiAmount(collateralAmount, ratio, liquidationRatio, ilkStatus.price);
      const currentCollateralAmount = urnStatus.lockedBalance.addUnsafe(collateralAmount);
      const currentUrnDebt = Vault.getDebt(urnStatus.debt, ilkStatus.debtMultiplier, daiAmount);

      const collateralizationRatio = Vault.getCollateralizationRatio(
        currentCollateralAmount,
        currentUrnDebt.toFormat(format).divUnsafe(ilkStatus.debtMultiplier.toFormat(format)),
        liquidationRatio,
        ilkStatus,
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
      };
    }
  }, [amountText, ilkInfo.gem.format, ilkStatus, liquidationRatio, ratioText, urnStatus.debt, urnStatus.lockedBalance]);

  const mintForm: ReactNode = useMemo(
    () => (
      <MintForm
        ilkInfo={ilkInfo}
        ilkStatus={ilkStatus}
        buttonContent={buttonContent}
        onMint={mint}
        liquidationRatio={liquidationRatio}
        balance={balance}
        lockedBalance={lockedBalance}
        debt={debt}
        onAmountChange={onAmountChange}
        onRatioChange={onRatioChange}
        amountText={amountText}
        ratioText={ratioText}
      />
    ),
    [
      amountText,
      balance,
      buttonContent,
      debt,
      ilkInfo,
      ilkStatus,
      liquidationRatio,
      lockedBalance,
      mint,
      onAmountChange,
      onRatioChange,
      ratioText,
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
