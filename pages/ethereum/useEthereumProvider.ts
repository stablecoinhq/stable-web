import detectEthereumProvider from '@metamask/detect-provider';
import { useEffect, useMemo, useState } from 'react';

import EthereumProvider from 'contracts/EthereumProvider';

import type { ExternalProvider } from '@ethersproject/providers';
import type { MetaMaskInpageProvider } from '@metamask/providers';

export function isMetaMaskInPageProvider(provider: ExternalProvider): provider is ExternalProvider & MetaMaskInpageProvider {
  return provider.isMetaMask || false;
}

const useEthereumProvider = (): [ExternalProvider | null, EthereumProvider | null] => {
  const [external, setExternal] = useState<ExternalProvider | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const provider = useMemo(
    () => (external && chainId && address ? new EthereumProvider(external, chainId, address) : null),
    [external, chainId, address],
  );

  useEffect(() => {
    detectEthereumProvider().then(async (it) => {
      if (it === window.ethereum) {
        setExternal(it as ExternalProvider);
      }
    });
  }, []);

  useEffect(() => {
    if (!external || !isMetaMaskInPageProvider(external)) {
      return () => {};
    }

    const setFirstAddress = (addresses: string[]) => setAddress(addresses[0] || null);

    external.request({ method: 'eth_chainId' }).then(setChainId);
    external.request({ method: 'eth_accounts' }).then(setFirstAddress);

    external.on('chainChanged', setChainId);
    external.on('accountsChanged', setFirstAddress);

    return () => {
      if (!isMetaMaskInPageProvider(external)) {
        return;
      }

      external.removeListener('chainChanged', setChainId);
      external.removeListener('accountsChanged', setFirstAddress);
    };
  }, [external]);

  return [external, provider];
};

export default useEthereumProvider;
