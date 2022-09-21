import { useCallback, useMemo } from 'react';

import ChainLogHelper from 'contracts/ChainLogHelper';
import usePromiseFactory from 'pages/usePromiseFactory';

import type { EthereumAccount } from './useAccount';
import type ProxyRegistryHelper from 'contracts/ProxyRegistryHelper';
import { ethers } from 'ethers';

export const useChainLog = (ethereum: ethers.Signer) =>
  useMemo(() => new ChainLogHelper(ethereum), [ethereum]);

export const useGetCDPs = (chainLog: ChainLogHelper) => usePromiseFactory(useCallback(() => chainLog.getCDPs(), [chainLog]));
export const useProxyRegistry = (chainLog: ChainLogHelper) =>
  usePromiseFactory(useCallback(() => chainLog.proxyRegistry(), [chainLog]));

export const useDSProxy = (proxyRegistry: ProxyRegistryHelper | undefined, account: EthereumAccount) =>
  usePromiseFactory(useCallback(async () => proxyRegistry?.getDSProxy(account.address), [proxyRegistry, account]));
