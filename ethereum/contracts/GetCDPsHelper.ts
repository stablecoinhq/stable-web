import IlkType from 'ethereum/IlkType';
import Vault from 'ethereum/Vault';
import { GetCdps__factory } from 'generated/types';

import { INT_FORMAT, toFixedNumber } from '../helpers/math';

import type EthereumProvider from '../EthereumProvider';
import type CDPManagerHelper from './CDPManagerHelper';
import type SpotHelper from './SpotHelper';
import type { UrnStatus } from './VatHelper';
import type VatHelper from './VatHelper';
import type { FixedNumber } from 'ethers';
import type { GetCdps, DSProxy } from 'generated/types';

export type CDP = {
  id: FixedNumber;
  urn: string;
  ilk: IlkType;
  owner: DSProxy;
  urnStatus: UrnStatus;
  collateralizationRatio: FixedNumber;
};

export default class GetCDPsHelper {
  private readonly contract: GetCdps;
  private readonly manager: CDPManagerHelper;
  private readonly vat: VatHelper;
  private readonly spot: SpotHelper;

  constructor(provider: EthereumProvider, address: string, manager: CDPManagerHelper, vat: VatHelper, spot: SpotHelper) {
    this.contract = GetCdps__factory.connect(address, provider.getSigner());
    this.vat = vat;
    this.spot = spot;
    this.manager = manager;
  }

  async getCDPs(proxy: DSProxy): Promise<CDP[]> {
    const [cdpIds, urns, ilks] = await this.contract.getCdpsDesc(this.manager.address, proxy.address);
    return Promise.all(
      cdpIds.map(async (cdpId, i) => {
        const urn = urns[i]!;
        const ilk = IlkType.fromBytes32(ilks[i]!);
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
          id: toFixedNumber(cdpId, INT_FORMAT),
          urn,
          ilk,
          owner: proxy,
          urnStatus,
          ilkStatus,
          collateralizationRatio,
        };
      }),
    );
  }
}
