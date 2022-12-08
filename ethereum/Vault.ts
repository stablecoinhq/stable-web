import { BigNumber, FixedNumber } from 'ethers';

import { assertFixedFormat, getBiggestDecimalsFormat, UnitFormats, COL_RATIO_FORMAT } from './helpers/math';

import type ChainLogHelper from './contracts/ChainLogHelper';
import type { IlkInfo } from './contracts/IlkRegistryHelper';
import type { IlkStatus } from './contracts/VatHelper';
// eslint-disable-next-line unused-imports/no-unused-imports
import type PromiseConstructor from 'types/promise';

const roundUp = (num: FixedNumber, decimals: number): FixedNumber => {
  const comps = num.toString().split('.');
  if (comps.length === 1) {
    comps.push('0');
  }
  if (comps[1]!.length <= decimals) {
    return num;
  }

  const factor = FixedNumber.from(`1${'0'.repeat(decimals)}`, num.format);
  const bump = FixedNumber.from('1', num.format);

  return num.mulUnsafe(factor).addUnsafe(bump).floor().divUnsafe(factor);
};

export default class Vault {
  readonly ilkInfo: IlkInfo;
  private readonly cdpId: FixedNumber;

  constructor(ilkInfo: IlkInfo, cdpId: FixedNumber) {
    this.ilkInfo = ilkInfo;
    this.cdpId = cdpId;
  }

  async mint(
    chainLog: ChainLogHelper,
    ilkStatus: IlkStatus,
    liquidationRatio: FixedNumber,
    colAmount: FixedNumber,
    colRatio: FixedNumber,
  ) {
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

    const daiAmount = Vault.getDaiAmount(colAmount, colRatio, liquidationRatio, ilkStatus.price);
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

  static async open(
    chainLog: ChainLogHelper,
    ilkInfo: IlkInfo,
    ilkStatus: IlkStatus,
    liquidationRatio: FixedNumber,
    colAmount: FixedNumber,
    colRatio: FixedNumber,
  ) {
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

    const daiAmount = Vault.getDaiAmount(colAmount, colRatio, liquidationRatio, ilkStatus.price);
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

  // Urn debt = Vat.urn.art * Vat.ilk.rate
  // 負債をDAIトークンに換算するために繰り上げを行なっている。
  // 四捨五入などで繰り下げると、全額返済を行なう際に問題が生じる
  static getDebt(urnDebt: FixedNumber, debtMultiplier: FixedNumber) {
    const calcFormat = getBiggestDecimalsFormat(urnDebt.format, debtMultiplier.format);
    return roundUp(
      urnDebt.toFormat(calcFormat).mulUnsafe(debtMultiplier.toFormat(calcFormat)),
      UnitFormats.WAD.decimals,
    ).toFormat(UnitFormats.WAD);
  }
}
