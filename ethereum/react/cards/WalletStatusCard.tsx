import { CardHeader, Grid } from '@mui/material';
import { useTranslation } from 'next-i18next';

import BNText from './BNText';

import type { FixedNumber } from 'ethers';
import type { FC } from 'react';

export type WalletStatusCardProps = {
  label: string;
  balance: FixedNumber;
  address: string;
  unit: string;
};

const WalletStatusCard: FC<WalletStatusCardProps> = ({ label, balance, address, unit }) => {
  const { t } = useTranslation('common', { keyPrefix: 'cards.wallet' });

  return (
    <>
      <CardHeader title={t('title')} subheader={address} />
      <Grid container padding={2} spacing={2}>
        <BNText label={label} value={balance} unit={unit} />
      </Grid>
    </>
  );
};

export default WalletStatusCard;
