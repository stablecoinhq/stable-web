import Vault from 'ethereum/Vault';
import { DSProxy__factory, DssCdpManager__factory } from 'generated/types';

import IlkType from '../IlkType';
import { INT_FORMAT, toBigNumber } from '../helpers/math';

import type EthereumProvider from '../EthereumProvider';
import type { CDP } from './GetCDPsHelper';
import type SpotHelper from './SpotHelper';
import type VatHelper from './VatHelper';
import type { FixedNumber } from 'ethers';
import type { DssCdpManager } from 'generated/types';

export default class CDPManagerHelper {
  private readonly provider: EthereumProvider;
  private readonly contract: DssCdpManager;
  private readonly vat: VatHelper;
  private readonly spot: SpotHelper;

  constructor(provider: EthereumProvider, address: string, vat: VatHelper, spot: SpotHelper) {
    this.provider = provider;
    this.vat = vat;
    this.spot = spot;
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

  async getCDP(cdpId: FixedNumber): Promise<CDP> {
    const [urn, ilk, owner] = await Promise.all([this.getUrn(cdpId), this.getIlkType(cdpId), this.getOwner(cdpId)]);
    const [urnStatus, ilkStatus, liquidationRatio] = await Promise.all([
      this.vat.getUrnStatus(ilk, urn),
      this.vat.getIlkStatus(ilk),
      this.spot.getLiquidationRatio(ilk),
    ]);
    const collateralizationRatio = Vault.getCollateralizationRatio(
      urnStatus.lockedBalance,
      urnStatus.debt,
      liquidationRatio,
      ilkStatus,
    );
    return {
      id: cdpId,
      urn,
      ilk,
      owner,
      urnStatus,
      collateralizationRatio,
    };
  }
}
