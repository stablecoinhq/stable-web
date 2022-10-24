import { Button, Card, Grid, InputAdornment, TextField } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';

import { cutDecimals, pickNumbers, toBigNumberOrUndefined } from './stringNumber';

import type { IlkInfo } from 'contracts/IlkRegistryHelper';
import type { BigNumber } from 'ethers';
import type { FC, ChangeEventHandler, MouseEventHandler, ReactNode } from 'react';

export type BurnFormProps = {
  ilkInfo: IlkInfo;
  buttonContent: ReactNode;
  onBurn: (daiAmount: BigNumber, colAmount: BigNumber) => Promise<void>;
};

const BurnForm: FC<BurnFormProps> = ({ ilkInfo, buttonContent, onBurn }) => {
  const [daiText, setDaiText] = useState('');
  const daiAmount = useMemo(() => toBigNumberOrUndefined(daiText, ilkInfo.dec.toNumber()), [daiText, ilkInfo.dec]);
  const [colText, setColText] = useState('');
  const colAmount = useMemo(() => toBigNumberOrUndefined(colText, ilkInfo.dec.toNumber()), [colText, ilkInfo.dec]);
  const [burning, setBurning] = useState(false);

  const onDaiChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => setDaiText(cutDecimals(pickNumbers(event.target.value), 18)),
    [],
  );
  const onColChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => setColText(cutDecimals(pickNumbers(event.target.value), ilkInfo.dec.toNumber())),
    [ilkInfo.dec],
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
            type="number"
            fullWidth
            label="Amount of DAI to redeem"
            value={daiText}
            onChange={onDaiChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">DAI</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            type="number"
            fullWidth
            label={`Amount of ${ilkInfo.name} to free`}
            value={colText}
            onChange={onColChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">{ilkInfo.symbol}</InputAdornment>,
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Button variant="contained" fullWidth disabled={!daiAmount || !colAmount || burning} onClick={onButtonClick}>
            {buttonContent}
          </Button>
        </Grid>
      </Grid>
    </Card>
  );
};

export default BurnForm;
