import { Box, Card, CardContent, CardHeader, CircularProgress, Stack } from '@mui/material';
import { FixedNumber } from 'ethers';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import useSWR from 'swr';

import IlkType from 'ethereum/IlkType';
import Vault from 'ethereum/Vault';
import { UnitFormats } from 'ethereum/helpers/math';
import IlkStatusCard from 'ethereum/react/cards/IlkStatusCard';
import useChainLog from 'ethereum/react/useChainLog';
import MintFormController from 'pages/forms/MintFormController';
import getEmptyPaths from 'pages/getEmptyPaths';
import getTranslationProps from 'pages/getTranslationProps';
import { getStringQuery } from 'pages/query';
import { useErrorDialog } from 'store/ErrorDialogProvider';

import InvalidIlk from './InvalidIlk';

import type EthereumProvider from 'ethereum/EthereumProvider';
import type ChainLogHelper from 'ethereum/contracts/ChainLogHelper';
import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus, UrnStatus } from 'ethereum/contracts/VatHelper';
import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

type OpenVaultProps = {
  chainLog: ChainLogHelper;
  ilkInfo: IlkInfo;
  ilkStatus: IlkStatus;
  liquidationRatio: FixedNumber;
  balance: FixedNumber;
  address: string;
};

const OpenVault: FC<OpenVaultProps> = ({ chainLog, ilkInfo, ilkStatus, liquidationRatio, balance, address }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.ilk' });
  const { t: errorMessage } = useTranslation('common', { keyPrefix: 'pages.ilk.errors' });
  const { openDialog } = useErrorDialog();
  const router = useRouter();

  const openVault = useCallback(
    async (amount: FixedNumber, ratio: FixedNumber) => {
      await Vault.open(chainLog, ilkInfo, amount, ratio)
        .then(() => router.push('/vaults'))
        .catch((_e) => openDialog(errorMessage('errorWhileOpeningVault')));
    },
    [chainLog, errorMessage, ilkInfo, openDialog, router],
  );

  const zero = FixedNumber.fromString('0', UnitFormats.WAD);
  const urnStatus: UrnStatus = {
    urn: `0x${'0'.repeat(40)}`,
    freeBalance: zero,
    lockedBalance: zero,
    debt: zero,
  };

  return (
    <MintFormController
      ilkInfo={ilkInfo}
      ilkStatus={ilkStatus}
      urnStatus={urnStatus}
      mint={openVault}
      liquidationRatio={liquidationRatio}
      balance={balance}
      address={address}
      buttonContent={t('openLabel')}
    />
  );
};

type ContentProps = {
  provider: EthereumProvider;
  ilkType: IlkType;
};

const Content: FC<ContentProps> = ({ provider, ilkType }) => {
  const chainLog = useChainLog(provider);
  const { data, isLoading, error } = useSWR('getData', async () => {
    const [ilkInfo, ilkStatus, liquidationRatio, stabilityFee] = await Promise.all([
      chainLog.ilkRegistry().then((ilkRegistry) => ilkRegistry.info(ilkType)),
      chainLog.vat().then((vat) => vat.getIlkStatus(ilkType)),
      chainLog.spot().then((spot) => spot.getLiquidationRatio(ilkType)),
      chainLog.jug().then((jug) => jug.getStabilityFee(ilkType)),
    ]);
    const balance = await ilkInfo.gem.getBalance();
    return {
      ilkInfo,
      ilkStatus,
      liquidationRatio,
      stabilityFee,
      balance,
    };
  });

  if (error) {
    return <InvalidIlk />;
  }

  if (!data || isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }
  const { ilkInfo, ilkStatus, liquidationRatio, stabilityFee, balance } = data;
  return (
    <Stack padding={2} spacing={2}>
      <IlkStatusCard ilkInfo={ilkInfo} ilkStatus={ilkStatus} liquidationRatio={liquidationRatio} stabilityFee={stabilityFee} />
      <OpenVault
        chainLog={chainLog}
        ilkInfo={ilkInfo}
        ilkStatus={ilkStatus}
        liquidationRatio={liquidationRatio}
        balance={balance}
        address={provider.address}
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
