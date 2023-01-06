/* eslint-disable i18next/no-literal-string */
import { useCallback, useState } from 'react';

import { UnitFormats } from 'ethereum/helpers/math';
import { cutDecimals, pickNumbers } from 'ethereum/helpers/stringNumber';

import FormLayout from './FormLayout';
import WithdrawForm from './WithdrawForm';

import type { TabValue } from './FormLayout';
import type { FixedNumber } from 'ethers';
import type { FC, ReactNode } from 'react';

export type WithdrawFormControllerProps = {
  depositAmount: FixedNumber;
  buttonContent: ReactNode;
  withdraw: (amount: FixedNumber) => Promise<void>;
  withdrawAll: () => Promise<void>;
  onDialogClose: () => void;
  proxyAddress: string | undefined;
  ensureProxy: () => Promise<string>;
  selectedTab: TabValue;
  onSelectTab: (_: unknown, value: TabValue) => void;
};

const WithdrawFormController: FC<WithdrawFormControllerProps> = ({
  buttonContent,
  proxyAddress,
  ensureProxy,
  withdraw,
  withdrawAll,
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

  const form = (
    <WithdrawForm
      depositAmount={depositAmount}
      buttonContent={buttonContent}
      withdraw={withdraw}
      withdrawAll={withdrawAll}
      onDialogClose={closeDialog}
      proxyAddress={proxyAddress}
      ensureProxy={ensureProxy}
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
    />
  );
};

export default WithdrawFormController;
