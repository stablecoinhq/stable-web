import { Card, CardContent, CardHeader, Grid } from '@mui/material';

import BNText from './BNText';

import type { FixedNumber } from 'ethers';
import type { FC } from 'react';

export type WalletStatusCardProps = {
  label: string;
  balance: FixedNumber;
  address: string;
};

// 共通コンポーネントなので移動させた方がいいかも？
const WalletStatusCard: FC<WalletStatusCardProps> = ({ label, balance, address }) => (
  <Card>
    <CardHeader title="Wallet Status" subheader={address} />
    <CardContent>
      <Grid container padding={2} spacing={2}>
        <BNText label={label} value={balance} tooltipText="Total amount of token that wallet currently holds" />
      </Grid>
    </CardContent>
  </Card>
);

export default WalletStatusCard;
