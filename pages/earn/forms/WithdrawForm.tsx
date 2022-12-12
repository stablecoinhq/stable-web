import {
  Button,
  Card,
  Grid,
  InputAdornment,
  TextField,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText,
} from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { UnitFormats } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers, toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';

import type { FixedNumber } from 'ethers';
import type { ChangeEventHandler, FC, MouseEventHandler, ReactNode } from 'react';

export type WithdrawFormProps = {
  depositAmount: FixedNumber;
  buttonContent: ReactNode;
  onWithdraw: (amount: FixedNumber) => Promise<void>;
  onWithdrawAll: () => Promise<void>;
};

type WithdrawState = 'withdraw' | 'withdrawAll' | 'neutral';

const WithdrawForm: FC<WithdrawFormProps> = ({ depositAmount, buttonContent, onWithdraw, onWithdrawAll }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.earn.withdraw.form' });
  const { t: error } = useTranslation('common', { keyPrefix: 'pages.earn.withdraw.form.errors' });

  const [amountText, setAmountText] = useState('');

  const [withdrawState, setWithdrawState] = useState<WithdrawState>('neutral');

  const formats = UnitFormats.WAD;
  const amount = useMemo(() => toFixedNumberOrUndefined(amountText, formats), [amountText, formats]);
  const isInvalidWithdrawAmount = useMemo(
    () => amount && depositAmount.subUnsafe(amount).isNegative(),
    [amount, depositAmount],
  );
  // input as percentage, return as ratio
  const [withdrawing, setWithdrawing] = useState(false);

  const onAmountChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      setAmountText(cutDecimals(pickNumbers(event.target.value), formats.decimals));
      if (event.target.value === '') {
        setWithdrawState('neutral');
      } else {
        setWithdrawState('withdraw');
      }
    },
    [formats],
  );

  const onWithdrawAllChange: ChangeEventHandler<HTMLInputElement> = () => {
    if (withdrawState !== 'withdrawAll') {
      setWithdrawState('withdrawAll');
      setAmountText(depositAmount.toString());
    } else {
      setWithdrawState('neutral');
      setAmountText('');
    }
  };

  const onButtonClick: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    switch (withdrawState) {
      case 'withdrawAll':
        setWithdrawing(true);
        onWithdrawAll().finally(() => {
          setWithdrawing(false);
        });
        break;
      case 'withdraw':
        if (!amount || isInvalidWithdrawAmount) {
          break;
        }
        setWithdrawing(true);
        onWithdraw(amount).finally(() => {
          setWithdrawing(false);
        });
        break;
      case 'neutral':
        break;
    }
  }, [amount, onWithdraw, onWithdrawAll, withdrawState, isInvalidWithdrawAmount]);

  return (
    <Card component="form" elevation={0}>
      <Grid container padding={2} spacing={2}>
        <Grid item xs={12} lg={6}>
          <TextField
            fullWidth
            label={t('label')}
            error={isInvalidWithdrawAmount}
            value={amountText}
            disabled={withdrawState === 'withdrawAll' || withdrawing}
            onChange={onAmountChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">DAI</InputAdornment>,
            }}
          />
          <FormGroup>
            <FormControlLabel
              disabled={withdrawState === 'withdraw' || withdrawing}
              control={<Checkbox checked={withdrawState === 'withdrawAll'} onChange={onWithdrawAllChange} />}
              label={t('withdrawAll')}
            />
          </FormGroup>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            fullWidth
            disabled={withdrawing || !(withdrawState !== 'neutral') || isInvalidWithdrawAmount}
            onClick={onButtonClick}
          >
            {withdrawing ? <CircularProgress /> : buttonContent}
          </Button>
        </Grid>
        <Grid item xs={12}>
          {isInvalidWithdrawAmount && <FormHelperText error>{error('insufficientWithdrawAmount')}</FormHelperText>}
        </Grid>
      </Grid>
    </Card>
  );
};

export default WithdrawForm;
