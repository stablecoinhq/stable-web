import { Card, CardContent, CardHeader, Grid } from '@mui/material';
import { useCallback, useMemo } from 'react';

import { pow, UnitFormats } from 'contracts/math';
import usePromiseFactory from 'pages/usePromiseFactory';

import BNText from './BNText';

import type ChainLogHelper from 'contracts/ChainLogHelper';
import type { IlkInfo } from 'contracts/IlkRegistryHelper';
import type IlkType from 'contracts/IlkType';
import type { IlkStatus } from 'contracts/VatHelper';
import type { FixedNumber } from 'ethers';
import type { FC } from 'react';

export const YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

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
  const totalIssue = useMemo(
    () => ilkStatus.normalizedDebt.toFormat(UnitFormats.RAY).mulUnsafe(ilkStatus.debtMultiplier),
    [ilkStatus.debtMultiplier, ilkStatus.normalizedDebt],
  );
  const curPrice = useMemo(() => ilkStatus.price.mulUnsafe(liquidationRatio), [ilkStatus.price, liquidationRatio]);
  const annualFee = useMemo(() => pow(stabilityFee, YEAR_IN_SECONDS), [stabilityFee]);

  return (
    <Card>
      <CardHeader title={`${ilkInfo.type.inString} Collateral Status`} subheader={ilkInfo.name} />
      <CardContent>
        <Grid container padding={2} spacing={2}>
          <BNText label="Total Issue" value={totalIssue} />
          <BNText label="Current Price" value={curPrice} />
          <BNText label="Liquidation Ratio" value={liquidationRatio} />
          <BNText label="Annual Fee" value={annualFee} />
          <BNText label="Maximum Liquidity" value={ilkStatus.debtCeiling} />
          <BNText label="Debt Floor" value={ilkStatus.debtFloor} />
        </Grid>
      </CardContent>
    </Card>
  );
};

export default IlkStatusCard;
