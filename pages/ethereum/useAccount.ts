import { useEffect, useMemo, useState } from 'react';

import type { ExternalProvider, Web3Provider } from '@ethersproject/providers';
import type { MetaMaskInpageProvider } from '@metamask/providers';

export type EthereumAccount = {
  chainId: string;
  address: string;
};

export function isMetaMaskInPageProvider(provider: ExternalProvider): provider is ExternalProvider & MetaMaskInpageProvider {
  return provider.isMetaMask || false;
}

const useAccount = (ethereum: Web3Provider | null) => {
  const [chainId, setChainId] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const account = useMemo<EthereumAccount | null>(() => {
    if (chainId && address) {
      return { chainId, address };
    }
    return null;
  }, [chainId, address]);

  useEffect(() => {
    if (!ethereum || !isMetaMaskInPageProvider(ethereum.provider)) {
      return () => {};
    }

    const setFirstAddress = (addresses: string[]) => setAddress(addresses[0] || null);

    ethereum.provider.request({ method: 'eth_chainId' }).then(setChainId);
    ethereum.provider.request({ method: 'eth_accounts' }).then(setFirstAddress);

    ethereum.provider.on('chainChanged', setChainId);
    ethereum.provider.on('accountsChanged', setFirstAddress);

    return () => {
      if (!isMetaMaskInPageProvider(ethereum.provider)) {
        return;
      }

      ethereum.provider.removeListener('chainChanged', setChainId);
      ethereum.provider.removeListener('accountsChanged', setFirstAddress);
    };
  }, [ethereum]);

  return account;
};

export default useAccount;
