import { Button, SvgIcon } from '@mui/material';
import { useCallback } from 'react';

import MetaMaskIcon from 'images/metamask.svg';

import { isMetaMaskInPageProvider } from './useEthereumProvider';

import type { FC } from 'react';
import type { WithNullableEthereum } from 'types/next';

const MetaMaskButton: FC<WithNullableEthereum> = ({ externalProvider, provider }) => {
  const text = (() => {
    if (!externalProvider || !isMetaMaskInPageProvider(externalProvider)) {
      return 'Install MetaMask';
    }

    if (!provider) {
      return 'Connect MetaMask';
    }

    return `${provider.address.substring(0, 16)}... (${provider.chainId})`;
  })();

  const onClick = useCallback(() => {
    if (!externalProvider || !isMetaMaskInPageProvider(externalProvider)) {
      window.open('https://metamask.io/download/', '_blank')?.focus();
      return;
    }

    if (!provider) {
      void externalProvider.request({ method: 'eth_requestAccounts' });
    }
  }, [externalProvider, provider]);

  return (
    <Button
      variant="outlined"
      color="inherit"
      startIcon={<SvgIcon component={MetaMaskIcon} inheritViewBox />}
      onClick={onClick}
    >
      {text}
    </Button>
  );
};

export default MetaMaskButton;
