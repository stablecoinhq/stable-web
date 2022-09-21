import { DSProxy__factory, ProxyRegistry__factory } from 'generated/types';

import type { Provider } from '@ethersproject/providers';
import type { ProxyRegistry } from 'generated/types';
import { ethers } from 'ethers';

export default class ProxyRegistryHelper {
  private readonly provider: ethers.Signer;
  private readonly contract: ProxyRegistry;

  constructor(provider: ethers.Signer, address: string) {
    this.provider = provider;
    this.contract = ProxyRegistry__factory.connect(address, provider);
  }

  getDSProxy(user: string) {
    return this.contract.proxies(user).then((address) => DSProxy__factory.connect(address, this.provider));
  }

  buildNewProxy() {
    return this.contract['build()']();
  }
}
