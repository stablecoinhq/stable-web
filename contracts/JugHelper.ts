import { Jug__factory } from 'generated/types';

import { toFixedNumber, UnitFormats } from './math';

import type EthereumProvider from './EthereumProvider';
import type IlkType from 'contracts/IlkType';
import type { Jug } from 'generated/types';
// eslint-disable-next-line unused-imports/no-unused-imports
import type PromiseConstructor from 'types/promise';

export default class JugHelper {
  private readonly provider: EthereumProvider;
  readonly address: string;
  private readonly contract: Jug;

  constructor(provider: EthereumProvider, address: string) {
    this.provider = provider;
    this.address = address;
    this.contract = Jug__factory.connect(address, provider);
  }

  ilkData(ilk: IlkType) {
    return this.contract.ilks(ilk.inBytes32);
  }

  getStabilityFee(ilk: IlkType) {
    return Promise.all([this.contract.base(), this.ilkData(ilk)]).then(([base, { duty }]) =>
      toFixedNumber(base, UnitFormats.RAY).addUnsafe(toFixedNumber(duty, UnitFormats.RAY)),
    );
  }
}
