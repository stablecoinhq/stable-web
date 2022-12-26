import { FixedNumber } from 'ethers';

import { UnitFormats } from 'ethereum/helpers/math';
import { BurnFormValidation } from 'pages/forms/BurnFormValidation';

describe('BurnFormValidation', () => {
  describe('isInsufficientBalance', () => {
    const zero = FixedNumber.fromString('0', UnitFormats.WAD);
    const low = FixedNumber.fromString('0.1234', UnitFormats.WAD);
    const high = FixedNumber.fromString('1.23456', UnitFormats.WAD);
    const anotherHigh = FixedNumber.fromString('1.23456', UnitFormats.WAD);

    it('returns true when balance < repay', () => {
      expect(BurnFormValidation.isInsufficientBalance(zero, low)).toBeTruthy();
      expect(BurnFormValidation.isInsufficientBalance(low, high)).toBeTruthy();
    });

    it('returns false when balance = repay', () => {
      expect(BurnFormValidation.isInsufficientBalance(zero, zero)).toBeFalsy();
      expect(BurnFormValidation.isInsufficientBalance(low, low)).toBeFalsy();
      expect(BurnFormValidation.isInsufficientBalance(high, anotherHigh)).toBeFalsy();
    });

    it('returns false when balance > repay', () => {
      expect(BurnFormValidation.isInsufficientBalance(low, zero)).toBeFalsy();
      expect(BurnFormValidation.isInsufficientBalance(high, low)).toBeFalsy();
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
        expect(BurnFormValidation.isOverRepaying(zero, low, debtMultiplier)).toBeTruthy();
        expect(BurnFormValidation.isOverRepaying(low, high, debtMultiplier)).toBeTruthy();
      });

      it('returns false when debt = repay', () => {
        expect(BurnFormValidation.isOverRepaying(zero, zero, debtMultiplier)).toBeFalsy();
        expect(BurnFormValidation.isOverRepaying(mid, twiceMid, debtMultiplier)).toBeFalsy();
      });

      it('returns false when debt > repay', () => {
        expect(BurnFormValidation.isOverRepaying(mid, zero, debtMultiplier)).toBeFalsy();
        expect(BurnFormValidation.isOverRepaying(low, mid, debtMultiplier)).toBeFalsy();
        expect(BurnFormValidation.isOverRepaying(high, low, debtMultiplier)).toBeFalsy();
      });
    });

    describe('with invalid debtMultiplier', () => {
      const debtMultiplier = FixedNumber.fromString('0', UnitFormats.RAY);

      it('returns true when debt < repay', () => {
        expect(BurnFormValidation.isOverRepaying(zero, low, debtMultiplier)).toBeTruthy();
        expect(BurnFormValidation.isOverRepaying(high, low, debtMultiplier)).toBeTruthy();
      });

      it('returns false when debt = repay', () => {
        expect(BurnFormValidation.isOverRepaying(high, zero, debtMultiplier)).toBeFalsy();
      });
    });
  });

  describe('isInvalidCollateralFreeAmount', () => {
    const zero = FixedNumber.fromString('0', UnitFormats.WAD);
    const low = FixedNumber.fromString('0.1234', UnitFormats.WAD);
    const high = FixedNumber.fromString('1.23456', UnitFormats.WAD);
    const anotherHigh = FixedNumber.fromString('1.23456', UnitFormats.WAD);

    it('returns true when locked < to free', () => {
      expect(BurnFormValidation.isInvalidCollateralFreeAmount(zero, low)).toBeTruthy();
      expect(BurnFormValidation.isInvalidCollateralFreeAmount(low, high)).toBeTruthy();
    });

    it('returns false when locked = to free', () => {
      expect(BurnFormValidation.isInvalidCollateralFreeAmount(zero, zero)).toBeFalsy();
      expect(BurnFormValidation.isInvalidCollateralFreeAmount(low, low)).toBeFalsy();
      expect(BurnFormValidation.isInvalidCollateralFreeAmount(high, anotherHigh)).toBeFalsy();
    });

    it('returns false when locked > to free', () => {
      expect(BurnFormValidation.isInvalidCollateralFreeAmount(low, zero)).toBeFalsy();
      expect(BurnFormValidation.isInvalidCollateralFreeAmount(high, low)).toBeFalsy();
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
      expect(BurnFormValidation.isCollateralizationRatioTooLow(value1, value3, zero, twoRAY)).toBeTruthy();
      expect(BurnFormValidation.isCollateralizationRatioTooLow(value2, value1, value3, oneRAY)).toBeTruthy();
      expect(BurnFormValidation.isCollateralizationRatioTooLow(value4, value2, value1, zeroRAY)).toBeTruthy();
    });

    it('returns false when current = new debt', () => {
      expect(BurnFormValidation.isCollateralizationRatioTooLow(value4, value1, zero, zeroRAY)).toBeFalsy();
      expect(BurnFormValidation.isCollateralizationRatioTooLow(value4, value3, value2, oneRAY)).toBeFalsy();
    });

    it('returns false when current < new debt', () => {
      expect(BurnFormValidation.isCollateralizationRatioTooLow(value4, value1, value2, twoRAY)).toBeFalsy();
      expect(BurnFormValidation.isCollateralizationRatioTooLow(value3, zero, value1, oneRAY)).toBeFalsy();
      expect(BurnFormValidation.isCollateralizationRatioTooLow(value2, value1, zero, oneRAY)).toBeFalsy();
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
      expect(BurnFormValidation.isBelowDebtFloor(lowWAD, highRAD)).toBeTruthy();
    });

    it('returns false when current = 0', () => {
      expect(BurnFormValidation.isBelowDebtFloor(zeroWAD, zeroRAD)).toBeFalsy();
      expect(BurnFormValidation.isBelowDebtFloor(zeroWAD, lowRAD)).toBeFalsy();
    });

    it('returns false when current < 0', () => {
      expect(BurnFormValidation.isBelowDebtFloor(minusWAD, zeroRAD)).toBeFalsy();
      expect(BurnFormValidation.isBelowDebtFloor(minusWAD, highRAD)).toBeFalsy();
    });

    it('returns false when current = debt', () => {
      expect(BurnFormValidation.isBelowDebtFloor(lowWAD, lowRAD)).toBeFalsy();
      expect(BurnFormValidation.isBelowDebtFloor(highWAD, highRAD)).toBeFalsy();
    });
  });
});
