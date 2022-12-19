/* eslint-disable i18next/no-literal-string */
import { Box, Card, CardContent, CardHeader, CircularProgress, Grid, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import useSWR from 'swr';

import useChainLog from 'ethereum/react/useChainLog';

import getTranslationProps from '../getTranslationProps';

import IlkItem from './IlkItem';

import type { IlkItemProps } from './IlkItem';
import type ChainLogHelper from 'ethereum/contracts/ChainLogHelper';
import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

const useIlks = (chainLog: ChainLogHelper) =>
  useSWR('getIlks', async () => {
    const [ilkRegistry, vat, spot, jug] = await Promise.all([
      chainLog.ilkRegistry(),
      chainLog.vat(),
      chainLog.spot(),
      chainLog.jug(),
    ]);
    const list = await ilkRegistry.list();
    return Promise.all(
      list.map(async (ilk) => {
        const [ilkInfo, ilkStatus, liquidationRatio, stabilityFee] = await Promise.all([
          ilkRegistry.info(ilk),
          vat.getIlkStatus(ilk),
          spot.getLiquidationRatio(ilk),
          jug.getStabilityFee(ilk),
        ]);
        return {
          ilk,
          ilkInfo,
          ilkStatus,
          liquidationRatio,
          stabilityFee,
        };
      }),
    );
  });

type ContentProps = {
  ilks: IlkItemProps[] | undefined;
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
      {ilks.map(({ ilk, ilkInfo, ilkStatus, liquidationRatio, stabilityFee }) => (
        <IlkItem
          key={ilk.inString}
          ilk={ilk}
          ilkInfo={ilkInfo}
          ilkStatus={ilkStatus}
          liquidationRatio={liquidationRatio}
          stabilityFee={stabilityFee}
        />
      ))}
    </Grid>
  );
};

const OpenVault: NextPageWithEthereum = ({ provider }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.ilk' });
  const chainLog = useChainLog(provider);

  const ilks = useIlks(chainLog);

  return (
    <Card elevation={0}>
      <CardHeader title={t('openLabel')} />
      <CardContent>
        <Content ilks={ilks.data} />
      </CardContent>
    </Card>
  );
};

export const getStaticProps = getTranslationProps;
export default OpenVault;
