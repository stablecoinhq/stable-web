import { FixedNumber } from 'ethers';

import { UnitFormats } from 'ethereum/helpers/math';
import { Validation } from 'pages/forms/burn/Validation';

describe('BurnFormValidation', () => {
  describe('isInsufficientBalance', () => {
    const zero = FixedNumber.fromString('0', UnitFormats.WAD);
    const low = FixedNumber.fromString('0.1234', UnitFormats.WAD);
    const high = FixedNumber.fromString('1.23456', UnitFormats.WAD);
    const anotherHigh = FixedNumber.fromString('1.23456', UnitFormats.WAD);

    it('returns true when balance < repay', () => {
      expect(Validation.isInsufficientBalance(zero, low)).toBeTruthy();
      expect(Validation.isInsufficientBalance(low, high)).toBeTruthy();
    });

    it('returns false when balance = repay', () => {
      expect(Validation.isInsufficientBalance(zero, zero)).toBeFalsy();
      expect(Validation.isInsufficientBalance(low, low)).toBeFalsy();
      expect(Validation.isInsufficientBalance(high, anotherHigh)).toBeFalsy();
    });

    it('returns false when balance > repay', () => {
      expect(Validation.isInsufficientBalance(low, zero)).toBeFalsy();
      expect(Validation.isInsufficientBalance(high, low)).toBeFalsy();
    });
  });

  describe('isOverRepaying', () => {
    const zero = FixedNumber.fromString('0', UnitFormats.WAD);
    const low = FixedNumber.fromString('0.1234', UnitFormats.WAD);
    const mid = FixedNumber.fromString('0.2345', UnitFormats.WAD);
    const twiceMid = FixedNumber.fromString('0.469', UnitFormats.WAD);
    const high = FixedNumber.fromString('1234', UnitFormats.WAD);

    describe('with valid debtMultiplier', () => {
      const debtMultiplier = FixedNumber.fromString('2', UnitFormats.RAY);

      it('returns true when debt < repay', () => {
        expect(Validation.isOverRepaying(zero, low, debtMultiplier)).toBeTruthy();
        expect(Validation.isOverRepaying(low, high, debtMultiplier)).toBeTruthy();
      });

      it('returns false when debt = repay', () => {
        expect(Validation.isOverRepaying(zero, zero, debtMultiplier)).toBeFalsy();
        expect(Validation.isOverRepaying(mid, twiceMid, debtMultiplier)).toBeFalsy();
      });

      it('returns false when debt > repay', () => {
        expect(Validation.isOverRepaying(mid, zero, debtMultiplier)).toBeFalsy();
        expect(Validation.isOverRepaying(low, mid, debtMultiplier)).toBeFalsy();
        expect(Validation.isOverRepaying(high, low, debtMultiplier)).toBeFalsy();
      });
    });

    describe('with invalid debtMultiplier', () => {
      const debtMultiplier = FixedNumber.fromString('0', UnitFormats.RAY);

      it('returns true when debt < repay', () => {
        expect(Validation.isOverRepaying(zero, low, debtMultiplier)).toBeTruthy();
        expect(Validation.isOverRepaying(high, low, debtMultiplier)).toBeTruthy();
      });

      it('returns false when debt = repay', () => {
        expect(Validation.isOverRepaying(high, zero, debtMultiplier)).toBeFalsy();
      });
    });
  });

  describe('isInvalidCollateralFreeAmount', () => {
    const zero = FixedNumber.fromString('0', UnitFormats.WAD);
    const low = FixedNumber.fromString('0.1234', UnitFormats.WAD);
    const high = FixedNumber.fromString('1.23456', UnitFormats.WAD);
    const anotherHigh = FixedNumber.fromString('1.23456', UnitFormats.WAD);

    it('returns true when locked < to free', () => {
      expect(Validation.isInvalidCollateralFreeAmount(zero, low)).toBeTruthy();
      expect(Validation.isInvalidCollateralFreeAmount(low, high)).toBeTruthy();
    });

    it('returns false when locked = to free', () => {
      expect(Validation.isInvalidCollateralFreeAmount(zero, zero)).toBeFalsy();
      expect(Validation.isInvalidCollateralFreeAmount(low, low)).toBeFalsy();
      expect(Validation.isInvalidCollateralFreeAmount(high, anotherHigh)).toBeFalsy();
    });

    it('returns false when locked > to free', () => {
      expect(Validation.isInvalidCollateralFreeAmount(low, zero)).toBeFalsy();
      expect(Validation.isInvalidCollateralFreeAmount(high, low)).toBeFalsy();
    });
  });

  describe('isCollateralizationRatioTooLow', () => {
    const zero = FixedNumber.fromString('0', UnitFormats.WAD);
    const value1 = FixedNumber.fromString('0.12', UnitFormats.WAD);
    const value2 = FixedNumber.fromString('1.12', UnitFormats.WAD);
    const value3 = FixedNumber.fromString('3', UnitFormats.WAD);
    const value4 = FixedNumber.fromString('4.12', UnitFormats.WAD);
    const zeroRAY = FixedNumber.fromString('0', UnitFormats.RAY);
    const oneRAY = FixedNumber.fromString('1', UnitFormats.RAY);
    const twoRAY = FixedNumber.fromString('2', UnitFormats.RAY);

    it('returns true when current > new debt', () => {
      expect(Validation.isCollateralizationRatioTooLow(value1, value3, zero, twoRAY)).toBeTruthy();
      expect(Validation.isCollateralizationRatioTooLow(value2, value1, value3, oneRAY)).toBeTruthy();
      expect(Validation.isCollateralizationRatioTooLow(value4, value2, value1, zeroRAY)).toBeTruthy();
    });

    it('returns false when current = new debt', () => {
      expect(Validation.isCollateralizationRatioTooLow(value4, value1, zero, zeroRAY)).toBeFalsy();
      expect(Validation.isCollateralizationRatioTooLow(value4, value3, value2, oneRAY)).toBeFalsy();
    });

    it('returns false when current < new debt', () => {
      expect(Validation.isCollateralizationRatioTooLow(value4, value1, value2, twoRAY)).toBeFalsy();
      expect(Validation.isCollateralizationRatioTooLow(value3, zero, value1, oneRAY)).toBeFalsy();
      expect(Validation.isCollateralizationRatioTooLow(value2, value1, zero, oneRAY)).toBeFalsy();
    });
  });

  describe('isBelowDebtFloor', () => {
    const minusWAD = FixedNumber.fromString('-3.21', UnitFormats.WAD);
    const zeroWAD = FixedNumber.fromString('0', UnitFormats.WAD);
    const lowWAD = FixedNumber.fromString('0.1234', UnitFormats.WAD);
    const highWAD = FixedNumber.fromString('1.23456', UnitFormats.WAD);
    const zeroRAD = FixedNumber.fromString('0', UnitFormats.RAD);
    const lowRAD = FixedNumber.fromString('0.1234', UnitFormats.RAD);
    const highRAD = FixedNumber.fromString('1.23456', UnitFormats.RAD);

    it('returns true when 0 < current < floor', () => {
      expect(Validation.isBelowDebtFloor(lowWAD, highRAD)).toBeTruthy();
    });

    it('returns false when current = 0', () => {
      expect(Validation.isBelowDebtFloor(zeroWAD, zeroRAD)).toBeFalsy();
      expect(Validation.isBelowDebtFloor(zeroWAD, lowRAD)).toBeFalsy();
    });

    it('returns false when current < 0', () => {
      expect(Validation.isBelowDebtFloor(minusWAD, zeroRAD)).toBeFalsy();
      expect(Validation.isBelowDebtFloor(minusWAD, highRAD)).toBeFalsy();
    });

    it('returns false when current = debt', () => {
      expect(Validation.isBelowDebtFloor(lowWAD, lowRAD)).toBeFalsy();
      expect(Validation.isBelowDebtFloor(highWAD, highRAD)).toBeFalsy();
    });
  });
});
