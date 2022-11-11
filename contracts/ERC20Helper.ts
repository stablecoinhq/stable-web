import { ERC20__factory } from 'generated/types';

import { toBigNumber, toFixedNumber } from './math';

import type EthereumAccount from './EthereumAccount';
import type { FixedFormat } from '@ethersproject/bignumber';
import type { Web3Provider } from '@ethersproject/providers';
import type { FixedNumber } from 'ethers';
import type { ERC20 } from 'generated/types';

export default class ERC20Helper {
  private readonly contract: ERC20;
  readonly format: FixedFormat;

  constructor(provider: Web3Provider, address: string, format: FixedFormat) {
    this.contract = ERC20__factory.connect(address, provider.getSigner());
    this.format = format;
  }

  private getAllowance(ownerAccount: EthereumAccount, spenderAddress: string) {
    return this.contract.allowance(ownerAccount.address, spenderAddress).then((value) => toFixedNumber(value, this.format));
  }

  private approve(spenderAddress: string, amount: FixedNumber) {
    return this.contract.approve(spenderAddress, toBigNumber(amount, this.format)).then((tx) => tx.wait());
  }

  async ensureAllowance(ownerAccount: EthereumAccount, spenderAddress: string, amount: FixedNumber) {
    const current = await this.getAllowance(ownerAccount, spenderAddress);
    const diff = amount.subUnsafe(current);

    // requested amount <= current
    if (diff.isNegative() || diff.isZero()) {
      return;
    }

    await this.approve(spenderAddress, diff);
  }
}
