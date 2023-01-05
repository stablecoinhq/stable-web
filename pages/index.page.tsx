/* eslint-disable i18next/no-literal-string */
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { FixedNumber } from 'ethers';
import { request, gql } from 'graphql-request';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import useSWR from 'swr';

import { UnitFormats } from 'ethereum/helpers/math';
import { useNumericDisplayContext } from 'store/NumericDisplayProvider';

import getTranslationProps from './getTranslationProps';

import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

type ActionProps = {
  cardTitle: string;
  cardBody: string;
  buttonTitle: string;
  href: string;
};

const Action: FC<ActionProps> = ({ cardTitle, cardBody, buttonTitle, href }) => (
  <Grid item xs={12} md={6}>
    <Card>
      <CardContent>
        <Typography variant="h5">{cardTitle}</Typography>
        <Typography variant="body2" color="text.secondary">
          {cardBody}
        </Typography>
      </CardContent>
      <CardActions>
        <Link href={href} passHref>
          <Button endIcon={<ArrowForwardIcon />} style={{ justifyContent: 'start' }} fullWidth>
            {buttonTitle}
          </Button>
        </Link>
      </CardActions>
    </Card>
  </Grid>
);

type StatProps = {
  systemStates: SystemStates;
};

const Stat: FC<{ value: string; description: string; unit?: string }> = ({ value, description, unit }) => (
  <Grid item xs={12} md={4} sx={{ paddingBottom: 1 }}>
    <Typography variant="h5" component="div">
      {value}
      {unit && ` ${unit}`}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  </Grid>
);
const Stats: FC<StatProps> = ({ systemStates }) => {
  const { format } = useNumericDisplayContext();

  const { t: home } = useTranslation('common', { keyPrefix: 'pages.home' });
  const { t: units } = useTranslation('common', { keyPrefix: 'units' });

  const { daiTotalSupply, vaultCount, totalSavingsInPot, unmanagedVaultCount } = systemStates;
  return (
    <Grid item xs={12}>
      <Card>
        <CardHeader title={home('protocolState')} sx={{ paddingBottom: 1 }} />
        <CardContent sx={{ padding: 0 }}>
          <Grid container padding={2}>
            <Stat value={format(daiTotalSupply).toString()} description={home('daiTotalSupply')} unit={units('stableToken')!} />
            <Stat
              value={format(totalSavingsInPot).toString()}
              description={home('totalSavingsInPot')}
              unit={units('stableToken')!}
            />
            <Stat value={(vaultCount + unmanagedVaultCount).toString()} description={home('activeVaults')} />
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

type SystemStates = {
  daiTotalSupply: FixedNumber;
  vaultCount: number;
  totalSavingsInPot: FixedNumber;
  unmanagedVaultCount: number;
};

const Home: NextPageWithEthereum = () => {
  const { t } = useTranslation('common', { keyPrefix: 'pages' });

  const { data, isLoading } = useSWR(process.env.NEXT_PUBLIC_GRAPH_URL!!, async (url) => {
    const query = gql`
      {
        systemStates {
          daiTotalSupply
          vaultCount
          totalSavingsInPot
          unmanagedVaultCount
        }
      }
    `;
    const res = await request(url, query, { mode: 'cors' });
    const systemStates = res.systemStates[0];
    return {
      daiTotalSupply: FixedNumber.fromString(systemStates.daiTotalSupply, UnitFormats.WAD),
      vaultCount: parseInt(systemStates.vaultCount, 10),
      totalSavingsInPot: FixedNumber.fromString(systemStates.totalSavingsInPot, UnitFormats.WAD),
      unmanagedVaultCount: parseInt(systemStates.unmanagedVaultCount, 10),
    } as SystemStates;
  });

  if (!data || isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Grid container spacing={4}>
        <Stats systemStates={data} />
        <Action
          cardTitle={t('vault.cardTitle')}
          cardBody={t('vault.cardDesc')}
          buttonTitle={t('vault.listTitle')}
          href="/vaults"
        />
        <Action cardTitle={t('earn.cardTitle')} cardBody={t('earn.cardDesc')} buttonTitle="Earn" href="/earn" />
      </Grid>
    </Stack>
  );
};

export const getStaticProps = getTranslationProps;
export default Home;
