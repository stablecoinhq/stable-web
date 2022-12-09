import { FixedFormat } from '@ethersproject/bignumber';
import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Card, CardContent, CardHeader, CircularProgress, Stack, SvgIcon, Typography } from '@mui/material';
import { FixedNumber } from 'ethers';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';

import IlkType from 'ethereum/IlkType';
import Vault from 'ethereum/Vault';
import { CENT, COL_RATIO_FORMAT, UnitFormats } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers } from 'ethereum/helpers/stringNumber';
import { useChainLog } from 'ethereum/react/ContractHooks';
import IlkStatusCard, { useIlkStatusCardProps } from 'ethereum/react/cards/IlkStatusCard';
import WalletStatusCard from 'ethereum/react/cards/WalletStatusCard';
import MintForm from 'pages/forms/MintForm';
import getEmptyPaths from 'pages/getEmptyPaths';
import getTranslationProps from 'pages/getTranslationProps';
import { getStringQuery } from 'pages/query';
import usePromiseFactory from 'pages/usePromiseFactory';

import type EthereumProvider from 'ethereum/EthereumProvider';
import type ChainLogHelper from 'ethereum/contracts/ChainLogHelper';
import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus } from 'ethereum/contracts/VatHelper';
import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

const InvalidIlk: FC = () => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.ilk' });

  return (
    <Stack direction="column" alignItems="center" padding={2}>
      <Box width={128} height={128}>
        <SvgIcon component={WarningIcon} inheritViewBox style={{ fontSize: 128 }} color="error" />
      </Box>
      <Typography variant="h6" component="div" padding={2}>
        {t('notFound')}
      </Typography>
      <Link href="/ilks" passHref>
        <Button variant="contained">{t('backToList')}</Button>
      </Link>
    </Stack>
  );
};

type OpenVaultProps = {
  chainLog: ChainLogHelper;
  ilkInfo: IlkInfo;
  ilkStatus: IlkStatus;
  liquidationRatio: FixedNumber;
  balance: FixedNumber;
};

const OpenVault: FC<OpenVaultProps> = ({ chainLog, ilkInfo, ilkStatus, liquidationRatio, balance }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.ilk' });

  const router = useRouter();
  const openVault = useCallback(
    async (amount: FixedNumber, ratio: FixedNumber) => {
      await Vault.open(chainLog, ilkInfo, ilkStatus, liquidationRatio, amount, ratio);
      await router.push('/vaults');
    },
    [chainLog, ilkInfo, ilkStatus, liquidationRatio, router],
  );

  const [amountText, setAmountText] = useState('');
  const [ratioText, setRatioText] = useState(() => {
    const initialRatio = liquidationRatio
      .toFormat(COL_RATIO_FORMAT)
      .mulUnsafe(CENT.toFormat(COL_RATIO_FORMAT))
      .toFormat(FixedFormat.from(0));
    return initialRatio.toString();
  });

  const onAmountChange = useCallback(
    (value: string) => setAmountText(cutDecimals(pickNumbers(value), ilkInfo.gem.format.decimals)),
    [ilkInfo.gem.format.decimals],
  );
  const onRatioChange = useCallback((value: string) => setRatioText(cutDecimals(pickNumbers(value), 0)), []);

  return (
    <MintForm
      ilkInfo={ilkInfo}
      buttonContent={t('openLabel')}
      onMint={openVault}
      liquidationRatio={liquidationRatio}
      ilkStatus={ilkStatus}
      balance={balance}
      debt={FixedNumber.fromString('0', UnitFormats.WAD)}
      lockedBalance={FixedNumber.fromString('0', UnitFormats.WAD)}
      onAmountChange={onAmountChange}
      onRatioChange={onRatioChange}
      amountText={amountText}
      ratioText={ratioText}
    />
  );
};

type ContentProps = {
  provider: EthereumProvider;
  ilkType: IlkType;
};

const Content: FC<ContentProps> = ({ provider, ilkType }) => {
  const chainLog = useChainLog(provider);
  const ilkCard = useIlkStatusCardProps(chainLog, ilkType);
  const [balance] = usePromiseFactory(
    useCallback(async () => {
      if (ilkCard) {
        return ilkCard.ilkInfo.gem.getBalance();
      }
    }, [ilkCard]),
  );

  if (!ilkCard || !balance) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (!ilkCard.ilkInfo.name) {
    return <InvalidIlk />;
  }

  return (
    <Stack padding={2} spacing={2}>
      <IlkStatusCard
        ilkInfo={ilkCard.ilkInfo}
        ilkStatus={ilkCard.ilkStatus}
        liquidationRatio={ilkCard.liquidationRatio}
        stabilityFee={ilkCard.stabilityFee}
      />
      <WalletStatusCard address={provider.address} balance={balance} label="Balance" unit={ilkCard.ilkInfo.symbol} />
      <OpenVault
        chainLog={chainLog}
        ilkInfo={ilkCard.ilkInfo}
        ilkStatus={ilkCard.ilkStatus}
        liquidationRatio={ilkCard.liquidationRatio}
        balance={balance}
      />
    </Stack>
  );
};

const OpenVaultForIlk: NextPageWithEthereum = ({ provider }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.ilk' });

  const router = useRouter();
  const ilkType = useMemo(() => {
    const typeInString = getStringQuery(router.query.ilk);
    return typeInString && IlkType.fromString(typeInString);
  }, [router.query.ilk]);

  if (!ilkType) {
    return <InvalidIlk />;
  }

  return (
    <Card elevation={0}>
      <CardHeader title={t('openLabel', { ilk: ilkType.inString })} />
      <CardContent>
        <Content provider={provider} ilkType={ilkType} />
      </CardContent>
    </Card>
  );
};

export const getStaticPaths = getEmptyPaths;
export const getStaticProps = getTranslationProps;
export default OpenVaultForIlk;
