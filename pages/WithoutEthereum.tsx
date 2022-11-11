import { Box, Stack, SvgIcon, Typography } from '@mui/material';

import MetaMaskIcon from 'images/metamask.svg';

import MetaMaskButton from './ethereum/MetaMaskButton';

import type { FC } from 'react';
import type { WithNullableEthereum } from 'types/next';

const WithoutEthereum: FC<WithNullableEthereum> = ({ externalProvider, provider }) => (
  <Stack minHeight="calc(100vh - 64px)" justifyContent="center" alignItems="center">
    <Box width={128} height={128}>
      <SvgIcon component={MetaMaskIcon} inheritViewBox style={{ fontSize: 128 }} />
    </Box>
    <Typography variant="h6" component="div">
      Ethereumウォレットが接続されていません
    </Typography>
    <p>アプリケーションを利用するためには、MetaMaskをインストールしてEthereumウォレットを接続する必要があります。</p>
    <MetaMaskButton externalProvider={externalProvider} provider={provider} />
  </Stack>
);

export default WithoutEthereum;
