import { Box, Card, CardContent, CardHeader, CircularProgress, Stack } from '@mui/material';
import { FixedNumber } from 'ethers';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import useSWR from 'swr';

import IlkType from 'ethereum/IlkType';
import Vault from 'ethereum/Vault';
import { UnitFormats } from 'ethereum/helpers/math';
import IlkStatusCard, { getIlkStatusProps } from 'ethereum/react/cards/IlkStatusCard';
import useChainLog from 'ethereum/react/useChainLog';
import MintFormController from 'pages/forms/MintFormController';
import getEmptyPaths from 'pages/getEmptyPaths';
import getTranslationProps from 'pages/getTranslationProps';
import { getStringQuery } from 'pages/query';
import { useErrorDialog } from 'store/ErrorDialogProvider';

import InvalidIlk from './InvalidIlk';

import type EthereumProvider from 'ethereum/EthereumProvider';
import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type ProxyRegistryHelper from 'ethereum/contracts/ProxyRegistryHelper';
import type { IlkStatus, UrnStatus } from 'ethereum/contracts/VatHelper';
import type { SubmitFormProps } from 'ethereum/react/form/SubmitForm';
import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

type OpenVaultProps = {
  ilkInfo: IlkInfo;
  proxyRegistry: ProxyRegistryHelper;
  proxyAddress: string | undefined;
  vault: Vault;
  ilkStatus: IlkStatus;
  liquidationRatio: FixedNumber;
  balance: FixedNumber;
  allowance: FixedNumber;
  address: string;
  update: () => void;
};

const OpenVault: FC<OpenVaultProps> = ({
  ilkInfo,
  proxyRegistry,
  vault,
  proxyAddress,
  ilkStatus,
  liquidationRatio,
  balance,
  address,
  allowance,
  update,
}) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.ilk' });
  const { t: errorMessage } = useTranslation('common', { keyPrefix: 'pages.ilk.errors' });
  const { t: common } = useTranslation('common');

  const { openDialog } = useErrorDialog();
  const router = useRouter();

  const openVault = useCallback(
    async (colAmount: FixedNumber, daiAmount: FixedNumber) => {
      await vault
        .open(colAmount, daiAmount)
        .then(() => router.push('/vaults'))
        .catch((e) => openDialog(errorMessage('errorWhileOpeningVault'), e));
    },
    [errorMessage, openDialog, router, vault],
  );

  const increaseAllowance = useCallback(
    async (n: FixedNumber) => {
      if (proxyAddress) {
        await ilkInfo.gem
          .ensureAllowance(proxyAddress, n, 5)
          .then(() => update())
          .catch((err) => openDialog(common('error.errorWhileIncreasingAllowance'), err));
      }
    },
    [common, ilkInfo.gem, openDialog, proxyAddress, update],
  );
  const createProxy = useCallback(
    () =>
      proxyRegistry
        .ensureDSProxy()
        .then(() => update())
        .catch((err) => openDialog(common('error.errorWhileCreatingProxy'), err)),
    [common, openDialog, proxyRegistry, update],
  );

  const zero = FixedNumber.fromString('0', UnitFormats.WAD);
  const urnStatus: UrnStatus = {
    urn: `0x${'0'.repeat(40)}`,
    freeBalance: zero,
    lockedBalance: zero,
    debt: zero,
  };

  const submitFormProps: SubmitFormProps = useMemo(
    () => ({
      createProxy,
      increaseAllowance,
      allowance,
      proxyAddress,
    }),
    [allowance, createProxy, increaseAllowance, proxyAddress],
  );

  return (
    <MintFormController
      submitFormProps={submitFormProps}
      ilkInfo={ilkInfo}
      ilkStatus={ilkStatus}
      urnStatus={urnStatus}
      mint={openVault}
      liquidationRatio={liquidationRatio}
      balance={balance}
      address={address}
      buttonContent={t('openLabel')}
      helperText={t('helperText')}
    />
  );
};

type ContentProps = {
  provider: EthereumProvider;
  ilkType: IlkType;
};

const Content: FC<ContentProps> = ({ provider, ilkType }) => {
  const chainLog = useChainLog(provider);
  const { data, isLoading, error, mutate } = useSWR('getData', async () => {
    const [ilkInfo, ilkStatus, liquidationRatio, stabilityFee] = await getIlkStatusProps(chainLog, ilkType);
    const proxyRegistry = await chainLog.proxyRegistry();
    const proxy = await proxyRegistry.getDSProxy();
    const [balance, vault, allowance] = await Promise.all([
      ilkInfo.gem.getBalance(),
      Vault.fromChainlog(chainLog, ilkInfo),
      proxy ? ilkInfo.gem.getAllowance(proxy.address) : FixedNumber.from('0', ilkInfo.gem.format),
    ]);
    return {
      ilkInfo,
      ilkStatus,
      liquidationRatio,
      stabilityFee,
      balance,
      allowance,
      vault,
      proxyRegistry,
      proxy: proxy?.address,
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

  const { ilkInfo, ilkStatus, liquidationRatio, stabilityFee, balance, allowance, vault, proxyRegistry, proxy } = data;
  return (
    <Stack padding={2} spacing={2}>
      <IlkStatusCard ilkInfo={ilkInfo} ilkStatus={ilkStatus} liquidationRatio={liquidationRatio} stabilityFee={stabilityFee} />
      <OpenVault
        ilkInfo={ilkInfo}
        ilkStatus={ilkStatus}
        vault={vault}
        liquidationRatio={liquidationRatio}
        balance={balance}
        allowance={allowance}
        address={provider.address}
        update={() => mutate()}
        proxyAddress={proxy}
        proxyRegistry={proxyRegistry}
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
