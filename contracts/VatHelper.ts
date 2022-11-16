import { Vat__factory } from 'generated/types';

import type EthereumProvider from './EthereumProvider';
import type IlkType from './IlkType';
import type { BigNumber } from 'ethers';
import type { Vat } from 'generated/types';

export type IlkStatus = {
  normalizedDebt: BigNumber;
  debtMultiplier: BigNumber;
  price: BigNumber;
  debtCeiling: BigNumber;
  debtFloor: BigNumber;
};

export type UrnStatus = {
  urn: string;
  freeBalance: BigNumber;
  lockedBalance: BigNumber;
  debt: BigNumber;
};

export default class VatHelper {
  private readonly contract: Vat;

  constructor(provider: EthereumProvider, address: string) {
    this.contract = Vat__factory.connect(address, provider.getSigner());
  }

  async getIlkStatus(ilkType: IlkType): Promise<IlkStatus> {
    const { Art: art, rate, spot, line, dust } = await this.contract.ilks(ilkType.inBytes32);
    return ({
      normalizedDebt: art,
      debtMultiplier: rate,
      price: spot,
      debtCeiling: line,
      debtFloor: dust,
    });
  }

  async getUrnStatus(ilkType: IlkType, urn: string): Promise<UrnStatus> {
    const [{ art, ink }, gem] = await Promise.all([this.contract.urns(ilkType.inBytes32, urn), this.contract.gem(ilkType.inBytes32, urn)]);
    return ({
      urn,
      freeBalance: gem,
      lockedBalance: ink,
      debt: art,
    });
  }
}
