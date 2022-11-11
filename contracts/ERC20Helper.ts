import { ERC20__factory } from 'generated/types';

import type EthereumProvider from './EthereumProvider';
import type { BigNumber } from 'ethers';
import type { ERC20 } from 'generated/types';

export default class ERC20Helper {
  private readonly provider: EthereumProvider;
  private readonly contract: ERC20;
  readonly format: FixedFormat;

  constructor(provider: EthereumProvider, address: string, format: FixedFormat) {
    this.provider = provider;
    this.contract = ERC20__factory.connect(address, provider.getSigner());
    this.format = format;
  }

  private getAllowance(spenderAddress: string) {
    return this.contract.allowance(this.provider.address, spenderAddress).then((value) => toFixedNumber(value, this.format));
  }

  private approve(spenderAddress: string, amount: FixedNumber) {
    return this.contract.approve(spenderAddress, toBigNumber(amount, this.format)).then((tx) => tx.wait());
  }

  async ensureAllowance(spenderAddress: string, amount: BigNumber) {
    const current = await this.getAllowance(spenderAddress);
    const diff = amount.subUnsafe(current);

    // requested amount <= current
    if (diff.isNegative() || diff.isZero()) {
      return;
    }

    await this.approve(spenderAddress, diff);
  }
}
