import { Box, Card, CardContent, CircularProgress, Stack, Tab, Tabs } from '@mui/material';
import { useCallback, useState } from 'react';

import Dsr from 'contracts/Dsr';
import { useChainLog } from 'pages/ethereum/ContractHooks';
import usePromiseFactory from 'pages/usePromiseFactory';

import DepositForm from './forms/DepositForm';
import WithdrawForm from './forms/WithdrawForm';

import type { DepositFormProps } from './forms/DepositForm';
import type { WithdrawFormProps } from './forms/WithdrawForm';
import type ChainLogHelper from 'contracts/ChainLogHelper';
import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

type ControllerProps = {
  dsr: Dsr;
};

type TabValue = 'deposit' | 'withdraw';

const Controller: FC<ControllerProps> = ({ dsr }) => {
  const [selectedTab, setSelectedTab] = useState<TabValue>('deposit');

  const onSelectTab: (_: unknown, value: TabValue) => void = useCallback((_, value) => {
    setSelectedTab(value);
  }, []);

  // chainlogを使ってdsrproxy関数を呼び込む
  const deposit: DepositFormProps['onDeposit'] = useCallback((amount) => (dsr.deposit(amount)), [dsr])
  const withdraw: WithdrawFormProps['onWithdraw'] = useCallback((amount) => (dsr.withdraw(amount)), [dsr])
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
  chainLog: ChainLogHelper;
};

const Content: FC<ContentProps> = ({ chainLog }) => {
  // chainlogを使ってdsrを求める
  const [dsr] = usePromiseFactory(useCallback(() => Dsr.fromChainLog(chainLog), [chainLog]));
  const [savingRate] = usePromiseFactory(useCallback(async () => {
    if (dsr) {
      return dsr.getSavingRate();
    }
  }, [dsr]));

  if (!dsr || !savingRate) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack padding={2} spacing={2}>
      <Controller dsr={dsr} />
    </Stack>
  );
};

const Earn: NextPageWithEthereum = ({ provider }) => {
  const chainLog = useChainLog(provider);
  return (
    <Card elevation={0}>
      <CardContent>
        <Content chainLog={chainLog} />
      </CardContent>
    </Card>
  );
};

export default Earn;
