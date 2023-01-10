import { Button, Card, Grid, InputAdornment, TextField, FormHelperText } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { useCallback, useMemo, useState } from 'react';

import HelperText from 'component/HelperText';
import ProgressDialog from 'component/ProgressDialog';
import { UnitFormats } from 'ethereum/helpers/math';
import { toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import { useErrorDialog } from 'store/ErrorDialogProvider';
import { useNumericDisplayContext } from 'store/NumericDisplayProvider';

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
  mint: (colAmount: FixedNumber, daiAmount: FixedNumber) => Promise<void>;
  onDialogClose: () => void;
  onAmountChange: (s: string) => void;
  onDaiAmountChange: (s: string) => void;
  allowance: FixedNumber;
  mintMessage: string;
  doneMessage: string;
  errorMessage: string;
  proxyAddress: string | undefined;
  increaseAllowance: (address: string, spendingAmount: FixedNumber) => Promise<void>;
  ensureProxy: () => Promise<string>;
  amountText: string;
  daiAmountText: string;
};

const MintForm: FC<MintFormProps> = ({
  ilkInfo,
  ilkStatus,
  mint,
  buttonContent,
  balance,
  lockedBalance,
  debt,
  onAmountChange,
  onDaiAmountChange,
  onDialogClose,
  amountText,
  daiAmountText,
  errorMessage,
  proxyAddress,
  allowance,
  increaseAllowance,
  ensureProxy,
  mintMessage: onMintMessage,
  doneMessage: onDoneMessage,
}) => {
  const { t } = useTranslation('common', { keyPrefix: 'forms' });
  const { t: units } = useTranslation('common', { keyPrefix: 'units' });

  const { openDialog } = useErrorDialog();

  const [dialogText, setDialogText] = useState('');
  const [totalSteps, setTotalSteps] = useState(1);
  const [currentStep, setCurrentStep] = useState(1);
  const { format } = useNumericDisplayContext();

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
        setDialogText(t('increaseAllowance', { token: ilkInfo.symbol })!);
        await increaseAllowance(proxy, collateralAmount);
        setCurrentStep((prev) => prev + 1);
      }

      setDialogText(onMintMessage);
      await mint(collateralAmount, daiAmount);
      setCurrentStep((prev) => prev + 1);
      setDialogText(onDoneMessage);
    };
    await f().catch((err) => {
      setMinting(false);
      openDialog(errorMessage, err);
    });
  }, [
    collateralAmount,
    daiAmount,
    allowance,
    proxyAddress,
    onMintMessage,
    mint,
    onDoneMessage,
    t,
    ensureProxy,
    ilkInfo.symbol,
    increaseAllowance,
    openDialog,
    errorMessage,
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
    if (onDialogClose) {
      onDialogClose();
    }
  }, [onDialogClose]);

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
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('mint.lockAmount', { gem: ilkInfo.name })}
            error={isInsufficientBalance}
            value={amountText}
            onChange={handleAmountChange}
            helperText={<HelperText>{`${t('balance')}: ${format(balance)} ${ilkInfo.symbol}`}</HelperText>}
            InputProps={{
              endAdornment: <InputAdornment position="end">{ilkInfo.symbol}</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
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
        <Grid item xs={12} md={6}>
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
