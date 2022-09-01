import { Button, SvgIcon } from '@mui/material';
import { useCallback } from 'react';

import MetaMaskIcon from 'images/metamask.svg';

import type { EthereumAccount } from './useAccount';
import type { MetaMaskInpageProvider } from '@metamask/providers';
import type { FC } from 'react';

export type MetaMaskButtonProps = {
  ethereum: MetaMaskInpageProvider | null;
  account: EthereumAccount | null;
};

const MetaMaskButton: FC<MetaMaskButtonProps> = ({ ethereum, account }) => {
  const text = (() => {
    if (!ethereum) {
      return 'Install MetaMask';
    }

    if (!account) {
      return 'Connect MetaMask';
    }

    return `${account.address.substring(0, 16)}... (${account.chainId})`;
  })();

  const onClick = useCallback(() => {
    if (!ethereum) {
      window.open('https://metamask.io/download/', '_blank')?.focus();
      return;
    }

    if (!account) {
      void ethereum.request({ method: 'eth_requestAccounts' });
    }
  }, [ethereum, account]);

  return (
    <Button variant="contained" startIcon={<SvgIcon component={MetaMaskIcon} inheritViewBox />} onClick={onClick}>
      {text}
    </Button>
  );
};

export default MetaMaskButton;
