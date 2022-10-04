import { Jug__factory } from 'generated/types';

import type { Web3Provider } from '@ethersproject/providers';
import type { Jug } from 'generated/types';

export default class JugHelper {
  private readonly provider: Web3Provider;
  private readonly contract: Jug;

  constructor(provider: Web3Provider, address: string) {
    this.provider = provider;
    this.contract = Jug__factory.connect(address, provider);
  }

  stabilityFee(ilkBytes32: string) {
    return Promise.all([this.contract.base(), this.contract.ilks(ilkBytes32)]).then(([base, { duty }]) => base.add(duty));
  }
}
