import { Box, Stack, SvgIcon, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';

import MetaMaskIcon from 'images/metamask.svg';

import MetaMaskButton from './ethereum/MetaMaskButton';

import type { FC } from 'react';
import type { WithNullableEthereum } from 'types/next';

const WithoutEthereum: FC<WithNullableEthereum> = ({ externalProvider, provider }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.errors' });

  return (
    <Stack minHeight="calc(100vh - 64px)" justifyContent="center" alignItems="center">
      <Box width={128} height={128}>
        <SvgIcon component={MetaMaskIcon} inheritViewBox style={{ fontSize: 128 }} />
      </Box>
      <Typography variant="h6" component="div">
        {t('notConnected')}
      </Typography>
      <p>{t('requireConnection')}</p>
      <MetaMaskButton externalProvider={externalProvider} provider={provider} />
    </Stack>
  );
};

export default WithoutEthereum;
