import { Tab, Tabs } from '@mui/material';
import { useTranslation } from 'react-i18next';

import VaultStatusCard from 'ethereum/react/cards/VaultStatusCard';
import WalletStatusCard from 'ethereum/react/cards/WalletStatusCard';

import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus, UrnStatus } from 'ethereum/contracts/VatHelper';
import type { CurrentVaultStatus } from 'ethereum/react/cards/VaultStatusCard';
import type { FixedNumber } from 'ethers';
import type { FC, ReactNode } from 'react';

export type TabValue = 'mint' | 'burn';

type FormLayoutProps = {
  ilkInfo: IlkInfo;
  ilkStatus: IlkStatus;
  urnStatus: UrnStatus;
  liquidationRatio: FixedNumber;
  balance: FixedNumber;
  address: string;
  selectedTab: TabValue;
  onSelectTab: (_: unknown, value: TabValue) => void;
  current?: CurrentVaultStatus;
  form: ReactNode;
};

const FormLayout: FC<FormLayoutProps> = ({
  ilkInfo,
  ilkStatus,
  liquidationRatio,
  balance,
  urnStatus,
  selectedTab,
  onSelectTab,
  address,
  form,
  current,
}) => {
  const { t: terms } = useTranslation('common', { keyPrefix: 'terms' });
  const { t } = useTranslation('common', { keyPrefix: 'cards.wallet' });

  return (
    <>
      <WalletStatusCard
        label={t('balance', { gem: ilkInfo.symbol })}
        balance={balance}
        unit={ilkInfo.symbol}
        address={address}
      />
      <VaultStatusCard
        urnStatus={urnStatus}
        ilkStatus={ilkStatus}
        liquidationRatio={liquidationRatio}
        ilkInfo={ilkInfo}
        current={current}
      />
      <Tabs variant="fullWidth" value={selectedTab} onChange={onSelectTab}>
        <Tab label={terms('mint')} value="mint" />
        <Tab label={terms('burn')} value="burn" />
      </Tabs>
      {form}
    </>
  );
};

export default FormLayout;
