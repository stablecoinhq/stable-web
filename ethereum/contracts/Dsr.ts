import { toFixedNumber, UnitFormats } from './math';

import type ChainLogHelper from './ChainLogHelper';
import type ERC20Helper from './ERC20Helper';
import type ProxyActionsDsrHelper from './ProxyActionsDsrHelper';
import type { FixedNumber } from 'ethers';
// eslint-disable-next-line unused-imports/no-unused-imports
import type { DaiJoin, Pot } from 'generated/types';

export default class Dsr {
  private readonly actions: ProxyActionsDsrHelper;
  private readonly daiJoin: DaiJoin;
  private readonly pot: Pot;
  private readonly dai: ERC20Helper;
  constructor(actions: ProxyActionsDsrHelper, daiJoin: DaiJoin, pot: Pot, dai: ERC20Helper) {
    this.actions = actions;
    this.daiJoin = daiJoin;
    this.pot = pot;

    this.dai = dai;
  }

  async deposit(daiAmount: FixedNumber) {
    await this.dai.ensureAllowance(this.actions.proxyAddress, daiAmount);
    await this.actions.deposit(this.daiJoin, this.pot, daiAmount);
  }

  async withdraw(daiAmount: FixedNumber) {
    await this.actions.withdraw(this.daiJoin, this.pot, daiAmount);
  }

  withdrawAll() {
    this.actions.withdrawAll(this.daiJoin, this.pot);
  }

  async getDepositAmount() {
    const pie = await this.pot.pie(this.actions.proxyAddress);
    return toFixedNumber(pie, UnitFormats.WAD);
  }

  async getSavingRate() {
    const dsr = await this.pot.dsr();
    return toFixedNumber(dsr, UnitFormats.RAY);
  }

  static async fromChainLog(chainLog: ChainLogHelper) {
    const [dai, actions, daiJoin, pot] = await Promise.all([
      chainLog.dai(),
      chainLog
        .proxyRegistry()
        .then((proxyRegistry) => proxyRegistry.ensureDSProxy())
        .then((proxy) => chainLog.proxyActionsDsr(proxy)),
      chainLog.daiJoin(),
      chainLog.pot(),
    ]);
    return new Dsr(actions, daiJoin, pot, dai);
  }
}
