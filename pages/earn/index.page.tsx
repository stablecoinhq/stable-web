import { Box, Card, CardContent, CircularProgress, Stack, Tab, Tabs } from '@mui/material';
import { FixedNumber } from 'ethers';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';

import Savings from 'ethereum/Savings';
import { UnitFormats } from 'ethereum/helpers/math';
import useChainLog from 'ethereum/react/useChainLog';
import BalanceStatusCard from 'pages/earn/BalanceStatusCard';
import getTranslationProps from 'pages/getTranslationProps';
import { useErrorDialog } from 'store/ErrorDialogProvider';

import SavingRateCard from './SavingRateCard';
import DepositForm from './forms/DepositForm';
import WithdrawForm from './forms/WithdrawForm';

import type { DepositFormProps } from './forms/DepositForm';
import type { WithdrawFormProps } from './forms/WithdrawForm';
import type EthereumProvider from 'ethereum/EthereumProvider';
import type ChainLogHelper from 'ethereum/contracts/ChainLogHelper';
import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

type ControllerProps = {
  savingRate: Savings;
  updateAllBalance: () => void;
  depositAmount: FixedNumber | undefined;
  balance: FixedNumber;
};

type TabValue = 'deposit' | 'withdraw';

const Controller: FC<ControllerProps> = ({ savingRate, updateAllBalance, depositAmount, balance }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.earn' });
  const [selectedTab, setSelectedTab] = useState<TabValue>('deposit');
  const { t: errorMessage } = useTranslation('common', { keyPrefix: 'pages.earn.errors' });
  const { openDialog } = useErrorDialog();

  const onSelectTab: (_: unknown, value: TabValue) => void = useCallback((_, value) => {
    setSelectedTab(value);
  }, []);

  const deposit: DepositFormProps['onDeposit'] = useCallback(
    (amount) =>
      savingRate
        .deposit(amount)
        .then(() => updateAllBalance())
        .catch((err) => openDialog(errorMessage('errorWhileDeposit'), err)),
    [errorMessage, openDialog, savingRate, updateAllBalance],
  );

  const withdraw: WithdrawFormProps['onWithdraw'] = useCallback(
    (amount) =>
      savingRate
        .withdraw(amount)
        .then(() => updateAllBalance())
        .catch((err) => openDialog(errorMessage('errorWhileWithdraw'), err)),
    [errorMessage, openDialog, savingRate, updateAllBalance],
  );

  const withdrawAll: WithdrawFormProps['onWithdrawAll'] = useCallback(
    () =>
      savingRate
        .withdrawAll()
        .then(() => updateAllBalance())
        .catch((err) => openDialog(errorMessage('errorWhileWithdraw'), err)),
    [errorMessage, openDialog, savingRate, updateAllBalance],
  );
  const TabContent: FC = useCallback(() => {
    switch (selectedTab) {
      case 'deposit':
        return <DepositForm buttonContent={t('deposit.form.submit')} onDeposit={deposit} balance={balance} />;
      case 'withdraw':
        return (
          <WithdrawForm
            buttonContent={t('withdraw.form.submit')}
            onWithdraw={withdraw}
            onWithdrawAll={withdrawAll}
            depositAmount={depositAmount || FixedNumber.from(0, UnitFormats.WAD)}
          />
        );
    }
  }, [deposit, withdraw, selectedTab, withdrawAll, depositAmount, balance, t]);

  return (
    <>
      <Tabs variant="fullWidth" value={selectedTab} onChange={onSelectTab}>
        <Tab label={t('depositTab')} value="deposit" />
        <Tab label={t('withdrawTab')} value="withdraw" disabled={!depositAmount || depositAmount?.isZero()} />
      </Tabs>
      <TabContent />
    </>
  );
};

type ContentProps = {
  provider: EthereumProvider;
  chainLog: ChainLogHelper;
};

const Content: FC<ContentProps> = ({ chainLog, provider }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.earn' });

  const { t: wallet } = useTranslation('common', { keyPrefix: 'cards.wallet' });

  const { data, mutate, isLoading } = useSWR('getSavingData', async () => {
    const saving = await Savings.fromChainlog(chainLog);
    const [annualRate, balance, deposit] = await Promise.all([
      saving.getAnnualRate(),
      chainLog.dai().then((dai) => dai.getBalance()),
      saving.getDepositAmount(),
    ]);
    return {
      saving,
      annualRate,
      balance,
      deposit,
    };
  });

  const updateAllBalance = mutate;

  if (isLoading || !data) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  const { saving, annualRate, deposit, balance } = data;
  return (
    <Stack padding={2} spacing={2}>
      <SavingRateCard annualRate={annualRate} />
      {deposit && (
        <BalanceStatusCard
          title={t('deposit.title')}
          address={deposit.address}
          balance={deposit.amount}
          label={t('deposit.label')}
          tooltipText={t('deposit.description')!}
          unit="DAI"
        />
      )}
      <BalanceStatusCard
        title={wallet('title')}
        address={provider.address}
        balance={balance}
        label={wallet('balance', { gem: 'DAI' })}
        tooltipText={wallet('description')!}
        unit="DAI"
      />
      <Controller savingRate={saving} updateAllBalance={updateAllBalance} depositAmount={deposit?.amount} balance={balance} />
    </Stack>
  );
};

const Earn: NextPageWithEthereum = ({ provider }) => {
  const chainLog = useChainLog(provider);

  return (
    <Card elevation={0}>
      <CardContent>
        <Content chainLog={chainLog} provider={provider} />
      </CardContent>
    </Card>
  );
};

export const getStaticProps = getTranslationProps;

export default Earn;
