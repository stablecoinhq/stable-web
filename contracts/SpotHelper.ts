import { Spotter__factory } from 'generated/types';

import type IlkType from './IlkType';
import type { Web3Provider } from '@ethersproject/providers';
import type { Spotter } from 'generated/types';

export default class SpotHelper {
  private readonly contract: Spotter;

  constructor(provider: Web3Provider, address: string) {
    this.contract = Spotter__factory.connect(address, provider.getSigner());
  }

  getLiquidationRatio(ilkType: IlkType) {
    return this.contract.ilks(ilkType.inBytes32).then(({ mat }) => mat);
  }
}
