import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Stack, SvgIcon, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { useCallback } from 'react';

import { UnsupportedNetworkError } from 'ethereum/contracts/ChainLogHelper';
import { isMetaMaskInPageProvider } from 'ethereum/react/useEthereumProvider';

import type { ExternalProvider } from '@ethersproject/providers';
import type { FC } from 'react';

export type UnsupportedNetworkProps = {
  externalProvider: ExternalProvider;
};

export const propagateError = (err: Error) => {
  if (err !== UnsupportedNetworkError) {
    throw err;
  }
};

const UnsupportedNetwork: FC<UnsupportedNetworkProps> = ({ externalProvider }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.errors' });

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

  return (
    <Stack direction="column" alignItems="center" padding={2}>
      <Box width={128} height={128}>
        <SvgIcon component={WarningIcon} inheritViewBox style={{ fontSize: 128 }} color="error" />
      </Box>
      {/* eslint-disable-next-line react/no-danger,@typescript-eslint/naming-convention */}
      <Typography variant="h6" component="div" padding={2} dangerouslySetInnerHTML={{ __html: t('unsupportedNetwork') }} />
      <Button variant="contained" onClick={changeNetwork}>
        {t('changeNetwork')}
      </Button>
    </Stack>
  );
};

export default UnsupportedNetwork;
