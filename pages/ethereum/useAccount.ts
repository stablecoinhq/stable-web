import { useEffect, useMemo, useState } from 'react';

import type { MetaMaskInpageProvider } from '@metamask/providers';

type EthereumAccount = {
  chainId: string;
  address: string;
};

const useAccount = (ethereum: MetaMaskInpageProvider) => {
  const [chainId, setChainId] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const account = useMemo<EthereumAccount | null>(() => {
    if (chainId && address) {
      return { chainId, address };
    }
    return null;
  }, [chainId, address]);

  useEffect(() => {
    const setFirstAddress = (addresses: string[]) => setAddress(addresses[0] || null);

    ethereum.request({ method: 'eth_chainId' }).then(setChainId);
    ethereum.request({ method: 'eth_accounts' }).then(setFirstAddress);

    ethereum.on('chainChanged', setChainId);
    ethereum.on('accountsChanged', setFirstAddress);

    return () => {
      ethereum.removeListener('chainChanged', setChainId);
      ethereum.removeListener('accountsChanged', setFirstAddress);
    };
  }, [ethereum]);

  return account;
};

export default useAccount;
