import detectEthereumProvider from '@metamask/detect-provider';
import { useEffect, useState } from 'react';

import type { MetaMaskInpageProvider } from '@metamask/providers';

const useEthereum = (): MetaMaskInpageProvider | null => {
  const [provider, setProvider] = useState<MetaMaskInpageProvider | null>(null);
  useEffect(() => {
    detectEthereumProvider().then((it) => {
      if (it === window.ethereum) {
        setProvider(it as MetaMaskInpageProvider | null);
      }
    });
  }, []);
  return provider;
};

export default useEthereum;
