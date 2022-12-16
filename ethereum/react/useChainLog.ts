import { useMemo } from 'react';

import ChainLogHelper from 'ethereum/contracts/ChainLogHelper';

import type EthereumProvider from 'ethereum/EthereumProvider';

const useChainLog = (provider: EthereumProvider) => useMemo(() => new ChainLogHelper(provider), [provider]);

export default useChainLog;
