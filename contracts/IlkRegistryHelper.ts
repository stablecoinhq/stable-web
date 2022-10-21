import IlkType from 'contracts/IlkType';
import { GemJoin__factory, IlkRegistry__factory } from 'generated/types';

import ERC20Helper from './ERC20Helper';

import type { Web3Provider } from '@ethersproject/providers';
import type { BigNumber } from 'ethers';
import type { GemJoin, IlkRegistry } from 'generated/types';

export type IlkInfo = {
  type: IlkType;
  name: string;
  symbol: string;
  dec: BigNumber;
  gem: ERC20Helper;
  gemJoin: GemJoin;
};

export default class IlkRegistryHelper {
  private readonly provider: Web3Provider;
  private readonly contract: IlkRegistry;

  constructor(provider: Web3Provider, address: string) {
    this.provider = provider;
    this.contract = IlkRegistry__factory.connect(address, provider.getSigner());
  }

  list(): Promise<IlkType[]> {
    return this.contract['list()']().then((ilks) => ilks.map((ilk) => IlkType.fromBytes32(ilk)));
  }

  info(ilkType: IlkType): Promise<IlkInfo> {
    return (
      this.contract
        .info(ilkType.inBytes32)
        // `join` property conflicts with `Array.join`.
        // 6th value of result array is `join`
        .then(({ name, symbol, dec, gem, 6: join }) => ({
          type: ilkType,
          name,
          symbol,
          dec,
          gem: new ERC20Helper(this.provider, gem),
          gemJoin: GemJoin__factory.connect(join, this.provider.getSigner()),
        }))
    );
  }
}
