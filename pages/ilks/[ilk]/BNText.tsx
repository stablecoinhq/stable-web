import { Grid, TextField } from '@mui/material';

import type { FixedNumber } from 'ethers';
import type { FC, ReactNode } from 'react';

export type BNTextProps = {
  label: ReactNode;
  value: FixedNumber;
};

const BNText: FC<BNTextProps> = ({ label, value }) => (
  <Grid item xs={6}>
    <TextField variant="standard" fullWidth label={label} value={value.toString()} inputProps={{ disabled: true }} />
  </Grid>
);

export default BNText;
