import { BigNumber, FixedNumber } from 'ethers';

import { INT_FORMAT, pow, toFixedNumber, UnitFormats, YEAR_IN_SECONDS } from 'ethereum/helpers/math';

import type ChainLogHelper from './contracts/ChainLogHelper';
import type ERC20Helper from './contracts/ERC20Helper';
import type ProxyActionsDsrHelper from './contracts/ProxyActionsDsrHelper';
import type ProxyRegistryHelper from './contracts/ProxyRegistryHelper';
import type { DaiJoin, DSProxy, Pot } from 'generated/types';

export default class Savings {
  private readonly chainLog: ChainLogHelper;
  private readonly daiJoin: DaiJoin;
  private readonly pot: Pot;
  private readonly dai: ERC20Helper;
  private readonly proxyRegistry: ProxyRegistryHelper;
  private actions?: ProxyActionsDsrHelper;
  private proxy?: DSProxy;

  constructor(
    chainLog: ChainLogHelper,
    daiJoin: DaiJoin,
    pot: Pot,
    dai: ERC20Helper,
    proxyRegistry: ProxyRegistryHelper,
    proxy?: DSProxy,
    actions?: ProxyActionsDsrHelper,
  ) {
    this.chainLog = chainLog;
    this.daiJoin = daiJoin;
    this.pot = pot;
    this.dai = dai;
    this.proxyRegistry = proxyRegistry;
    this.actions = actions;
    this.proxy = proxy;
  }

  private async getProxyAndActions() {
    if (this.proxy && this.actions) {
      return {
        proxy: this.proxy,
        actions: this.actions,
      };
    }
    this.proxy = await this.proxyRegistry.ensureDSProxy();
    this.actions = await this.chainLog.proxyActionsDsr(this.proxy);
    return {
      proxy: this.proxy,
      actions: this.actions,
    };
  }

  async deposit(daiAmount: FixedNumber) {
    if (daiAmount.isNegative() || daiAmount.isZero()) {
      return;
    }
    const { proxy, actions } = await this.getProxyAndActions();
    await this.dai.ensureAllowance(proxy.address, daiAmount, 3);
    const tx = await actions.deposit(this.daiJoin, this.pot, daiAmount);
    await tx.wait();
  }

  async withdraw(daiAmount: FixedNumber) {
    if (daiAmount.isNegative() || daiAmount.isZero()) {
      return;
    }
    const { actions } = await this.getProxyAndActions();
    const tx = await actions.withdraw(this.daiJoin, this.pot, daiAmount);
    await tx.wait();
  }

  async withdrawAll() {
    const { actions } = await this.getProxyAndActions();
    const tx = await actions.withdrawAll(this.daiJoin, this.pot);
    await tx.wait();
  }

  async getDepositAmount() {
    if (this.proxy) {
      const [pie, chi, rho, dsr] = await Promise.all([
        this.pot.pie(this.proxy.address),
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
        address: this.proxy.address,
        amount,
      };
    }
  }

  async getAnnualRate() {
    const dsr = await this.pot.dsr();
    return pow(toFixedNumber(dsr, UnitFormats.RAY), YEAR_IN_SECONDS)
      .subUnsafe(toFixedNumber(BigNumber.from(1), INT_FORMAT).toFormat(UnitFormats.RAY))
      .mulUnsafe(FixedNumber.fromString('100').toFormat(UnitFormats.RAY));
  }

  static async fromChainlog(chainLog: ChainLogHelper): Promise<Savings> {
    const [daiJoin, pot, dai, proxyRegistry] = await Promise.all([
      chainLog.daiJoin(),
      chainLog.pot(),
      chainLog.dai(),
      chainLog.proxyRegistry(),
    ]);
    const proxy = await proxyRegistry.getDSProxy();

    const actions = proxy ? await chainLog.proxyActionsDsr(proxy) : undefined;

    return new Savings(chainLog, daiJoin, pot, dai, proxyRegistry, proxy, actions);
  }
}
