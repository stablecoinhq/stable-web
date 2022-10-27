import { useCallback, useMemo } from 'react';

import ChainLogHelper from 'contracts/ChainLogHelper';
import usePromiseFactory from 'pages/usePromiseFactory';

import type { Web3Provider } from '@ethersproject/providers';

export const useChainLog = (ethereum: Web3Provider) => useMemo(() => new ChainLogHelper(ethereum), [ethereum]);

export const useCDPManager = (chainLog: ChainLogHelper) =>
  usePromiseFactory(useCallback(() => chainLog.dssCDPManager(), [chainLog]));
export const useGetCDPs = (chainLog: ChainLogHelper) => usePromiseFactory(useCallback(() => chainLog.getCDPs(), [chainLog]));
export const useProxyRegistry = (chainLog: ChainLogHelper) =>
  usePromiseFactory(useCallback(() => chainLog.proxyRegistry(), [chainLog]));
