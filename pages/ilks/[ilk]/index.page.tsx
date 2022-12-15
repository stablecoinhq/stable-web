import { Box, Card, CardContent, CardHeader, CircularProgress, Stack } from '@mui/material';
import { FixedNumber } from 'ethers';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import IlkType from 'ethereum/IlkType';
import Vault from 'ethereum/Vault';
import { InvalidGemAddress } from 'ethereum/contracts/ERC20Helper';
import { UnitFormats } from 'ethereum/helpers/math';
import { useChainLog } from 'ethereum/react/ContractHooks';
import IlkStatusCard, { useIlkStatusCardProps } from 'ethereum/react/cards/IlkStatusCard';
import ErrorDialog from 'pages/ErrorDialog';
import MintFormController from 'pages/forms/MintFormController';
import getEmptyPaths from 'pages/getEmptyPaths';
import getTranslationProps from 'pages/getTranslationProps';
import { getStringQuery } from 'pages/query';
import usePromiseFactory from 'pages/usePromiseFactory';

import InvalidIlk from './InvalidIlk';

import type EthereumProvider from 'ethereum/EthereumProvider';
import type ChainLogHelper from 'ethereum/contracts/ChainLogHelper';
import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus, UrnStatus } from 'ethereum/contracts/VatHelper';
import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';
import type { FallbackProps } from 'react-error-boundary';

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

  const router = useRouter();
  const openVault = useCallback(
    async (amount: FixedNumber, ratio: FixedNumber) => {
      await Vault.open(chainLog, ilkInfo, amount, ratio);
      await router.push('/vaults');
    },
    [chainLog, ilkInfo, router],
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

  if (!ilkCard.ilkInfo.name || !ilkCard) {
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
      <OpenVault
        chainLog={chainLog}
        ilkInfo={ilkCard.ilkInfo}
        ilkStatus={ilkCard.ilkStatus}
        liquidationRatio={ilkCard.liquidationRatio}
        balance={balance}
        address={provider.address}
      />
    </Stack>
  );
};

const OpenVaultForIlk: NextPageWithEthereum = ({ provider }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.ilk' });
  const fallBack = useCallback((props: FallbackProps) => {
    switch (props.error) {
      case InvalidGemAddress:
        return <InvalidIlk />;
      default:
        return <ErrorDialog props={props} />;
    }
  }, []);

  const onError = useCallback((err: Error) => {
    switch (err) {
      case InvalidGemAddress:
        break;
      default:
        throw err;
    }
  }, []);

  const router = useRouter();
  const ilkType = useMemo(() => {
    const typeInString = getStringQuery(router.query.ilk);
    return typeInString && IlkType.fromString(typeInString);
  }, [router.query.ilk]);

  if (!ilkType) {
    return <InvalidIlk />;
  }

  return (
    <ErrorBoundary FallbackComponent={fallBack} onError={onError}>
      <Card elevation={0}>
        <CardHeader title={t('openLabel', { ilk: ilkType.inString })} />
        <CardContent>
          <Content provider={provider} ilkType={ilkType} />
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

export const getStaticPaths = getEmptyPaths;
export const getStaticProps = getTranslationProps;
export default OpenVaultForIlk;
