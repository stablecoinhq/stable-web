import LoadingButton from '@mui/lab/LoadingButton';
import { Card, Grid, InputAdornment, TextField, FormHelperText, FormControlLabel, FormGroup, Checkbox } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { useCallback, useMemo, useState } from 'react';

import Vault from 'ethereum/Vault';
import { UnitFormats } from 'ethereum/helpers/math';
import { toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import SubmitForm from 'ethereum/react/form/SubmitForm';

import { BurnFormValidation, BurnError } from './BurnFormValidation';

import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus } from 'ethereum/contracts/VatHelper';
import type { SubmitFormProps } from 'ethereum/react/form/SubmitForm';
import type { FixedNumber } from 'ethers';
import type { FC, ChangeEventHandler, MouseEventHandler, ReactNode } from 'react';

export type BurnFormProps = {
  daiBalance: FixedNumber;
  lockedBalance: FixedNumber;
  debt: FixedNumber;
  ilkStatus: IlkStatus;
  ilkInfo: IlkInfo;
  buttonContent: ReactNode;
  loadingText: ReactNode;
  onBurn: (daiAmount: FixedNumber, colAmount: FixedNumber) => Promise<void>;
  onBurnAll: (daiAmount: FixedNumber, colAmount: FixedNumber) => Promise<void>;
  onAmountChange: (s: string) => void;
  onColChange: (s: string) => void;
  daiText: string;
  colText: string;
  submitFormProps: SubmitFormProps;
};

type BurnFormState = 'burn' | 'burnAll' | 'neutral';

const BurnForm: FC<BurnFormProps> = ({
  ilkInfo,
  onBurn,
  onBurnAll,
  buttonContent,
  loadingText,
  daiBalance,
  lockedBalance,
  debt,
  ilkStatus,
  daiText,
  colText,
  onAmountChange,
  onColChange,
  submitFormProps,
}) => {
  const { t } = useTranslation('common', { keyPrefix: 'forms.burn' });
  const daiAmount = useMemo(() => toFixedNumberOrUndefined(daiText, UnitFormats.WAD), [daiText]);
  const colAmount = useMemo(() => toFixedNumberOrUndefined(colText, ilkInfo.gem.format), [colText, ilkInfo.gem.format]);
  const [burning, setBurning] = useState(false);
  const [burnFormState, setBurnFormState] = useState<BurnFormState>('neutral');

  const handleDaiChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      onAmountChange(event.target.value);
      if (event.target.value === '') {
        setBurnFormState('neutral');
      } else {
        setBurnFormState('burn');
      }
    },
    [onAmountChange],
  );
  const handleColChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      onColChange(event.target.value);
      if (event.target.value === '') {
        setBurnFormState('neutral');
      } else {
        setBurnFormState('burn');
      }
    },
    [onColChange],
  );

  const handleBurnAllChange: ChangeEventHandler<HTMLInputElement> = () => {
    if (burnFormState !== 'burnAll') {
      setBurnFormState('burnAll');
      const currentDebt = Vault.getDebt(debt, ilkStatus.debtMultiplier);
      onAmountChange(currentDebt.toString());
      onColChange(lockedBalance.toString());
    } else {
      setBurnFormState('neutral');
      onAmountChange('');
      onColChange('');
    }
  };

  const onButtonClick: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    switch (burnFormState) {
      case 'burnAll': {
        setBurning(true);
        onBurnAll(Vault.getDebt(debt, ilkStatus.debtMultiplier), lockedBalance).finally(() => {
          setBurning(false);
          setBurnFormState('neutral');
        });
        break;
      }
      case 'burn': {
        if (!daiAmount || !colAmount) {
          return;
        }
        setBurning(true);
        onBurn(daiAmount, colAmount).finally(() => {
          setBurning(false);
          setBurnFormState('neutral');
        });
        break;
      }
      case 'neutral':
        break;
    }
  }, [burnFormState, colAmount, daiAmount, debt, ilkStatus.debtMultiplier, lockedBalance, onBurn, onBurnAll]);

  const isInvalidRepayAmount = useMemo(
    () => daiAmount && BurnFormValidation.isInsufficientBalance(daiBalance, daiAmount),
    [daiAmount, daiBalance],
  );
  const isOverRepaying = useMemo(
    () => daiAmount && colAmount && BurnFormValidation.isOverRepaying(debt, daiAmount, ilkStatus.debtMultiplier),
    [colAmount, daiAmount, debt, ilkStatus.debtMultiplier],
  );

  const isInvalidCollateralFreeAmount = useMemo(
    () => colAmount && daiAmount && BurnFormValidation.isInvalidCollateralFreeAmount(lockedBalance, colAmount),
    [colAmount, daiAmount, lockedBalance],
  );

  const formErrors: BurnError[] = useMemo(() => {
    if (colAmount && daiAmount) {
      return BurnFormValidation.canBurn(daiBalance, lockedBalance, debt, colAmount, daiAmount, ilkStatus);
    }
    return [];
  }, [colAmount, daiAmount, lockedBalance, ilkStatus, debt, daiBalance]);

  const isInvalid = useMemo(
    () =>
      !daiAmount ||
      !colAmount ||
      burning ||
      formErrors.length !== 0 ||
      (daiAmount && colAmount && daiAmount.isZero() && colAmount.isZero()) ||
      !(burnFormState !== 'neutral'),
    [burnFormState, burning, colAmount, daiAmount, formErrors.length],
  );
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
            disabled={burnFormState === 'burnAll' || burning}
            value={daiText}
            error={isInvalidRepayAmount || isOverRepaying}
            onChange={handleDaiChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">DAI</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            disabled={burnFormState === 'burnAll' || burning}
            error={isInvalidCollateralFreeAmount}
            label={t('freeAmount', { gem: ilkInfo.name })}
            value={colText}
            onChange={handleColChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">{ilkInfo.symbol}</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <FormGroup>
            <FormControlLabel
              disabled={burnFormState === 'burn'}
              control={<Checkbox checked={burnFormState === 'burnAll'} onChange={handleBurnAllChange} />}
              label={t('repayAll')}
            />
          </FormGroup>
        </Grid>
        <Grid item xs={12}>
          <SubmitForm
            proxyAddress={submitFormProps.proxyAddress}
            increaseAllowance={submitFormProps.increaseAllowance}
            spendingAmount={daiAmount}
            allowance={submitFormProps.allowance}
            isInvalid={isInvalid}
            createProxy={submitFormProps.createProxy}
          >
            <LoadingButton
              loading={burning}
              variant="contained"
              fullWidth
              disabled={isInvalid}
              onClick={onButtonClick}
              loadingPosition="end"
              size="large"
            >
              {burning ? loadingText : buttonContent}
            </LoadingButton>
          </SubmitForm>
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
