import { DSProxy__factory, ProxyRegistry__factory } from 'generated/types';

import type { Provider } from '@ethersproject/providers';
import type { ProxyRegistry } from 'generated/types';

export default class ProxyRegistryHelper {
  private readonly provider: Provider;
  private readonly contract: ProxyRegistry;

  constructor(provider: Provider, address: string) {
    this.provider = provider;
    this.contract = ProxyRegistry__factory.connect(address, provider);
  }

  getDSProxy(user: string) {
    return this.contract.proxies(user).then((address) => DSProxy__factory.connect(address, this.provider));
  }
}
