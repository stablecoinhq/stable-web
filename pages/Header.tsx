import { AppBar, Toolbar, Typography } from '@mui/material';
import Link from 'next/link';

import MetaMaskButton from './ethereum/MetaMaskButton';

import type { FC } from 'react';
import type { WithNullableEthereum } from 'types/next';

const Header: FC<WithNullableEthereum> = ({ externalProvider, provider }) => (
  <AppBar position="static">
    <Toolbar>
      <Link href="/">
        <Typography variant="h5" component="div" flexGrow={1} style={{ cursor: 'pointer' }}>
          stable-web
        </Typography>
      </Link>
      <MetaMaskButton externalProvider={externalProvider} provider={provider} />
    </Toolbar>
  </AppBar>
);

export default Header;
