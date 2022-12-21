import { Spotter__factory } from 'generated/types';

import { toFixedNumber, UnitFormats } from '../helpers/math';

import type EthereumProvider from '../EthereumProvider';
import type IlkType from '../IlkType';
import type { Spotter } from 'generated/types';

export default class SpotHelper {
  private readonly contract: Spotter;

  constructor(provider: EthereumProvider, address: string) {
    this.contract = Spotter__factory.connect(address, provider.getSigner());
  }

  async getLiquidationRatio(ilkType: IlkType) {
    const { mat } = await this.contract.ilks(ilkType.inBytes32);
    return toFixedNumber(mat, UnitFormats.RAY);
  }
}
