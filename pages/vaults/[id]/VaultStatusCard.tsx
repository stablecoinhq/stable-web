import { Card, CardContent, CardHeader, Grid } from '@mui/material';
import { useMemo } from 'react';

import BNText, { RAD_DECIMAL, WAD_DECIMAL } from 'pages/ilks/[ilk]/BNText';

import type { UrnStatus } from 'contracts/VatHelper';
import type { BigNumber } from 'ethers';
import type { FC } from 'react';

export type VaultStatusCardProps = {
  urnStatus: UrnStatus;
  debtMultiplier: BigNumber;
};

const VaultStatusCard: FC<VaultStatusCardProps> = ({ urnStatus, debtMultiplier }) => {
  const debt = useMemo(() => urnStatus.debt.mul(debtMultiplier), [urnStatus.debt, debtMultiplier]);

  return (
    <Card>
      <CardHeader title="Vault Status" subheader={urnStatus.urn} />
      <CardContent>
        <Grid container padding={2} spacing={2}>
          <BNText label="Free Collateral" value={urnStatus.freeBalance} unit={WAD_DECIMAL} />
          <BNText label="Locked Collateral" value={urnStatus.lockedBalance} unit={WAD_DECIMAL} />
          <BNText label="Debt" value={debt} unit={RAD_DECIMAL} />
        </Grid>
      </CardContent>
    </Card>
  );
};

export default VaultStatusCard;
