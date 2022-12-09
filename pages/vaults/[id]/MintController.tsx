import { FixedFormat } from '@ethersproject/bignumber';
import { Tab, Tabs } from '@mui/material';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CENT, COL_RATIO_FORMAT } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers } from 'ethereum/helpers/stringNumber';
import VaultStatusCard from 'ethereum/react/cards/VaultStatusCard';
import WalletStatusCard from 'ethereum/react/cards/WalletStatusCard';
import MintForm from 'pages/forms/MintForm';

import type { TabValue } from './ControllerTypes';
import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus, UrnStatus } from 'ethereum/contracts/VatHelper';
import type { FixedNumber } from 'ethers';
import type { FC } from 'react';

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
  selectedTab?: TabValue;
  onSelectTab?: (_: unknown, value: TabValue) => void;
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
  const { t: terms } = useTranslation('common', { keyPrefix: 'terms' });
  const { t } = useTranslation('common', { keyPrefix: 'cards.wallet' });

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

  return (
    <>
      <VaultStatusCard urnStatus={urnStatus} ilkStatus={ilkStatus} liquidationRatio={liquidationRatio} ilkInfo={ilkInfo} />
      <WalletStatusCard
        label={t('balance', { gem: ilkInfo.symbol })}
        balance={balance}
        unit={ilkInfo.symbol}
        address={address}
      />
      {selectedTab && onSelectTab && (
        <Tabs variant="fullWidth" value={selectedTab} onChange={onSelectTab}>
          <Tab label={terms('mint')} value="mint" />
          <Tab label={terms('burn')} value="burn" />
        </Tabs>
      )}
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
    </>
  );
};
export default MintController;
