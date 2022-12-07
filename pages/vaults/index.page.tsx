/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable i18next/no-literal-string */
import AddIcon from '@mui/icons-material/Add';
import { Box, Card, CardContent, CardHeader, CircularProgress, Fab, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useCallback } from 'react';

import { useChainLog, useGetCDPs, useProxyRegistry } from 'ethereum/react/ContractHooks';
import usePromiseFactory from 'pages/usePromiseFactory';

import getTranslationProps from '../getTranslationProps';

import VaultTable from './[id]/VaultTable';

import type EthereumProvider from 'ethereum/EthereumProvider';
import type { CDP } from 'ethereum/contracts/GetCDPsHelper';
import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

const useCDPs = (provider: EthereumProvider): CDP[] | undefined => {
  const chainLog = useChainLog(provider);
  const getCDPs = useGetCDPs(chainLog);
  const proxyRegistry = useProxyRegistry(chainLog);
  return usePromiseFactory(
    useCallback(
      async () => getCDPs && proxyRegistry?.getDSProxy().then((proxy) => (proxy ? getCDPs?.getCDPs(proxy) : [])),
      [getCDPs, proxyRegistry],
    ),
  )[0];
};

type ContentProps = {
  cdps: CDP[] | undefined;
};

const Content: FC<ContentProps> = ({ cdps }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.vault' });

  if (!cdps) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (cdps.length === 0) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <Typography variant="subtitle1">{t('noVaults')}</Typography>
      </Box>
    );
  }

  return <VaultTable cdps={cdps} />;
};

const Page: NextPageWithEthereum = ({ provider }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.vault' });

  const cdps = useCDPs(provider);

  return (
    <Card elevation={0}>
      <CardHeader
        title={t('listTitle')}
        action={
          <Link href="/ilks" passHref>
            <Fab variant="extended" color="primary">
              <AddIcon sx={{ mr: 1 }} />
              {t('new')}
            </Fab>
          </Link>
        }
      />
      <CardContent>
        <Content cdps={cdps} />
      </CardContent>
    </Card>
  );
};

export const getStaticProps = getTranslationProps;
export default Page;
