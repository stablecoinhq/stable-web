import { Button, Card, Grid, InputAdornment, TextField, CircularProgress } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { useCallback, useMemo, useState } from 'react';

import { UnitFormats } from 'contracts/math';

import { cutDecimals, pickNumbers, toFixedNumberOrUndefined } from './stringNumber';

import type { IlkInfo } from 'contracts/IlkRegistryHelper';
import type { FixedNumber } from 'ethers';
import type { FC, ChangeEventHandler, MouseEventHandler, ReactNode } from 'react';

export type BurnFormProps = {
  ilkInfo: IlkInfo;
  buttonContent: ReactNode;
  onBurn: (daiAmount: FixedNumber, colAmount: FixedNumber) => Promise<void>;
};

const BurnForm: FC<BurnFormProps> = ({ ilkInfo, onBurn, buttonContent }) => {
  const { t } = useTranslation('common', { keyPrefix: 'forms.burn' });
  const [daiText, setDaiText] = useState('');
  const daiAmount = useMemo(() => toFixedNumberOrUndefined(daiText, UnitFormats.WAD), [daiText]);
  const [colText, setColText] = useState('');
  const colAmount = useMemo(() => toFixedNumberOrUndefined(colText, ilkInfo.gem.format), [colText, ilkInfo.gem.format]);
  const [burning, setBurning] = useState(false);

  const onDaiChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => setDaiText(cutDecimals(pickNumbers(event.target.value), 18)),
    [],
  );
  const onColChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => setColText(cutDecimals(pickNumbers(event.target.value), ilkInfo.gem.format.decimals)),
    [ilkInfo.gem.format.decimals],
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

  return (
    <Card component="form" elevation={0}>
      <Grid container padding={2} spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
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
            label={t('freeAmount', { gem: ilkInfo.name })}
            value={colText}
            onChange={onColChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">{ilkInfo.symbol}</InputAdornment>,
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Button variant="contained" fullWidth disabled={!daiAmount || !colAmount || burning} onClick={onButtonClick}>
            {burning ? <CircularProgress /> : buttonContent}
          </Button>
        </Grid>
      </Grid>
    </Card>
  );
};

export default BurnForm;
