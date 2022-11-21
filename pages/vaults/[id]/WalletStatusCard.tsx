import { Card, CardContent, CardHeader, Grid } from '@mui/material';

import BNText from 'pages/ilks/[ilk]/BNText';

import type { FixedNumber } from 'ethers';
import type { FC } from 'react';

export type WalletStatusCardProps = {
  balance: FixedNumber;
  address: string;
};

// 共通コンポーネントなので移動させた方がいいかも？
const WalletStatusCard: FC<WalletStatusCardProps> = ({ balance, address }) => (
  <Card>
    <CardHeader title="Wallet Status" subheader={address} />
    <CardContent>
      <Grid container padding={2} spacing={2}>
        <BNText label="Balance" value={balance} />
      </Grid>
    </CardContent>
  </Card>
);

export default WalletStatusCard;
