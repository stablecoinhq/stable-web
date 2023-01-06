import { Grid, InputAdornment, TextField, Tooltip } from '@mui/material';

import HelperText from 'component/HelperText';
import { useNumericDisplayContext } from 'store/NumericDisplayProvider';

import type { FixedNumber } from 'ethers';
import type { FC, ReactNode } from 'react';

export type BNTextProps = {
  label: ReactNode;
  value: FixedNumber;
  unit: string;
  noCommas?: boolean;
  tooltipText?: ReactNode;
  helperText?: ReactNode;
  error?: boolean;
};

const BNText: FC<BNTextProps> = ({ label, value, tooltipText, unit, helperText, error, noCommas }) => {
  const { format } = useNumericDisplayContext();

  const content = (
    <Grid item xs={12} md={6}>
      <TextField
        error={error}
        variant="standard"
        fullWidth
        label={label}
        value={format(value, noCommas)}
        inputProps={{ disabled: true }}
        InputProps={{ endAdornment: <InputAdornment position="end">{unit}</InputAdornment> }}
        helperText={<HelperText>{helperText}</HelperText>}
      />
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
