import { DSProxy__factory, ProxyRegistry__factory } from 'generated/types';

import type { Web3Provider } from '@ethersproject/providers';
import type { ProxyRegistry } from 'generated/types';

export default class ProxyRegistryHelper {
  private readonly provider: Web3Provider;
  private readonly contract: ProxyRegistry;

  constructor(provider: Web3Provider, address: string) {
    this.provider = provider;
    this.contract = ProxyRegistry__factory.connect(address, provider.getSigner());
  }

  getDSProxy(user: string) {
    return this.contract.proxies(user).then((address) => DSProxy__factory.connect(address, this.provider));
  }

  buildNewProxy() {
    return this.contract['build()']();
  }
}
