import { Card, CardContent, CardHeader, Grid } from '@mui/material';
import { FixedNumber } from 'ethers';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';

import Vault from 'ethereum/Vault';
import { UnitFormats } from 'ethereum/helpers/math';
import { useNumericDisplayContext } from 'store/NumericDisplayProvider';

import BNText from './BNText';

import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus, UrnStatus } from 'ethereum/contracts/VatHelper';
import type { FC } from 'react';

export type ValidValue = {
  value: FixedNumber;
  isValid: boolean;
};

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
  const { format } = useNumericDisplayContext();
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
  const renderHelperText = (num: FixedNumber | undefined, unit: string, noComma?: boolean) =>
    num ? (
      <span style={{ fontSize: 13 }}>{`${format(num, noComma)} ${unit}`}</span>
    ) : (
      <span style={{ fontSize: 13 }}>&nbsp;</span>
    );
  return (
    <Card>
      <CardHeader title={t('title')} subheader={urn} />
      <CardContent>
        <Grid container padding={2} spacing={2}>
          <BNText
            label={t('colRatio')}
            value={collateralizationRatio}
            unit="%"
            helperText={renderHelperText(current?.collateralizationRatio.value, '%', true)}
            error={current?.collateralizationRatio.isValid}
            noCommas
          />
          <BNText
            label={t('lockedCollateral')}
            value={lockedBalance}
            tooltipText={t('lockedCollateralDesc')}
            unit={ilkInfo.symbol}
            helperText={renderHelperText(current?.collateralAmount.value, ilkInfo.symbol)}
            error={current?.collateralAmount.isValid}
          />
          <BNText
            label={t('debt')}
            value={debt}
            tooltipText={t('debtDesc')}
            unit={units('stableToken')}
            helperText={renderHelperText(current?.debt.value, units('stableToken'))}
            error={current?.debt.isValid}
          />
          <BNText
            label={t('liquidationPrice')}
            tooltipText={t('liquidationPriceDesc', { collateral: ilkInfo.name })}
            value={liquidationPrice}
            helperText={renderHelperText(current?.liquidationPrice.value, units('jpy'))}
            unit={units('jpy')}
            error={current?.liquidationPrice.isValid}
          />
        </Grid>
      </CardContent>
    </Card>
  );
};

export default VaultStatusCard;
