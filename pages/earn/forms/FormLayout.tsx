import { Tab, Tabs } from '@mui/material';
import { useTranslation } from 'react-i18next';

import BalanceStatusCard from '../BalanceStatusCard';

import type { FixedNumber } from 'ethers';
import type { FC, ReactNode } from 'react';

export type TabValue = 'deposit' | 'withdraw';

type FormLayoutProps = {
  proxyAddress: string | undefined;
  depositAmount: FixedNumber | undefined;
  selectedTab: TabValue;
  onSelectTab: (_: unknown, value: TabValue) => void;
  form: ReactNode;
};

const FormLayout: FC<FormLayoutProps> = ({ proxyAddress, depositAmount, selectedTab, onSelectTab, form }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.earn' });
  const { t: units } = useTranslation('common', { keyPrefix: 'units' });

  return (
    <>
      {depositAmount && proxyAddress && (
        <BalanceStatusCard
          title={t('deposit.title')}
          address={proxyAddress}
          balance={depositAmount}
          label={t('deposit.label')}
          tooltipText={t('deposit.description')!}
          unit={units('stableToken')}
        />
      )}
      <Tabs variant="fullWidth" value={selectedTab} onChange={onSelectTab}>
        <Tab label={t('depositTab')} value="deposit" />
        <Tab label={t('withdrawTab')} value="withdraw" />
      </Tabs>
      {form}
    </>
  );
};

export default FormLayout;
