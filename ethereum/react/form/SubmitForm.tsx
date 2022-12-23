/* eslint-disable i18next/no-literal-string */
import { Button, CircularProgress, FormHelperText } from '@mui/material';
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

  const helperText = useMemo(() => {
    switch (submitState) {
      case 'createProxy':
        return t('createProxy.helperText');
      case 'increaseAllowance':
        return t('increaseAllowance.helperText');
      case 'neutral':
        break;
    }
  }, [submitState, t]);
  if (submitState !== 'neutral') {
    return (
      <>
        <Button variant="contained" disabled fullWidth>
          <CircularProgress />
        </Button>
        <FormHelperText>{helperText}</FormHelperText>
      </>
    );
  }
  if (!proxyAddress) {
    return (
      <Button variant="contained" disabled={isInvalid || submitState !== 'neutral'} fullWidth onClick={onCreateProxy}>
        {t('createProxy.submit')}
      </Button>
    );
  }

  if (allowanceToIncrease && !allowanceToIncrease.isNegative() && !allowanceToIncrease.isZero() && !isInvalid) {
    return (
      <Button variant="contained" fullWidth disabled={isInvalid || submitState !== 'neutral'} onClick={onIncreaseAllowance}>
        {t('increaseAllowance.submit')}
      </Button>
    );
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
};

export default SubmitForm;
