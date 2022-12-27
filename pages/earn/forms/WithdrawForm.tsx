import {
  Button,
  Card,
  Grid,
  InputAdornment,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText,
} from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ProgressDialog from 'component/ProgressDialog';
import { UnitFormats } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers, toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import { useErrorDialog } from 'store/ErrorDialogProvider';

import WithdrawFormValidation, { WithdrawError } from './WithdrawFormValidation';

import type { FixedNumber } from 'ethers';
import type { ChangeEventHandler, FC, MouseEventHandler, ReactNode } from 'react';

export type WithdrawFormProps = {
  depositAmount: FixedNumber;
  buttonContent: ReactNode;
  onWithdraw: (amount: FixedNumber) => Promise<void>;
  onWithdrawAll: () => Promise<void>;
  onDialogClose: () => void;
};

type WithdrawState = 'withdraw' | 'withdrawAll' | 'neutral';

const WithdrawForm: FC<WithdrawFormProps> = ({ depositAmount, buttonContent, onWithdraw, onWithdrawAll, onDialogClose }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.earn.withdraw.form' });
  const { t: forms } = useTranslation('common', { keyPrefix: 'forms' });
  const { t: errorMessage } = useTranslation('common', { keyPrefix: 'pages.earn.errors' });
  const { t: error } = useTranslation('common', { keyPrefix: 'pages.earn.withdraw.form.errors' });
  const { openDialog } = useErrorDialog();
  const [dialogText, setDialogText] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [amountText, setAmountText] = useState('');
  const [withdrawState, setWithdrawState] = useState<WithdrawState>('neutral');
  const [withdrawing, setWithdrawing] = useState(false);
  const formats = UnitFormats.WAD;
  const amount = useMemo(() => toFixedNumberOrUndefined(amountText, formats), [amountText, formats]);

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

  const onButtonClick: MouseEventHandler<HTMLButtonElement> = useCallback(async () => {
    const f = async () => {
      setWithdrawing(true);
      setCurrentStep(1);
      setDialogText(t('processing')!);
      switch (withdrawState) {
        case 'withdrawAll':
          await onWithdrawAll();
          break;
        case 'withdraw':
          if (!amount) {
            break;
          }
          await onWithdraw(amount);
          break;
        case 'neutral':
          break;
      }
      setCurrentStep((prev) => prev + 1);
      setDialogText(forms('done')!);
    };
    await f().catch((err) => {
      setWithdrawing(false);
      openDialog(errorMessage('errorWhileWithdraw'), err);
    });
  }, [t, withdrawState, forms, onWithdrawAll, amount, onWithdraw, openDialog, errorMessage]);

  const formErrors: WithdrawError[] = useMemo(() => {
    if (amount) {
      return WithdrawFormValidation.canDeposit(depositAmount, amount);
    }
    return [];
  }, [amount, depositAmount]);

  const showErrorMessage = (e: WithdrawError) => {
    switch (e) {
      case WithdrawError.insufficientBalance:
        return error('insufficientBalance');
      case WithdrawError.invalidAmount:
        return error('invalidAmount');
    }
  };

  return (
    <Card component="form" elevation={0}>
      <ProgressDialog
        open={withdrawing}
        title={buttonContent}
        text={dialogText}
        totalStep={2}
        currentStep={currentStep}
        onClose={() => {
          setWithdrawing(false);
          setAmountText('');
          setWithdrawState('neutral');
          onDialogClose();
        }}
      />
      <Grid container padding={2} spacing={2}>
        <Grid item xs={12} lg={6}>
          <TextField
            fullWidth
            label={t('label')}
            error={formErrors.length !== 0}
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
            disabled={withdrawing || !(withdrawState !== 'neutral') || formErrors.length !== 0}
            onClick={onButtonClick}
          >
            {buttonContent}
          </Button>
        </Grid>
        <Grid item xs={12}>
          {formErrors.map((e) => (
            <FormHelperText key={e} error>
              {showErrorMessage(e)}
            </FormHelperText>
          ))}
        </Grid>
      </Grid>
    </Card>
  );
};

export default WithdrawForm;
