import { Card, CardContent, CardHeader, Grid } from '@mui/material';
import { FixedNumber } from 'ethers';
import { useTranslation } from 'next-i18next';
import { useCallback, useMemo } from 'react';

import { pow, UnitFormats, INT_FORMAT, YEAR_IN_SECONDS, CENT } from 'ethereum/helpers/math';
import usePromiseFactory from 'pages/usePromiseFactory';

import BNText from './BNText';

import type IlkType from 'ethereum/IlkType';
import type ChainLogHelper from 'ethereum/contracts/ChainLogHelper';
import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus } from 'ethereum/contracts/VatHelper';
import type { FC } from 'react';

export type IlkStatusCardProps = {
  ilkInfo: IlkInfo;
  ilkStatus: IlkStatus;
  liquidationRatio: FixedNumber;
  stabilityFee: FixedNumber;
};

export const useIlkStatusCardProps = (chainLog: ChainLogHelper, type: IlkType): IlkStatusCardProps | undefined =>
  usePromiseFactory(
    useCallback(
      () =>
        Promise.all([
          chainLog.ilkRegistry().then((ilkRegistry) => ilkRegistry.info(type)),
          chainLog.vat().then((vat) => vat.getIlkStatus(type)),
          chainLog.spot().then((spot) => spot.getLiquidationRatio(type)),
          chainLog.jug().then((jug) => jug.getStabilityFee(type)),
        ]).then(([ilkInfo, ilkStatus, liquidationRatio, stabilityFee]) => ({
          ilkInfo,
          ilkStatus,
          liquidationRatio,
          stabilityFee,
        })),
      [chainLog, type],
    ),
  )[0];

const IlkStatusCard: FC<IlkStatusCardProps> = ({ ilkInfo, ilkStatus, liquidationRatio, stabilityFee }) => {
  const { t } = useTranslation('common', { keyPrefix: 'cards.ilk' });
  const totalIssue = useMemo(
    () => ilkStatus.normalizedDebt.toFormat(UnitFormats.RAY).mulUnsafe(ilkStatus.debtMultiplier),
    [ilkStatus.debtMultiplier, ilkStatus.normalizedDebt],
  );
  const curPrice = useMemo(() => ilkStatus.price.mulUnsafe(liquidationRatio), [ilkStatus.price, liquidationRatio]);
  const annualFee = useMemo(
    () =>
      pow(stabilityFee, YEAR_IN_SECONDS)
        .subUnsafe(FixedNumber.fromString('1', INT_FORMAT).toFormat(UnitFormats.RAY))
        .mulUnsafe(CENT),
    [stabilityFee],
  );

  const liquidationRatioPercent = useMemo(() => liquidationRatio.mulUnsafe(CENT), [liquidationRatio]);

  return (
    <Card>
      <CardHeader title={t('title', { ilk: ilkInfo.type.inString })} subheader={ilkInfo.name} />
      <CardContent>
        <Grid container padding={2} spacing={2}>
          <BNText label={t('totalIssue')} value={totalIssue} tooltipText={t('totalIssueDesc')} unit="DAI" />
          <BNText
            label={t('currentPrice')}
            value={curPrice}
            tooltipText={t('currentPriceDesc', { collateral: ilkInfo.name })}
            unit="DAI"
          />
          <BNText label={t('liqRatio')} value={liquidationRatioPercent} tooltipText={t('liqRatioDesc')} unit="%" />
          <BNText label={t('annualFee')} value={annualFee} tooltipText={t('annualFeeDesc')} unit="%" />
          <BNText label={t('maxLiquidity')} value={ilkStatus.debtCeiling} tooltipText={t('maxLiquidityDesc')} unit="DAI" />
          <BNText label={t('debtFloor')} value={ilkStatus.debtFloor} tooltipText={t('debtFloorDesc')} unit="DAI" />
        </Grid>
      </CardContent>
    </Card>
  );
};

export default IlkStatusCard;
