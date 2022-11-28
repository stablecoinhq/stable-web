import { Button, Card, Grid, InputAdornment, TextField, CircularProgress } from '@mui/material';
import { FixedNumber } from 'ethers';
import { useCallback, useMemo, useState } from 'react';

import { COL_RATIO_FORMAT } from 'ethereum/Vault';

import { cutDecimals, pickNumbers, toFixedNumberOrUndefined } from './stringNumber';

import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { ChangeEventHandler, FC, MouseEventHandler, ReactNode } from 'react';

const CENT = FixedNumber.fromString('100', COL_RATIO_FORMAT);

export type MintFormProps = {
  ilkInfo: IlkInfo;
  buttonContent: ReactNode;
  onMint: (amount: FixedNumber, ratio: FixedNumber) => Promise<void>;
};

const MintForm: FC<MintFormProps> = ({ ilkInfo, onMint, buttonContent }) => {
  const [amountText, setAmountText] = useState('');
  const amount = useMemo(() => toFixedNumberOrUndefined(amountText, ilkInfo.gem.format), [amountText, ilkInfo.gem.format]);
  // input as percentage, return as ratio
  const [ratioText, setRatioText] = useState('150');
  const ratio = useMemo(() => toFixedNumberOrUndefined(ratioText, COL_RATIO_FORMAT)?.divUnsafe(CENT), [ratioText]);
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
    if (!amount || !ratio) {
      return;
    }

    setMinting(true);
    onMint(amount, ratio).finally(() => {
      setMinting(false);
    });
  }, [amount, onMint, ratio]);

  return (
    <Card component="form" elevation={0}>
      <Grid container padding={2} spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label={`Amount of ${ilkInfo.name} to lock`}
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
            label="Collateralization Ratio"
            value={ratioText}
            onChange={onRatioChange}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
          />
        </Grid>

        <Grid item xs={12}>
          <Button variant="contained" fullWidth disabled={!amount || !ratio || minting} onClick={onButtonClick}>
            {minting ? <CircularProgress /> : buttonContent}
          </Button>
        </Grid>
      </Grid>
    </Card>
  );
};

export default MintForm;
