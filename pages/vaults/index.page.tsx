import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Fab,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useCallback } from 'react';

import { useChainLog, useGetCDPs, useProxyRegistry } from 'pages/ethereum/ContractHooks';
import usePromiseFactory from 'pages/usePromiseFactory';

import type EthereumProvider from 'contracts/EthereumProvider';
import type { CDP } from 'contracts/GetCDPsHelper';
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
        <Typography variant="subtitle1">No vaults found.</Typography>
      </Box>
    );
  }

  return (
    <List>
      {cdps.map(({ id, urn, ilk }) => (
        <ListItem key={id.toString()} disablePadding>
          <Link href={`/vaults/${id.toString()}`} passHref>
            <ListItemButton>
              <ListItemIcon>
                <AccountBalanceWalletIcon />
              </ListItemIcon>
              <ListItemText primary={`${ilk.inString} (${id.toString()})`} secondary={urn} />
            </ListItemButton>
          </Link>
        </ListItem>
      ))}
    </List>
  );
};

const Page: NextPageWithEthereum = ({ provider }) => {
  const cdps = useCDPs(provider);

  return (
    <Card elevation={0}>
      <CardHeader
        title="Vaults"
        action={
          <Link href="/ilks" passHref>
            <Fab variant="extended" color="primary">
              <AddIcon sx={{ mr: 1 }} /> New Vault
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

export default Page;
