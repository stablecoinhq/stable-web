import { BigNumber, FixedNumber } from 'ethers';

import { assertFixedFormat, getBiggestDecimalsFormat, UnitFormats, COL_RATIO_FORMAT } from './helpers/math';

import type ChainLogHelper from './contracts/ChainLogHelper';
import type { IlkInfo } from './contracts/IlkRegistryHelper';
import type { IlkStatus } from './contracts/VatHelper';
// eslint-disable-next-line unused-imports/no-unused-imports
import type PromiseConstructor from 'types/promise';

export default class Vault {
  readonly ilkInfo: IlkInfo;
  private readonly cdpId: FixedNumber;

  constructor(ilkInfo: IlkInfo, cdpId: FixedNumber) {
    this.ilkInfo = ilkInfo;
    this.cdpId = cdpId;
  }

  async mint(chainLog: ChainLogHelper, colAmount: FixedNumber, daiAmount: FixedNumber) {
    const [actions, cdpManager, jug, daiJoin] = await Promise.all([
      chainLog
        .proxyRegistry()
        .then((proxyRegistry) => proxyRegistry.ensureDSProxy())
        .then((proxy) =>
          Promise.all([chainLog.proxyActions(proxy), this.ilkInfo.gem.ensureAllowance(proxy.address, colAmount)]),
        )
        .then(([x, _]) => x),
      chainLog.dssCDPManager(),
      chainLog.jug(),
      chainLog.daiJoin(),
    ]);
    await actions
      .lockGemAndDraw(cdpManager, jug, daiJoin, this.ilkInfo, this.cdpId, colAmount, daiAmount)
      .then((tx) => tx.wait());
  }

  async burn(chainLog: ChainLogHelper, colAmount: FixedNumber, daiAmount: FixedNumber) {
    const [actions, cdpManager, daiJoin] = await Promise.all([
      Promise.all([chainLog.proxyRegistry().then((proxyRegistry) => proxyRegistry.ensureDSProxy()), chainLog.dai()]).then(
        ([proxy, dai]) =>
          Promise.all([chainLog.proxyActions(proxy), dai.ensureAllowance(proxy.address, daiAmount)]).then(([x, _]) => x),
      ),
      chainLog.dssCDPManager(),
      chainLog.daiJoin(),
    ]);

    await actions.wipeAndFreeGem(cdpManager, daiJoin, this.ilkInfo, this.cdpId, colAmount, daiAmount).then((tx) => tx.wait());
  }

  async burnAll(chainLog: ChainLogHelper, colAmount: FixedNumber, daiAmount: FixedNumber) {
    const [actions, cdpManager, daiJoin] = await Promise.all([
      Promise.all([chainLog.proxyRegistry().then((proxyRegistry) => proxyRegistry.ensureDSProxy()), chainLog.dai()]).then(
        ([proxy, dai]) =>
          Promise.all([chainLog.proxyActions(proxy), dai.ensureAllowance(proxy.address, daiAmount)]).then(([x, _]) => x),
      ),
      chainLog.dssCDPManager(),
      chainLog.daiJoin(),
    ]);

    await actions.wipeAllAndFreeGem(cdpManager, daiJoin, this.ilkInfo, this.cdpId, colAmount).then((tx) => tx.wait());
  }

  static async open(chainLog: ChainLogHelper, ilkInfo: IlkInfo, colAmount: FixedNumber, daiAmount: FixedNumber) {
    const [actions, cdpManager, jug, daiJoin] = await Promise.all([
      chainLog
        .proxyRegistry()
        .then((proxyRegistry) => proxyRegistry.ensureDSProxy())
        .then((proxy) => Promise.all([chainLog.proxyActions(proxy), ilkInfo.gem.ensureAllowance(proxy.address, colAmount)]))
        .then(([x, _]) => x),
      chainLog.dssCDPManager(),
      chainLog.jug(),
      chainLog.daiJoin(),
    ]);
    await actions.openLockGemAndDraw(cdpManager, jug, daiJoin, ilkInfo, colAmount, daiAmount).then((tx) => tx.wait());
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
