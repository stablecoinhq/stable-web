/* eslint-disable i18next/no-literal-string */
import { Button, CircularProgress } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';

import type ERC20Helper from 'ethereum/contracts/ERC20Helper';
import type ProxyRegistryHelper from 'ethereum/contracts/ProxyRegistryHelper';
import type { FixedNumber } from 'ethers';
import type { FC, MouseEventHandler, ReactNode } from 'react';

export type SubmitFormProps = {
  children: NonNullable<ReactNode>;
  proxyRegistry: ProxyRegistryHelper;
  spendingAmount?: FixedNumber;
  allowance: FixedNumber;
  erc20: ERC20Helper;
  isInvalid: boolean;
};

// 1. Proxyが必要な場合にはProxy作成ボタンを表示する
// 2. Allowanceを引き上げるにはAllowance許可ボタンを表示する
// 3. 1,2がクリアできているならchildrenを表示する
const SubmitForm: FC<SubmitFormProps> = ({ children, proxyRegistry, erc20, spendingAmount, allowance, isInvalid }) => {
  const { data, isLoading, mutate } = useSWR('getProxy', async () => {
    const proxy = await proxyRegistry.getDSProxy();
    return {
      proxy,
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const allowanceToIncrease = useMemo(
    () => spendingAmount && spendingAmount.subUnsafe(allowance),
    [allowance, spendingAmount],
  );

  console.log(`allowance ${allowance}, spendingAmount ${spendingAmount},allowanceToIncrease ${allowanceToIncrease}`)

  const onCreateProxy: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    setIsSubmitting(true);
    proxyRegistry
      .ensureDSProxy()
      .then(() => mutate())
      .finally(() => setIsSubmitting(false));
  }, [mutate, proxyRegistry]);

  const onIncreaseAllowance: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    if (data?.proxy && spendingAmount) {
      setIsSubmitting(true);
      erc20
        .ensureAllowance(data.proxy.address, spendingAmount)
        .then(() => mutate())
        .finally(() => setIsSubmitting(false));
    }
  }, [data, erc20, mutate, spendingAmount]);

  if (!data || isLoading) {
    return <CircularProgress />;
  }

  const { proxy } = data;

  if (!proxy || isSubmitting) {
    return (
      <Button variant="contained" disabled={isInvalid || isSubmitting} fullWidth onClick={onCreateProxy}>
        {isSubmitting ? <CircularProgress /> : 'Create proxy'}
      </Button>
    );
  }

  if (allowanceToIncrease && !allowanceToIncrease.isNegative() && !allowanceToIncrease.isZero() && !isInvalid || isSubmitting) {
    return (
      <Button variant="contained" fullWidth disabled={isInvalid || isSubmitting} onClick={onIncreaseAllowance}>
        {isSubmitting ? <CircularProgress /> : 'Increase Allowance'}
      </Button>
    );
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
};

export default SubmitForm;
