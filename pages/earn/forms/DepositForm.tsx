import { Button, Card, Grid, InputAdornment, TextField, CircularProgress } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';

import { UnitFormats } from 'contracts/math';

import { cutDecimals, pickNumbers, toFixedNumberOrUndefined } from '../../forms/stringNumber';

import type { FixedNumber } from 'ethers';
import type { ChangeEventHandler, FC, MouseEventHandler, ReactNode } from 'react';

export type DepositFormProps = {
  buttonContent: ReactNode;
  onDeposit: (amount: FixedNumber) => Promise<void>;
};

const DepositForm: FC<DepositFormProps> = ({ onDeposit, buttonContent }) => {
  const [amountText, setAmountText] = useState('');
  const formats = UnitFormats.WAD;
  const amount = useMemo(() => toFixedNumberOrUndefined(amountText, formats), [amountText, formats]);
  // input as percentage, return as ratio
  const [depositing, setDepositing] = useState(false);

  const onAmountChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => setAmountText(cutDecimals(pickNumbers(event.target.value), formats.decimals)),
    [formats],
  );
  const onButtonClick: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    if (!amount) {
      return;
    }

    setDepositing(true);
    onDeposit(amount).finally(() => {
      setDepositing(false);
    });
  }, [amount, onDeposit]);

  return (
    <Card component="form" elevation={0}>
      <Grid container padding={2} spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Amount of DAI to deposit"
            value={amountText}
            onChange={onAmountChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">DAI</InputAdornment>,
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Button variant="contained" fullWidth disabled={!amount || depositing} onClick={onButtonClick}>
            {depositing ? <CircularProgress /> : buttonContent}
          </Button>
        </Grid>
      </Grid>
    </Card>
  );
};

export default DepositForm;
