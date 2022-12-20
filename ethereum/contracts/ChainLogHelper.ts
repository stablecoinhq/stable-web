import { formatBytes32String } from '@ethersproject/strings';

import { ChainLog__factory, DaiJoin__factory, Pot__factory } from 'generated/types';

import { UnitFormats } from '../helpers/math';

import CDPManagerHelper from './CDPManagerHelper';
import ERC20Helper from './ERC20Helper';
import GetCDPsHelper from './GetCDPsHelper';
import IlkRegistryHelper from './IlkRegistryHelper';
import JugHelper from './JugHelper';
import ProxyActionsDsrHelper from './ProxyActionsDsrHelper';
import ProxyActionsHelper from './ProxyActionsHelper';
import ProxyRegistryHelper from './ProxyRegistryHelper';
import SpotHelper from './SpotHelper';
import VatHelper from './VatHelper';

import type EthereumProvider from '../EthereumProvider';
import type { ChainLog, DSProxy } from 'generated/types';
// eslint-disable-next-line unused-imports/no-unused-imports
import type PromiseConstructor from 'types/promise';

export const UnsupportedNetworkError = new Error('This network seems to be unsupported. ChainLog not found.');

export default class ChainLogHelper {
  private readonly provider: EthereumProvider;
  private readonly contract: ChainLog;
  private existenceChecked: boolean = false;

  constructor(provider: EthereumProvider) {
    this.provider = provider;
    this.contract = ChainLog__factory.connect(process.env.NEXT_PUBLIC_CHAINLOG_ADDRESS!!, provider.getSigner());
  }

  private async getAddress(key: string) {
    if (!this.existenceChecked) {
      if ((await this.provider.getCode(this.contract.address)) === '0x') {
        throw UnsupportedNetworkError;
      }

      this.existenceChecked = true;
    }

    return this.contract.getAddress(formatBytes32String(key));
  }

  async ilkRegistry() {
    const address = await this.getAddress('ILK_REGISTRY');
    return new IlkRegistryHelper(this.provider, address);
  }

  async vat() {
    const address = await this.getAddress('MCD_VAT');
    return new VatHelper(this.provider, address);
  }

  async jug() {
    const address = await this.getAddress('MCD_JUG');
    return new JugHelper(this.provider, address);
  }

  async spot() {
    const address = await this.getAddress('MCD_SPOT');
    return new SpotHelper(this.provider, address);
  }

  async dssCDPManager() {
    const [address, vat, spot] = await Promise.all([this.getAddress('CDP_MANAGER'), this.vat(), this.spot()]);
    return new CDPManagerHelper(this.provider, address, vat, spot);
  }

  async getCDPs() {
    const [address, dssCDPManager, vat, spot] = await Promise.all([
      this.getAddress('GET_CDPS'),
      this.dssCDPManager(),
      this.vat(),
      this.spot(),
    ]);
    return new GetCDPsHelper(this.provider, address, dssCDPManager, vat, spot);
  }

  async proxyRegistry() {
    const address = await this.getAddress('PROXY_REGISTRY');
    return new ProxyRegistryHelper(this.provider, address);
  }

  async proxyActions(proxy: DSProxy) {
    const address = await this.getAddress('PROXY_ACTIONS');
    return new ProxyActionsHelper(this.provider, address, proxy);
  }

  async proxyActionsDsr(proxy: DSProxy) {
    const address = await this.getAddress('PROXY_ACTIONS_DSR');
    return new ProxyActionsDsrHelper(this.provider, address, proxy);
  }

  async dai() {
    const address = await this.getAddress('MCD_DAI');
    return new ERC20Helper(this.provider, address, UnitFormats.WAD);
  }

  async daiJoin() {
    const address = await this.getAddress('MCD_JOIN_DAI');
    return DaiJoin__factory.connect(address, this.provider.getSigner());
  }

  async pot() {
    const address = await this.getAddress('MCD_POT');
    return Pot__factory.connect(address, this.provider);
  }
}
