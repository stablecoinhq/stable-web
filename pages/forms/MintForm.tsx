import { Button, Card, Grid, InputAdornment, TextField, CircularProgress, FormHelperText } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { useCallback, useMemo, useState } from 'react';

import { UnitFormats } from 'ethereum/helpers/math';
import { toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';

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
  onAmountChange: (s: string) => void;
  onDaiAmountChange: (s: string) => void;
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
  amountText,
  daiAmountText,
}) => {
  const { t } = useTranslation('common', { keyPrefix: 'forms.mint' });
  const { t: units } = useTranslation('common', { keyPrefix: 'units' });

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
  const onButtonClick: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    if (!collateralAmount || !daiAmount) {
      return;
    }

    setMinting(true);
    onMint(collateralAmount, daiAmount).finally(() => {
      setMinting(false);
    });
  }, [collateralAmount, onMint, daiAmount]);

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
        return t('error.insufficientBalance');
      case MintError.collateralTooLow:
        return t('error.collateralTooLow');
      case MintError.debtTooLow:
        return t('error.debtTooLow');
      case MintError.issuingTooMuchCoins:
        return t('error.issuingTooMuchCoins');
    }
  };

  return (
    <Card component="form" elevation={0}>
      <Grid container padding={2} spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label={t('lockAmount', { gem: ilkInfo.name })}
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
            label={t('stableTokenAmount', { gem: ilkInfo.name })}
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
            {minting ? <CircularProgress /> : buttonContent}
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
