import { DSProxy__factory, DssCdpManager__factory } from 'generated/types';

import IlkType from './IlkType';

import type { CDP } from './GetCDPsHelper';
import type { Web3Provider } from '@ethersproject/providers';
import type { BigNumber } from 'ethers';
import type { DssCdpManager } from 'generated/types';

export default class CDPManagerHelper {
  private readonly provider: Web3Provider;
  private readonly contract: DssCdpManager;

  constructor(provider: Web3Provider, address: string) {
    this.provider = provider;
    this.contract = DssCdpManager__factory.connect(address, provider.getSigner());
  }

  get address() {
    return this.contract.address;
  }

  private getIlkType(cdpId: BigNumber) {
    return this.contract.ilks(cdpId).then((typeBytes32) => IlkType.fromBytes32(typeBytes32));
  }

  private getUrn(cdpId: BigNumber) {
    return this.contract.urns(cdpId);
  }

  private getOwner(cdpId: BigNumber) {
    return this.contract.owns(cdpId).then((address) => DSProxy__factory.connect(address, this.provider.getSigner()));
  }

  getCDP(cdpId: BigNumber): Promise<CDP> {
    return Promise.all([this.getUrn(cdpId), this.getIlkType(cdpId), this.getOwner(cdpId)]).then(([urn, ilk, owner]) => ({
      id: cdpId,
      urn,
      ilk,
      owner,
    }));
  }
}
