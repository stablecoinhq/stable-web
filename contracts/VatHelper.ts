import { Vat__factory } from 'generated/types';

import type IlkType from './IlkType';
import type { Web3Provider } from '@ethersproject/providers';
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

  constructor(provider: Web3Provider, address: string) {
    this.contract = Vat__factory.connect(address, provider.getSigner());
  }

  getIlkStatus(ilkType: IlkType): Promise<IlkStatus> {
    return this.contract.ilks(ilkType.inBytes32).then(({ Art: art, rate, spot, line, dust }) => ({
      normalizedDebt: art,
      debtMultiplier: rate,
      price: spot,
      debtCeiling: line,
      debtFloor: dust,
    }));
  }

  getUrnStatus(ilkType: IlkType, urn: string): Promise<UrnStatus> {
    return Promise.all([this.contract.urns(ilkType.inBytes32, urn), this.contract.gem(ilkType.inBytes32, urn)]).then(
      ([{ art, ink }, gem]) => ({
        urn,
        freeBalance: gem,
        lockedBalance: ink,
        debt: art,
      }),
    );
  }
}
