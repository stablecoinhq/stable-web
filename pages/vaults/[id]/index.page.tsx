import WarningIcon from '@mui/icons-material/Warning';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Stack,
  SvgIcon,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { BigNumber } from 'ethers';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';

import Vault from 'contracts/Vault';
import { useCDPManager, useChainLog, useProxyRegistry } from 'pages/ethereum/ContractHooks';
import BurnForm from 'pages/forms/BurnForm';
import MintForm from 'pages/forms/MintForm';
import IlkStatusCard, { useIlkStatusCardProps } from 'pages/ilks/[ilk]/IlkStatusCard';
import { getStringQuery } from 'pages/query';
import usePromiseFactory from 'pages/usePromiseFactory';

import VaultStatusCard from './VaultStatusCard';
import WalletStatusCard from './WalletStatusCard';

import type CDPManagerHelper from 'contracts/CDPManagerHelper';
import type ChainLogHelper from 'contracts/ChainLogHelper';
import type { CDP } from 'contracts/GetCDPsHelper';
import type { IlkStatus } from 'contracts/VatHelper';
import type { FixedNumber } from 'ethers';
import type { NextPageWithEthereum } from 'next';
import type { BurnFormProps } from 'pages/forms/BurnForm';
import type { MintFormProps } from 'pages/forms/MintForm';
import type { FC } from 'react';

const useCDP = (cdpManager: CDPManagerHelper | undefined, cdpId: BigNumber) =>
  usePromiseFactory(useCallback(async () => cdpManager?.getCDP(cdpId), [cdpManager, cdpId]))[0];

const useProxyAddress = (chainLog: ChainLogHelper) => {
  const proxyRegistry = useProxyRegistry(chainLog);
  return usePromiseFactory(
    useCallback(async () => proxyRegistry?.getDSProxy().then((proxy) => proxy?.address || ''), [proxyRegistry]),
  )[0];
};

const NotFound: FC = () => (
  <Stack direction="column" alignItems="center" padding={2}>
    <Box width={128} height={128}>
      <SvgIcon component={WarningIcon} inheritViewBox style={{ fontSize: 128 }} color="error" />
    </Box>
    <Typography variant="h6" component="div" padding={2}>
      Vaultが見つかりませんでした。
    </Typography>
    <Link href="/vaults" passHref>
      <Button variant="contained">一覧に戻る</Button>
    </Link>
  </Stack>
);

type ControllerProps = {
  chainLog: ChainLogHelper;
  vault: Vault;
  ilkStatus: IlkStatus;
  liquidationRatio: FixedNumber;
  tokenBalance: FixedNumber;
  daiBalance: FixedNumber;
  address: string;
  updateAllBalance: () => void;
};

type TabValue = 'mint' | 'burn';

const Controller: FC<ControllerProps> = ({
  chainLog,
  vault,
  ilkStatus,
  liquidationRatio,
  updateAllBalance,
  tokenBalance,
  daiBalance,
  address,
}) => {
  const [selectedTab, setSelectedTab] = useState<TabValue>('mint');
  const onSelectTab: (_: unknown, value: TabValue) => void = useCallback(
    (_, value) => {
      setSelectedTab(value);
    },
    [setSelectedTab],
  );
  const mint: MintFormProps['onMint'] = useCallback(
    (amount, ratio) => vault.mint(chainLog, ilkStatus, liquidationRatio, amount, ratio).then(() => updateAllBalance()),
    [chainLog, ilkStatus, liquidationRatio, vault, updateAllBalance],
  );
  const burn: BurnFormProps['onBurn'] = useCallback(
    (dai, col) => vault.burn(chainLog, col, dai).then(() => updateAllBalance()),
    [chainLog, vault, updateAllBalance],
  );

  const TabContent: FC = useCallback(() => {
    switch (selectedTab) {
      case 'mint':
        return <MintForm ilkInfo={vault.ilkInfo} buttonContent="Mint" onMint={mint} />;
      case 'burn':
        return <BurnForm ilkInfo={vault.ilkInfo} buttonContent="Burn" onBurn={burn} />;
    }
  }, [burn, mint, selectedTab, vault]);

  return (
    <>
      <WalletStatusCard
        label={selectedTab === 'mint' ? 'Balance' : 'DAI balance'}
        balance={selectedTab === 'mint' ? tokenBalance : daiBalance}
        address={address}
      />
      <Tabs variant="fullWidth" value={selectedTab} onChange={onSelectTab}>
        <Tab label="Mint" value="mint" />
        <Tab label="Burn" value="burn" />
      </Tabs>
      <TabContent />
    </>
  );
};

type ContentProps = {
  chainLog: ChainLogHelper;
  cdp: CDP;
  address: string;
};

const Content: FC<ContentProps> = ({ chainLog, cdp, address }) => {
  const ilkCard = useIlkStatusCardProps(chainLog, cdp.ilk);

  const [urnStatus, updateUrnStatus] = usePromiseFactory(
    useCallback(() => chainLog.vat().then((vat) => vat.getUrnStatus(cdp.ilk, cdp.urn)), [chainLog, cdp]),
  );
  const [tokenBalance, updateTokenBalance] = usePromiseFactory(
    useCallback(async () => {
      if (ilkCard) {
        return ilkCard.ilkInfo.gem.getBalance();
      }
    }, [ilkCard]),
  );
  const [daiBalance, updateDaiBalance] = usePromiseFactory(
    useCallback(async () => {
      if (cdp) {
        const dai = await chainLog.dai();
        return dai.getBalance();
      }
    }, [chainLog, cdp]),
  );
  const vault = useMemo(() => ilkCard && new Vault(ilkCard.ilkInfo, cdp.id), [cdp, ilkCard]);

  const updateAllBalance = () => {
    updateDaiBalance();
    updateTokenBalance();
    updateUrnStatus();
  };

  if (!ilkCard || !urnStatus || !vault || !tokenBalance || !daiBalance) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack padding={2} spacing={2}>
      <IlkStatusCard
        ilkInfo={ilkCard.ilkInfo}
        ilkStatus={ilkCard.ilkStatus}
        liquidationRatio={ilkCard.liquidationRatio}
        stabilityFee={ilkCard.stabilityFee}
      />
      <VaultStatusCard urnStatus={urnStatus} ilkStatus={ilkCard.ilkStatus} />
      <Controller
        chainLog={chainLog}
        vault={vault}
        ilkStatus={ilkCard.ilkStatus}
        liquidationRatio={ilkCard.liquidationRatio}
        updateAllBalance={updateAllBalance}
        tokenBalance={tokenBalance}
        daiBalance={daiBalance}
        address={address}
      />
    </Stack>
  );
};

const VaultDetail: NextPageWithEthereum = ({ provider }) => {
  const router = useRouter();
  const cdpId = useMemo(() => BigNumber.from(getStringQuery(router.query.id)), [router.query.id]);
  const chainLog = useChainLog(provider);
  const cdpManager = useCDPManager(chainLog);
  const cdp = useCDP(cdpManager, cdpId);
  const proxyAddress = useProxyAddress(chainLog);

  if (!cdp) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (proxyAddress !== cdp.owner.address) {
    return <NotFound />;
  }

  return (
    <Card elevation={0}>
      <CardHeader title={`${cdp.ilk.inString} Vault (${cdpId.toString()})`} subheader={cdp.urn} />
      <CardContent>
        <Content chainLog={chainLog} cdp={cdp} address={provider.address} />
      </CardContent>
    </Card>
  );
};

export default VaultDetail;
