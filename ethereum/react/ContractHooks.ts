import { useCallback, useMemo } from 'react';

import ChainLogHelper from 'ethereum/contracts/ChainLogHelper';
import usePromiseFactory from 'pages/usePromiseFactory';

import type EthereumProvider from 'ethereum/EthereumProvider';

export const useChainLog = (provider: EthereumProvider) => useMemo(() => new ChainLogHelper(provider), [provider]);

export const useCDPManager = (chainLog: ChainLogHelper) =>
  usePromiseFactory(useCallback(() => chainLog.dssCDPManager(), [chainLog]))[0];
export const useGetCDPs = (chainLog: ChainLogHelper) => usePromiseFactory(useCallback(() => chainLog.getCDPs(), [chainLog]))[0];
export const useProxyRegistry = (chainLog: ChainLogHelper) =>
  usePromiseFactory(useCallback(() => chainLog.proxyRegistry(), [chainLog]))[0];
