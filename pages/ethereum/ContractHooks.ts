import { useCallback, useMemo } from 'react';

import ChainLogHelper from 'contracts/ChainLogHelper';
import ethereumProvider from 'contracts/ethereumProvider';
import usePromiseFactory from 'pages/usePromiseFactory';

import type { EthereumAccount } from './useAccount';
import type { MetaMaskInpageProvider } from '@metamask/providers';
import type ProxyRegistryHelper from 'contracts/ProxyRegistryHelper';

export const useChainLog = (ethereum: MetaMaskInpageProvider) =>
  useMemo(() => new ChainLogHelper(ethereumProvider(ethereum)), [ethereum]);

export const useGetCDPs = (chainLog: ChainLogHelper) => usePromiseFactory(useCallback(() => chainLog.getCDPs(), [chainLog]));
export const useProxyRegistry = (chainLog: ChainLogHelper) =>
  usePromiseFactory(useCallback(() => chainLog.proxyRegistry(), [chainLog]));

export const useDSProxy = (proxyRegistry: ProxyRegistryHelper | undefined, account: EthereumAccount) =>
  usePromiseFactory(useCallback(async () => proxyRegistry?.getDSProxy(account.address), [proxyRegistry, account]));
