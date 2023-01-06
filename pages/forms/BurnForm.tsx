import {
  Button,
  Card,
  Grid,
  InputAdornment,
  TextField,
  FormHelperText,
  FormControlLabel,
  FormGroup,
  Checkbox,
} from '@mui/material';
import { useTranslation } from 'next-i18next';
import { useCallback, useMemo, useState } from 'react';

import HelperText from 'component/HelperText';
import ProgressDialog from 'component/ProgressDialog';
import Vault from 'ethereum/Vault';
import { UnitFormats } from 'ethereum/helpers/math';
import { toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import { useErrorDialog } from 'store/ErrorDialogProvider';
import { useNumericDisplayContext } from 'store/NumericDisplayProvider';

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
  burn: (daiAmount: FixedNumber, colAmount: FixedNumber) => Promise<void>;
  burnAll: (daiAmount: FixedNumber, colAmount: FixedNumber) => Promise<void>;
  onAmountChange: (s: string) => void;
  onColChange: (s: string) => void;
  daiText: string;
  colText: string;
  proxyAddress: string | undefined;
  increaseAllowance: (address: string, spendingAmount: FixedNumber) => Promise<void>;
  ensureProxy: () => Promise<string>;
  onDialogClose: () => void;
  allowance: FixedNumber;
};

type BurnFormState = 'burn' | 'burnAll' | 'neutral';

const BurnForm: FC<BurnFormProps> = ({
  ilkInfo,
  burn,
  burnAll,
  buttonContent,
  daiBalance,
  lockedBalance,
  debt,
  ilkStatus,
  daiText,
  colText,
  onAmountChange,
  onColChange,
  proxyAddress,
  increaseAllowance,
  ensureProxy,
  allowance,
  onDialogClose,
}) => {
  const { t } = useTranslation('common', { keyPrefix: 'forms' });
  const { t: units } = useTranslation('common', { keyPrefix: 'units' });

  const { openDialog } = useErrorDialog();

  const daiAmount = useMemo(() => toFixedNumberOrUndefined(daiText, UnitFormats.WAD), [daiText]);
  const colAmount = useMemo(() => toFixedNumberOrUndefined(colText, ilkInfo.gem.format), [colText, ilkInfo.gem.format]);
  const [burning, setBurning] = useState(false);
  const [burnFormState, setBurnFormState] = useState<BurnFormState>('neutral');
  const [dialogText, setDialogText] = useState('');
  const [totalSteps, setTotalSteps] = useState(1);
  const [currentStep, setCurrentStep] = useState(1);
  const { format } = useNumericDisplayContext();

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

  const onButtonClick: MouseEventHandler<HTMLButtonElement> = useCallback(async () => {
    if (!daiAmount || !colAmount) {
      return;
    }
    const f = async () => {
      const allowanceToIncrease = daiAmount.subUnsafe(allowance);
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
      setBurning(true);
      let proxy = '';
      if (!proxyAddress) {
        setDialogText(t('createProxy')!);
        proxy = await ensureProxy();
        setCurrentStep((prev) => prev + 1);
      } else {
        proxy = await ensureProxy();
      }
      if (!allowanceToIncrease.isNegative() && !allowanceToIncrease.isZero()) {
        setDialogText(t('increaseAllowance', { token: units('stableToken') })!);
        await increaseAllowance(proxy, daiAmount);
        setCurrentStep((prev) => prev + 1);
      }

      setDialogText(t('burn.processing')!);
      switch (burnFormState) {
        case 'burnAll': {
          await burnAll(Vault.getDebt(debt, ilkStatus.debtMultiplier), lockedBalance);
          break;
        }
        case 'burn': {
          await burn(daiAmount, colAmount);
          break;
        }
        case 'neutral':
          break;
      }
      setCurrentStep((prev) => prev + 1);
      setDialogText(t('burn.done')!);
    };
    await f().catch((err) => {
      setBurning(false);
      openDialog(t('burn.error.errorWhileRepaying'), err);
    });
  }, [
    allowance,
    burnFormState,
    colAmount,
    daiAmount,
    debt,
    ensureProxy,
    ilkStatus.debtMultiplier,
    increaseAllowance,
    lockedBalance,
    burn,
    burnAll,
    openDialog,
    proxyAddress,
    t,
    units,
  ]);

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
  const showErrorMessage = (e: BurnError) => {
    switch (e) {
      case BurnError.insufficientBalance:
        return t('burn.error.insufficientBalance');
      case BurnError.collateralTooLow:
        return t('burn.error.collateralTooLow');
      case BurnError.debtTooLow:
        return t('burn.error.debtTooLow');
      case BurnError.invalidCollateralFreeAmount:
        return t('burn.error.invalidCollateralFreeAmount');
      case BurnError.invalidRepayAmount:
        return t('burn.error.invalidRepayAmount');
    }
  };

  return (
    <Card component="form" elevation={0}>
      <ProgressDialog
        open={burning}
        title={buttonContent}
        text={dialogText}
        totalStep={totalSteps}
        currentStep={currentStep}
        onClose={() => {
          setBurnFormState('neutral');
          setBurning(false);
          onDialogClose();
        }}
      />
      <Grid container padding={2} spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('burn.redeemAmount')}
            disabled={burnFormState === 'burnAll' || burning}
            value={daiText}
            error={isInvalidRepayAmount || isOverRepaying}
            onChange={handleDaiChange}
            helperText={<HelperText>{`${t('balance')}: ${format(daiBalance)} ${units('stableToken')}`}</HelperText>}
            InputProps={{
              endAdornment: <InputAdornment position="end">{units('stableToken')}</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            disabled={burnFormState === 'burnAll' || burning}
            error={isInvalidCollateralFreeAmount}
            label={t('burn.freeAmount', { gem: ilkInfo.name })}
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
              label={t('burn.repayAll')}
            />
          </FormGroup>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            fullWidth
            disabled={
              !daiAmount ||
              !colAmount ||
              burning ||
              formErrors.length !== 0 ||
              (daiAmount && colAmount && daiAmount.isZero() && colAmount.isZero()) ||
              !(burnFormState !== 'neutral')
            }
            onClick={onButtonClick}
          >
            {buttonContent}
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
