import { Button, Card, Grid, InputAdornment, TextField, FormHelperText } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ProgressDialog from 'component/ProgressDialog';
import { UnitFormats } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers, toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import { useErrorDialog } from 'store/ErrorDialogProvider';

import type { FixedNumber } from 'ethers';
import type { ChangeEventHandler, FC, MouseEventHandler, ReactNode } from 'react';

export type DepositFormProps = {
  balance: FixedNumber;
  buttonContent: ReactNode;
  onDeposit: (amount: FixedNumber) => Promise<void>;
  proxyAddress: string | undefined;
  increaseAllowance: (address: string, spendingAmount: FixedNumber) => Promise<void>;
  ensureProxy: () => Promise<string>;
  allowance: FixedNumber;
};

const DepositForm: FC<DepositFormProps> = ({
  onDeposit,
  buttonContent,
  balance,
  proxyAddress,
  increaseAllowance,
  ensureProxy,
  allowance,
}) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.earn.deposit.form' });

  const { t: forms } = useTranslation('common', { keyPrefix: 'forms' });
  const { t: error } = useTranslation('common', { keyPrefix: 'pages.earn.deposit.form.errors' });
  const { t: errorMessage } = useTranslation('common', { keyPrefix: 'pages.earn.errors' });

  const [dialogText, setDialogText] = useState('');
  const [totalSteps, setTotalSteps] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [amountText, setAmountText] = useState('');

  const { openDialog } = useErrorDialog();

  const formats = UnitFormats.WAD;
  const amount = useMemo(() => toFixedNumberOrUndefined(amountText, formats), [amountText, formats]);
  const isInvalidDepositAmount = useMemo(() => amount && balance.subUnsafe(amount).isNegative(), [amount, balance]);

  // input as percentage, return as ratio
  const [depositing, setDepositing] = useState(false);

  const onAmountChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => setAmountText(cutDecimals(pickNumbers(event.target.value), formats.decimals)),
    [formats],
  );
  const onButtonClick: MouseEventHandler<HTMLButtonElement> = useCallback(async () => {
    if (!amount || isInvalidDepositAmount) {
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
        setDialogText(forms('increaseAllowance')!);
        await increaseAllowance(proxy, amount);
        setCurrentStep((prev) => prev + 1);
      }

      setDialogText(t('processing')!);
      await onDeposit(amount);
      setCurrentStep((prev) => prev + 1);
      setDialogText(forms('done')!);
      setAmountText('');
    };
    await f().catch((err) => {
      setDepositing(false);
      openDialog(errorMessage('errorWhileDeposit'), err);
    });
  }, [
    amount,
    isInvalidDepositAmount,
    allowance,
    proxyAddress,
    t,
    onDeposit,
    forms,
    ensureProxy,
    increaseAllowance,
    openDialog,
    errorMessage,
  ]);

  return (
    <Card component="form" elevation={0}>
      <ProgressDialog
        open={depositing}
        title={buttonContent}
        text={dialogText}
        totalStep={totalSteps}
        currentStep={currentStep}
        onClose={() => setDepositing(false)}
      />
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
            {buttonContent}
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
