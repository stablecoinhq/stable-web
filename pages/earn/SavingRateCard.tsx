import { Card, CardContent, CardHeader, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';

import BNText from 'ethereum/react/cards/BNText';

import type { FixedNumber } from 'ethers';
import type { FC } from 'react';

export type SavingRateCardProps = {
  annualRate: FixedNumber;
};

const SavingRateCard: FC<SavingRateCardProps> = ({ annualRate }) => {
  const { t } = useTranslation('common', { keyPrefix: 'cards.savings' });
  return (
    <Card>
      <CardHeader title={t('title')} />
      <CardContent>
        <Grid container padding={2} spacing={2}>
          <BNText label={t('annualSavingRate')} value={annualRate} tooltipText={t('annualSavingRateDesc')} unit="%" />
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SavingRateCard;
