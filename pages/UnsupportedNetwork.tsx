import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Stack, SvgIcon, Typography } from '@mui/material';
import { useCallback } from 'react';

import { UnsupportedNetworkError } from 'contracts/ChainLogHelper';

import { isMetaMaskInPageProvider } from './ethereum/useEthereumProvider';

import type { ExternalProvider } from '@ethersproject/providers';
import type { FC } from 'react';
import type { FallbackProps } from 'react-error-boundary';

export type UnsupportedNetworkProps = FallbackProps & {
  externalProvider: ExternalProvider;
};

export const propagateError = (err: Error) => {
  if (err !== UnsupportedNetworkError) {
    throw err;
  }
};

const UnsupportedNetwork: FC<UnsupportedNetworkProps> = ({ error, externalProvider }) => {
  const changeNetwork = useCallback(() => {
    if (isMetaMaskInPageProvider(externalProvider)) {
      void externalProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [
          {
            chainId: '0x5', // TODO: change to MainNet
          },
        ],
      });
    }
  }, [externalProvider]);

  propagateError(error);

  return (
    <Stack direction="column" alignItems="center" padding={2}>
      <Box width={128} height={128}>
        <SvgIcon component={WarningIcon} inheritViewBox style={{ fontSize: 128 }} color="error" />
      </Box>
      <Typography variant="h6" component="div" padding={2}>
        選択されたネットワークはサポートされていません。
        <br />
        MetaMaskで別のネットワークを選択してください。
      </Typography>
      <Button variant="contained" onClick={changeNetwork}>
        ネットワークを変更
      </Button>
    </Stack>
  );
};

export default UnsupportedNetwork;
