import { AppBar, Toolbar, Typography } from '@mui/material';

import MetaMaskButton from './ethereum/MetaMaskButton';

import type { FC } from 'react';
import type { WithNullableEthereum } from 'types/next';

const Header: FC<WithNullableEthereum> = ({ ethereum, account }) => (
  <AppBar position="static">
    <Toolbar>
      <Typography variant="h5" component="div" flexGrow={1}>
        stable-web
      </Typography>
      <MetaMaskButton ethereum={ethereum} account={account} />
    </Toolbar>
  </AppBar>
);

export default Header;
