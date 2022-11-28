import { Card, CardContent, CardHeader, Grid } from '@mui/material';
import { BigNumber, FixedNumber } from 'ethers';
import { useMemo } from 'react';

import { UnitFormats } from 'ethereum/math';

import BNText from './BNText';

import type { IlkStatus, UrnStatus } from 'ethereum/contracts/VatHelper';
import type { FC } from 'react';

export type VaultStatusCardProps = {
  urnStatus: UrnStatus;
  ilkStatus: IlkStatus;
};

const VaultStatusCard: FC<VaultStatusCardProps> = ({ urnStatus, ilkStatus }) => {
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
      .mulUnsafe(price.toFormat(calcFormat))
      .divUnsafe(urnDebt.toFormat(calcFormat).mulUnsafe(debtMultiplier.toFormat(calcFormat)))
      .mulUnsafe(FixedNumber.fromValue(BigNumber.from(100)).toFormat(calcFormat));
  }, [ilkStatus, lockedBalance, urnDebt]);

  return (
    <Card>
      <CardHeader title="Vault Status" subheader={urn} />
      <CardContent>
        <Grid container padding={2} spacing={2}>
          <BNText
            label="Free Collateral"
            value={freeBalance}
            tooltipText="Amount of tokens that is currently being locked in Vault but not used as collateral."
          />
          <BNText
            label="Locked Collateral"
            value={lockedBalance}
            tooltipText="Total amount of collateral that is locked in this vault"
          />
          <BNText label="Debt" value={debt} tooltipText="Total amount of debt that this Vault owes." />
          <BNText label="Collateralization Ratio" value={collateralizationRatio} tooltipText="Collatelization ratio" />
        </Grid>
      </CardContent>
    </Card>
  );
};

export default VaultStatusCard;
