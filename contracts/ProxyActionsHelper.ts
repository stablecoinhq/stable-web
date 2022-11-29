import { DssProxyActions__factory } from 'generated/types';

import { INT_FORMAT, toBigNumber, UnitFormats } from './math';

import type CDPManagerHelper from './CDPManagerHelper';
import type EthereumProvider from './EthereumProvider';
import type { IlkInfo } from './IlkRegistryHelper';
import type JugHelper from './JugHelper';
import type { FixedNumber, PayableOverrides } from 'ethers';
import type { DssProxyActions, DSProxy, DaiJoin } from 'generated/types';

export default class ProxyActionsHelper {
  private readonly proxy: DSProxy;
  private readonly actions: DssProxyActions;

  constructor(provider: EthereumProvider, address: string, proxy: DSProxy) {
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
    cdpId: FixedNumber,
    collateralAmount: FixedNumber,
    daiAmount: FixedNumber,
  ) {
    if (ilkInfo.symbol === 'ETH') {
      return this.execute(
        this.encodeFunctionData('lockETHAndDraw', [
          cdpManager.address,
          jug.address,
          ilkInfo.gemJoin.address,
          daiJoin.address,
          toBigNumber(cdpId, INT_FORMAT),
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
        toBigNumber(cdpId, INT_FORMAT),
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
    console.log(
      `DaiAmount ${toBigNumber(daiAmount, UnitFormats.WAD)}, Eth amount ${toBigNumber(collateralAmount, ilkInfo.gem.format)}`,
    );
    if (ilkInfo.symbol === 'ETH') {
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
    cdpId: FixedNumber,
    collateralAmount: FixedNumber,
    daiAmount: FixedNumber,
  ) {
    if (ilkInfo.symbol === 'ETH') {
      return this.execute(
        this.encodeFunctionData('wipeAndFreeETH', [
          cdpManager.address,
          ilkInfo.gemJoin.address,
          daiJoin.address,
          toBigNumber(cdpId, INT_FORMAT),
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
        toBigNumber(cdpId, INT_FORMAT),
        toBigNumber(collateralAmount, ilkInfo.gem.format),
        toBigNumber(daiAmount, UnitFormats.WAD),
      ]),
    );
  }
}
