/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable i18next/no-literal-string */
import AddIcon from '@mui/icons-material/Add';
import { Box, Card, CardContent, CardHeader, CircularProgress, Fab, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import useSWR from 'swr';

import useChainLog from 'ethereum/react/useChainLog';

import getTranslationProps from '../getTranslationProps';

import VaultTable from './[id]/VaultTable';

import type { CDP } from 'ethereum/contracts/GetCDPsHelper';
import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';
import type { SWRResponse } from 'swr';

type ContentProps = {
  cdps: SWRResponse<CDP[], Error>;
};

const Content: FC<ContentProps> = ({ cdps }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.vault' });

  if (cdps.isLoading || !cdps.data) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (cdps.data.length === 0) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <Typography variant="subtitle1">{t('noVaults')}</Typography>
      </Box>
    );
  }

  return <VaultTable cdps={cdps.data} />;
};

const Page: NextPageWithEthereum = ({ provider }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.vault' });
  const chainLog = useChainLog(provider);
  const cdps = useSWR('getCPDS', async () => {
    const getCDPs = await chainLog.getCDPs();
    const proxyRegistry = await chainLog.proxyRegistry();
    const proxy = await proxyRegistry.getDSProxy();
    const cpds = proxy ? await getCDPs.getCDPs(proxy) : undefined;
    return cpds || [];
  });

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
