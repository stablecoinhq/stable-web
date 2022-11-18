import { Card, CardContent, CardHeader, Grid } from '@mui/material';
import { useMemo } from 'react';

import { UnitFormats } from 'contracts/math';
import BNText from 'pages/ilks/[ilk]/BNText';

import type { UrnStatus } from 'contracts/VatHelper';
import type { FixedNumber } from 'ethers';
import type { FC } from 'react';

export type VaultStatusCardProps = {
  urnStatus: UrnStatus;
  debtMultiplier: FixedNumber;
};

const VaultStatusCard: FC<VaultStatusCardProps> = ({ urnStatus, debtMultiplier }) => {
  const debt = useMemo(
    () => urnStatus.debt.toFormat(UnitFormats.RAY).mulUnsafe(debtMultiplier),
    [urnStatus.debt, debtMultiplier],
  );

  return (
    <Card>
      <CardHeader title="Vault Status" subheader={urnStatus.urn} />
      <CardContent>
        <Grid container padding={2} spacing={2}>
          <BNText label="Free Collateral" value={urnStatus.freeBalance} />
          <BNText label="Locked Collateral" value={urnStatus.lockedBalance} />
          <BNText label="Debt" value={debt} />
        </Grid>
      </CardContent>
    </Card>
  );
};

export default VaultStatusCard;
