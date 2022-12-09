import { useCallback, useMemo, useState } from 'react';

import { UnitFormats } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers } from 'ethereum/helpers/stringNumber';
import BurnForm from 'pages/forms/BurnForm';

import FormLayout from './FormLayout';

import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus, UrnStatus } from 'ethereum/contracts/VatHelper';
import type { FixedNumber } from 'ethers';
import type { FC } from 'react';

type TabValue = 'mint' | 'burn';

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
  return (
    <FormLayout
      ilkInfo={ilkInfo}
      ilkStatus={ilkStatus}
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
