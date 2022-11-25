import { DssProxyActionsDsr__factory } from 'generated/types';

import { toBigNumber, UnitFormats } from './math';

import type EthereumProvider from './EthereumProvider';
import type { FixedNumber, PayableOverrides } from 'ethers';
import type { DssProxyActionsDsr, DaiJoin, DSProxy, Pot } from 'generated/types';

export default class ProxyActionsDsrHelper {
  private readonly actions: DssProxyActionsDsr;
  private readonly proxy: DSProxy;

  constructor(provider: EthereumProvider, address: string, proxy: DSProxy) {
    this.proxy = proxy;
    this.actions = DssProxyActionsDsr__factory.connect(address, provider.getSigner());
  }

  get proxyAddress() {
    return this.proxy.address;
  }

  private get encodeFunctionData() {
    return this.actions.interface.encodeFunctionData.bind(this.actions.interface);
  }

  private execute(data: string, overrides: PayableOverrides | undefined = undefined) {
    // TODO: Gas limitを乗算する
    const GAS_LIMIT = 300000;

    if (overrides) {
      return this.proxy['execute(address,bytes)'](this.actions.address, data, overrides);
    }

    return this.proxy['execute(address,bytes)'](this.actions.address, data, { gasLimit: GAS_LIMIT });
  }

  deposit(daiJoin: DaiJoin, pot: Pot, daiAmount: FixedNumber) {
    return this.execute(
      this.encodeFunctionData('join', [daiJoin.address, pot.address, toBigNumber(daiAmount, UnitFormats.WAD)]),
    );
  }

  withdraw(daiJoin: DaiJoin, pot: Pot, daiAmount: FixedNumber) {
    return this.execute(
      this.encodeFunctionData('exit', [daiJoin.address, pot.address, toBigNumber(daiAmount, UnitFormats.WAD)]),
    );
  }

  withdrawAll(daiJoin: DaiJoin, pot: Pot) {
    return this.execute(this.encodeFunctionData('exitAll', [daiJoin.address, pot.address]));
  }
}
