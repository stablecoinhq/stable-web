import type ChainLogHelper from './ChainLogHelper';
import type { IlkInfo } from './IlkRegistryHelper';
import type { IlkStatus } from './VatHelper';
import type { BigNumber } from 'ethers';
// eslint-disable-next-line unused-imports/no-unused-imports
import type PromiseConstructor from 'types/promise';

const getDaiAmount = (colAmount: BigNumber, debtMultiplier: BigNumber, liqRatio: BigNumber, colRatio: BigNumber) =>
  colAmount.mul(liqRatio).mul(100).div(debtMultiplier).div(colRatio);

export default class Vault {
  readonly ilkInfo: IlkInfo;
  private readonly cdpId: BigNumber;

  constructor(ilkInfo: IlkInfo, cdpId: BigNumber) {
    this.ilkInfo = ilkInfo;
    this.cdpId = cdpId;
  }

  async mint(
    chainLog: ChainLogHelper,
    ilkStatus: IlkStatus,
    liquidationRatio: BigNumber,
    colAmount: BigNumber,
    colRatio: BigNumber,
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

  async burn(chainLog: ChainLogHelper, colAmount: BigNumber, daiAmount: BigNumber) {
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
    liquidationRatio: BigNumber,
    colAmount: BigNumber,
    colRatio: BigNumber,
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
