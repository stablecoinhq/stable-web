import { formatBytes32String } from '@ethersproject/strings';
import { ethers } from 'ethers';

import {
  ChainLog__factory,
  Dai__factory,
  DssCdpManager__factory,
  ERC20__factory,
  Spotter__factory,
  Vat__factory,
} from 'generated/types';

import GetCDPsHelper from './GetCDPsHelper';
import IlkRegistryHelper from './IlkRgistryHelper';
import JugHelper from './JugHelper';
import ProxyActionsHelper from './ProxyActionsHelper';
import ProxyRegistryHelper from './ProxyRegistryHelper';

import type { ChainLog, DSProxy } from 'generated/types';
import type PromiseConstructor from 'types/promise';

export default class ChainLogHelper {
  private readonly provider: ethers.Signer;
  private readonly contract: ChainLog;

  constructor(provider: ethers.Signer) {
    this.provider = provider;
    this.contract = ChainLog__factory.connect(process.env.NEXT_PUBLIC_CHAINLOG_ADDRESS!!, provider);
  }

  getAddress(key: string) {
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

  jug() {
    return this.contract.getAddress(formatBytes32String('MCD_JUG')).then((address) => new JugHelper(this.provider, address));
  }

  spot() {
    return this.contract
      .getAddress(formatBytes32String('MCD_SPOT'))
      .then((address) => Spotter__factory.connect(address, this.provider));
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

  async dai() {
    const dai = await this.contract.getAddress(formatBytes32String('MCD_DAI'));
    return Dai__factory.connect(dai, this.provider);
  }

  async erc20(ilkBytes32: string) {
    const ilkAddr = await this.contract.getAddress(ilkBytes32);
    if (ilkAddr && ilkAddr !== ethers.constants.AddressZero) {
      return ERC20__factory.connect(ilkAddr, this.provider);
    }
    throw new Error('invalid collateral');
  }
}
