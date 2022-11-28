import { toFixedNumber, UnitFormats } from './math';

import type ChainLogHelper from './ChainLogHelper';
import type ERC20Helper from './ERC20Helper';
import type ProxyRegistryHelper from './ProxyRegistryHelper';
import type { FixedNumber } from 'ethers';
import type { DaiJoin, Pot } from 'generated/types';

export default class Savings {
  chainLog: ChainLogHelper;
  daiJoin: DaiJoin;
  pot: Pot;
  dai: ERC20Helper;
  proxyRegistry: ProxyRegistryHelper;

  constructor(chainLog: ChainLogHelper, daiJoin: DaiJoin, pot: Pot, dai: ERC20Helper, proxyRegistry: ProxyRegistryHelper) {
    this.chainLog = chainLog;
    this.daiJoin = daiJoin;
    this.pot = pot;
    this.dai = dai;
    this.proxyRegistry = proxyRegistry;
  }

  async deposit(daiAmount: FixedNumber) {
    const proxy = await this.proxyRegistry.ensureDSProxy();
    await this.dai.ensureAllowance(proxy.address, daiAmount);
    const actions = await this.chainLog.proxyActionsDsr(proxy);
    const tx = await actions.deposit(this.daiJoin, this.pot, daiAmount);
    await tx.wait();
  }

  async withdraw(daiAmount: FixedNumber) {
    const proxy = await this.proxyRegistry.ensureDSProxy();
    const actions = await this.chainLog.proxyActionsDsr(proxy);
    const tx = await actions.withdraw(this.daiJoin, this.pot, daiAmount);
    await tx.wait();
  }

  async withdrawAll(chainLog: ChainLogHelper) {
    const proxy = await this.proxyRegistry.ensureDSProxy();
    const actions = await chainLog.proxyActionsDsr(proxy);
    const tx = await actions.withdrawAll(this.daiJoin, this.pot);
    await tx.wait();
  }

  async getDepositAmount() {
    const proxy = await this.proxyRegistry.getDSProxy();
    if (proxy) {
      const pie = await this.pot.pie(proxy.address);
      return { address: proxy.address, amount: toFixedNumber(pie, UnitFormats.WAD) };
    }
  }

  async getAnnualRate() {
    const dsr = await this.pot.dsr();
    return toFixedNumber(dsr, UnitFormats.RAY);
  }

  static async fromChainlog(chainLog: ChainLogHelper): Promise<Savings> {
    const [daiJoin, pot, dai, proxyRegistry] = await Promise.all([
      chainLog.daiJoin(),
      chainLog.pot(),
      chainLog.dai(),
      chainLog.proxyRegistry(),
    ]);

    return new Savings(chainLog, daiJoin, pot, dai, proxyRegistry);
  }
}
