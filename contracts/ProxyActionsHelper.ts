import { formatBytes32String } from '@ethersproject/strings';

import { DssProxyActions__factory, DSProxy__factory } from 'generated/types';

import type { Web3Provider } from '@ethersproject/providers';
import type { ethers } from 'ethers';
import type { DssProxyActions, DSProxy } from 'generated/types';

export default class ProxyActionsHelper {
  private readonly proxy: DSProxy;
  private readonly actions: DssProxyActions;

  constructor(provider: Web3Provider, proxy: DSProxy | string, actions: string) {
    if (typeof proxy === 'string') {
      this.proxy = DSProxy__factory.connect(proxy, provider.getSigner());
    } else {
      this.proxy = proxy;
    }
    this.actions = DssProxyActions__factory.connect(actions, provider.getSigner());
  }

  // ilk: ETH-A, DAI-A, ...
  open(cdpManager: string, ilk: string) {
    return this.proxy['execute(address,bytes)'](
      this.actions.address,
      this.actions.interface.encodeFunctionData('open', [cdpManager, formatBytes32String(ilk), this.proxy.address]),
    );
  }

  lockETHAndDraw(
    cdpManager: string,
    jug: string,
    ethJoin: string,
    daiJoin: string,
    cdp: ethers.BigNumberish,
    amtEth: ethers.BigNumber,
    wadDai: ethers.BigNumberish,
  ) {
    return this.proxy['execute(address,bytes)'](
      this.actions.address,
      this.actions.interface.encodeFunctionData('lockETHAndDraw', [cdpManager, jug, ethJoin, daiJoin, cdp, wadDai]),
      { value: amtEth },
    );
  }

  // ilk: ETH-A, DAI-A, ...
  openLockEthAndDraw(
    cdpManager: string,
    jug: string,
    ethJoin: string,
    daiJoin: string,
    ilk: string,
    amtEth: ethers.BigNumber,
    wadDai: ethers.BigNumberish,
  ) {
    return this.proxy['execute(address,bytes)'](
      this.actions.address,
      this.actions.interface.encodeFunctionData('openLockETHAndDraw', [
        cdpManager,
        jug,
        ethJoin,
        daiJoin,
        formatBytes32String(ilk),
        wadDai,
      ]),
      { value: amtEth },
    );
  }

  /**
   * if transferFrom is true, collateral will be sent to gemJoin adoptor by proxy.
   * amtCollateral's decimal should be different per its token type.
   */
  lockGemAndDraw(
    cdpManager: string,
    jug: string,
    gemJoin: string,
    daiJoin: string,
    cdp: ethers.BigNumberish,
    amtCollateral: ethers.BigNumber,
    wadDai: ethers.BigNumberish,
    transferFrom: boolean,
  ) {
    return this.proxy['execute(address,bytes)'](
      this.actions.address,
      this.actions.interface.encodeFunctionData('lockGemAndDraw', [
        cdpManager,
        jug,
        gemJoin,
        daiJoin,
        cdp,
        amtCollateral,
        wadDai,
        transferFrom,
      ]),
    );
  }

  /**
   * if transferFrom is true, collateral will be sent to gemJoin adoptor by proxy.
   * amtCollateral's decimal should be different per its token type.
   * ilk: ETH-A, DAI-A, ...
   */
  openLockGemAndDraw(
    cdpManager: string,
    jug: string,
    gemJoin: string,
    daiJoin: string,
    ilk: string,
    amtCollateral: ethers.BigNumber,
    wadDai: ethers.BigNumberish,
    transferFrom: boolean,
  ) {
    return this.proxy['execute(address,bytes)'](
      this.actions.address,
      this.actions.interface.encodeFunctionData('openLockGemAndDraw', [
        cdpManager,
        jug,
        gemJoin,
        daiJoin,
        ilk,
        amtCollateral,
        wadDai,
        transferFrom,
      ]),
    );
  }

  wipeAndFreeEth(
    cdpMan: string,
    ethJoin: string,
    daiJoin: string,
    cdpId: ethers.BigNumber,
    wadCollateral: ethers.BigNumber,
    wadDai: ethers.BigNumber,
  ) {
    return this.proxy['execute(address,bytes)'](
      this.actions.address,
      this.actions.interface.encodeFunctionData('wipeAndFreeETH', [cdpMan, ethJoin, daiJoin, cdpId, wadCollateral, wadDai]),
    );
  }

  /**
   * if dai amount is enough to withdraw all locked collateral, wadCollateral should be all locked collateral.
   * if not, wadCollateral should be as withdrawable amount as possible.
   * otherwise, unnecessary transactions needed later.
   * locked collateral can't be used to re-mint dai as it is.
   * to work, need to once unlock it and re-lock it
   */
  wipeAllAndFreeEth(
    cdpMan: string,
    ethJoin: string,
    daiJoin: string,
    cdpId: ethers.BigNumber,
    wadCollateral: ethers.BigNumber,
  ) {
    return this.proxy['execute(address,bytes)'](
      this.actions.address,
      this.actions.interface.encodeFunctionData('wipeAllAndFreeETH', [cdpMan, ethJoin, daiJoin, cdpId, wadCollateral]),
    );
  }

  wipeAndFreeGem(
    cdpMan: string,
    gemJoin: string,
    daiJoin: string,
    cdpId: ethers.BigNumber,
    amtCollateral: ethers.BigNumber,
    wadDai: ethers.BigNumber,
  ) {
    return this.proxy['execute(address,bytes)'](
      this.actions.address,
      this.actions.interface.encodeFunctionData('wipeAndFreeGem', [cdpMan, gemJoin, daiJoin, cdpId, amtCollateral, wadDai]),
    );
  }

  wipeAllAndFreeGem(
    cdpMan: string,
    gemJoin: string,
    daiJoin: string,
    cdpId: ethers.BigNumber,
    amtCollateral: ethers.BigNumber,
  ) {
    return this.proxy['execute(address,bytes)'](
      this.actions.address,
      this.actions.interface.encodeFunctionData('wipeAllAndFreeGem', [cdpMan, gemJoin, daiJoin, cdpId, amtCollateral]),
    );
  }
}
