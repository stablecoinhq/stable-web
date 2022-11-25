import { ERC20__factory } from 'generated/types';

import { toBigNumber, toFixedNumber } from './math';

import type EthereumProvider from './EthereumProvider';
import type { FixedFormat } from '@ethersproject/bignumber';
import type { FixedNumber } from 'ethers';
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

  private async getAllowance(spenderAddress: string) {
    const value = await this.contract.allowance(this.provider.address, spenderAddress);
    return toFixedNumber(value, this.format);
  }

  async getBalance() {
    const symbol = await this.contract.symbol();
    if (symbol === 'WETH') {
      const value = await this.contract.balanceOf(this.provider.address);
      const ethBalance = await this.provider.getBalance(this.provider.address);
      return toFixedNumber(value.add(ethBalance), this.format);
    }
    const value = await this.contract.balanceOf(this.provider.address);
    return toFixedNumber(value, this.format);
  }

  private approve(spenderAddress: string, amount: FixedNumber) {
    return this.contract.approve(spenderAddress, toBigNumber(amount, this.format)).then((tx) => tx.wait());
  }

  async ensureAllowance(spenderAddress: string, amount: FixedNumber) {
    const current = await this.getAllowance(spenderAddress);
    const diff = amount.subUnsafe(current);

    // requested amount <= current
    if (diff.isNegative() || diff.isZero()) {
      return;
    }

    await this.approve(spenderAddress, diff);
  }
}
