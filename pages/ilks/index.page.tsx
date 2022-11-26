import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Box, Button, Card, CardActions, CardContent, CardHeader, CircularProgress, Grid, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useCallback } from 'react';

import ChainLogHelper from 'contracts/ChainLogHelper';
import usePromiseFactory from 'pages/usePromiseFactory';

import getTranslationProps from '../getTranslationProps';

import type EthereumProvider from 'contracts/EthereumProvider';
import type IlkType from 'contracts/IlkType';
import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

const useIlks = (provider: EthereumProvider) =>
  usePromiseFactory(
    useCallback(async () => new ChainLogHelper(provider).ilkRegistry().then((ilkRegistry) => ilkRegistry.list()), [provider]),
  )[0];

type RenderIlkProps = {
  ilk: IlkType;
};

const RenderIlk: FC<RenderIlkProps> = ({ ilk }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.ilk' });

  return (
    <Grid item xs={6}>
      <Card>
        <CardHeader title={ilk.inString} />
        <CardActions>
          <Link href={`/ilks/${ilk.inString}`} passHref>
            <Button endIcon={<ArrowForwardIcon />} style={{ justifyContent: 'start' }} fullWidth>
              {t('openDesc', { ilk: ilk.inString })}
            </Button>
          </Link>
        </CardActions>
      </Card>
    </Grid>
  );
};

type ContentProps = {
  ilks: IlkType[] | undefined;
};

const Content: FC<ContentProps> = ({ ilks }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.ilk' });

  if (!ilks) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (ilks.length === 0) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <Typography variant="subtitle1">{t('noIlks')}</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={4}>
      {ilks.map((ilk) => (
        <RenderIlk key={ilk.inString} ilk={ilk} />
      ))}
    </Grid>
  );
};

const OpenVault: NextPageWithEthereum = ({ provider }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.ilk' });

  const ilks = useIlks(provider);

  return (
    <Card elevation={0}>
      <CardHeader title={t('openLabel')} />
      <CardContent>
        <Content ilks={ilks} />
      </CardContent>
    </Card>
  );
};

export const getStaticProps = getTranslationProps;
export default OpenVault;
