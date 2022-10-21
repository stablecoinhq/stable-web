import { formatBytes32String, parseBytes32String } from '@ethersproject/strings';

export default class IlkType {
  readonly inString: string;
  readonly inBytes32: string;

  private constructor(inString: string, inBytes32: string) {
    this.inString = inString;
    this.inBytes32 = inBytes32;
  }

  static fromString(inString: string) {
    return new IlkType(inString, formatBytes32String(inString));
  }

  static fromBytes32(inBytes32: string) {
    return new IlkType(parseBytes32String(inBytes32), inBytes32);
  }
}
