import { BigNumber, FixedNumber } from 'ethers';

import { assertFixedFormat, getBiggestDecimalsFormat, UnitFormats, COL_RATIO_FORMAT } from './helpers/math';

import type CDPManagerHelper from './contracts/CDPManagerHelper';
import type ChainLogHelper from './contracts/ChainLogHelper';
import type ERC20Helper from './contracts/ERC20Helper';
import type { IlkInfo } from './contracts/IlkRegistryHelper';
// eslint-disable-next-line unused-imports/no-unused-imports
import type JugHelper from './contracts/JugHelper';
import type ProxyActionsHelper from './contracts/ProxyActionsHelper';
import type ProxyRegistryHelper from './contracts/ProxyRegistryHelper';
import type { IlkStatus } from './contracts/VatHelper';
import type { DaiJoin, DSProxy } from 'generated/types';

export default class Vault {
  readonly ilkInfo: IlkInfo;
  private readonly cdpManager: CDPManagerHelper;
  private readonly chainLog: ChainLogHelper;
  private readonly jug: JugHelper;
  private readonly daiJoin: DaiJoin;
  private readonly dai: ERC20Helper;
  private readonly proxyRegistry: ProxyRegistryHelper;
  private actions?: ProxyActionsHelper;
  private proxy?: DSProxy;

  constructor(
    chainLog: ChainLogHelper,
    ilkInfo: IlkInfo,
    cdpManager: CDPManagerHelper,
    jug: JugHelper,
    daiJoin: DaiJoin,
    dai: ERC20Helper,
    proxyRegistry: ProxyRegistryHelper,
    actions?: ProxyActionsHelper,
    proxy?: DSProxy,
  ) {
    this.ilkInfo = ilkInfo;
    this.chainLog = chainLog;
    this.cdpManager = cdpManager;
    this.jug = jug;
    this.daiJoin = daiJoin;
    this.dai = dai;
    this.actions = actions;
    this.proxy = proxy;
    this.proxyRegistry = proxyRegistry;
  }

  private async getProxyAndActions() {
    if (this.proxy && this.actions) {
      return {
        proxy: this.proxy,
        actions: this.actions,
      };
    }
    this.proxy = await this.proxyRegistry.ensureDSProxy();
    this.actions = await this.chainLog.proxyActions(this.proxy);
    return {
      proxy: this.proxy,
      actions: this.actions,
    };
  }

  async mint(cdpId: FixedNumber, colAmount: FixedNumber, daiAmount: FixedNumber) {
    const { actions, proxy } = await this.getProxyAndActions();
    await this.ilkInfo.gem.ensureAllowance(proxy.address, colAmount, 3);
    const tx = await actions.lockGemAndDraw(this.cdpManager, this.jug, this.daiJoin, this.ilkInfo, cdpId, colAmount, daiAmount);
    await tx.wait();
  }

  async burn(cdpId: FixedNumber, colAmount: FixedNumber, daiAmount: FixedNumber) {
    const { actions, proxy } = await this.getProxyAndActions();
    await this.dai.ensureAllowance(proxy.address, daiAmount);
    const tx = await actions.wipeAndFreeGem(this.cdpManager, this.daiJoin, this.ilkInfo, cdpId, colAmount, daiAmount);
    await tx.wait();
  }

  async burnAll(cdpId: FixedNumber, colAmount: FixedNumber, daiAmount: FixedNumber) {
    const { actions, proxy } = await this.getProxyAndActions();
    await this.dai.ensureAllowance(proxy.address, daiAmount);
    const tx = await actions.wipeAllAndFreeGem(this.cdpManager, this.daiJoin, this.ilkInfo, cdpId, colAmount);
    await tx.wait();
  }

  async open(colAmount: FixedNumber, daiAmount: FixedNumber) {
    const { actions, proxy } = await this.getProxyAndActions();
    await this.dai.ensureAllowance(proxy.address, daiAmount);
    const tx = await actions.openLockGemAndDraw(this.cdpManager, this.jug, this.daiJoin, this.ilkInfo, colAmount, daiAmount);
    await tx.wait();
  }

  static async fromChainlog(chainLog: ChainLogHelper, ilkInfo: IlkInfo) {
    const [proxyRegistry, cdpManager, jug, daiJoin, dai] = await Promise.all([
      chainLog.proxyRegistry(),
      chainLog.dssCDPManager(),
      chainLog.jug(),
      chainLog.daiJoin(),
      chainLog.dai(),
    ]);
    const proxy = await proxyRegistry.getDSProxy();

    const actions = proxy ? await chainLog.proxyActions(proxy) : undefined;

    return new Vault(chainLog, ilkInfo, cdpManager, jug, daiJoin, dai, proxyRegistry, actions, proxy);
  }

  static getDaiAmount(colAmount: FixedNumber, colRatio: FixedNumber, liqRatio: FixedNumber, price: FixedNumber): FixedNumber {
    if (colRatio.isZero()) {
      return FixedNumber.fromString('0', UnitFormats.WAD);
    }
    const calcFormat = getBiggestDecimalsFormat(colAmount.format, UnitFormats.RAY, COL_RATIO_FORMAT, UnitFormats.WAD);
    const result = colAmount
      .toFormat(calcFormat)
      .mulUnsafe(assertFixedFormat(price, UnitFormats.RAY).toFormat(calcFormat))
      .mulUnsafe(assertFixedFormat(liqRatio, UnitFormats.RAY).toFormat(calcFormat))
      .divUnsafe(assertFixedFormat(colRatio, COL_RATIO_FORMAT).toFormat(calcFormat).toFormat(calcFormat));
    return result.round(UnitFormats.WAD.decimals).toFormat(UnitFormats.WAD);
  }

  // Collateralization Ratio = Vat.urn.ink * Vat.ilk.spot * Spot.ilk.mat / (Vat.urn.art * Vat.ilk.rate)
  static getCollateralizationRatio(
    lockedBalance: FixedNumber,
    urnDebt: FixedNumber,
    liquidationRatio: FixedNumber,
    ilkStatus: IlkStatus,
  ) {
    const calcFormat = UnitFormats.RAD;
    const { price, debtMultiplier } = ilkStatus;
    if (urnDebt.isZero() || debtMultiplier.isZero()) {
      return FixedNumber.fromString('0', calcFormat);
    }
    return lockedBalance
      .toFormat(calcFormat)
      .mulUnsafe(liquidationRatio.toFormat(calcFormat))
      .mulUnsafe(price.toFormat(calcFormat))
      .divUnsafe(urnDebt.toFormat(calcFormat).mulUnsafe(debtMultiplier.toFormat(calcFormat)))
      .mulUnsafe(FixedNumber.fromValue(BigNumber.from(100)).toFormat(calcFormat));
  }

  // Urn debt = Vat.urn.art * Vat.ilk.rate + daiAmount
  static getDebt(urnDebt: FixedNumber, debtMultiplier: FixedNumber, daiAmount?: FixedNumber) {
    const calcFormat = getBiggestDecimalsFormat(urnDebt.format, debtMultiplier.format);
    const factor = FixedNumber.from(`1${'0'.repeat(UnitFormats.WAD.decimals)}`, calcFormat);
    return urnDebt
      .toFormat(calcFormat)
      .mulUnsafe(debtMultiplier.toFormat(calcFormat))
      .addUnsafe(daiAmount?.toFormat(calcFormat) || FixedNumber.fromString('0', calcFormat))
      .mulUnsafe(factor)
      .ceiling()
      .divUnsafe(factor)
      .toFormat(UnitFormats.WAD);
  }

  // liquidation price = Spot.ilks.mat * Vat.urn.art * Vat.ilk.rate / Vat.urn.ink
  static getLiquidationPrice(
    lockedBalance: FixedNumber,
    urnDebt: FixedNumber,
    debtMultiplier: FixedNumber,
    liquidationRatio: FixedNumber,
  ) {
    const calcFormat = getBiggestDecimalsFormat(urnDebt.format, debtMultiplier.format);

    if (lockedBalance.isZero()) {
      return FixedNumber.fromString('0', calcFormat);
    }

    return liquidationRatio
      .toFormat(calcFormat)
      .mulUnsafe(urnDebt.toFormat(calcFormat))
      .mulUnsafe(debtMultiplier.toFormat(calcFormat))
      .divUnsafe(lockedBalance.toFormat(calcFormat))
      .round(UnitFormats.WAD.decimals)
      .toFormat(UnitFormats.WAD);
  }
}
