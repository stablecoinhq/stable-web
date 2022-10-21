import { Jug__factory } from 'generated/types';

import type { Web3Provider } from '@ethersproject/providers';
import type IlkType from 'contracts/IlkType';
import type { Jug } from 'generated/types';
// eslint-disable-next-line unused-imports/no-unused-imports
import type PromiseConstructor from 'types/promise';

export default class JugHelper {
  private readonly provider: Web3Provider;
  readonly address: string;
  private readonly contract: Jug;

  constructor(provider: Web3Provider, address: string) {
    this.provider = provider;
    this.address = address;
    this.contract = Jug__factory.connect(address, provider);
  }

  ilkData(ilk: IlkType) {
    return this.contract.ilks(ilk.inBytes32);
  }

  getStabilityFee(ilk: IlkType) {
    return Promise.all([this.contract.base(), this.ilkData(ilk)]).then(([base, { duty }]) => base.add(duty));
  }
}
