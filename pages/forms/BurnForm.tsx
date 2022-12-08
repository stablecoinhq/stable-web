import {
  Button,
  Card,
  Grid,
  InputAdornment,
  TextField,
  CircularProgress,
  FormHelperText,
  FormControlLabel,
  FormGroup,
  Checkbox,
} from '@mui/material';
import { useTranslation } from 'next-i18next';
import { useCallback, useMemo, useState } from 'react';

import Vault from 'ethereum/Vault';
import { UnitFormats } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers, toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';

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
};

type BurnFormState = 'repay' | 'repayAll' | 'neutral';

const BurnForm: FC<BurnFormProps> = ({ ilkInfo, onBurn, buttonContent, daiBalance, lockedBalance, debt, ilkStatus }) => {
  const { t } = useTranslation('common', { keyPrefix: 'forms.burn' });
  const [daiText, setDaiText] = useState('');
  const daiAmount = useMemo(() => toFixedNumberOrUndefined(daiText, UnitFormats.WAD), [daiText]);
  const [colText, setColText] = useState('');
  const colAmount = useMemo(() => toFixedNumberOrUndefined(colText, ilkInfo.gem.format), [colText, ilkInfo.gem.format]);
  const [burning, setBurning] = useState(false);
  const [burnFormState, setBurnFormState] = useState<BurnFormState>('neutral');

  const onDaiChange: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    setDaiText(cutDecimals(pickNumbers(event.target.value), 18));
    if (event.target.value === '') {
      setBurnFormState('neutral');
    } else {
      setBurnFormState('repay');
    }
  }, []);
  const onColChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      setColText(cutDecimals(pickNumbers(event.target.value), ilkInfo.gem.format.decimals));
      if (event.target.value === '') {
        setBurnFormState('neutral');
      } else {
        setBurnFormState('repay');
      }
    },
    [ilkInfo.gem.format.decimals],
  );

  const onButtonClick: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    switch (burnFormState) {
      case 'repayAll': {
        setBurning(true);
        onBurn(Vault.getDebt(debt, ilkStatus.debtMultiplier), lockedBalance).finally(() => {
          setBurning(false);
          setBurnFormState('neutral');
        });
        break;
      }
      case 'repay': {
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
  }, [burnFormState, debt, ilkStatus.debtMultiplier, lockedBalance, daiAmount, colAmount, onBurn]);

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

  const onRepayAllChange: ChangeEventHandler<HTMLInputElement> = () => {
    if (burnFormState !== 'repayAll') {
      setBurnFormState('repayAll');
      const currentDebt = Vault.getDebt(debt, ilkStatus.debtMultiplier);
      setDaiText(currentDebt.toString());
      setColText(lockedBalance.toString());
    } else {
      setBurnFormState('neutral');
      setDaiText('');
      setColText('');
    }
  };
  return (
    <Card component="form" elevation={0}>
      <Grid container padding={2} spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            disabled={burnFormState === 'repayAll' || burning}
            label={t('redeemAmount')}
            value={daiText}
            onChange={onDaiChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">DAI</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            disabled={burnFormState === 'repayAll' || burning}
            label={t('freeAmount', { gem: ilkInfo.name })}
            value={colText}
            onChange={onColChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">{ilkInfo.symbol}</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <FormGroup>
            <FormControlLabel
              disabled={burnFormState === 'repay'}
              control={<Checkbox checked={burnFormState === 'repayAll'} onChange={onRepayAllChange} />}
              label={t('repayAll')}
            />
          </FormGroup>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            fullWidth
            disabled={!daiAmount || !colAmount || burning || !(burnFormState !== 'neutral') || formErrors.length !== 0}
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
