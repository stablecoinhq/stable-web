import { Card, CardContent, CardHeader, Grid } from '@mui/material';

import BNText from 'ethereum/react/cards/BNText';

import type { FixedNumber } from 'ethers';
import type { FC } from 'react';

export type SavingRateCardProps = {
  annualRate: FixedNumber;
};

const SavingRateCard: FC<SavingRateCardProps> = ({ annualRate }) => (
  <Card>
    <CardHeader title="Saving Rate" />
    <CardContent>
      <Grid container padding={2} spacing={2}>
        <BNText label="Annual saving rate" value={annualRate} tooltipText="Annual saving rate of the DSR" unit="%" />
      </Grid>
    </CardContent>
  </Card>
);

export default SavingRateCard;
