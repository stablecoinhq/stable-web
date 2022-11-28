import { DSProxy__factory, DssCdpManager__factory } from 'generated/types';

import IlkType from '../IlkType';
import { INT_FORMAT, toBigNumber } from '../helpers/math';

import type EthereumProvider from '../EthereumProvider';
import type { CDP } from './GetCDPsHelper';
import type { FixedNumber } from 'ethers';
import type { DssCdpManager } from 'generated/types';

export default class CDPManagerHelper {
  private readonly provider: EthereumProvider;
  private readonly contract: DssCdpManager;

  constructor(provider: EthereumProvider, address: string) {
    this.provider = provider;
    this.contract = DssCdpManager__factory.connect(address, provider.getSigner());
  }

  get address() {
    return this.contract.address;
  }

  private getIlkType(cdpId: FixedNumber) {
    return this.contract.ilks(toBigNumber(cdpId, INT_FORMAT)).then((typeBytes32) => IlkType.fromBytes32(typeBytes32));
  }

  private getUrn(cdpId: FixedNumber) {
    return this.contract.urns(toBigNumber(cdpId, INT_FORMAT));
  }

  private getOwner(cdpId: FixedNumber) {
    return this.contract
      .owns(toBigNumber(cdpId, INT_FORMAT))
      .then((address) => DSProxy__factory.connect(address, this.provider.getSigner()));
  }

  getCDP(cdpId: FixedNumber): Promise<CDP> {
    return Promise.all([this.getUrn(cdpId), this.getIlkType(cdpId), this.getOwner(cdpId)]).then(([urn, ilk, owner]) => ({
      id: cdpId,
      urn,
      ilk,
      owner,
    }));
  }
}
