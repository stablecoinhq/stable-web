import { FixedNumber } from 'ethers';

import { INT_FORMAT, UnitFormats } from 'ethereum/helpers/math';
import { MintFormValidation } from 'pages/forms/MintFormValidation';

import type { IlkStatus } from 'ethereum/contracts/VatHelper';

describe('MintFormValidation', () => {
  describe('isInsufficientBalance', () => {
    describe('with INT_FORMAT', () => {
      const zero = FixedNumber.fromString('0', INT_FORMAT);
      const low = FixedNumber.fromString('10', INT_FORMAT);
      const high = FixedNumber.fromString('20', INT_FORMAT);
      const anotherHigh = FixedNumber.fromString('20', INT_FORMAT);

      it('returns true when balance < colAmount', () => {
        expect(MintFormValidation.isInsufficientBalance(zero, low)).toBeTruthy();
        expect(MintFormValidation.isInsufficientBalance(low, high)).toBeTruthy();
      });

      it('returns false when balance = colAmount', () => {
        expect(MintFormValidation.isInsufficientBalance(zero, zero)).toBeFalsy();
        expect(MintFormValidation.isInsufficientBalance(low, low)).toBeFalsy();
        expect(MintFormValidation.isInsufficientBalance(high, anotherHigh)).toBeFalsy();
      });

      it('returns false when balance > colAmount', () => {
        expect(MintFormValidation.isInsufficientBalance(low, zero)).toBeFalsy();
        expect(MintFormValidation.isInsufficientBalance(high, low)).toBeFalsy();
      });
    });

    describe('with UnitFormats.WAD', () => {
      const low = FixedNumber.fromString('0.01234', UnitFormats.WAD);
      const high = FixedNumber.fromString('0.01235', UnitFormats.WAD);

      it('returns true when balance < colAmount', () => {
        expect(MintFormValidation.isInsufficientBalance(low, high)).toBeTruthy();
      });

      it('returns false when balance = colAmount', () => {
        expect(MintFormValidation.isInsufficientBalance(low, low)).toBeFalsy();
      });

      it('returns false when balance > colAmount', () => {
        expect(MintFormValidation.isInsufficientBalance(high, low)).toBeFalsy();
      });
    });
  });

  describe('isBelowLiquidationRatio', () => {
    const zeroWAD = FixedNumber.fromString('0', UnitFormats.WAD);
    const value1WAD = FixedNumber.fromString('100', UnitFormats.WAD);
    const value2WAD = FixedNumber.fromString('200', UnitFormats.WAD);
    const value3WAD = FixedNumber.fromString('300', UnitFormats.WAD);
    const zeroINT = FixedNumber.fromString('0', INT_FORMAT);
    const value1INT = FixedNumber.fromString('100', INT_FORMAT);
    const value2INT = FixedNumber.fromString('200', INT_FORMAT);
    const value3INT = FixedNumber.fromString('300', INT_FORMAT);

    describe('with valid IlkStatus', () => {
      const ilkStatus = {
        debtMultiplier: FixedNumber.fromString('2', UnitFormats.RAY),
        price: FixedNumber.fromString('1', UnitFormats.RAY),
      } as Partial<IlkStatus> as IlkStatus;

      it('returns true when colRatio < liqRatio', () => {
        expect(MintFormValidation.isBelowLiquidationRatio(value2WAD, value3WAD, value1WAD, value2WAD, ilkStatus)).toBeTruthy();
        expect(MintFormValidation.isBelowLiquidationRatio(zeroWAD, value3WAD, zeroWAD, value1WAD, ilkStatus)).toBeTruthy();
        expect(MintFormValidation.isBelowLiquidationRatio(value2WAD, zeroWAD, value1WAD, zeroWAD, ilkStatus)).toBeTruthy();

        expect(MintFormValidation.isBelowLiquidationRatio(value2WAD, value3WAD, value1INT, value2INT, ilkStatus)).toBeTruthy();
        expect(MintFormValidation.isBelowLiquidationRatio(zeroWAD, value3WAD, zeroINT, value1INT, ilkStatus)).toBeTruthy();
        expect(MintFormValidation.isBelowLiquidationRatio(value2WAD, zeroWAD, value1INT, zeroINT, ilkStatus)).toBeTruthy();
      });

      it('returns false when colRatio = liqRatio', () => {
        expect(MintFormValidation.isBelowLiquidationRatio(value2WAD, zeroWAD, value1WAD, value3WAD, ilkStatus)).toBeFalsy();

        expect(MintFormValidation.isBelowLiquidationRatio(value2WAD, zeroWAD, value1INT, value3INT, ilkStatus)).toBeFalsy();
      });

      it('returns false when colRatio > liqRatio', () => {
        expect(MintFormValidation.isBelowLiquidationRatio(value1WAD, value1WAD, value2WAD, value3WAD, ilkStatus)).toBeFalsy();

        expect(MintFormValidation.isBelowLiquidationRatio(value1WAD, value1WAD, value2INT, value3INT, ilkStatus)).toBeFalsy();
      });
    });

    describe('with invalid IlkStatus', () => {
      const ilkStatus = {
        debtMultiplier: FixedNumber.fromString('0', UnitFormats.RAY),
        price: FixedNumber.fromString('0', UnitFormats.RAY),
      } as Partial<IlkStatus> as IlkStatus;

      it('returns false when colRatio = liqRatio', () => {
        expect(MintFormValidation.isBelowLiquidationRatio(value1WAD, value3WAD, value2INT, value1INT, ilkStatus)).toBeFalsy();
      });
    });
  });

  describe('isBelowDebtFloor', () => {
    const zero = FixedNumber.fromString('0', UnitFormats.WAD);
    const value1 = FixedNumber.fromString('1.2', UnitFormats.WAD);
    const value2 = FixedNumber.fromString('1.8', UnitFormats.WAD);
    const value3 = FixedNumber.fromString('4', UnitFormats.WAD);

    describe('with valid IlkStatus', () => {
      const ilkStatus = {
        debtMultiplier: FixedNumber.fromString('1.2', UnitFormats.RAY),
        debtFloor: FixedNumber.fromString('3.6', UnitFormats.RAD),
      } as Partial<IlkStatus> as IlkStatus;

      it('returns true when new amount of debt < debt floor', () => {
        expect(MintFormValidation.isBelowDebtFloor(zero, zero, ilkStatus)).toBeTruthy();
        expect(MintFormValidation.isBelowDebtFloor(zero, value1, ilkStatus)).toBeTruthy();
        expect(MintFormValidation.isBelowDebtFloor(value1, value1, ilkStatus)).toBeTruthy();
      });

      it('returns false when new amount of debt = debt floor', () => {
        expect(MintFormValidation.isBelowDebtFloor(value1, value2, ilkStatus)).toBeFalsy();
      });

      it('returns false when new amount of debt > debt floor', () => {
        expect(MintFormValidation.isBelowDebtFloor(value2, value2, ilkStatus)).toBeFalsy();
        expect(MintFormValidation.isBelowDebtFloor(value3, zero, ilkStatus)).toBeFalsy();
      });
    });

    describe('with invalid IlkStatus', () => {
      const ilkStatus = {
        debtMultiplier: FixedNumber.fromString('0', UnitFormats.RAY),
        debtFloor: FixedNumber.fromString('0', UnitFormats.RAD),
      } as Partial<IlkStatus> as IlkStatus;

      it('returns false when new amount of debt = debt floor', () => {
        expect(MintFormValidation.isBelowDebtFloor(zero, zero, ilkStatus)).toBeFalsy();
      });

      it('returns false when new amount of debt > debt floor', () => {
        expect(MintFormValidation.isBelowDebtFloor(value1, value2, ilkStatus)).toBeFalsy();
      });
    });
  });

  describe('isAboveDebtCeiling', () => {
    const zero = FixedNumber.fromString('0', UnitFormats.WAD);
    const value1 = FixedNumber.fromString('1.2', UnitFormats.WAD);
    const value2 = FixedNumber.fromString('1.5', UnitFormats.WAD);
    const value3 = FixedNumber.fromString('1.8', UnitFormats.WAD);

    describe('with valid IlkStatus', () => {
      const ilkStatus = {
        debtMultiplier: FixedNumber.fromString('1.2', UnitFormats.RAY),
        debtCeiling: FixedNumber.fromString('3', UnitFormats.RAD),
        normalizedDebt: FixedNumber.fromString('1', UnitFormats.WAD),
      } as Partial<IlkStatus> as IlkStatus;

      it('returns false if new amount of debt < debt ceiling', () => {
        expect(MintFormValidation.isAboveDebtCeiling(zero, ilkStatus)).toBeFalsy();
        expect(MintFormValidation.isAboveDebtCeiling(value1, ilkStatus)).toBeFalsy();
      });

      it('returns false if new amount of debt = debt ceiling', () => {
        expect(MintFormValidation.isAboveDebtCeiling(value2, ilkStatus)).toBeFalsy();
      });

      it('returns true if new amount of debt > debt ceiling', () => {
        expect(MintFormValidation.isAboveDebtCeiling(value3, ilkStatus)).toBeTruthy();
      });
    });

    describe('with invalid IlkStatus', () => {
      it('returns false if new amount of debt = debt ceiling', () => {
        const ilkStatus = {
          debtMultiplier: FixedNumber.fromString('0', UnitFormats.RAY),
          debtCeiling: FixedNumber.fromString('0', UnitFormats.RAD),
          normalizedDebt: FixedNumber.fromString('0', UnitFormats.WAD),
        } as Partial<IlkStatus> as IlkStatus;

        expect(MintFormValidation.isAboveDebtCeiling(zero, ilkStatus)).toBeFalsy();
      });

      it('returns true if new amount of debt > debt ceiling', () => {
        const ilkStatus = {
          debtMultiplier: FixedNumber.fromString('1', UnitFormats.RAY),
          debtCeiling: FixedNumber.fromString('0', UnitFormats.RAD),
          normalizedDebt: FixedNumber.fromString('0', UnitFormats.WAD),
        } as Partial<IlkStatus> as IlkStatus;

        expect(MintFormValidation.isAboveDebtCeiling(value3, ilkStatus)).toBeTruthy();
      });
    });
  });
});
