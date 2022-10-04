import { useCallback, useMemo } from 'react';

import ChainLogHelper from 'contracts/ChainLogHelper';
import usePromiseFactory from 'pages/usePromiseFactory';

import type { EthereumAccount } from './useAccount';
import type { Web3Provider } from '@ethersproject/providers';
import type ProxyRegistryHelper from 'contracts/ProxyRegistryHelper';

export const useChainLog = (ethereum: Web3Provider) => useMemo(() => new ChainLogHelper(ethereum), [ethereum]);

export const useGetCDPs = (chainLog: ChainLogHelper) => usePromiseFactory(useCallback(() => chainLog.getCDPs(), [chainLog]));
export const useProxyRegistry = (chainLog: ChainLogHelper) =>
  usePromiseFactory(useCallback(() => chainLog.proxyRegistry(), [chainLog]));

export const useDSProxy = (proxyRegistry: ProxyRegistryHelper | undefined, account: EthereumAccount) =>
  usePromiseFactory(useCallback(async () => proxyRegistry?.getDSProxy(account.address), [proxyRegistry, account]));

export const useVat = (chainlog: ChainLogHelper) => usePromiseFactory(useCallback(() => chainlog.vat(), [chainlog]));
