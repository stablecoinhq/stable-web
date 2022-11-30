import { Card, CardContent, CardHeader, Grid } from '@mui/material';
import { useTranslation } from 'next-i18next';

import BNText from 'pages/ilks/[ilk]/BNText';

import type { FixedNumber } from 'ethers';
import type { FC } from 'react';

export type WalletStatusCardProps = {
  label: string;
  balance: FixedNumber;
  address: string;
};

// 共通コンポーネントなので移動させた方がいいかも？
const WalletStatusCard: FC<WalletStatusCardProps> = ({ label, balance, address }) => {
  const { t } = useTranslation('common', { keyPrefix: 'cards.wallet' });

  return (
    <Card>
      <CardHeader title={t('title')} subheader={address} />
      <CardContent>
        <Grid container padding={2} spacing={2}>
          <BNText label={label} value={balance} />
        </Grid>
      </CardContent>
    </Card>
  );
};

export default WalletStatusCard;
