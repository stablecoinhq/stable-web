import { ERC20__factory } from 'generated/types';

import type EthereumProvider from './EthereumProvider';
import type { BigNumber } from 'ethers';
import type { ERC20 } from 'generated/types';

export default class ERC20Helper {
  private readonly provider: EthereumProvider;
  private readonly contract: ERC20;

  constructor(provider: EthereumProvider, address: string) {
    this.provider = provider;
    this.contract = ERC20__factory.connect(address, provider.getSigner());
  }

  private getAllowance(spenderAddress: string) {
    return this.contract.allowance(this.provider.address, spenderAddress);
  }

  private approve(spenderAddress: string, amount: BigNumber) {
    return this.contract.approve(spenderAddress, amount).then((tx) => tx.wait());
  }

  async ensureAllowance(spenderAddress: string, amount: BigNumber) {
    const current = await this.getAllowance(spenderAddress);

    if (amount.lte(current)) {
      return;
    }

    await this.approve(spenderAddress, amount.sub(current));
  }
}
