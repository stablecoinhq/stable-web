import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import {
  Box,
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
import { useCallback } from 'react';

import { useChainLog, useDSProxy, useGetCDPs, useProxyRegistry } from 'pages/ethereum/ContractHooks';
import usePromiseFactory from 'pages/usePromiseFactory';

import type { CDP } from 'contracts/GetCDPsHelper';
import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

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
          <ListItemButton>
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
  const chainLog = useChainLog(ethereum);
  const getCDPs = useGetCDPs(chainLog);
  const proxyRegistry = useProxyRegistry(chainLog);
  const dsProxy = useDSProxy(proxyRegistry, account);
  const cdps = usePromiseFactory(
    useCallback(async () => (dsProxy ? getCDPs?.getCDPs(dsProxy) : undefined), [dsProxy, getCDPs]),
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h5">Vaults</Typography>
        <Content cdps={cdps} />
      </CardContent>
    </Card>
  );
};

export default Page;
