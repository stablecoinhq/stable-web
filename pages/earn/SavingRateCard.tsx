import { Card, CardContent, CardHeader, Grid } from '@mui/material';

import BNText from 'pages/ilks/[ilk]/BNText';

import type { FixedNumber } from 'ethers';
import type { FC } from 'react';

export type SavingRateCardProps = {
  savingRate: FixedNumber;
};

const SavingRateCard: FC<SavingRateCardProps> = ({ savingRate }) => (
  <Card>
    <CardHeader title="Saving Rate" />
    <CardContent>
      <Grid container padding={2} spacing={2}>
        <BNText label="Saving rate" value={savingRate} tooltipText="Saving rate of the DSR" />
      </Grid>
    </CardContent>
  </Card>
);

export default SavingRateCard;
