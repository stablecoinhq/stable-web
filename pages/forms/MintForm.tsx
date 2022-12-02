import { FixedFormat } from '@ethersproject/bignumber';
import { Button, Card, Grid, InputAdornment, TextField, CircularProgress, FormHelperText } from '@mui/material';
import { FixedNumber } from 'ethers';
import { useTranslation } from 'next-i18next';
import { useCallback, useMemo, useState } from 'react';

import Vault from 'ethereum/Vault';
import { UnitFormats, CENT, COL_RATIO_FORMAT } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers, toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import BNText from 'ethereum/react/cards/BNText';

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
};

enum FormError {
  // 残高不足
  insufficientBalance,
  // 担保率が最低担保率を下回っている
  collateralTooLow,
  // 発行下限を下回っている
  debtTooLow,
  // 発行上限を上回っている
  issuingTooMuchCoins,
}

const MintForm: FC<MintFormProps> = ({
  ilkInfo,
  ilkStatus,
  onMint,
  buttonContent,
  liquidationRatio,
  balance,
  lockedBalance,
  debt,
}) => {
  const { price } = ilkStatus;
  const { t } = useTranslation('common', { keyPrefix: 'forms.mint' });
  const { t: units } = useTranslation('common', { keyPrefix: 'units' });

  const [amountText, setAmountText] = useState('');
  const collateralAmount = useMemo(
    () => toFixedNumberOrUndefined(amountText, ilkInfo.gem.format),
    [amountText, ilkInfo.gem.format],
  );
  // input as percentage, return as ratio
  const [ratioText, setRatioText] = useState(() => {
    const initialRatio = liquidationRatio
      .toFormat(COL_RATIO_FORMAT)
      .mulUnsafe(CENT.toFormat(COL_RATIO_FORMAT))
      .toFormat(FixedFormat.from(0));
    return initialRatio.toString();
  });
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

  const onAmountChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => setAmountText(cutDecimals(pickNumbers(event.target.value), ilkInfo.gem.format.decimals)),
    [ilkInfo.gem.format.decimals],
  );
  const onRatioChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => setRatioText(cutDecimals(pickNumbers(event.target.value), 0)),
    [],
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

  const formErrors: FormError[] = useMemo(() => {
    const { debtMultiplier, normalizedDebt, debtCeiling, debtFloor } = ilkStatus;
    const errors = [];
    // Insufficient balance
    // (Amount to use as collateral) - (Amount available) < 0
    if (collateralAmount && balance.subUnsafe(collateralAmount).isNegative()) {
      errors.push(FormError.insufficientBalance);
    }
    const formats = UnitFormats.RAD;

    // CollateralizationRatio is below liquidation ratio
    // Vat.ilk.rate * (Vat.urn.art + daiAmount) < Vat.urn.spot * (Vat.urn.ink + collateralAmount)
    if (collateralAmount && !(debt.isZero() && daiAmount.isZero())) {
      const currentDebt = debtMultiplier
        .toFormat(formats)
        .mulUnsafe(debt.toFormat(formats).addUnsafe(daiAmount.toFormat(formats)));
      const currentSurplus = price
        .toFormat(formats)
        .mulUnsafe(lockedBalance.toFormat(formats).addUnsafe(collateralAmount.toFormat(formats)));

      if (currentSurplus.subUnsafe(currentDebt).isNegative()) {
        errors.push(FormError.collateralTooLow);
      }
    }

    // Amount of debt is below debt floor
    // Vat.ilk.rate * (urn.art + daiAmount) - Vat.ilk.dust < 0
    if (
      !daiAmount.isZero() &&
      debtMultiplier
        .toFormat(formats)
        .mulUnsafe(debt.toFormat(formats).addUnsafe(daiAmount.toFormat(formats)))
        .subUnsafe(debtFloor.toFormat(formats))
        .isNegative()
    ) {
      errors.push(FormError.debtTooLow);
    }

    // Amount of debt is above debt ceiling
    // Vat.ilk.line - (Vat.ilk.Art + daiAmount) * Vat.ilk.rate < 0
    const totalIssued = normalizedDebt
      .toFormat(formats)
      .addUnsafe(daiAmount.toFormat(formats))
      .mulUnsafe(debtMultiplier.toFormat(formats));
    if (debtCeiling.subUnsafe(totalIssued).isNegative()) {
      errors.push(FormError.issuingTooMuchCoins);
    }
    return errors;
  }, [balance, collateralAmount, daiAmount, ilkStatus, debt, lockedBalance, price]);

  const showErrorMessage = (e: FormError) => {
    switch (e) {
      case FormError.insufficientBalance:
        return t('error.insufficientBalance');
      case FormError.collateralTooLow:
        return t('error.collateralTooLow');
      case FormError.debtTooLow:
        return t('error.debtTooLow');
      case FormError.issuingTooMuchCoins:
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
            value={amountText}
            onChange={onAmountChange}
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
            onChange={onRatioChange}
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
