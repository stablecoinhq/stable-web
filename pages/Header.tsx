import { AppBar, Toolbar, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';

import MetaMaskButton from './ethereum/MetaMaskButton';

import type { FC } from 'react';
import type { WithNullableEthereum } from 'types/next';

const Header: FC<WithNullableEthereum> = ({ externalProvider, provider }) => {
  const { t } = useTranslation('common', { keyPrefix: 'site' });

  return (
    <AppBar position="static">
      <Toolbar>
        <Link href="/">
          <Typography variant="h5" component="div" flexGrow={1} style={{ cursor: 'pointer' }}>
            {t('title')}
          </Typography>
        </Link>
        <MetaMaskButton externalProvider={externalProvider} provider={provider} />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
