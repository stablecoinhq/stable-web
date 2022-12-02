import { FixedNumber } from 'ethers';

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
}
