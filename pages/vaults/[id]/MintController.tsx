import { FixedFormat } from '@ethersproject/bignumber';
import { useCallback, useMemo, useState } from 'react';

import { CENT, COL_RATIO_FORMAT } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers } from 'ethereum/helpers/stringNumber';
import MintForm from 'pages/forms/MintForm';

import ControllerLayout from './ControllerLayout';

import type { TabValue } from './ControllerTypes';
import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus, UrnStatus } from 'ethereum/contracts/VatHelper';
import type { FixedNumber } from 'ethers';
import type { FC, ReactNode } from 'react';

type MintControllerProps = {
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

const MintController: FC<MintControllerProps> = ({
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
    <ControllerLayout
      ilkInfo={ilkInfo}
      ilkStatus={ilkStatus}
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
export default MintController;
