import { Box, Card, CardContent, CircularProgress, Stack, Tab, Tabs } from '@mui/material';
import { FixedNumber } from 'ethers';
import { useCallback, useMemo, useState } from 'react';
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
import type ERC20Helper from 'ethereum/contracts/ERC20Helper';
import type ProxyRegistryHelper from 'ethereum/contracts/ProxyRegistryHelper';
import type { SubmitFormProps } from 'ethereum/react/form/SubmitForm';
import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

type ControllerProps = {
  savingRate: Savings;
  update: () => void;
  depositAmount: FixedNumber | undefined;
  balance: FixedNumber;
  allowance: FixedNumber;
  proxyAddress: string | undefined;
  proxyRegistry: ProxyRegistryHelper;
  dai: ERC20Helper;
};

type TabValue = 'deposit' | 'withdraw';

const Controller: FC<ControllerProps> = ({
  savingRate,
  update,
  depositAmount,
  balance,
  allowance,
  proxyAddress,
  proxyRegistry,
  dai,
}) => {
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
        .then(() => update())
        .catch((err) => openDialog(errorMessage('errorWhileDeposit'), err)),
    [errorMessage, openDialog, savingRate, update],
  );

  const withdraw: WithdrawFormProps['onWithdraw'] = useCallback(
    (amount) =>
      savingRate
        .withdraw(amount)
        .then(() => update())
        .catch((err) => openDialog(errorMessage('errorWhileWithdraw'), err)),
    [errorMessage, openDialog, savingRate, update],
  );

  const withdrawAll: WithdrawFormProps['onWithdrawAll'] = useCallback(
    () =>
      savingRate
        .withdrawAll()
        .then(() => update())
        .catch((err) => openDialog(errorMessage('errorWhileWithdraw'), err)),
    [errorMessage, openDialog, savingRate, update],
  );

  const createProxy = useCallback(
    () =>
      proxyRegistry
        .ensureDSProxy()
        .then(() => update())
        .catch((err) => openDialog(errorMessage('errorWhileCreatingProxy'), err)),
    [errorMessage, openDialog, proxyRegistry, update],
  );

  const increaseAllowance = useCallback(
    async (n: FixedNumber) => {
      if (proxyAddress) {
        await dai
          .ensureAllowance(proxyAddress, n, 5)
          .then(() => update())
          .catch((err) => openDialog(errorMessage('errorWhileIncreasingAllowance'), err));
      }
    },
    [dai, errorMessage, openDialog, proxyAddress, update],
  );

  const submitFormProps: SubmitFormProps = useMemo(
    () => ({
      proxyAddress,
      createProxy,
      increaseAllowance,
      allowance,
    }),
    [allowance, createProxy, increaseAllowance, proxyAddress],
  );
  const content = useMemo(() => {
    switch (selectedTab) {
      case 'deposit':
        return <DepositForm onDeposit={deposit} balance={balance} submitFormProps={submitFormProps} />;
      case 'withdraw':
        return (
          <WithdrawForm
            onWithdraw={withdraw}
            onWithdrawAll={withdrawAll}
            depositAmount={depositAmount || FixedNumber.from(0, UnitFormats.WAD)}
          />
        );
    }
  }, [selectedTab, deposit, balance, submitFormProps, withdraw, withdrawAll, depositAmount]);

  return (
    <>
      <Tabs variant="fullWidth" value={selectedTab} onChange={onSelectTab}>
        <Tab label={t('depositTab')} value="deposit" />
        <Tab label={t('withdrawTab')} value="withdraw" disabled={!depositAmount || depositAmount?.isZero()} />
      </Tabs>
      {content}
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
    const proxyRegistry = await chainLog.proxyRegistry();
    const proxy = await proxyRegistry.getDSProxy();
    const dai = await chainLog.dai();
    const [annualRate, balance, allowance, deposit] = await Promise.all([
      saving.getAnnualRate(),
      dai.getBalance(),
      proxy ? dai.getAllowance(proxy.address) : FixedNumber.from('0', UnitFormats.WAD),
      saving.getDepositAmount(),
    ]);
    return {
      saving,
      annualRate,
      balance,
      allowance,
      deposit,
      proxyAddress: proxy?.address,
      proxyRegistry,
      dai,
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

  const { saving, annualRate, deposit, balance, proxyAddress, proxyRegistry, dai, allowance } = data;
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
      <Controller
        savingRate={saving}
        update={updateAllBalance}
        depositAmount={deposit?.amount}
        balance={balance}
        allowance={allowance}
        proxyAddress={proxyAddress}
        proxyRegistry={proxyRegistry}
        dai={dai}
      />
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
