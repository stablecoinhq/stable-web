import { Box, Card, CardContent, CircularProgress, Stack, Tab, Tabs } from '@mui/material';
import { useCallback, useState } from 'react';

import Savings from 'contracts/Savings';
import { useChainLog } from 'pages/ethereum/ContractHooks';
import usePromiseFactory from 'pages/usePromiseFactory';
import BalanceStatusCard from 'pages/vaults/[id]/BalanceStatusCard';

import SavingRateCard from './SavingRateCard';
import DepositForm from './forms/DepositForm';
import WithdrawForm from './forms/WithdrawForm';

import type { DepositFormProps } from './forms/DepositForm';
import type { WithdrawFormProps } from './forms/WithdrawForm';
import type ChainLogHelper from 'contracts/ChainLogHelper';
import type EthereumProvider from 'contracts/EthereumProvider';
import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

type ControllerProps = {
  savingRate: Savings;
  updateAllBalance: () => void;
};

type TabValue = 'deposit' | 'withdraw';

const Controller: FC<ControllerProps> = ({ savingRate, updateAllBalance }) => {
  const [selectedTab, setSelectedTab] = useState<TabValue>('deposit');

  const onSelectTab: (_: unknown, value: TabValue) => void = useCallback((_, value) => {
    setSelectedTab(value);
  }, []);

  const deposit: DepositFormProps['onDeposit'] = useCallback(
    (amount) => savingRate.deposit(amount).then(() => updateAllBalance()),
    [savingRate, updateAllBalance],
  );
  const withdraw: WithdrawFormProps['onWithdraw'] = useCallback(
    (amount) => savingRate.withdraw(amount).then(() => updateAllBalance()),
    [savingRate, updateAllBalance],
  );
  const TabContent: FC = useCallback(() => {
    switch (selectedTab) {
      case 'deposit':
        return <DepositForm buttonContent="Deposit" onDeposit={deposit} />;
      case 'withdraw':
        return <WithdrawForm buttonContent="Withdraw" onWithdraw={withdraw} />;
    }
  }, [deposit, withdraw, selectedTab]);

  return (
    <>
      <Tabs variant="fullWidth" value={selectedTab} onChange={onSelectTab}>
        <Tab label="Deposit" value="deposit" />
        <Tab label="Withdraw" value="withdraw" />
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
  const [savingRate] = usePromiseFactory(useCallback(() => Savings.fromChainlog(chainLog), [chainLog]));
  const [annualRate] = usePromiseFactory(useCallback(async () => savingRate && savingRate.getAnnualRate(), [savingRate]));
  const [balance, updateBalance] = usePromiseFactory(
    useCallback(async () => {
      const dai = await chainLog.dai();
      return dai.getBalance();
    }, [chainLog]),
  );
  const [deposit, updateDeposit] = usePromiseFactory(
    useCallback(async () => savingRate && savingRate.getDepositAmount(), [savingRate]),
  );

  const updateAllBalance = () => {
    updateBalance();
    updateDeposit();
  };

  if (!savingRate || !balance || !annualRate) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack padding={2} spacing={2}>
      <SavingRateCard annualRate={annualRate} />
      {deposit && (
        <BalanceStatusCard
          title="Deposit Status"
          address={deposit.address}
          balance={deposit.amount}
          label="Deposit"
          tooltipText="Amount of DAI currently being deposited at DSR"
        />
      )}
      <BalanceStatusCard
        title="Wallet Status"
        address={provider.address}
        balance={balance}
        label="DAI Balance"
        tooltipText="Amount of token that wallet currently holds"
      />
      <Controller savingRate={savingRate} updateAllBalance={updateAllBalance} />
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

export default Earn;
