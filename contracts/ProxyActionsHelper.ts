import { DssProxyActions__factory } from 'generated/types';

import { toBigNumber, UnitFormats } from './math';

import type CDPManagerHelper from './CDPManagerHelper';
import type { IlkInfo } from './IlkRegistryHelper';
import type JugHelper from './JugHelper';
import type { Web3Provider } from '@ethersproject/providers';
import type { FixedNumber, BigNumber, PayableOverrides } from 'ethers';
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
    collateralAmount: FixedNumber,
    daiAmount: FixedNumber,
  ) {
    if (ilkInfo.symbol === 'WETH') {
      return this.execute(
        this.encodeFunctionData('lockETHAndDraw', [
          cdpManager.address,
          jug.address,
          ilkInfo.gemJoin.address,
          daiJoin.address,
          cdpId,
          toBigNumber(daiAmount, UnitFormats.WAD),
        ]),
        {
          value: toBigNumber(collateralAmount, ilkInfo.gem.format),
        },
      );
    }

    /**
     * Collateral will be sent by proxy when `transferFrom` is true
     */
    return this.execute(
      this.encodeFunctionData('lockGemAndDraw', [
        cdpManager.address,
        jug.address,
        ilkInfo.gemJoin.address,
        daiJoin.address,
        cdpId,
        toBigNumber(collateralAmount, ilkInfo.gem.format),
        toBigNumber(daiAmount, UnitFormats.WAD),
        /* transferFrom */ true,
      ]),
    );
  }

  openLockGemAndDraw(
    cdpManager: CDPManagerHelper,
    jug: JugHelper,
    daiJoin: DaiJoin,
    ilkInfo: IlkInfo,
    collateralAmount: FixedNumber,
    daiAmount: FixedNumber,
  ) {
    if (ilkInfo.symbol === 'WETH') {
      return this.execute(
        this.encodeFunctionData('openLockETHAndDraw', [
          cdpManager.address,
          jug.address,
          ilkInfo.gemJoin.address,
          daiJoin.address,
          ilkInfo.type.inBytes32,
          toBigNumber(daiAmount, UnitFormats.WAD),
        ]),
        {
          value: toBigNumber(collateralAmount, ilkInfo.gem.format),
        },
      );
    }

    /**
     * Collateral will be sent by proxy when `transferFrom` is true
     */
    return this.execute(
      this.encodeFunctionData('openLockGemAndDraw', [
        cdpManager.address,
        jug.address,
        ilkInfo.gemJoin.address,
        daiJoin.address,
        ilkInfo.type.inBytes32,
        toBigNumber(collateralAmount, ilkInfo.gem.format),
        toBigNumber(daiAmount, UnitFormats.WAD),
        /* transferFrom */ true,
      ]),
    );
  }

  wipeAndFreeGem(
    cdpManager: CDPManagerHelper,
    daiJoin: DaiJoin,
    ilkInfo: IlkInfo,
    cdpId: BigNumber,
    collateralAmount: FixedNumber,
    daiAmount: FixedNumber,
  ) {
    if (ilkInfo.symbol === 'WETH') {
      return this.execute(
        this.encodeFunctionData('wipeAndFreeETH', [
          cdpManager.address,
          ilkInfo.gemJoin.address,
          daiJoin.address,
          cdpId,
          toBigNumber(collateralAmount, ilkInfo.gem.format),
          toBigNumber(daiAmount, UnitFormats.WAD),
        ]),
      );
    }

    return this.execute(
      this.encodeFunctionData('wipeAndFreeGem', [
        cdpManager.address,
        ilkInfo.gemJoin.address,
        daiJoin.address,
        cdpId,
        toBigNumber(collateralAmount, ilkInfo.gem.format),
        toBigNumber(daiAmount, UnitFormats.WAD),
      ]),
    );
  }
}
