import { Card, CardContent, CardHeader, Grid } from '@mui/material';

import BNText from 'ethereum/react/cards/BNText';

import type { FixedNumber } from 'ethers';
import type { FC, ReactNode } from 'react';

export type WalletStatusCardProps = {
  label: string;
  balance: FixedNumber;
  address: string;
  title: string;
  unit: string;
  tooltipText: NonNullable<ReactNode>;
};

const BalanceStatusCard: FC<WalletStatusCardProps> = ({ title, label, balance, address, tooltipText, unit }) => (
  <Card>
    <CardHeader title={title} subheader={address} />
    <CardContent>
      <Grid container padding={2} spacing={2}>
        <BNText label={label} value={balance} tooltipText={tooltipText} unit={unit} />
      </Grid>
    </CardContent>
  </Card>
);

export default BalanceStatusCard;
