import { Button, Card, Grid, InputAdornment, TextField, CircularProgress, FormHelperText } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { UnitFormats } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers, toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';

import type { FixedNumber } from 'ethers';
import type { ChangeEventHandler, FC, MouseEventHandler, ReactNode } from 'react';

export type DepositFormProps = {
  balance: FixedNumber;
  buttonContent: ReactNode;
  onDeposit: (amount: FixedNumber) => Promise<void>;
};

const DepositForm: FC<DepositFormProps> = ({ onDeposit, buttonContent, balance }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.earn.deposit.form' });
  const { t: error } = useTranslation('common', { keyPrefix: 'pages.earn.deposit.form.errors' });

  const [amountText, setAmountText] = useState('');
  const formats = UnitFormats.WAD;
  const amount = useMemo(() => toFixedNumberOrUndefined(amountText, formats), [amountText, formats]);
  const isInvalidDepositAmount = useMemo(() => amount && balance.subUnsafe(amount).isNegative(), [amount, balance]);

  // input as percentage, return as ratio
  const [depositing, setDepositing] = useState(false);

  const onAmountChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => setAmountText(cutDecimals(pickNumbers(event.target.value), formats.decimals)),
    [formats],
  );
  const onButtonClick: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    if (!amount || isInvalidDepositAmount) {
      return;
    }

    setDepositing(true);
    onDeposit(amount).finally(() => {
      setDepositing(false);
    });
  }, [amount, onDeposit, isInvalidDepositAmount]);

  return (
    <Card component="form" elevation={0}>
      <Grid container padding={2} spacing={2}>
        <Grid item xs={12} lg={6}>
          <TextField
            fullWidth
            label={t('label')}
            value={amountText}
            error={isInvalidDepositAmount}
            onChange={onAmountChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">DAI</InputAdornment>,
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            fullWidth
            disabled={!amount || depositing || isInvalidDepositAmount}
            onClick={onButtonClick}
          >
            {depositing ? <CircularProgress /> : buttonContent}
          </Button>
        </Grid>
        <Grid item xs={12}>
          {isInvalidDepositAmount && <FormHelperText error>{error('insufficientBalance')}</FormHelperText>}
        </Grid>
      </Grid>
    </Card>
  );
};

export default DepositForm;
