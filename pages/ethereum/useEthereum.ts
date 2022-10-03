import { Web3Provider } from '@ethersproject/providers';
import detectEthereumProvider from '@metamask/detect-provider';
import { useEffect, useState } from 'react';

import type { ExternalProvider } from '@ethersproject/providers';

const useEthereum = (): Web3Provider | null => {
  const [provider, setProvider] = useState<Web3Provider | null>(null);
  useEffect(() => {
    detectEthereumProvider().then(async (it) => {
      if (it === window.ethereum) {
        setProvider(new Web3Provider(it as ExternalProvider));
      }
    });
  }, []);
  return provider;
};

export default useEthereum;
