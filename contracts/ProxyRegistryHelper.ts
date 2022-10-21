import { getContractAddress } from '@ethersproject/address';
import { AddressZero } from '@ethersproject/constants';

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
    return this.contract.proxies(user).then((address) => {
      if (address === AddressZero) {
        return undefined;
      }

      return DSProxy__factory.connect(address, this.provider.getSigner());
    });
  }

  private createDSProxy() {
    return this.contract['build()']()
      .then(async (pendingTx) => {
        await pendingTx.wait();
        return getContractAddress(pendingTx);
      })
      .then((address) => DSProxy__factory.connect(address, this.provider.getSigner()));
  }

  async ensureDSProxy(user: string) {
    return (await this.getDSProxy(user)) || this.createDSProxy();
  }
}
