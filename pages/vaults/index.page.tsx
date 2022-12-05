/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable i18next/no-literal-string */
import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Button,
  Card,
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

  return (
    <TableContainer>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Asset</TableCell>
            <TableCell align="right">Vault ID</TableCell>
            <TableCell align="right">Collateralization Ratio</TableCell>
            <TableCell align="right">Collateral Locked</TableCell>
            <TableCell align="right">Dai Debt</TableCell>
            <TableCell align="right">Manage</TableCell>
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
      <Content cdps={cdps} />
    </Card>
  );
};

export const getStaticProps = getTranslationProps;
export default Page;
