import { FixedFormat } from '@ethersproject/bignumber';

import { assertFixedFormat, getBiggestDecimalsFormat, UnitFormats } from './helpers/math';

import type ChainLogHelper from './contracts/ChainLogHelper';
import type { IlkInfo } from './contracts/IlkRegistryHelper';
import type { IlkStatus } from './contracts/VatHelper';
import type { FixedNumber } from 'ethers';
// eslint-disable-next-line unused-imports/no-unused-imports
import type PromiseConstructor from 'types/promise';

/**
 * Collateral ratio has 2 decimals (percentage)
 */
export const COL_RATIO_FORMAT = FixedFormat.from(2);

const getDaiAmount = (colAmount: FixedNumber, debtMultiplier: FixedNumber, liqRatio: FixedNumber, colRatio: FixedNumber) => {
  const calcFormat = getBiggestDecimalsFormat(colAmount.format, UnitFormats.RAY, COL_RATIO_FORMAT, UnitFormats.WAD);
  const result = colAmount
    .toFormat(calcFormat)
    .mulUnsafe(assertFixedFormat(liqRatio, UnitFormats.RAY).toFormat(calcFormat))
    .divUnsafe(assertFixedFormat(debtMultiplier, UnitFormats.RAY).toFormat(calcFormat))
    .divUnsafe(assertFixedFormat(colRatio, COL_RATIO_FORMAT).toFormat(calcFormat));

  return result.round(UnitFormats.WAD.decimals).toFormat(UnitFormats.WAD);
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

    const daiAmount = getDaiAmount(colAmount, ilkStatus.debtMultiplier, liquidationRatio, colRatio);
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

    const daiAmount = getDaiAmount(colAmount, ilkStatus.debtMultiplier, liquidationRatio, colRatio);
    await actions.openLockGemAndDraw(cdpManager, jug, daiJoin, ilkInfo, colAmount, daiAmount).then((tx) => tx.wait());
  }
}
