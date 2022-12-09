import { Tab, Tabs } from '@mui/material';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { UnitFormats } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers } from 'ethereum/helpers/stringNumber';
import VaultStatusCard from 'ethereum/react/cards/VaultStatusCard';
import WalletStatusCard from 'ethereum/react/cards/WalletStatusCard';
import BurnForm from 'pages/forms/BurnForm';

import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus, UrnStatus } from 'ethereum/contracts/VatHelper';
import type { FixedNumber } from 'ethers';
import type { FC } from 'react';

type TabValue = 'mint' | 'burn';

type BurnControllerProps = {
  ilkInfo: IlkInfo;
  ilkStatus: IlkStatus;
  urnStatus: UrnStatus;
  liquidationRatio: FixedNumber;
  balance: FixedNumber;
  lockedBalance: FixedNumber;
  debt: FixedNumber;
  selectedTab: TabValue;
  address: string;
  onSelectTab: (_: unknown, value: TabValue) => void;
  burn: (daiAmount: FixedNumber, colAmount: FixedNumber) => Promise<void>;
};

const BurnController: FC<BurnControllerProps> = ({
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
  const { t: terms } = useTranslation('common', { keyPrefix: 'terms' });
  const { t } = useTranslation('common', { keyPrefix: 'cards.wallet' });

  const [daiText, setDaiText] = useState('');
  const [colText, setColText] = useState('');

  const onAmountChange = useCallback(
    (value: string) => setDaiText(cutDecimals(pickNumbers(value), UnitFormats.WAD.decimals)),
    [],
  );
  const onColChange = useCallback((value: string) => setColText(cutDecimals(pickNumbers(value), 0)), []);

  return (
    <>
      <VaultStatusCard urnStatus={urnStatus} ilkStatus={ilkStatus} liquidationRatio={liquidationRatio} ilkInfo={ilkInfo} />
      <WalletStatusCard
        label={t('balance', { gem: ilkInfo.symbol })}
        balance={balance}
        unit={ilkInfo.symbol}
        address={address}
      />
      <Tabs variant="fullWidth" value={selectedTab} onChange={onSelectTab}>
        <Tab label={terms('mint')} value="mint" />
        <Tab label={terms('burn')} value="burn" />
      </Tabs>
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
    </>
  );
};
export default BurnController;
