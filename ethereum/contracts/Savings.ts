import { BigNumber } from 'ethers';

import { pow, toFixedNumber, UnitFormats, YEAR_IN_SECONDS } from './math';

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
    await this.dai.ensureAllowance(proxy.address, daiAmount, 3);
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

  async withdrawAll() {
    const proxy = await this.proxyRegistry.ensureDSProxy();
    const actions = await this.chainLog.proxyActionsDsr(proxy);
    const tx = await actions.withdrawAll(this.daiJoin, this.pot);
    await tx.wait();
  }

  async getDepositAmount() {
    const proxy = await this.proxyRegistry.getDSProxy();
    if (proxy) {
      const [pie, chi, rho, dsr] = await Promise.all([
        this.pot.pie(proxy.address),
        this.pot.chi(),
        this.pot.rho(),
        this.pot.dsr(),
      ]);
      // 収益を加算する
      // pie * (dsr ** (now - rho) * chi)
      const now = Math.floor(new Date().getTime() / 1000);
      const unitFormat = UnitFormats.RAY;
      const currentChi =
        now > rho.toNumber()
          ? pow(toFixedNumber(dsr, unitFormat), now - rho.toNumber()).mulUnsafe(toFixedNumber(chi, unitFormat))
          : toFixedNumber(chi, unitFormat);
      const amount = toFixedNumber(pie, UnitFormats.WAD)
        .toFormat(unitFormat)
        .mulUnsafe(currentChi)
        .round(18)
        .toFormat(UnitFormats.WAD);
      return {
        address: proxy.address,
        amount,
      };
    }
  }

  async getAnnualRate() {
    const dsr = await this.pot.dsr();
    return pow(toFixedNumber(dsr, UnitFormats.RAY), YEAR_IN_SECONDS).subUnsafe(
      toFixedNumber(BigNumber.from(1), UnitFormats.RAY),
    );
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
