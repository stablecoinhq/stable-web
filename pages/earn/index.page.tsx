import { Box, Card, CardContent, CircularProgress, Stack, Tab, Tabs } from '@mui/material';
import { useCallback, useState } from 'react';

import Dsr from 'contracts/Dsr';
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
  chainLog: ChainLogHelper;
};

type TabValue = 'deposit' | 'withdraw';

const Controller: FC<ControllerProps> = ({ chainLog }) => {
  const [selectedTab, setSelectedTab] = useState<TabValue>('deposit');

  const onSelectTab: (_: unknown, value: TabValue) => void = useCallback((_, value) => {
    setSelectedTab(value);
  }, []);

  const deposit: DepositFormProps['onDeposit'] = useCallback((amount) => Dsr.deposit(chainLog, amount), [chainLog]);
  const withdraw: WithdrawFormProps['onWithdraw'] = useCallback((amount) => Dsr.withdraw(chainLog, amount), [chainLog]);
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
  const [savingRate] = usePromiseFactory(useCallback(async () => Dsr.getSavingRate(chainLog), [chainLog]));
  const [balance] = usePromiseFactory(
    useCallback(async () => {
      const dai = await chainLog.dai();
      return dai.getBalance();
    }, [chainLog]),
  );
  const [deposit] = usePromiseFactory(useCallback(async () => Dsr.getDepositAmount(chainLog), [chainLog]));

  if (!savingRate || !balance) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack padding={2} spacing={2}>
      <SavingRateCard savingRate={savingRate} />
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
      <Controller chainLog={chainLog} />
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
