import { Button, Card, Grid, InputAdornment, TextField, CircularProgress } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';

import { UnitFormats } from 'contracts/math';

import { cutDecimals, pickNumbers, toFixedNumberOrUndefined } from '../../forms/stringNumber';

import type { FixedNumber } from 'ethers';
import type { ChangeEventHandler, FC, MouseEventHandler, ReactNode } from 'react';


export type WithdrawFormProps = {
  buttonContent: ReactNode;
  onWithdraw: (amount: FixedNumber) => Promise<void>;
};

const WithdrawForm: FC<WithdrawFormProps> = ({ onWithdraw, buttonContent }) => {
  const [amountText, setAmountText] = useState('');
  const formats = UnitFormats.WAD;
  const amount = useMemo(() => toFixedNumberOrUndefined(amountText, formats), [amountText, formats]);
  // input as percentage, return as ratio
  const [withdrawing, setWithdrawing] = useState(false);

  const onAmountChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => setAmountText(cutDecimals(pickNumbers(event.target.value), formats.decimals)),
    [formats],
  );
  const onButtonClick: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    if (!amount) {
      return;
    }

    setWithdrawing(true);
    onWithdraw(amount).finally(() => {
      setWithdrawing(false);
    });
  }, [amount, onWithdraw]);

  return (
    <Card component="form" elevation={0}>
      <Grid container padding={2} spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Amount of DAI to withdraw"
            value={amountText}
            onChange={onAmountChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">DAI</InputAdornment>,
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Button variant="contained" fullWidth disabled={!amount || withdrawing} onClick={onButtonClick}>
            {withdrawing ? <CircularProgress /> : buttonContent}
          </Button>
        </Grid>
      </Grid>
    </Card>
  );
};

export default WithdrawForm;
