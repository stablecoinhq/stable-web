import { AddressZero } from '@ethersproject/constants';

import { DSProxy__factory, ProxyRegistry__factory } from 'generated/types';

import type EthereumProvider from '../EthereumProvider';
import type { ProxyRegistry } from 'generated/types';

export default class ProxyRegistryHelper {
  private readonly provider: EthereumProvider;
  private readonly contract: ProxyRegistry;

  constructor(provider: EthereumProvider, address: string) {
    this.provider = provider;
    this.contract = ProxyRegistry__factory.connect(address, provider.getSigner());
  }

  async getDSProxy() {
    const address = await this.contract.proxies(this.provider.address);
    if (address === AddressZero) {
      return undefined;
    }
    return DSProxy__factory.connect(address, this.provider.getSigner());
  }

  private async createDSProxy() {
    const pendingTx = await this.contract['build()']();
    await pendingTx.wait(3);
    const proxy = await this.getDSProxy();
    if (proxy === undefined) {
      throw new Error('Proxy address not found');
    }
    return proxy;
  }

  async ensureDSProxy() {
    return (await this.getDSProxy()) || this.createDSProxy();
  }
}
