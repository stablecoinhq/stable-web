import { Button, Card, Grid, InputAdornment, TextField, CircularProgress, FormHelperText } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { UnitFormats } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers, toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import SubmitForm from 'ethereum/react/form/SubmitForm';

import type { SubmitFormProps } from 'ethereum/react/form/SubmitForm';
import type { FixedNumber } from 'ethers';
import type { ChangeEventHandler, FC, MouseEventHandler } from 'react';

export type DepositFormProps = {
  balance: FixedNumber;
  submitFormProps: SubmitFormProps;
  onDeposit: (amount: FixedNumber) => Promise<void>;
};

const DepositForm: FC<DepositFormProps> = ({ onDeposit, balance, submitFormProps }) => {
  const { t: units } = useTranslation('common', { keyPrefix: 'units' });

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
      setAmountText('');
    });
  }, [amount, onDeposit, isInvalidDepositAmount]);

  const isInvalid = useMemo(
    () => !amount || depositing || isInvalidDepositAmount || false,
    [amount, depositing, isInvalidDepositAmount],
  );

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
              endAdornment: <InputAdornment position="end">{units('stableToken')}</InputAdornment>,
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <SubmitForm
            proxyAddress={submitFormProps.proxyAddress}
            increaseAllowance={submitFormProps.increaseAllowance}
            spendingAmount={amount}
            allowance={submitFormProps.allowance}
            isInvalid={isInvalid}
            createProxy={submitFormProps.createProxy}
          >
            <Button variant="contained" fullWidth disabled={isInvalid} onClick={onButtonClick}>
              {depositing ? <CircularProgress /> : t('submit')}
            </Button>
            {depositing && <FormHelperText>{t('helperText')}</FormHelperText>}
          </SubmitForm>
        </Grid>
        <Grid item xs={12}>
          {isInvalidDepositAmount && <FormHelperText error>{error('insufficientBalance')}</FormHelperText>}
        </Grid>
      </Grid>
    </Card>
  );
};

export default DepositForm;
