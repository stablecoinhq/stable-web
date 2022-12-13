import { Button, Card, Grid, InputAdornment, TextField, CircularProgress, FormHelperText } from '@mui/material';
import { FixedNumber } from 'ethers';
import { useTranslation } from 'next-i18next';
import { useCallback, useMemo, useState } from 'react';

import Vault from 'ethereum/Vault';
import { UnitFormats, CENT, COL_RATIO_FORMAT } from 'ethereum/helpers/math';
import { toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import BNText from 'ethereum/react/cards/BNText';

import { MintFormValidation, MintError } from './MintFormValidation';

import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus } from 'ethereum/contracts/VatHelper';
import type { ChangeEventHandler, FC, MouseEventHandler, ReactNode } from 'react';

export type MintFormProps = {
  ilkInfo: IlkInfo;
  ilkStatus: IlkStatus;
  buttonContent: ReactNode;
  liquidationRatio: FixedNumber;
  balance: FixedNumber;
  lockedBalance: FixedNumber;
  debt: FixedNumber;
  onMint: (amount: FixedNumber, ratio: FixedNumber) => Promise<void>;
  onAmountChange: (s: string) => void;
  onRatioChange: (s: string) => void;
  amountText: string;
  ratioText: string;
};

const MintForm: FC<MintFormProps> = ({
  ilkInfo,
  ilkStatus,
  onMint,
  buttonContent,
  liquidationRatio,
  balance,
  lockedBalance,
  debt,
  onAmountChange,
  onRatioChange,
  amountText,
  ratioText,
}) => {
  const { price } = ilkStatus;
  const { t } = useTranslation('common', { keyPrefix: 'forms.mint' });
  const { t: units } = useTranslation('common', { keyPrefix: 'units' });

  const collateralAmount = useMemo(
    () => toFixedNumberOrUndefined(amountText, ilkInfo.gem.format),
    [amountText, ilkInfo.gem.format],
  );
  const ratio = useMemo(
    () => toFixedNumberOrUndefined(ratioText, COL_RATIO_FORMAT)?.divUnsafe(CENT.toFormat(COL_RATIO_FORMAT)),
    [ratioText],
  );
  const daiAmount = useMemo(() => {
    if (collateralAmount && ratio) {
      return Vault.getDaiAmount(collateralAmount, ratio, liquidationRatio, price);
    }
    return FixedNumber.fromString('0', UnitFormats.WAD);
  }, [collateralAmount, ratio, liquidationRatio, price]);
  const [minting, setMinting] = useState(false);

  const handleAmountChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => onAmountChange(event.target.value),
    [onAmountChange],
  );
  const handleRatioChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => onRatioChange(event.target.value),
    [onRatioChange],
  );

  const onButtonClick: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    if (!collateralAmount || !ratio) {
      return;
    }

    setMinting(true);
    onMint(collateralAmount, ratio).finally(() => {
      setMinting(false);
    });
  }, [collateralAmount, onMint, ratio]);

  const formErrors: MintError[] = useMemo(() => {
    if (collateralAmount && ratio) {
      return MintFormValidation.canMint(balance, collateralAmount, daiAmount, lockedBalance, debt, ilkStatus);
    }
    return [];
  }, [balance, collateralAmount, ilkStatus, debt, lockedBalance, ratio, daiAmount]);

  const isInsufficientBalance = useMemo(
    () => collateralAmount && MintFormValidation.isInsufficientBalance(balance, collateralAmount),
    [balance, collateralAmount],
  );

  const isCollateralizationRatioTooLow = useMemo(
    () =>
      collateralAmount &&
      MintFormValidation.isBelowLiquidationRatio(daiAmount, debt, lockedBalance, collateralAmount, ilkStatus),
    [collateralAmount, daiAmount, debt, ilkStatus, lockedBalance],
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
            label={t('colRatio')}
            value={ratioText}
            error={isCollateralizationRatioTooLow}
            onChange={handleRatioChange}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
          />
        </Grid>
        <BNText
          label={t('mintAmountLabel')}
          value={daiAmount}
          tooltipText={t('mintAmountTooltipText')}
          unit={units('stableToken')}
        />
        <Grid item xs={12}>
          <Button
            variant="contained"
            fullWidth
            disabled={!collateralAmount || daiAmount.isZero() || !ratio || minting || formErrors.length !== 0}
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
