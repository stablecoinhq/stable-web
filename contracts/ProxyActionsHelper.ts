import { DssProxyActions__factory } from 'generated/types';

import type CDPManagerHelper from './CDPManagerHelper';
import type { IlkInfo } from './IlkRegistryHelper';
import type JugHelper from './JugHelper';
import type { Web3Provider } from '@ethersproject/providers';
import type { BigNumber, PayableOverrides } from 'ethers';
import type { DssProxyActions, DSProxy, DaiJoin } from 'generated/types';

export default class ProxyActionsHelper {
  private readonly proxy: DSProxy;
  private readonly actions: DssProxyActions;

  constructor(provider: Web3Provider, address: string, proxy: DSProxy) {
    this.proxy = proxy;
    this.actions = DssProxyActions__factory.connect(address, provider.getSigner());
  }

  private get encodeFunctionData() {
    return this.actions.interface.encodeFunctionData.bind(this.actions.interface);
  }

  private execute(data: string, overrides: PayableOverrides | undefined = undefined) {
    if (overrides) {
      return this.proxy['execute(address,bytes)'](this.actions.address, data, overrides);
    }

    return this.proxy['execute(address,bytes)'](this.actions.address, data);
  }

  lockGemAndDraw(
    cdpManager: CDPManagerHelper,
    jug: JugHelper,
    daiJoin: DaiJoin,
    ilkInfo: IlkInfo,
    cdpId: BigNumber,
    collateralAmount: BigNumber,
    daiAmount: BigNumber,
  ) {
    if (ilkInfo.symbol === 'WETH') {
      return this.execute(
        this.encodeFunctionData('lockETHAndDraw', [
          cdpManager.address,
          jug.address,
          ilkInfo.gemJoin.address,
          daiJoin.address,
          cdpId,
          daiAmount,
        ]),
        {
          value: collateralAmount,
        },
      );
    }

    return this.execute(
      this.encodeFunctionData('lockGemAndDraw', [
        cdpManager.address,
        jug.address,
        ilkInfo.gemJoin.address,
        daiJoin.address,
        cdpId,
        collateralAmount,
        daiAmount,
        /* transferFrom */ true,
      ]),
    );
  }

  openLockGemAndDraw(
    cdpManager: CDPManagerHelper,
    jug: JugHelper,
    daiJoin: DaiJoin,
    ilkInfo: IlkInfo,
    collateralAmount: BigNumber,
    daiAmount: BigNumber,
  ) {
    if (ilkInfo.symbol === 'WETH') {
      return this.execute(
        this.encodeFunctionData('openLockETHAndDraw', [
          cdpManager.address,
          jug.address,
          ilkInfo.gemJoin.address,
          daiJoin.address,
          ilkInfo.type.inBytes32,
          daiAmount,
        ]),
        {
          value: collateralAmount,
        },
      );
    }

    return this.execute(
      this.encodeFunctionData('openLockGemAndDraw', [
        cdpManager.address,
        jug.address,
        ilkInfo.gemJoin.address,
        daiJoin.address,
        ilkInfo.type.inBytes32,
        collateralAmount,
        daiAmount,
        /* transferFrom */ true,
      ]),
    );
  }

  wipeAndFreeGem(
    cdpManager: CDPManagerHelper,
    daiJoin: DaiJoin,
    ilkInfo: IlkInfo,
    cdpId: BigNumber,
    collateralAmount: BigNumber,
    daiAmount: BigNumber,
  ) {
    if (ilkInfo.symbol === 'WETH') {
      return this.execute(
        this.encodeFunctionData('wipeAndFreeETH', [
          cdpManager.address,
          ilkInfo.gemJoin.address,
          daiJoin.address,
          cdpId,
          collateralAmount,
          daiAmount,
        ]),
      );
    }

    return this.execute(
      this.encodeFunctionData('wipeAndFreeGem', [
        cdpManager.address,
        ilkInfo.gemJoin.address,
        daiJoin.address,
        cdpId,
        collateralAmount,
        daiAmount,
      ]),
    );
  }
}
