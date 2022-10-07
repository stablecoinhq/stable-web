import { parseBytes32String } from '@ethersproject/strings';

import { GetCdps__factory } from 'generated/types';

import type { Web3Provider } from '@ethersproject/providers';
import type { BigNumber } from 'ethers';
import type { DssCdpManager, GetCdps, DSProxy } from 'generated/types';

export type CDP = {
  id: BigNumber;
  urn: string;
  ilk: string;
};

export default class GetCDPsHelper {
  private readonly contract: GetCdps;
  private readonly manager: DssCdpManager;

  constructor(provider: Web3Provider, address: string, manager: DssCdpManager) {
    this.contract = GetCdps__factory.connect(address, provider.getSigner());
    this.manager = manager;
  }

  getCDPs(proxy: DSProxy): Promise<CDP[]> {
    return this.contract.getCdpsDesc(this.manager.address, proxy.address).then(([cdpIds, urns, ilks]) =>
      cdpIds.map((cdpId, i) => ({
        id: cdpId,
        urn: urns[i]!,
        ilk: parseBytes32String(ilks[i]!),
      })),
    );
  }
}
