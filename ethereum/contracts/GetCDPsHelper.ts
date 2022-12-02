import IlkType from 'ethereum/IlkType';
import { GetCdps__factory } from 'generated/types';

import { INT_FORMAT, toFixedNumber } from '../helpers/math';

import type EthereumProvider from '../EthereumProvider';
import type CDPManagerHelper from './CDPManagerHelper';
import type { FixedNumber } from 'ethers';
import type { GetCdps, DSProxy } from 'generated/types';

export type CDP = {
  id: FixedNumber;
  urn: string;
  ilk: IlkType;
  owner: DSProxy;
};

export default class GetCDPsHelper {
  private readonly contract: GetCdps;
  private readonly manager: CDPManagerHelper;

  constructor(provider: EthereumProvider, address: string, manager: CDPManagerHelper) {
    this.contract = GetCdps__factory.connect(address, provider.getSigner());
    this.manager = manager;
  }

  getCDPs(proxy: DSProxy): Promise<CDP[]> {
    return this.contract.getCdpsDesc(this.manager.address, proxy.address).then(([cdpIds, urns, ilks]) =>
      cdpIds.map((cdpId, i) => ({
        id: toFixedNumber(cdpId, INT_FORMAT),
        urn: urns[i]!,
        ilk: IlkType.fromBytes32(ilks[i]!),
        owner: proxy,
      })),
    );
  }
}
