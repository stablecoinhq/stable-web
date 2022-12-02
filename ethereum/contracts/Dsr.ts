import { toFixedNumber, UnitFormats } from '../helpers/math';

import type ChainLogHelper from './ChainLogHelper';
import type { FixedNumber } from 'ethers';

export default class Dsr {
  static async deposit(chainLog: ChainLogHelper, daiAmount: FixedNumber) {
    const [actions, daiJoin, pot] = await Promise.all([
      Promise.all([chainLog.proxyRegistry().then((proxyRegistry) => proxyRegistry.ensureDSProxy()), chainLog.dai()]).then(
        ([proxy, dai]) =>
          Promise.all([chainLog.proxyActionsDsr(proxy), dai.ensureAllowance(proxy.address, daiAmount)]).then(([x, _]) => x),
      ),
      chainLog.daiJoin(),
      chainLog.pot(),
    ]);
    const tx = await actions.deposit(daiJoin, pot, daiAmount);
    await tx.wait();
  }

  static async withdraw(chainLog: ChainLogHelper, daiAmount: FixedNumber) {
    const [actions, daiJoin, pot] = await Promise.all([
      chainLog
        .proxyRegistry()
        .then((proxyRegistry) => proxyRegistry.ensureDSProxy())
        .then((proxy) => chainLog.proxyActionsDsr(proxy)),
      chainLog.daiJoin(),
      chainLog.pot(),
    ]);
    const tx = await actions.withdraw(daiJoin, pot, daiAmount);
    await tx.wait();
  }

  static async withdrawAll(chainLog: ChainLogHelper) {
    const [actions, daiJoin, pot] = await Promise.all([
      chainLog
        .proxyRegistry()
        .then((proxyRegistry) => proxyRegistry.ensureDSProxy())
        .then((proxy) => chainLog.proxyActionsDsr(proxy)),
      chainLog.daiJoin(),
      chainLog.pot(),
    ]);
    const tx = await actions.withdrawAll(daiJoin, pot);
    await tx.wait();
  }

  static async getDepositAmount(chainLog: ChainLogHelper) {
    const proxyRegistry = await chainLog.proxyRegistry();
    const proxy = await proxyRegistry.getDSProxy();
    if (proxy) {
      const pot = await chainLog.pot();
      const pie = await pot.pie(proxy.address);
      return { address: proxy.address, amount: toFixedNumber(pie, UnitFormats.WAD) };
    }
  }

  static async getSavingRate(chainLog: ChainLogHelper) {
    const pot = await chainLog.pot();
    const dsr = await pot.dsr();
    return toFixedNumber(dsr, UnitFormats.RAY);
  }
}
