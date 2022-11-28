import { Vat__factory } from 'generated/types';

import { toFixedNumber, UnitFormats } from '../math';

import type EthereumProvider from '../EthereumProvider';
import type IlkType from '../IlkType';
import type { FixedNumber } from 'ethers';
import type { Vat } from 'generated/types';

export type IlkStatus = {
  normalizedDebt: FixedNumber;
  debtMultiplier: FixedNumber;
  price: FixedNumber;
  debtCeiling: FixedNumber;
  debtFloor: FixedNumber;
};

export type UrnStatus = {
  urn: string;
  freeBalance: FixedNumber;
  lockedBalance: FixedNumber;
  debt: FixedNumber;
};

export default class VatHelper {
  private readonly contract: Vat;

  constructor(provider: EthereumProvider, address: string) {
    this.contract = Vat__factory.connect(address, provider.getSigner());
  }

  getIlkStatus(ilkType: IlkType): Promise<IlkStatus> {
    return this.contract.ilks(ilkType.inBytes32).then(({ Art: art, rate, spot, line, dust }) => ({
      normalizedDebt: toFixedNumber(art, UnitFormats.WAD),
      debtMultiplier: toFixedNumber(rate, UnitFormats.RAY),
      price: toFixedNumber(spot, UnitFormats.RAY),
      debtCeiling: toFixedNumber(line, UnitFormats.RAD),
      debtFloor: toFixedNumber(dust, UnitFormats.RAD),
    }));
  }

  getUrnStatus(ilkType: IlkType, urn: string): Promise<UrnStatus> {
    return Promise.all([this.contract.urns(ilkType.inBytes32, urn), this.contract.gem(ilkType.inBytes32, urn)]).then(
      ([{ art, ink }, gem]) => ({
        urn,
        freeBalance: toFixedNumber(gem, UnitFormats.WAD),
        lockedBalance: toFixedNumber(ink, UnitFormats.WAD),
        debt: toFixedNumber(art, UnitFormats.WAD),
      }),
    );
  }
}
