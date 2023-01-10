import { Button, Card, Grid, InputAdornment, TextField, FormHelperText } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import HelperText from 'component/HelperText';
import ProgressDialog from 'component/ProgressDialog';
import { UnitFormats } from 'ethereum/helpers/math';
import { toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import { useErrorDialog } from 'store/ErrorDialogProvider';
import { useNumericDisplayContext } from 'store/NumericDisplayProvider';

import Validation, { DepositError } from './Validation';

import type { FixedNumber } from 'ethers';
import type { ChangeEventHandler, FC, MouseEventHandler, ReactNode } from 'react';

export type FormProps = {
  balance: FixedNumber;
  buttonContent: ReactNode;
  deposit: (amount: FixedNumber) => Promise<void>;
  proxyAddress: string | undefined;
  increaseAllowance: (address: string, spendingAmount: FixedNumber) => Promise<void>;
  ensureProxy: () => Promise<string>;
  allowance: FixedNumber;
  onDialogClose: () => void;
  amountText: string;
  onAmountChange: (s: string) => void;
};

const Form: FC<FormProps> = ({
  deposit,
  buttonContent,
  balance,
  proxyAddress,
  increaseAllowance,
  ensureProxy,
  allowance,
  onDialogClose,
  amountText,
  onAmountChange,
}) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.earn.deposit.form' });
  const { t: units } = useTranslation('common', { keyPrefix: 'units' });
  const { t: forms } = useTranslation('common', { keyPrefix: 'forms' });
  const { t: error } = useTranslation('common', { keyPrefix: 'pages.earn.deposit.form.errors' });

  const [dialogText, setDialogText] = useState('');
  const [totalSteps, setTotalSteps] = useState(1);
  const [currentStep, setCurrentStep] = useState(1);

  const { openDialog } = useErrorDialog();
  const { format } = useNumericDisplayContext();

  const formats = UnitFormats.WAD;
  const amount = useMemo(() => toFixedNumberOrUndefined(amountText, formats), [amountText, formats]);
  // input as percentage, return as ratio
  const [depositing, setDepositing] = useState(false);

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => onAmountChange(event.target.value),
    [onAmountChange],
  );
  const onButtonClick: MouseEventHandler<HTMLButtonElement> = useCallback(async () => {
    if (!amount) {
      return;
    }
    const f = async () => {
      setDepositing(true);
      const allowanceToIncrease = amount.subUnsafe(allowance);
      setCurrentStep(1);
      setTotalSteps(() => {
        let steps = 2;
        if (!proxyAddress) {
          steps += 1;
        }
        if (!allowanceToIncrease.isNegative() && !allowanceToIncrease.isZero()) {
          steps += 1;
        }
        return steps;
      });
      let proxy = '';
      if (!proxyAddress) {
        setDialogText(forms('createProxy')!);
        proxy = await ensureProxy();
        setCurrentStep((prev) => prev + 1);
      } else {
        proxy = await ensureProxy();
      }
      if (!allowanceToIncrease.isNegative() && !allowanceToIncrease.isZero()) {
        setDialogText(forms('increaseAllowance', { token: units('stableToken') })!);
        await increaseAllowance(proxy, amount);
        setCurrentStep((prev) => prev + 1);
      }

      setDialogText(t('processing')!);
      await deposit(amount);
      setCurrentStep((prev) => prev + 1);
      setDialogText(t('done')!);
    };
    await f().catch((err) => {
      setDepositing(false);
      openDialog(error('errorWhileDeposit'), err);
    });
  }, [amount, allowance, proxyAddress, t, deposit, forms, ensureProxy, units, increaseAllowance, openDialog, error]);

  const formErrors: DepositError[] = useMemo(() => {
    if (amount) {
      return Validation.canDeposit(balance, amount);
    }
    return [];
  }, [amount, balance]);

  const showErrorMessage = (e: DepositError) => {
    switch (e) {
      case DepositError.insufficientBalance:
        return error('insufficientBalance');
      case DepositError.invalidAmount:
        return error('invalidAmount');
    }
  };
  return (
    <Card component="form" elevation={0}>
      <ProgressDialog
        open={depositing}
        title={buttonContent}
        text={dialogText}
        totalStep={totalSteps}
        currentStep={currentStep}
        onClose={() => {
          setDepositing(false);
          onDialogClose();
        }}
      />
      <Grid container padding={2} spacing={2}>
        <Grid item xs={12} lg={6}>
          <TextField
            fullWidth
            label={t('label')}
            value={amountText}
            error={formErrors.length !== 0}
            onChange={handleChange}
            helperText={<HelperText>{`${forms('balance')}: ${format(balance)} ${units('stableToken')}`}</HelperText>}
            InputProps={{
              endAdornment: <InputAdornment position="end">DAI</InputAdornment>,
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            fullWidth
            disabled={!amount || depositing || formErrors.length !== 0}
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

export default Form;
