import { Button, Card, Grid, InputAdornment, TextField } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';

import { cutDecimals, pickNumbers, toBigNumberOrUndefined } from './stringNumber';

import type { IlkInfo } from 'contracts/IlkRegistryHelper';
import type { BigNumber } from 'ethers';
import type { ChangeEventHandler, FC, MouseEventHandler, ReactNode } from 'react';

export type MintFormProps = {
  ilkInfo: IlkInfo;
  buttonContent: ReactNode;
  onMint: (amount: BigNumber, ratio: BigNumber) => Promise<void>;
};

const MintForm: FC<MintFormProps> = ({ ilkInfo, buttonContent, onMint }) => {
  const [amountText, setAmountText] = useState('');
  const amount = useMemo(() => toBigNumberOrUndefined(amountText, ilkInfo.dec.toNumber()), [amountText, ilkInfo.dec]);
  const [ratioText, setRatioText] = useState('150');
  const ratio = useMemo(() => toBigNumberOrUndefined(ratioText, 0), [ratioText]);
  const [minting, setMinting] = useState(false);

  const onAmountChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => setAmountText(cutDecimals(pickNumbers(event.target.value), ilkInfo.dec.toNumber())),
    [ilkInfo.dec],
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
            {buttonContent}
          </Button>
        </Grid>
      </Grid>
    </Card>
  );
};

export default MintForm;
