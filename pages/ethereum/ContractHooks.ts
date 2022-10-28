import { useCallback, useMemo } from 'react';

import ChainLogHelper from 'contracts/ChainLogHelper';
import usePromiseFactory from 'pages/usePromiseFactory';

import type EthereumProvider from 'contracts/EthereumProvider';

export const useChainLog = (provider: EthereumProvider) => useMemo(() => new ChainLogHelper(provider), [provider]);

export const useCDPManager = (chainLog: ChainLogHelper) =>
  usePromiseFactory(useCallback(() => chainLog.dssCDPManager(), [chainLog]));
export const useGetCDPs = (chainLog: ChainLogHelper) => usePromiseFactory(useCallback(() => chainLog.getCDPs(), [chainLog]));
export const useProxyRegistry = (chainLog: ChainLogHelper) =>
  usePromiseFactory(useCallback(() => chainLog.proxyRegistry(), [chainLog]));
