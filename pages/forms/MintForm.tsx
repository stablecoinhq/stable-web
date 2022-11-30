import { FixedFormat } from '@ethersproject/bignumber';
import { Button, Card, Grid, InputAdornment, TextField, CircularProgress } from '@mui/material';
import { FixedNumber } from 'ethers';
import { useTranslation } from 'next-i18next';
import { useCallback, useMemo, useState } from 'react';

import Vault from 'ethereum/Vault';
import { UnitFormats, CENT, COL_RATIO_FORMAT } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers, toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import BNText from 'ethereum/react/cards/BNText';

import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { ChangeEventHandler, FC, MouseEventHandler, ReactNode } from 'react';

export type MintFormProps = {
  ilkInfo: IlkInfo;
  buttonContent: ReactNode;
  price: FixedNumber;
  liquidationRatio: FixedNumber;
  onMint: (amount: FixedNumber, ratio: FixedNumber) => Promise<void>;
};

const MintForm: FC<MintFormProps> = ({ ilkInfo, onMint, buttonContent, liquidationRatio, price }) => {
  const { t } = useTranslation('common', { keyPrefix: 'forms.mint' });
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
        <BNText label="Amount of DAIs to be minted." value={daiAmount} tooltipText="Amount of DAIs to be minted." unit="DAI" />
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
