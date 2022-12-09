import { useCallback, useMemo, useState } from 'react';

import Vault from 'ethereum/Vault';
import { UnitFormats } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers, toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import BurnForm from 'pages/forms/BurnForm';

import FormLayout from './FormLayout';

import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus, UrnStatus } from 'ethereum/contracts/VatHelper';
import type { CurrentVaultStatus } from 'ethereum/react/cards/VaultStatusCard';
import type { FixedNumber } from 'ethers';
import type { FC } from 'react';

type TabValue = 'mint' | 'burn';

const formats = UnitFormats.RAD;

type BurnFormControllerProps = {
  ilkInfo: IlkInfo;
  ilkStatus: IlkStatus;
  urnStatus: UrnStatus;
  liquidationRatio: FixedNumber;
  balance: FixedNumber;
  lockedBalance: FixedNumber;
  debt: FixedNumber;
  address: string;
  selectedTab: TabValue;
  onSelectTab: (_: unknown, value: TabValue) => void;
  burn: (daiAmount: FixedNumber, colAmount: FixedNumber) => Promise<void>;
};

const BurnFormController: FC<BurnFormControllerProps> = ({
  ilkInfo,
  ilkStatus,
  liquidationRatio,
  balance,
  lockedBalance,
  debt,
  urnStatus,
  address,
  selectedTab,
  onSelectTab,
  burn,
}) => {
  const [daiText, setDaiText] = useState('');
  const [colText, setColText] = useState('');

  const onAmountChange = useCallback(
    (value: string) => setDaiText(cutDecimals(pickNumbers(value), UnitFormats.WAD.decimals)),
    [],
  );
  const onColChange = useCallback((value: string) => setColText(cutDecimals(pickNumbers(value), 0)), []);

  const burnForm = useMemo(
    () => (
      <BurnForm
        ilkInfo={ilkInfo}
        ilkStatus={ilkStatus}
        buttonContent="Burn"
        daiBalance={balance}
        lockedBalance={lockedBalance}
        debt={debt}
        onBurn={burn}
        onAmountChange={onAmountChange}
        onColChange={onColChange}
        daiText={daiText}
        colText={colText}
      />
    ),
    [balance, burn, colText, daiText, debt, ilkInfo, ilkStatus, lockedBalance, onAmountChange, onColChange],
  );

  const current: CurrentVaultStatus | undefined = useMemo(() => {
    const daiAmount = toFixedNumberOrUndefined(daiText, UnitFormats.WAD);
    const collateralAmount = toFixedNumberOrUndefined(colText, ilkInfo.gem.format);
    if (daiAmount && collateralAmount) {
      // Vat.urn.art * Var.urn.rate - daiAmount
      const currentCollateralAmount = urnStatus.lockedBalance.subUnsafe(collateralAmount);
      const currentDebt = Vault.getDebt(urnStatus.debt, ilkStatus.debtMultiplier).subUnsafe(daiAmount);
      const normalizedDebt = urnStatus.debt
        .toFormat(formats)
        .subUnsafe(daiAmount.toFormat(formats).divUnsafe(ilkStatus.debtMultiplier.toFormat(formats)));
      const collateralizationRatio = Vault.getCollateralizationRatio(
        currentCollateralAmount,
        normalizedDebt,
        liquidationRatio,
        ilkStatus,
      );
      return {
        debt: currentDebt,
        collateralizationRatio,
        collateralAmount: currentCollateralAmount,
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
