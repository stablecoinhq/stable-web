/* eslint-disable i18next/no-literal-string */
import LoadingButton from '@mui/lab/LoadingButton';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { FixedNumber } from 'ethers';
import type { FC, MouseEventHandler, ReactNode } from 'react';

export type SubmitFormProps = {
  createProxy: () => Promise<void>;
  proxyAddress: string | undefined;
  allowance: FixedNumber;
  increaseAllowance: (n: FixedNumber) => Promise<void>;
};

type SubmitFormProp = {
  children: NonNullable<ReactNode>;
  createProxy: () => Promise<void>;
  proxyAddress: string | undefined;
  spendingAmount?: FixedNumber;
  allowance: FixedNumber;
  isInvalid: boolean;
  increaseAllowance: (n: FixedNumber) => Promise<void>;
};

type SubmitState = 'createProxy' | 'increaseAllowance' | 'neutral';

// 1. Proxyが必要な場合にはProxy作成ボタンを表示する
// 2. Allowanceを引き上げるにはAllowance許可ボタンを表示する
// 3. 1,2がクリアできているならchildrenを表示する
const SubmitForm: FC<SubmitFormProp> = ({
  children,
  proxyAddress,
  createProxy,
  spendingAmount,
  allowance,
  isInvalid,
  increaseAllowance,
}) => {
  const { t } = useTranslation('common', { keyPrefix: 'forms' });
  const [submitState, setSubmitState] = useState<SubmitState>('neutral');

  const allowanceToIncrease = useMemo(() => spendingAmount && spendingAmount.subUnsafe(allowance), [allowance, spendingAmount]);

  const onCreateProxy: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    setSubmitState('createProxy');
    createProxy().finally(() => setSubmitState('neutral'));
  }, [createProxy]);

  const onIncreaseAllowance: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    if (spendingAmount) {
      setSubmitState('increaseAllowance');
      increaseAllowance(spendingAmount).finally(() => setSubmitState('neutral'));
    }
  }, [increaseAllowance, spendingAmount]);

  if (!proxyAddress || submitState === 'createProxy') {
    return (
      <LoadingButton
        variant="contained"
        loading={submitState !== 'neutral'}
        disabled={isInvalid || submitState !== 'neutral'}
        fullWidth
        onClick={onCreateProxy}
        loadingPosition="end"
        size="large"
      >
        {submitState !== 'neutral' ? t('createProxy.loadingText') : t('createProxy.submit')}
      </LoadingButton>
    );
  }

  if (
    (allowanceToIncrease && !allowanceToIncrease.isNegative() && !allowanceToIncrease.isZero() && !isInvalid) ||
    submitState === 'increaseAllowance'
  ) {
    return (
      <LoadingButton
        loading={submitState !== 'neutral'}
        variant="contained"
        fullWidth
        disabled={isInvalid || submitState !== 'neutral'}
        onClick={onIncreaseAllowance}
        loadingPosition="end"
        size="large"
      >
        {submitState !== 'neutral' ? t('increaseAllowance.loadingText') : t('increaseAllowance.submit')}
      </LoadingButton>
    );
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
};

export default SubmitForm;
