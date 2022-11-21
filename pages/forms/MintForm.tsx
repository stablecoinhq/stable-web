import { Button, Card, Grid, InputAdornment, TextField, CircularProgress } from '@mui/material';
import { FixedNumber } from 'ethers';
import { useTranslation } from 'next-i18next';
import { useCallback, useMemo, useState } from 'react';

import Vault, { COL_RATIO_FORMAT } from 'contracts/Vault';
import BNText from 'pages/ilks/[ilk]/BNText';

import { cutDecimals, pickNumbers, toFixedNumberOrUndefined } from './stringNumber';

import type { IlkInfo } from 'contracts/IlkRegistryHelper';
import type { ChangeEventHandler, FC, MouseEventHandler, ReactNode } from 'react';

const CENT = FixedNumber.fromString('100', COL_RATIO_FORMAT);

export type MintFormProps = {
  ilkInfo: IlkInfo;
  buttonContent: ReactNode;
  liquidationRatio: FixedNumber;
  debtMultiplier: FixedNumber;
  onMint: (amount: FixedNumber, ratio: FixedNumber) => Promise<void>;
};

const MintForm: FC<MintFormProps> = ({ ilkInfo, onMint, buttonContent, liquidationRatio, debtMultiplier }) => {
  const { t } = useTranslation('common', { keyPrefix: 'forms.mint' });

  const [amountText, setAmountText] = useState('');
  const collateralAmount = useMemo(
    () => toFixedNumberOrUndefined(amountText, ilkInfo.gem.format),
    [amountText, ilkInfo.gem.format],
  );
  // input as percentage, return as ratio
  const [ratioText, setRatioText] = useState('150');
  const ratio = useMemo(() => toFixedNumberOrUndefined(ratioText, COL_RATIO_FORMAT)?.divUnsafe(CENT), [ratioText]);
  const daiAmount = useMemo(() => {
    if (collateralAmount && ratio) {
      return Vault.getDaiAmount(collateralAmount, debtMultiplier, liquidationRatio, ratio);
    }
  }, [collateralAmount, ratio, debtMultiplier, liquidationRatio]);
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
        {daiAmount && <BNText label="Amount of DAI minted" value={daiAmount} />}
        <Grid item xs={12}>
          <Button variant="contained" fullWidth disabled={!collateralAmount || !ratio || minting} onClick={onButtonClick}>
            {minting ? <CircularProgress /> : buttonContent}
          </Button>
        </Grid>
      </Grid>
    </Card>
  );
};

export default MintForm;
