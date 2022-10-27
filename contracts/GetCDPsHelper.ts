import IlkType from 'contracts/IlkType';
import { GetCdps__factory } from 'generated/types';

import type CDPManagerHelper from './CDPManagerHelper';
import type { Web3Provider } from '@ethersproject/providers';
import type { BigNumber } from 'ethers';
import type { GetCdps, DSProxy } from 'generated/types';

export type CDP = {
  id: BigNumber;
  urn: string;
  ilk: IlkType;
  owner: DSProxy;
};

export default class GetCDPsHelper {
  private readonly contract: GetCdps;
  private readonly manager: CDPManagerHelper;

  constructor(provider: Web3Provider, address: string, manager: CDPManagerHelper) {
    this.contract = GetCdps__factory.connect(address, provider.getSigner());
    this.manager = manager;
  }

  getCDPs(proxy: DSProxy): Promise<CDP[]> {
    return this.contract.getCdpsDesc(this.manager.address, proxy.address).then(([cdpIds, urns, ilks]) =>
      cdpIds.map((cdpId, i) => ({
        id: cdpId,
        urn: urns[i]!,
        ilk: IlkType.fromBytes32(ilks[i]!),
        owner: proxy,
      })),
    );
  }
}
