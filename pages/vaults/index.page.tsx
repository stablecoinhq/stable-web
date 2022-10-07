import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';

import { useChainLog, useDSProxy, useGetCDPs, useProxyRegistry } from 'pages/ethereum/ContractHooks';
import usePromiseFactory from 'pages/usePromiseFactory';

import type { CDP } from 'contracts/GetCDPsHelper';
import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

type ContentProps = {
  cdps: CDP[] | undefined;
};

const Content: FC<ContentProps> = ({ cdps }) => {
  const router = useRouter();
  const baseUrl = '/vaults/';

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
          <ListItemButton onClick={() => router.push(baseUrl + id.toHexString())}>
            <ListItemIcon>
              <AccountBalanceWalletIcon />
            </ListItemIcon>
            <ListItemText primary={`${ilk} (${id.toString()})`} secondary={urn} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

const Page: NextPageWithEthereum = ({ ethereum, account }) => {
  const router = useRouter();
  const chainLog = useChainLog(ethereum);
  const getCDPs = useGetCDPs(chainLog);
  const proxyRegistry = useProxyRegistry(chainLog);
  const dsProxy = useDSProxy(proxyRegistry, account);
  const cdps = usePromiseFactory(
    useCallback(async () => (dsProxy ? getCDPs?.getCDPs(dsProxy) : undefined), [dsProxy, getCDPs]),
  );

  const proxyExists = dsProxy && dsProxy.address !== ethers.constants.AddressZero;

  const [proxyPrepared, setProxyPrepared] = useState(false);

  const newProxy = async () => {
    if (!proxyPrepared) {
      await proxyRegistry?.buildNewProxy();
    }
    setProxyPrepared(true);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5">Vaults</Typography>
        {proxyExists ? (
          <Button fullWidth onClick={() => router.push('/vaults/open')}>
            Open a new Vault
          </Button>
        ) : (
          <Button fullWidth onClick={newProxy}>
            Prepare Proxy
          </Button>
        )}
        <Content cdps={cdps} />
      </CardContent>
    </Card>
  );
};

export default Page;
