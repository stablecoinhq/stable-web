import { IlkRegistry__factory } from 'generated/types';

import type { Web3Provider } from '@ethersproject/providers';
import type { IlkRegistry } from 'generated/types';

export default class IlkRegistryHelper {
  private readonly provider: Web3Provider;
  private readonly contract: IlkRegistry;

  constructor(provider: Web3Provider, address: string) {
    this.provider = provider;
    this.contract = IlkRegistry__factory.connect(address, provider.getSigner());
  }

  list() {
    return this.contract['list()']();
  }
}
