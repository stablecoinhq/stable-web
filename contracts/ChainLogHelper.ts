import { formatBytes32String } from '@ethersproject/strings';

import { ChainLog__factory, DssCdpManager__factory, Vat__factory } from 'generated/types';

import GetCDPsHelper from './GetCDPsHelper';
import ProxyActionsHelper from './ProxyActionsHelper';
import ProxyRegistryHelper from './ProxyRegistryHelper';

import type { ethers } from 'ethers';
import type addresses from 'generated/addresses.json';
import type { ChainLog, DSProxy } from 'generated/types';
import type PromiseConstructor from 'types/promise';
import IlkRegistryHelper from './IlkRgistryHelper';

type ChainLogKeys = keyof typeof addresses;

export default class ChainLogHelper {
  private readonly provider: ethers.Signer;
  private readonly contract: ChainLog;

  constructor(provider: ethers.Signer) {
    this.provider = provider;
    this.contract = ChainLog__factory.connect(process.env.NEXT_PUBLIC_CHAINLOG_ADDRESS!!, provider);
  }

  getAddress(key: ChainLogKeys) {
    return this.contract.getAddress(formatBytes32String(key));
  }

  ilkRegistry() {
    return this.contract
      .getAddress(formatBytes32String('ILK_REGISTRY'))
      .then((address) => new IlkRegistryHelper(this.provider, address));
  }

  vat() {
    return this.contract
      .getAddress(formatBytes32String('MCD_VAT'))
      .then((address) => Vat__factory.connect(address, this.provider));
  }

  dssCDPManager() {
    return this.contract
      .getAddress(formatBytes32String('CDP_MANAGER'))
      .then((address) => DssCdpManager__factory.connect(address, this.provider));
  }

  getCDPs() {
    return Promise.all([this.contract.getAddress(formatBytes32String('GET_CDPS')), this.dssCDPManager()]).then(
      ([address, dssCDPManager]) => new GetCDPsHelper(this.provider, address, dssCDPManager),
    );
  }

  proxyRegistry() {
    return this.contract
      .getAddress(formatBytes32String('PROXY_REGISTRY'))
      .then((address) => new ProxyRegistryHelper(this.provider, address));
  }

  /**
   * proxy actions means to be used via ds-proxy, should not be used directory.
   * so it returns a raw address as string.
   */
  async bindActions(proxy: DSProxy) {
    const actions = await this.contract.getAddress(formatBytes32String('PROXY_ACTIONS'));
    return new ProxyActionsHelper(this.provider, proxy, actions);
  }
}
