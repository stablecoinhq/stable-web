import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import type { ExternalProvider } from '@ethersproject/providers';

const useEthereum = (): ethers.providers.Web3Provider | null => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  useEffect(() => {
    detectEthereumProvider().then(async (it) => {
      if (it && it === window.ethereum) {
        const ethProvider = it as ExternalProvider;
        setProvider(new ethers.providers.Web3Provider(ethProvider));
      }
    });
  }, []);
  return provider;
};

export default useEthereum;
