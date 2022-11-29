import { Card, CardContent, CardHeader, Grid } from '@mui/material';
import { BigNumber, FixedNumber } from 'ethers';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';

import { UnitFormats } from 'contracts/math';
import BNText from 'pages/ilks/[ilk]/BNText';

import type { IlkStatus, UrnStatus } from 'contracts/VatHelper';
import type { FC } from 'react';

export type VaultStatusCardProps = {
  urnStatus: UrnStatus;
  ilkStatus: IlkStatus;
  liquidationRatio: FixedNumber;
};

const VaultStatusCard: FC<VaultStatusCardProps> = ({ urnStatus, ilkStatus, liquidationRatio }) => {
  const { t } = useTranslation('common', { keyPrefix: 'cards.vault' });
  const debt = useMemo(
    () => urnStatus.debt.toFormat(UnitFormats.RAY).mulUnsafe(ilkStatus.debtMultiplier),
    [urnStatus.debt, ilkStatus.debtMultiplier],
  );
  const { urn, freeBalance, lockedBalance, debt: urnDebt } = urnStatus;
  // collateralizationRatio = (ink * spot) / (art * rate)
  const collateralizationRatio = useMemo(() => {
    const { debtMultiplier, price } = ilkStatus;
    const calcFormat = UnitFormats.RAY;
    if (urnDebt.isZero() || debtMultiplier.isZero()) {
      return FixedNumber.fromValue(BigNumber.from(0));
    }
    return lockedBalance
      .toFormat(calcFormat)
      .mulUnsafe(liquidationRatio.toFormat(calcFormat))
      .mulUnsafe(price.toFormat(calcFormat))
      .divUnsafe(urnDebt.toFormat(calcFormat).mulUnsafe(debtMultiplier.toFormat(calcFormat)))
      .mulUnsafe(FixedNumber.fromValue(BigNumber.from(100)).toFormat(calcFormat));
  }, [ilkStatus, lockedBalance, urnDebt, liquidationRatio]);

  return (
    <Card>
      <CardHeader title={t('title')} subheader={urn} />
      <CardContent>
        <Grid container padding={2} spacing={2}>
          <BNText label={t('freeCollateral')} value={freeBalance} tooltipText={t('freeCollateralDesc')} />
          <BNText label={t('lockedCollateral')} value={lockedBalance} tooltipText={t('lockedCollateralDesc')} />
          <BNText label={t('debt')} value={debt} tooltipText={t('debtDesc')} />
          <BNText label={t('colRatio')} value={collateralizationRatio} />
        </Grid>
      </CardContent>
    </Card>
  );
};

export default VaultStatusCard;
