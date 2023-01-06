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

import SavingRateCard from './SavingRateCard';
import DepositForm from './forms/DepositForm';
import WithdrawForm from './forms/WithdrawForm';

import type { DepositFormProps } from './forms/DepositForm';
import type { WithdrawFormProps } from './forms/WithdrawForm';
import type EthereumProvider from 'ethereum/EthereumProvider';
import type ChainLogHelper from 'ethereum/contracts/ChainLogHelper';
import type ERC20Helper from 'ethereum/contracts/ERC20Helper';
import type ProxyRegistryHelper from 'ethereum/contracts/ProxyRegistryHelper';
import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

type ControllerProps = {
  savingRate: Savings;
  update: () => void;
  depositAmount: FixedNumber | undefined;
  balance: FixedNumber;
  proxyAddress: string | undefined;
  dai: ERC20Helper;
  proxyRegistry: ProxyRegistryHelper;
  allowance: FixedNumber;
};

type TabValue = 'deposit' | 'withdraw';

const Controller: FC<ControllerProps> = ({
  savingRate,
  update,
  depositAmount,
  balance,
  proxyAddress,
  dai,
  proxyRegistry,
  allowance,
}) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.earn' });
  const [selectedTab, setSelectedTab] = useState<TabValue>('deposit');

  const onSelectTab: (_: unknown, value: TabValue) => void = useCallback((_, value) => {
    setSelectedTab(value);
  }, []);

  const deposit: DepositFormProps['deposit'] = useCallback((amount) => savingRate.deposit(amount), [savingRate]);

  const withdraw: WithdrawFormProps['withdraw'] = useCallback((amount) => savingRate.withdraw(amount), [savingRate]);

  const withdrawAll: WithdrawFormProps['withdrawAll'] = useCallback(() => savingRate.withdrawAll(), [savingRate]);

  const increaseAllowance = useCallback(
    async (who: string, n: FixedNumber) => {
      await dai.ensureAllowance(who, n).then(() => update());
    },
    [dai, update],
  );

  const ensureProxy = useCallback(
    () =>
      proxyRegistry.ensureDSProxy().then((v) => {
        update();
        return v.address;
      }),
    [proxyRegistry, update],
  );

  const content = useMemo(() => {
    switch (selectedTab) {
      case 'deposit':
        return (
          <DepositForm
            buttonContent={t('deposit.form.submit')}
            deposit={deposit}
            balance={balance}
            increaseAllowance={increaseAllowance}
            proxyAddress={proxyAddress}
            allowance={allowance}
            ensureProxy={ensureProxy}
            onDialogClose={update}
          />
        );
      case 'withdraw':
        return (
          <WithdrawForm
            buttonContent={t('withdraw.form.submit')}
            withdraw={withdraw}
            withdrawAll={withdrawAll}
            depositAmount={depositAmount || FixedNumber.from(0, UnitFormats.WAD)}
            onDialogClose={update}
            proxyAddress={proxyAddress}
            ensureProxy={ensureProxy}
          />
        );
    }
  }, [
    selectedTab,
    t,
    deposit,
    balance,
    increaseAllowance,
    proxyAddress,
    allowance,
    ensureProxy,
    update,
    withdraw,
    withdrawAll,
    depositAmount,
  ]);

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
  const { t: units } = useTranslation('common', { keyPrefix: 'units' });
  const { t: wallet } = useTranslation('common', { keyPrefix: 'cards.wallet' });

  const { data, mutate, isLoading } = useSWR(
    'getSavingData',
    async () => {
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
    },
    { revalidateOnFocus: false },
  );

  if (isLoading || !data) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  const { saving, annualRate, deposit, balance, proxyAddress, proxyRegistry, allowance, dai } = data;
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
          unit={units('stableToken')}
        />
      )}
      <BalanceStatusCard
        title={wallet('title')}
        address={provider.address}
        balance={balance}
        label={wallet('balance', { gem: units('stableToken') })}
        tooltipText={wallet('description')!}
        unit={units('stableToken')}
      />
      <Controller
        savingRate={saving}
        update={() => mutate()}
        depositAmount={deposit?.amount}
        balance={balance}
        proxyAddress={proxyAddress}
        proxyRegistry={proxyRegistry}
        allowance={allowance}
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
