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
import { toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import { useErrorDialog } from 'store/ErrorDialogProvider';

import WithdrawFormValidation, { WithdrawError } from './WithdrawFormValidation';

import type { FixedNumber } from 'ethers';
import type { ChangeEventHandler, FC, MouseEventHandler, ReactNode } from 'react';

export type WithdrawFormProps = {
  depositAmount: FixedNumber;
  buttonContent: ReactNode;
  withdraw: (amount: FixedNumber) => Promise<void>;
  withdrawAll: () => Promise<void>;
  onDialogClose: () => void;
  proxyAddress: string | undefined;
  ensureProxy: () => Promise<string>;
  amountText: string;
  onAmountChange: (s: string) => void;
};

type WithdrawState = 'withdraw' | 'withdrawAll' | 'neutral';

const WithdrawForm: FC<WithdrawFormProps> = ({
  depositAmount,
  buttonContent,
  withdraw,
  withdrawAll,
  onDialogClose,
  proxyAddress,
  ensureProxy,
  amountText,
  onAmountChange,
}) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.earn.withdraw.form' });
  const { t: forms } = useTranslation('common', { keyPrefix: 'forms' });

  const { t: error } = useTranslation('common', { keyPrefix: 'pages.earn.withdraw.form.errors' });
  const { openDialog } = useErrorDialog();
  const [dialogText, setDialogText] = useState('');
  const [totalSteps, setTotalSteps] = useState(2);

  const [currentStep, setCurrentStep] = useState(1);
  const [withdrawState, setWithdrawState] = useState<WithdrawState>('neutral');
  const [withdrawing, setWithdrawing] = useState(false);
  const formats = UnitFormats.WAD;
  const amount = useMemo(() => toFixedNumberOrUndefined(amountText, formats), [amountText, formats]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      onAmountChange(event.target.value);
      if (event.target.value === '') {
        setWithdrawState('neutral');
      } else {
        setWithdrawState('withdraw');
      }
    },
    [onAmountChange],
  );

  const onWithdrawAllChange: ChangeEventHandler<HTMLInputElement> = () => {
    if (withdrawState !== 'withdrawAll') {
      setWithdrawState('withdrawAll');
      onAmountChange(depositAmount.toString());
    } else {
      setWithdrawState('neutral');
      onAmountChange('');
    }
  };

  const onButtonClick: MouseEventHandler<HTMLButtonElement> = useCallback(async () => {
    const f = async () => {
      setWithdrawing(true);
      setCurrentStep(1);
      setTotalSteps(() => {
        let steps = 2;
        if (!proxyAddress) {
          steps += 1;
        }
        return steps;
      });

      if (!proxyAddress) {
        setDialogText(forms('createProxy')!);
        await ensureProxy();
        setCurrentStep((prev) => prev + 1);
      }

      setDialogText(t('processing')!);
      switch (withdrawState) {
        case 'withdrawAll':
          await withdrawAll();
          break;
        case 'withdraw':
          if (!amount) {
            break;
          }
          await withdraw(amount);
          break;
        case 'neutral':
          break;
      }
      setCurrentStep((prev) => prev + 1);
      setDialogText(t('done')!);
    };
    await f().catch((err) => {
      setWithdrawing(false);
      openDialog(error('errorWhileWithdraw'), err);
    });
  }, [proxyAddress, t, withdrawState, forms, ensureProxy, withdrawAll, amount, withdraw, openDialog, error]);

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
        totalStep={totalSteps}
        currentStep={currentStep}
        onClose={() => {
          setWithdrawing(false);
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
            onChange={handleChange}
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
