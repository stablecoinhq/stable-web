/* eslint-disable @typescript-eslint/naming-convention */
import AddIcon from '@mui/icons-material/Add';
import { Box, Card, CardContent, CardHeader, CircularProgress, Fab, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import useSWR from 'swr';

import useChainLog from 'ethereum/react/useChainLog';

import getTranslationProps from '../getTranslationProps';

import VaultTable from './[id]/VaultTable';

import type { NextPageWithEthereum } from 'next';

const Page: NextPageWithEthereum = ({ provider }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.vault' });
  const chainLog = useChainLog(provider);
  const { data, isLoading } = useSWR('getCPDS', async () => {
    const getCDPs = await chainLog.getCDPs();
    const proxyRegistry = await chainLog.proxyRegistry();
    const proxy = await proxyRegistry.getDSProxy();
    const cdps = proxy ? await getCDPs.getCDPs(proxy) : [];
    return cdps;
  });

  if (isLoading || !data) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

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
        <Box display="flex" justifyContent="center" padding={2}>
          {data.length === 0 ? <Typography variant="subtitle1">{t('noVaults')}</Typography> : <VaultTable cdps={data} />}
        </Box>
      </CardContent>
    </Card>
  );
};

export const getStaticProps = getTranslationProps;
export default Page;
