import { formatUnits } from '@ethersproject/units';
import { Grid, TextField } from '@mui/material';
import { useMemo } from 'react';

import type { BigNumber } from 'ethers';
import type { FC, ReactNode } from 'react';

export const WAD_DECIMAL = 18;
export const RAY_DECIMAL = 27;
export const RAD_DECIMAL = 45;

export type BNTextProps = {
  label: ReactNode;
  value: BigNumber;
  unit: number;
};

const BNText: FC<BNTextProps> = ({ label, value, unit }) => {
  const str = useMemo(() => formatUnits(value, unit), [unit, value]);

  return (
    <Grid item xs={6}>
      <TextField variant="standard" fullWidth label={label} value={str} />
    </Grid>
  );
};

export default BNText;
