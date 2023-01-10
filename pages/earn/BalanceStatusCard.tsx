import { CardHeader, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';

import BnHelperText from 'component/BnHelperText';
import BNText from 'ethereum/react/cards/BNText';

import type { ValidValue } from 'ethereum/helpers/ValidValue';
import type { FixedNumber } from 'ethers';
import type { FC, ReactNode } from 'react';

export type CurrentBalanceStatus = {
  depositAmount: ValidValue;
};

export type BalanceStatusCardProps = {
  label: string;
  balance: FixedNumber;
  address: string;
  title: string;
  unit: string;
  tooltipText: NonNullable<ReactNode>;
  current?: CurrentBalanceStatus;
};

const BalanceStatusCard: FC<BalanceStatusCardProps> = ({ title, label, balance, address, tooltipText, unit, current }) => {
  const { t: units } = useTranslation('common', { keyPrefix: 'units' });

  return (
    <>
      <CardHeader title={title} subheader={address} />
      <Grid container padding={2} spacing={2}>
        <BNText
          label={label}
          value={balance}
          tooltipText={tooltipText}
          unit={unit}
          helperText={<BnHelperText num={current?.depositAmount.value} unit={units('stableToken')} />}
          error={current?.depositAmount.isInvalid}
        />
      </Grid>
    </>
  );
};

export default BalanceStatusCard;
