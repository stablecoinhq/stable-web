import { Button, Card, Grid, InputAdornment, TextField, FormHelperText } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { useCallback, useMemo, useState } from 'react';

import ProgressDialog from 'component/ProgressDialog';
import { UnitFormats } from 'ethereum/helpers/math';
import { toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import { useErrorDialog } from 'store/ErrorDialogProvider';

import { MintFormValidation, MintError } from './MintFormValidation';

import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus } from 'ethereum/contracts/VatHelper';
import type { FixedNumber } from 'ethers';
import type { ChangeEventHandler, FC, MouseEventHandler, ReactNode } from 'react';

export type MintFormProps = {
  ilkInfo: IlkInfo;
  ilkStatus: IlkStatus;
  buttonContent: ReactNode;
  balance: FixedNumber;
  lockedBalance: FixedNumber;
  debt: FixedNumber;
  onMint: (colAmount: FixedNumber, daiAmount: FixedNumber) => Promise<void>;
  onCloseDialog?: () => void;
  onAmountChange: (s: string) => void;
  onDaiAmountChange: (s: string) => void;
  allowance: FixedNumber;
  onMintDialog: string;
  onErrorMessage: string;
  proxyAddress: string | undefined;
  increaseAllowance: (address: string, spendingAmount: FixedNumber) => Promise<void>;
  ensureProxy: () => Promise<string>;
  amountText: string;
  daiAmountText: string;
};

const MintForm: FC<MintFormProps> = ({
  ilkInfo,
  ilkStatus,
  onMint,
  buttonContent,
  balance,
  lockedBalance,
  debt,
  onAmountChange,
  onDaiAmountChange,
  onCloseDialog,
  amountText,
  daiAmountText,
  onErrorMessage,
  proxyAddress,
  allowance,
  increaseAllowance,
  ensureProxy,
  onMintDialog,
}) => {
  const { t } = useTranslation('common', { keyPrefix: 'forms' });
  const { t: units } = useTranslation('common', { keyPrefix: 'units' });
  const { openDialog } = useErrorDialog();

  const [dialogText, setDialogText] = useState('');
  const [totalSteps, setTotalSteps] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);

  const collateralAmount = useMemo(
    () => toFixedNumberOrUndefined(amountText, ilkInfo.gem.format),
    [amountText, ilkInfo.gem.format],
  );

  const daiAmount = useMemo(() => toFixedNumberOrUndefined(daiAmountText, UnitFormats.WAD), [daiAmountText]);

  const [minting, setMinting] = useState(false);

  const handleAmountChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => onAmountChange(event.target.value),
    [onAmountChange],
  );

  const handleDaiAmountChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => onDaiAmountChange(event.target.value),
    [onDaiAmountChange],
  );
  const onButtonClick: MouseEventHandler<HTMLButtonElement> = useCallback(async () => {
    if (!collateralAmount || !daiAmount) {
      return;
    }

    const f = async () => {
      const allowanceToIncrease = collateralAmount.subUnsafe(allowance);
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
      setMinting(true);
      let proxy = '';
      if (!proxyAddress) {
        setDialogText(t('createProxy')!);
        proxy = await ensureProxy();
        setCurrentStep((prev) => prev + 1);
      } else {
        proxy = await ensureProxy();
      }

      if (!allowanceToIncrease.isNegative() && !allowanceToIncrease.isZero()) {
        setDialogText(t('increaseAllowance')!);
        await increaseAllowance(proxy, collateralAmount);
        setCurrentStep((prev) => prev + 1);
      }

      setDialogText(onMintDialog);
      await onMint(collateralAmount, daiAmount);
      setCurrentStep((prev) => prev + 1);
      setDialogText(t('done')!);
    };
    await f().catch((err) => {
      setMinting(false);
      openDialog(onErrorMessage, err);
    });
  }, [
    collateralAmount,
    daiAmount,
    allowance,
    proxyAddress,
    onMintDialog,
    onMint,
    t,
    ensureProxy,
    increaseAllowance,
    openDialog,
    onErrorMessage,
  ]);

  const formErrors: MintError[] = useMemo(() => {
    if (collateralAmount && daiAmount) {
      return MintFormValidation.canMint(balance, collateralAmount, daiAmount, lockedBalance, debt, ilkStatus);
    }
    return [];
  }, [balance, collateralAmount, ilkStatus, debt, lockedBalance, daiAmount]);

  const isInsufficientBalance = useMemo(
    () => collateralAmount && MintFormValidation.isInsufficientBalance(balance, collateralAmount),
    [balance, collateralAmount],
  );

  const showErrorMessage = (e: MintError) => {
    switch (e) {
      case MintError.insufficientBalance:
        return t('mint.error.insufficientBalance');
      case MintError.collateralTooLow:
        return t('mint.error.collateralTooLow');
      case MintError.debtTooLow:
        return t('mint.error.debtTooLow');
      case MintError.issuingTooMuchCoins:
        return t('mint.error.issuingTooMuchCoins');
    }
  };

  const handleClose = useCallback(() => {
    setMinting(false);
    if (onCloseDialog) {
      onCloseDialog();
    }
  }, [onCloseDialog]);

  return (
    <Card component="form" elevation={0}>
      <ProgressDialog
        open={minting}
        title={buttonContent}
        text={dialogText}
        totalStep={totalSteps}
        currentStep={currentStep}
        onClose={handleClose}
      />
      <Grid container padding={2} spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label={t('mint.lockAmount', { gem: ilkInfo.name })}
            error={isInsufficientBalance}
            value={amountText}
            onChange={handleAmountChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">{ilkInfo.symbol}</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label={t('mint.stableTokenAmount', { gem: ilkInfo.name })}
            error={isInsufficientBalance}
            value={daiAmountText}
            onChange={handleDaiAmountChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">{units('stableToken')}</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            fullWidth
            disabled={
              !collateralAmount ||
              !daiAmount ||
              minting ||
              formErrors.length !== 0 ||
              (daiAmount && collateralAmount && daiAmount.isZero() && collateralAmount.isZero())
            }
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

export default MintForm;
