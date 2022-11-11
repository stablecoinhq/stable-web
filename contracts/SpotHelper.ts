import { Spotter__factory } from 'generated/types';

import { toFixedNumber, UnitFormats } from './math';

import type EthereumProvider from './EthereumProvider';
import type IlkType from './IlkType';
import type { Spotter } from 'generated/types';

export default class SpotHelper {
  private readonly contract: Spotter;

  constructor(provider: EthereumProvider, address: string) {
    this.contract = Spotter__factory.connect(address, provider.getSigner());
  }

  getLiquidationRatio(ilkType: IlkType) {
    return this.contract.ilks(ilkType.inBytes32).then(({ mat }) => toFixedNumber(mat, UnitFormats.RAY));
  }
}
