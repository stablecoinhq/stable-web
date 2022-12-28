import { Card, CardContent, CardHeader, Grid } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';

import { UnitFormats, CENT, getAnnualFee, getTotalIssued } from 'ethereum/helpers/math';

import BNText from './BNText';

import type IlkType from 'ethereum/IlkType';
import type ChainLogHelper from 'ethereum/contracts/ChainLogHelper';
import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus } from 'ethereum/contracts/VatHelper';
import type { FixedNumber } from 'ethers';
import type { FC } from 'react';

export type IlkStatusCardProps = {
  ilkInfo: IlkInfo;
  ilkStatus: IlkStatus;
  liquidationRatio: FixedNumber;
  stabilityFee: FixedNumber;
};

export async function getIlkStatusProps(chainLog: ChainLogHelper, type: IlkType) {
  const [ilkInfo, ilkStatus, liquidationRatio, stabilityFee] = await Promise.all([
    chainLog.ilkRegistry().then((ilkRegistry) => ilkRegistry.info(type)),
    chainLog.vat().then((vat) => vat.getIlkStatus(type)),
    chainLog.spot().then((spot) => spot.getLiquidationRatio(type)),
    chainLog.jug().then((jug) => jug.getStabilityFee(type)),
  ]);
  return {
    ilkInfo,
    ilkStatus,
    liquidationRatio,
    stabilityFee,
  };
}

const IlkStatusCard: FC<IlkStatusCardProps> = ({ ilkInfo, ilkStatus, liquidationRatio, stabilityFee }) => {
  const { t } = useTranslation('common', { keyPrefix: 'cards.ilk' });
  const { t: units } = useTranslation('common', { keyPrefix: 'units' });

  const totalIssue = useMemo(() => getTotalIssued(ilkStatus), [ilkStatus]);
  const curPrice = useMemo(() => ilkStatus.price.mulUnsafe(liquidationRatio), [ilkStatus.price, liquidationRatio]);
  const annualFee = useMemo(() => getAnnualFee(stabilityFee), [stabilityFee]);

  const liquidationRatioPercent = useMemo(() => liquidationRatio.mulUnsafe(CENT.toFormat(UnitFormats.RAY)), [liquidationRatio]);

  return (
    <Card>
      <CardHeader title={t('title', { ilk: ilkInfo.type.inString })} subheader={ilkInfo.name} />
      <CardContent>
        <Grid container padding={2} spacing={2}>
          <BNText label={t('totalIssue')} value={totalIssue} tooltipText={t('totalIssueDesc')} unit={units('stableToken')} />
          <BNText
            label={t('currentPrice', { collateral: ilkInfo.symbol })}
            value={curPrice}
            tooltipText={t('currentPriceDesc', { collateral: ilkInfo.name })}
            unit={units('jpy')}
          />
          <BNText label={t('liqRatio')} value={liquidationRatioPercent} tooltipText={t('liqRatioDesc')} unit="%" />
          <BNText label={t('annualFee')} value={annualFee} tooltipText={t('annualFeeDesc')} unit="%" />
          <BNText
            label={t('maxLiquidity')}
            value={ilkStatus.debtCeiling}
            tooltipText={t('maxLiquidityDesc', { collateral: ilkInfo.name })}
            unit={units('stableToken')}
          />
          <BNText
            label={t('debtFloor')}
            value={ilkStatus.debtFloor}
            tooltipText={t('debtFloorDesc')}
            unit={units('stableToken')}
          />
        </Grid>
      </CardContent>
    </Card>
  );
};

export default IlkStatusCard;
