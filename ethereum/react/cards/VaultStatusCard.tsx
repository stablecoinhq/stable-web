import { Card, CardContent, CardHeader, Grid } from '@mui/material';
import { BigNumber, FixedNumber } from 'ethers';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';

import { UnitFormats } from 'ethereum/helpers/math';

import BNText from './BNText';

import type { IlkStatus, UrnStatus } from 'ethereum/contracts/VatHelper';
import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { FC } from 'react';

export type VaultStatusCardProps = {
  urnStatus: UrnStatus;
  ilkStatus: IlkStatus;
  ilkInfo: IlkInfo;
  liquidationRatio: FixedNumber;
};

const VaultStatusCard: FC<VaultStatusCardProps> = ({ urnStatus, ilkStatus, liquidationRatio, ilkInfo }) => {
  const { t } = useTranslation('common', { keyPrefix: 'cards.vault' });
  const debt = useMemo(
    () => urnStatus.debt.toFormat(UnitFormats.RAY).mulUnsafe(ilkStatus.debtMultiplier),
    [urnStatus.debt, ilkStatus.debtMultiplier],
  );
  const { urn, freeBalance, lockedBalance, debt: urnDebt } = urnStatus;
  // Collateralization Ratio = Vat.urn.ink * Vat.ilk.spot * Spot.ilk.mat / (Vat.urn.art * Vat.ilk.rate)
  const collateralizationRatio = useMemo(() => {
    const { debtMultiplier, price } = ilkStatus;
    const calcFormat = UnitFormats.RAY;
    if (urnDebt.isZero() || debtMultiplier.isZero()) {
      return FixedNumber.fromString('0', calcFormat);
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
          <BNText label={t('freeCollateral')} value={freeBalance} tooltipText={t('freeCollateralDesc')} unit={ilkInfo.symbol} />
          <BNText label={t('lockedCollateral')} value={lockedBalance} tooltipText={t('lockedCollateralDesc')} unit={ilkInfo.symbol} />
          <BNText label={t('debt')} value={debt} tooltipText={t('debtDesc')} unit="DAI" />
          <BNText label={t('colRatio')} value={collateralizationRatio} unit="%" />
        </Grid>
      </CardContent>
    </Card>
  );
};

export default VaultStatusCard;
