import { Grid, TextField, Tooltip } from '@mui/material';

import type { FixedNumber } from 'ethers';
import type { FC, ReactNode } from 'react';

export type BNTextProps = {
  label: ReactNode;
  value: FixedNumber;
  tooltipText?: ReactNode;
};

const BNText: FC<BNTextProps> = ({ label, value, tooltipText }) => {
  const content = (
    <Grid item xs={6}>
      <TextField variant="standard" fullWidth label={label} value={value.toString()} inputProps={{ disabled: true }} />
    </Grid>
  );

  if (tooltipText) {
    return (
      <Tooltip title={tooltipText} arrow>
        {content}
      </Tooltip>
    );
  }

  return content;
};

export default BNText;
