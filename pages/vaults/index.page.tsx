/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable i18next/no-literal-string */
import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useCallback } from 'react';

import { useChainLog, useGetCDPs, useProxyRegistry } from 'ethereum/react/ContractHooks';
import usePromiseFactory from 'pages/usePromiseFactory';

import getTranslationProps from '../getTranslationProps';

import type EthereumProvider from 'ethereum/EthereumProvider';
import type { CDP } from 'ethereum/contracts/GetCDPsHelper';
import type { NextPageWithEthereum } from 'next';
import type { FC, ReactNode } from 'react';

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

const TableHeadCell: FC<{ children: ReactNode; align?: 'left' | 'right' | 'center' }> = ({ children, align }) => (
  <TableCell align={align || 'right'} sx={{ fontWeight: 700 }}>
    {children}
  </TableCell>
);

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

  return (
    <TableContainer component={Card}>
      <Table sx={{ minWidth: 650 }} aria-label="cdp-table">
        <TableHead>
          <TableRow>
            <TableHeadCell align="left">Asset</TableHeadCell>
            <TableHeadCell>Vault ID</TableHeadCell>
            <TableHeadCell>Collateralization Ratio</TableHeadCell>
            <TableHeadCell>Collateral Locked</TableHeadCell>
            <TableHeadCell>Dai Debt</TableHeadCell>
            <TableHeadCell>Manage</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cdps.map(({ id, ilk, urnStatus, collateralizationRatio }) => (
            <TableRow key={id.toString()} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell component="th" scope="row">
                {ilk.inString}
              </TableCell>
              <TableCell align="right">{id.toString()}</TableCell>
              <TableCell align="right">{collateralizationRatio.round(1).toString()} %</TableCell>
              <TableCell align="right">{urnStatus.lockedBalance.toString()}</TableCell>
              <TableCell align="right">{urnStatus.debt.toString()}</TableCell>
              <TableCell align="right">
                <Link href={`/vaults/${id.toString()}`} passHref>
                  <Button variant="contained">Manage Vault</Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
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
