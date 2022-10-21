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

import type { Web3Provider } from '@ethersproject/providers';
import type EthereumAccount from 'contracts/EthereumAccount';
import type { CDP } from 'contracts/GetCDPsHelper';
import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

const useCDPs = (ethereum: Web3Provider, account: EthereumAccount): CDP[] | undefined => {
  const chainLog = useChainLog(ethereum);
  const getCDPs = useGetCDPs(chainLog);
  const proxyRegistry = useProxyRegistry(chainLog);
  return usePromiseFactory(
    useCallback(
      async () => getCDPs && proxyRegistry?.getDSProxy(account.address).then((proxy) => (proxy ? getCDPs?.getCDPs(proxy) : [])),
      [account, getCDPs, proxyRegistry],
    ),
  );
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
          <Link href={`/vaults/${id.toHexString()}`} passHref>
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

const Page: NextPageWithEthereum = ({ ethereum, account }) => {
  const cdps = useCDPs(ethereum, account);

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
