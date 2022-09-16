import { Web3Provider } from '@ethersproject/providers';

import type { ExternalProvider } from '@ethersproject/providers';
import type { MetaMaskInpageProvider } from '@metamask/providers';

const ethereumProvider = (ethereum: MetaMaskInpageProvider) => new Web3Provider(ethereum as unknown as ExternalProvider);

export default ethereumProvider;
