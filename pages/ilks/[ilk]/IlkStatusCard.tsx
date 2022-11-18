import { parseUnits } from '@ethersproject/units';
import { Card, CardContent, CardHeader, Grid } from '@mui/material';
import { useCallback, useMemo } from 'react';

import usePromiseFactory from 'pages/usePromiseFactory';

import BNText, { RAD_DECIMAL, RAY_DECIMAL } from './BNText';

import type ChainLogHelper from 'contracts/ChainLogHelper';
import type { IlkInfo } from 'contracts/IlkRegistryHelper';
import type IlkType from 'contracts/IlkType';
import type { IlkStatus } from 'contracts/VatHelper';
import type { BigNumber } from 'ethers';
import type { FC } from 'react';

export const YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
const RAY = parseUnits('1', RAY_DECIMAL);

/**
 * Calculate pow of `BigNumber` faster than original implementation.
 */
const pow = (base: BigNumber, exp: number, unit: BigNumber) => {
  let result = unit;
  let b = base;

  // eslint-disable-next-line no-bitwise
  for (let tmp = exp; tmp > 0; tmp >>= 1) {
    // eslint-disable-next-line no-bitwise
    if (tmp & 1) {
      result = result.mul(b).div(unit);
    }

    b = b.mul(b).div(unit);
  }

  return result;
};

export type IlkStatusCardProps = {
  ilkInfo: IlkInfo;
  ilkStatus: IlkStatus;
  liquidationRatio: BigNumber;
  stabilityFee: BigNumber;
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
    () => ilkStatus.normalizedDebt.mul(ilkStatus.debtMultiplier),
    [ilkStatus.debtMultiplier, ilkStatus.normalizedDebt],
  );
  const curPrice = useMemo(() => ilkStatus.price.mul(liquidationRatio).div(RAY), [ilkStatus.price, liquidationRatio]);
  const annualFee = useMemo(() => pow(stabilityFee, YEAR_IN_SECONDS, RAY), [stabilityFee]);

  return (
    <Card>
      <CardHeader title={`${ilkInfo.type.inString} Collateral Status`} subheader={ilkInfo.name} />
      <CardContent>
        <Grid container padding={2} spacing={2}>
          <BNText label="Total Issue" value={totalIssue} unit={RAD_DECIMAL} />
          <BNText label="Current Price" value={curPrice} unit={RAY_DECIMAL} />
          <BNText label="Liquidation Ratio" value={liquidationRatio} unit={RAY_DECIMAL} />
          <BNText label="Annual Fee" value={annualFee} unit={RAY_DECIMAL} />
          <BNText label="Maximum Liquidity" value={ilkStatus.debtCeiling} unit={RAD_DECIMAL} />
          <BNText label="Debt Floor" value={ilkStatus.debtFloor} unit={RAD_DECIMAL} />
        </Grid>
      </CardContent>
    </Card>
  );
};

export default IlkStatusCard;
