import { IlkRegistry__factory } from 'generated/types';

import type { ethers } from 'ethers';
import type { IlkRegistry } from 'generated/types';

export default class IlkRegistryHelper {
  private provider: ethers.Signer;
  private contracts: IlkRegistry;

  constructor(provider: ethers.Signer, address: string) {
    this.provider = provider;
    this.contracts = IlkRegistry__factory.connect(address, provider);
  }

  list() {
    return this.contracts['list()'];
  }
}
