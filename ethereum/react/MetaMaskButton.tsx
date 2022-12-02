import { Button, SvgIcon } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { useCallback } from 'react';

import MetaMaskIcon from 'images/metamask.svg';

import { isMetaMaskInPageProvider } from './useEthereumProvider';

import type { FC } from 'react';
import type { WithNullableEthereum } from 'types/next';

const MetaMaskButton: FC<WithNullableEthereum> = ({ externalProvider, provider }) => {
  const { t } = useTranslation('common', { keyPrefix: 'metamask.buttons' });
  const text = (() => {
    if (!externalProvider || !isMetaMaskInPageProvider(externalProvider)) {
      return t('connect');
    }

    if (!provider) {
      return t('connect');
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
