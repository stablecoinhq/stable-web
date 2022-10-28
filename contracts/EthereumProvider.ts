import { Web3Provider } from '@ethersproject/providers';

import type { ExternalProvider } from '@ethersproject/providers';

export default class EthereumProvider extends Web3Provider {
  readonly chainId: string;
  readonly address: string;

  constructor(provider: ExternalProvider, chainId: string, address: string) {
    super(provider);
    this.chainId = chainId;
    this.address = address;
  }
}
