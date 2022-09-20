import detectEthereumProvider from '@metamask/detect-provider';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { ExternalProvider } from '@ethersproject/providers';

const useEthereum = (): ethers.providers.Web3Provider | null => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  useEffect(() => {
    detectEthereumProvider().then(async (it) => {
      if (it && it === window.ethereum) {
        const provider = it as ExternalProvider;
        setProvider(new ethers.providers.Web3Provider(provider));
      }
    });
  }, []);
  return provider;
};

export default useEthereum;
