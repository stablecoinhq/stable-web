import { formatBytes32String } from '@ethersproject/strings';

import { DssProxyActions__factory, DSProxy__factory } from 'generated/types';

import type { ethers } from 'ethers';
import type { DssProxyActions, DSProxy } from 'generated/types';

export default class ProxyActionsHelper {
  private readonly proxy: DSProxy;
  private readonly actions: DssProxyActions;

  constructor(provider: ethers.Signer, proxy: string, actions: string);
  constructor(provider: ethers.Signer, proxy: DSProxy, actions: string);
  constructor(provider: ethers.Signer, proxy: DSProxy | string, actions: string) {
    if (typeof proxy === 'string') {
      this.proxy = DSProxy__factory.connect(proxy, provider);
    } else {
      this.proxy = proxy;
    }
    this.actions = DssProxyActions__factory.connect(actions, provider);
  }

  // ilk: ETH-A, DAI-A, ...
  open(cdpManager: string, ilk: string) {
    return this.proxy['execute(address,bytes)'](
      this.actions.address,
      this.actions.interface.encodeFunctionData('open', [cdpManager, formatBytes32String(ilk), this.proxy.address]),
    );
  }

  lockETHAndDraw(cdpManager: string, jug: string, ethJoin: string, daiJoin: string, cdp: ethers.BigNumberish, amtEth: ethers.BigNumber, wadDai: ethers.BigNumberish) {
    return this.proxy['execute(address,bytes)'](
      this.actions.address,
      this.actions.interface.encodeFunctionData('lockETHAndDraw', [cdpManager, jug, ethJoin, daiJoin, cdp, wadDai]),
      { value: amtEth }
    );
  }

  // ilk: ETH-A, DAI-A, ...
  openLockEthAndDraw(cdpManager: string, jug: string, ethJoin: string, daiJoin: string, ilk: string, amtEth: ethers.BigNumber, wadDai: ethers.BigNumberish) {
    return this.proxy['execute(address,bytes)'](
      this.actions.address,
      this.actions.interface.encodeFunctionData('openLockETHAndDraw', [cdpManager, jug, ethJoin, daiJoin, formatBytes32String(ilk), wadDai]),
      { value: amtEth }
    );
  }

  /**
   * if transferFrom is true, collateral will be sent to gemJoin adoptor by proxy.
   * amtCollateral's decimal should be different per its token type.
   */
  lockGemAndDraw(cdpManager: string, jug: string, gemJoin: string, daiJoin: string, cdp: ethers.BigNumberish, amtCollateral: ethers.BigNumber, wadDai: ethers.BigNumberish, transferFrom: boolean) {
    return this.proxy['execute(address,bytes)'](
      this.actions.address,
      this.actions.interface.encodeFunctionData('lockGemAndDraw', [cdpManager, jug, gemJoin, daiJoin, cdp, amtCollateral, wadDai, transferFrom]),
    );
  }

  // ilk: ETH-A, DAI-A, ...
  openLockGemAndDraw(cdpManager: string, jug: string, gemJoin: string, daiJoin: string, ilk: string, amtCollateral: ethers.BigNumber, wadDai: ethers.BigNumberish, transferFrom: boolean) {
    return this.proxy['execute(address,bytes)'](
      this.actions.address,
      this.actions.interface.encodeFunctionData('openLockGemAndDraw', [cdpManager, jug, gemJoin, daiJoin, ilk, amtCollateral, wadDai, transferFrom]),
    );
  }
}
