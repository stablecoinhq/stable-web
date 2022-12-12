import IlkType from 'ethereum/IlkType';
import { GetCdps__factory } from 'generated/types';

import { INT_FORMAT, toFixedNumber } from '../helpers/math';

import type EthereumProvider from '../EthereumProvider';
import type CDPManagerHelper from './CDPManagerHelper';
import type SpotHelper from './SpotHelper';
import type { IlkStatus, UrnStatus } from './VatHelper';
import type VatHelper from './VatHelper';
import type { FixedNumber } from 'ethers';
import type { GetCdps, DSProxy } from 'generated/types';

export type CDP = {
  id: FixedNumber;
  urn: string;
  ilk: IlkType;
  owner: DSProxy;
  urnStatus: UrnStatus;
  ilkStatus: IlkStatus;
  liquidationRatio: FixedNumber;
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
    const ilkTypes = Array.from(new Set(ilks)).map((i) => IlkType.fromBytes32(i));
    const ilkStatusList = await Promise.all(ilkTypes.map(async (ilk) => ({ ilk, status: await this.vat.getIlkStatus(ilk) })));
    const liquidationRatios = await Promise.all(
      ilkTypes.map(async (ilk) => ({ ilk, lr: await this.spot.getLiquidationRatio(ilk) })),
    );
    return Promise.all(
      cdpIds.map(async (cdpId, i) => {
        const urn = urns[i]!;
        const ilk = IlkType.fromBytes32(ilks[i]!);
        const [urnStatus] = await Promise.all([this.vat.getUrnStatus(ilk, urn)]);
        const ilkStatus = ilkStatusList.filter((v) => v.ilk.inString === ilk.inString)[0]!.status;
        const liquidationRatio = liquidationRatios.filter((v) => v.ilk.inString === ilk.inString)[0]!.lr;

        return {
          id: toFixedNumber(cdpId, INT_FORMAT),
          urn,
          ilk,
          owner: proxy,
          urnStatus,
          ilkStatus,
          liquidationRatio,
        };
      }),
    );
  }
}
