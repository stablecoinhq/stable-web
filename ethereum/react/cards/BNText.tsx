import { Grid, TextField, Tooltip } from '@mui/material';

import type { FixedNumber } from 'ethers';
import type { FC, ReactNode } from 'react';

export type BNTextProps = {
  label: ReactNode;
  value: FixedNumber;
  tooltipText: NonNullable<ReactNode>;
};

const BNText: FC<BNTextProps> = ({ label, value, tooltipText: helperText }) => (
  <Tooltip title={helperText} arrow>
    <Grid item xs={6}>
      <TextField variant="standard" fullWidth label={label} value={value.toString()} inputProps={{ disabled: true }} />
    </Grid>
  </Tooltip>
);

export default BNText;
