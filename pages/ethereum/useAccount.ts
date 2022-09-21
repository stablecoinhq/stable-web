import { useEffect, useMemo, useState } from 'react';

import type { ethers } from 'ethers';

export type EthereumAccount = {
  chainId: string;
  address: string;
};

const useAccount = (ethereum: ethers.providers.Web3Provider | null) => {
  const [chainId, setChainId] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const account = useMemo<EthereumAccount | null>(() => {
    if (chainId && address) {
      return { chainId, address };
    }
    return null;
  }, [chainId, address]);

  useEffect(() => {
    if (!ethereum) {
      return () => {};
    }

    const setFirstAddress = (addresses: string[]) => setAddress(addresses[0] || null);

    if (ethereum.provider.request) {
      ethereum.provider.request({ method: 'eth_chainId' }).then(setChainId);
      ethereum.provider.request({ method: 'eth_requestAccounts', params: [] }).then(setFirstAddress);
    }

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
