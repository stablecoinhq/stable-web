import { CardHeader, Grid } from '@mui/material';
import { FixedNumber } from 'ethers';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';

import BnHelperText from 'component/BnHelperText';
import Vault from 'ethereum/Vault';
import { UnitFormats } from 'ethereum/helpers/math';

import BNText from './BNText';

import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus, UrnStatus } from 'ethereum/contracts/VatHelper';
import type { ValidValue } from 'ethereum/helpers/ValidValue';
import type { FC } from 'react';

export type CurrentVaultStatus = {
  collateralizationRatio: ValidValue;
  liquidationPrice: ValidValue;
  collateralAmount: ValidValue;
  debt: ValidValue;
};

export type VaultStatusCardProps = {
  urnStatus: UrnStatus;
  ilkStatus: IlkStatus;
  ilkInfo: IlkInfo;
  liquidationRatio: FixedNumber;
  current?: CurrentVaultStatus;
};

const VaultStatusCard: FC<VaultStatusCardProps> = ({ urnStatus, ilkStatus, liquidationRatio, ilkInfo, current }) => {
  const { t } = useTranslation('common', { keyPrefix: 'cards.vault' });
  const { t: units } = useTranslation('common', { keyPrefix: 'units' });
  const debt = useMemo(
    () => Vault.getDebt(urnStatus.debt, ilkStatus.debtMultiplier),
    [urnStatus.debt, ilkStatus.debtMultiplier],
  );
  const { urn, lockedBalance, debt: urnDebt } = urnStatus;
  const collateralizationRatio = useMemo(() => {
    const calcFormat = UnitFormats.RAY;
    if (urnDebt.isZero()) {
      return FixedNumber.fromString('0', calcFormat);
    }
    return Vault.getCollateralizationRatio(lockedBalance, urnDebt, liquidationRatio, ilkStatus);
  }, [ilkStatus, lockedBalance, urnDebt, liquidationRatio]);

  const liquidationPrice = useMemo(
    () => Vault.getLiquidationPrice(lockedBalance, urnDebt, ilkStatus.debtMultiplier, liquidationRatio),
    [ilkStatus.debtMultiplier, liquidationRatio, lockedBalance, urnDebt],
  );
  return (
    <>
      <CardHeader title={t('title')} subheader={urn} />
      <Grid container padding={2} spacing={2}>
        <BNText
          label={t('colRatio')}
          value={collateralizationRatio}
          unit="%"
          helperText={<BnHelperText num={current?.collateralizationRatio.value} unit="%" noComma />}
          error={current?.collateralizationRatio.isInvalid}
          noCommas
        />
        <BNText
          label={t('lockedCollateral')}
          value={lockedBalance}
          tooltipText={t('lockedCollateralDesc')}
          unit={ilkInfo.symbol}
          helperText={<BnHelperText num={current?.collateralAmount.value} unit={ilkInfo.symbol} />}
          error={current?.collateralAmount.isInvalid}
        />
        <BNText
          label={t('debt')}
          value={debt}
          tooltipText={t('debtDesc')}
          unit={units('stableToken')}
          helperText={<BnHelperText num={current?.debt.value} unit={units('stableToken')} />}
          error={current?.debt.isInvalid}
        />
        <BNText
          label={t('liquidationPrice')}
          tooltipText={t('liquidationPriceDesc', { collateral: ilkInfo.name })}
          value={liquidationPrice}
          helperText={<BnHelperText num={current?.liquidationPrice.value} unit={units('jpy')} />}
          unit={units('jpy')}
          error={current?.liquidationPrice.isInvalid}
        />
      </Grid>
    </>
  );
};

export default VaultStatusCard;
