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

const FormController: FC<FormControllerProps> = ({
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

  const current: CurrentBalanceStatus | undefined = useMemo(() => {
    const amount = toFixedNumberOrUndefined(amountText, formats);
    if (amount) {
      return {
        depositAmount: {
          value: depositAmount.subUnsafe(amount),
          isInvalid: depositAmount.subUnsafe(amount).isNegative(),
        },
      };
    }
  }, [amountText, depositAmount, formats]);

  const form = (
    <Form
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
      current={current}
    />
  );
};

export default FormController;
