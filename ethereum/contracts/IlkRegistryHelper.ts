import { FixedFormat } from '@ethersproject/bignumber';

import IlkType from 'ethereum/IlkType';
import { GemJoin__factory, IlkRegistry__factory } from 'generated/types';

import ERC20Helper from './ERC20Helper';

import type EthereumProvider from '../EthereumProvider';
import type { GemJoin, IlkRegistry } from 'generated/types';

export type IlkInfo = {
  type: IlkType;
  name: string;
  symbol: string;
  gem: ERC20Helper;
  gemJoin: GemJoin;
};

export default class IlkRegistryHelper {
  private readonly provider: EthereumProvider;
  private readonly contract: IlkRegistry;

  constructor(provider: EthereumProvider, address: string) {
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
        .then(({ name, symbol, dec, gem, 6: join }) => {
          const format = FixedFormat.from(dec.toNumber());

          return {
            type: ilkType,
            name: symbol === 'WETH' ? 'Ethereum' : name,
            symbol: symbol === 'WETH' ? 'ETH' : symbol,
            gem: ERC20Helper.fromAddress(this.provider, gem, format),
            gemJoin: GemJoin__factory.connect(join, this.provider.getSigner()),
          };
        })
    );
  }
}
