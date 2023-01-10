import { useCallback, useMemo, useState } from 'react';

import { UnitFormats } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers, toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';

import FormLayout from '../FormLayout';

import Form from './Form';

import type { CurrentBalanceStatus } from '../../BalanceStatusCard';
import type { TabValue } from '../FormLayout';
import type { FixedNumber } from 'ethers';
import type { FC, ReactNode } from 'react';

export type FormControllerProps = {
  balance: FixedNumber;
  buttonContent: ReactNode;
  deposit: (amount: FixedNumber) => Promise<void>;
  proxyAddress: string | undefined;
  increaseAllowance: (address: string, spendingAmount: FixedNumber) => Promise<void>;
  ensureProxy: () => Promise<string>;
  allowance: FixedNumber;
  onDialogClose: () => void;
  depositAmount: FixedNumber | undefined;
  selectedTab: TabValue;
  onSelectTab: (_: unknown, value: TabValue) => void;
};

const FormController: FC<FormControllerProps> = ({
  deposit,
  buttonContent,
  balance,
  proxyAddress,
  increaseAllowance,
  ensureProxy,
  allowance,
  onDialogClose,
  depositAmount,
  selectedTab,
  onSelectTab,
}) => {
  const [amountText, setAmountText] = useState('');
  const formats = UnitFormats.WAD;

  const onAmountChange = useCallback((s: string) => setAmountText(cutDecimals(pickNumbers(s), formats.decimals)), [formats]);
  const closeDialog = useCallback(() => {
    onDialogClose();
    setAmountText('');
  }, [onDialogClose]);

  const current: CurrentBalanceStatus | undefined = useMemo(() => {
    const amount = toFixedNumberOrUndefined(amountText, formats);
    if (amount) {
      return {
        depositAmount: {
          value: amount.addUnsafe(balance),
          isInvalid: false,
        },
      };
    }
  }, [amountText, balance, formats]);

  const form = (
    <Form
      deposit={deposit}
      balance={balance}
      buttonContent={buttonContent}
      proxyAddress={proxyAddress}
      increaseAllowance={increaseAllowance}
      ensureProxy={ensureProxy}
      allowance={allowance}
      onDialogClose={closeDialog}
      amountText={amountText}
      onAmountChange={onAmountChange}
    />
  );
  return (
    <FormLayout
      proxyAddress={proxyAddress}
      depositAmount={depositAmount}
      selectedTab={selectedTab}
      onSelectTab={onSelectTab}
      form={form}
      current={current}
    />
  );
};

export default FormController;
