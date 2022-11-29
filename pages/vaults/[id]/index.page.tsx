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
import { FixedNumber } from 'ethers';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';

import Vault from 'contracts/Vault';
import { INT_FORMAT } from 'contracts/math';
import { useCDPManager, useChainLog, useProxyRegistry } from 'pages/ethereum/ContractHooks';
import BurnForm from 'pages/forms/BurnForm';
import MintForm from 'pages/forms/MintForm';
import { toFixedNumberOrUndefined } from 'pages/forms/stringNumber';
import getEmptyPaths from 'pages/getEmptyPaths';
import getTranslationProps from 'pages/getTranslationProps';
import IlkStatusCard, { useIlkStatusCardProps } from 'pages/ilks/[ilk]/IlkStatusCard';
import { getStringQuery } from 'pages/query';
import usePromiseFactory from 'pages/usePromiseFactory';

import VaultStatusCard from './VaultStatusCard';
import WalletStatusCard from './WalletStatusCard';

import type CDPManagerHelper from 'contracts/CDPManagerHelper';
import type ChainLogHelper from 'contracts/ChainLogHelper';
import type { CDP } from 'contracts/GetCDPsHelper';
import type { IlkStatus } from 'contracts/VatHelper';
import type { NextPageWithEthereum } from 'next';
import type { BurnFormProps } from 'pages/forms/BurnForm';
import type { MintFormProps } from 'pages/forms/MintForm';
import type { FC } from 'react';

const useCDP = (cdpManager: CDPManagerHelper | undefined, cdpId: FixedNumber) =>
  usePromiseFactory(useCallback(async () => cdpManager?.getCDP(cdpId), [cdpManager, cdpId]))[0];

const useProxyAddress = (chainLog: ChainLogHelper) => {
  const proxyRegistry = useProxyRegistry(chainLog);
  return usePromiseFactory(
    useCallback(async () => proxyRegistry?.getDSProxy().then((proxy) => proxy?.address || ''), [proxyRegistry]),
  )[0];
};

const NotFound: FC = () => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.vault' });

  return (
    <Stack direction="column" alignItems="center" padding={2}>
      <Box width={128} height={128}>
        <SvgIcon component={WarningIcon} inheritViewBox style={{ fontSize: 128 }} color="error" />
      </Box>
      <Typography variant="h6" component="div" padding={2}>
        {t('notFound')}
      </Typography>
      <Link href="/vaults" passHref>
        <Button variant="contained">{t('backToList')}</Button>
      </Link>
    </Stack>
  );
};

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
        return (
          <MintForm
            ilkInfo={vault.ilkInfo}
            buttonContent="Mint"
            onMint={mint}
            liquidationRatio={liquidationRatio}
            ilkStatus={ilkStatus}
          />
        );
      case 'burn':
        return <BurnForm ilkInfo={vault.ilkInfo} buttonContent="Burn" onBurn={burn} />;
    }
  }, [burn, mint, selectedTab, vault, liquidationRatio, ilkStatus]);

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
      <VaultStatusCard urnStatus={urnStatus} ilkStatus={ilkCard.ilkStatus} liquidationRatio={ilkCard.liquidationRatio} />
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
  const { t } = useTranslation('common', { keyPrefix: 'pages.vault' });

  const router = useRouter();
  const cdpId = useMemo(
    () => toFixedNumberOrUndefined(getStringQuery(router.query.id), INT_FORMAT) || FixedNumber.fromString('0', INT_FORMAT),
    [router.query.id],
  );
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
      <CardHeader title={t('title', { ilk: cdp.ilk.inString, id: cdpId?.toString() })} subheader={cdp.urn} />
      <CardContent>
        <Content chainLog={chainLog} cdp={cdp} address={provider.address} />
      </CardContent>
    </Card>
  );
};

export const getStaticPaths = getEmptyPaths;
export const getStaticProps = getTranslationProps;
export default VaultDetail;
