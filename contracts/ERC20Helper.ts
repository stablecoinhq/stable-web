import { ERC20__factory } from 'generated/types';

import type EthereumAccount from './EthereumAccount';
import type { Web3Provider } from '@ethersproject/providers';
import type { BigNumber } from 'ethers';
import type { ERC20 } from 'generated/types';

export default class ERC20Helper {
  private readonly contract: ERC20;

  constructor(provider: Web3Provider, address: string) {
    this.contract = ERC20__factory.connect(address, provider.getSigner());
  }

  private getAllowance(ownerAccount: EthereumAccount, spenderAddress: string) {
    return this.contract.allowance(ownerAccount.address, spenderAddress);
  }

  private approve(spenderAddress: string, amount: BigNumber) {
    return this.contract.approve(spenderAddress, amount).then((tx) => tx.wait());
  }

  async ensureAllowance(ownerAccount: EthereumAccount, spenderAddress: string, amount: BigNumber) {
    const current = await this.getAllowance(ownerAccount, spenderAddress);

    if (amount.lte(current)) {
      return;
    }

    await this.approve(spenderAddress, amount.sub(current));
  }
}
