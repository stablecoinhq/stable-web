import { AddressZero } from '@ethersproject/constants';
import { formatBytes32String } from '@ethersproject/strings';

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

import type { Signer } from 'ethers';
import type { ChainLog, DSProxy } from 'generated/types';
import type PromiseConstructor from 'types/promise';

export default class ChainLogHelper {
  private readonly provider: Signer;
  private readonly contract: ChainLog;

  constructor(provider: Signer) {
    this.provider = provider;
    this.contract = ChainLog__factory.connect(process.env.NEXT_PUBLIC_CHAINLOG_ADDRESS!!, provider);
  }

  getAddressFromKey(key: string) {
    return this.getAddressFromBytes32(formatBytes32String(key));
  }

  getAddressFromBytes32(bytes32: string) {
    return this.contract.getAddress(bytes32);
  }

  ilkRegistry() {
    return this.getAddressFromKey('ILK_REGISTRY').then((address) => new IlkRegistryHelper(this.provider, address));
  }

  vat() {
    return this.getAddressFromKey('MCD_VAT').then((address) => Vat__factory.connect(address, this.provider));
  }

  jug() {
    return this.getAddressFromKey('MCD_JUG').then((address) => new JugHelper(this.provider, address));
  }

  spot() {
    return this.getAddressFromKey('MCD_SPOT').then((address) => Spotter__factory.connect(address, this.provider));
  }

  dssCDPManager() {
    return this.getAddressFromKey('CDP_MANAGER').then((address) => DssCdpManager__factory.connect(address, this.provider));
  }

  getCDPs() {
    return Promise.all([this.getAddressFromKey('GET_CDPS'), this.dssCDPManager()]).then(
      ([address, dssCDPManager]) => new GetCDPsHelper(this.provider, address, dssCDPManager),
    );
  }

  proxyRegistry() {
    return this.getAddressFromKey('PROXY_REGISTRY').then((address) => new ProxyRegistryHelper(this.provider, address));
  }

  /**
   * proxy actions means to be used via ds-proxy, should not be used directly.
   * so it returns a raw address as string.
   */
  async bindActions(proxy: DSProxy) {
    // TODO
    const actions = await this.getAddressFromKey('PROXY_ACTIONS');
    return new ProxyActionsHelper(this.provider, proxy, actions);
  }

  async dai() {
    const dai = await this.getAddressFromKey('MCD_DAI');
    return Dai__factory.connect(dai, this.provider);
  }

  async erc20(ilkBytes32: string) {
    const ilkAddr = await this.getAddressFromBytes32(ilkBytes32);
    if (ilkAddr && ilkAddr !== AddressZero) {
      return ERC20__factory.connect(ilkAddr, this.provider);
    }
    throw new Error('invalid collateral');
  }
}
