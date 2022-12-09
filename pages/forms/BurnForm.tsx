import { Button, Card, Grid, InputAdornment, TextField, CircularProgress, FormHelperText } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { useCallback, useMemo, useState } from 'react';

import { UnitFormats } from 'ethereum/helpers/math';
import { toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';

import { BurnFormValidation, BurnError } from './BurnFormValidation';

import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus } from 'ethereum/contracts/VatHelper';
import type { FixedNumber } from 'ethers';
import type { FC, ChangeEventHandler, MouseEventHandler, ReactNode } from 'react';

export type BurnFormProps = {
  daiBalance: FixedNumber;
  lockedBalance: FixedNumber;
  debt: FixedNumber;
  ilkStatus: IlkStatus;
  ilkInfo: IlkInfo;
  buttonContent: ReactNode;
  onBurn: (daiAmount: FixedNumber, colAmount: FixedNumber) => Promise<void>;
  onAmountChange: (s: string) => void;
  onColChange: (s: string) => void;
  daiText: string;
  colText: string;
};

const BurnForm: FC<BurnFormProps> = ({
  ilkInfo,
  onBurn,
  buttonContent,
  daiBalance,
  lockedBalance,
  debt,
  ilkStatus,
  daiText,
  colText,
  onAmountChange,
  onColChange,
}) => {
  const { t } = useTranslation('common', { keyPrefix: 'forms.burn' });
  const daiAmount = useMemo(() => toFixedNumberOrUndefined(daiText, UnitFormats.WAD), [daiText]);
  const colAmount = useMemo(() => toFixedNumberOrUndefined(colText, ilkInfo.gem.format), [colText, ilkInfo.gem.format]);
  const [burning, setBurning] = useState(false);

  const handleDaiChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => onAmountChange(event.target.value),
    [onAmountChange],
  );
  const handleColChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => onColChange(event.target.value),
    [onColChange],
  );

  const onButtonClick: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    if (!daiAmount || !colAmount) {
      return;
    }

    setBurning(true);
    onBurn(daiAmount, colAmount).finally(() => {
      setBurning(false);
    });
  }, [colAmount, daiAmount, onBurn]);

  const formErrors: BurnError[] = useMemo(() => {
    if (colAmount && daiAmount) {
      return BurnFormValidation.canBurn(daiBalance, lockedBalance, debt, colAmount, daiAmount, ilkStatus);
    }
    return [];
  }, [colAmount, daiAmount, lockedBalance, ilkStatus, debt, daiBalance]);
  const showErrorMessage = (e: BurnError) => {
    switch (e) {
      case BurnError.insufficientBalance:
        return t('error.insufficientBalance');
      case BurnError.collateralTooLow:
        return t('error.collateralTooLow');
      case BurnError.debtTooLow:
        return t('error.debtTooLow');
      case BurnError.invalidCollateralFreeAmount:
        return t('error.invalidCollateralFreeAmount');
      case BurnError.invalidRepayAmount:
        return t('error.invalidRepayAmount');
    }
  };
  return (
    <Card component="form" elevation={0}>
      <Grid container padding={2} spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label={t('redeemAmount')}
            value={daiText}
            onChange={handleDaiChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">DAI</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label={t('freeAmount', { gem: ilkInfo.name })}
            value={colText}
            onChange={handleColChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">{ilkInfo.symbol}</InputAdornment>,
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            fullWidth
            disabled={!daiAmount || !colAmount || burning || formErrors.length !== 0}
            onClick={onButtonClick}
          >
            {burning ? <CircularProgress /> : buttonContent}
          </Button>
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

export default BurnForm;
