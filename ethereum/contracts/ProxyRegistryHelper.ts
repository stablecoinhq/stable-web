import { getContractAddress } from '@ethersproject/address';
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

  getDSProxy() {
    return this.contract.proxies(this.provider.address).then((address) => {
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

  async ensureDSProxy() {
    return (await this.getDSProxy()) || this.createDSProxy();
  }
}
