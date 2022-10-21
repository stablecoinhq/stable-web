import { formatBytes32String } from '@ethersproject/strings';

import { ChainLog__factory, DaiJoin__factory } from 'generated/types';

import CDPManagerHelper from './CDPManagerHelper';
import ERC20Helper from './ERC20Helper';
import GetCDPsHelper from './GetCDPsHelper';
import IlkRegistryHelper from './IlkRegistryHelper';
import JugHelper from './JugHelper';
import ProxyActionsHelper from './ProxyActionsHelper';
import ProxyRegistryHelper from './ProxyRegistryHelper';
import SpotHelper from './SpotHelper';
import VatHelper from './VatHelper';

import type { Web3Provider } from '@ethersproject/providers';
import type { ChainLog, DSProxy } from 'generated/types';
// eslint-disable-next-line unused-imports/no-unused-imports
import type PromiseConstructor from 'types/promise';

export default class ChainLogHelper {
  private readonly provider: Web3Provider;
  private readonly contract: ChainLog;

  constructor(provider: Web3Provider) {
    this.provider = provider;
    this.contract = ChainLog__factory.connect(process.env.NEXT_PUBLIC_CHAINLOG_ADDRESS!!, provider.getSigner());
  }

  private getAddress(key: string) {
    return this.contract.getAddress(formatBytes32String(key));
  }

  ilkRegistry() {
    return this.getAddress('ILK_REGISTRY').then((address) => new IlkRegistryHelper(this.provider, address));
  }

  vat() {
    return this.getAddress('MCD_VAT').then((address) => new VatHelper(this.provider, address));
  }

  jug() {
    return this.getAddress('MCD_JUG').then((address) => new JugHelper(this.provider, address));
  }

  spot() {
    return this.getAddress('MCD_SPOT').then((address) => new SpotHelper(this.provider, address));
  }

  dssCDPManager() {
    return this.getAddress('CDP_MANAGER').then((address) => new CDPManagerHelper(this.provider, address));
  }

  getCDPs() {
    return Promise.all([this.getAddress('GET_CDPS'), this.dssCDPManager()]).then(
      ([address, dssCDPManager]) => new GetCDPsHelper(this.provider, address, dssCDPManager),
    );
  }

  proxyRegistry() {
    return this.getAddress('PROXY_REGISTRY').then((address) => new ProxyRegistryHelper(this.provider, address));
  }

  proxyActions(proxy: DSProxy) {
    return this.getAddress('PROXY_ACTIONS').then((address) => new ProxyActionsHelper(this.provider, address, proxy));
  }

  dai() {
    return this.getAddress('MCD_DAI').then((address) => new ERC20Helper(this.provider, address));
  }

  daiJoin() {
    return this.getAddress('MCD_JOIN_DAI').then((address) => DaiJoin__factory.connect(address, this.provider.getSigner()));
  }
}
