import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Card, CardContent, CardHeader, CircularProgress, Stack, SvgIcon, Typography } from '@mui/material';
import { FixedNumber } from 'ethers';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';

import Vault from 'ethereum/Vault';
import { INT_FORMAT } from 'ethereum/helpers/math';
import { toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import { useCDPManager, useChainLog, useProxyRegistry } from 'ethereum/react/ContractHooks';
import IlkStatusCard, { useIlkStatusCardProps } from 'ethereum/react/cards/IlkStatusCard';
import getEmptyPaths from 'pages/getEmptyPaths';
import getTranslationProps from 'pages/getTranslationProps';
import { getStringQuery } from 'pages/query';
import usePromiseFactory from 'pages/usePromiseFactory';

import BurnFormController from '../../forms/BurnFormController';
import MintFormController from '../../forms/MintFormController';

import type { TabValue } from '../../forms/FormLayout';
import type CDPManagerHelper from 'ethereum/contracts/CDPManagerHelper';
import type ChainLogHelper from 'ethereum/contracts/ChainLogHelper';
import type { CDP } from 'ethereum/contracts/GetCDPsHelper';
import type { IlkStatus, UrnStatus } from 'ethereum/contracts/VatHelper';
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
  urnStatus: UrnStatus;
  debt: FixedNumber;
  lockedBalance: FixedNumber;
  liquidationRatio: FixedNumber;
  tokenBalance: FixedNumber;
  daiBalance: FixedNumber;
  address: string;
  updateAllBalance: () => void;
};

const Controller: FC<ControllerProps> = ({
  chainLog,
  vault,
  urnStatus,
  ilkStatus,
  liquidationRatio,
  updateAllBalance,
  debt,
  lockedBalance,
  tokenBalance,
  daiBalance,
  address,
}) => {
  const { t } = useTranslation('common', { keyPrefix: 'terms' });

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
          <MintFormController
            ilkInfo={vault.ilkInfo}
            ilkStatus={ilkStatus}
            urnStatus={urnStatus}
            mint={mint}
            liquidationRatio={liquidationRatio}
            balance={tokenBalance}
            address={address}
            buttonContent={t('mint')}
            selectedTab={selectedTab}
            onSelectTab={onSelectTab}
          />
        );
      case 'burn':
        return (
          <BurnFormController
            ilkInfo={vault.ilkInfo}
            burn={burn}
            liquidationRatio={liquidationRatio}
            urnStatus={urnStatus}
            balance={daiBalance}
            lockedBalance={lockedBalance}
            debt={debt}
            buttonContent={t('burn')}
            address={address}
            ilkStatus={ilkStatus}
            selectedTab={selectedTab}
            onSelectTab={onSelectTab}
          />
        );
    }
  }, [
    selectedTab,
    vault.ilkInfo,
    ilkStatus,
    urnStatus,
    mint,
    liquidationRatio,
    tokenBalance,
    lockedBalance,
    debt,
    address,
    t,
    onSelectTab,
    burn,
    daiBalance,
  ]);

  return <TabContent />;
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
      <Controller
        chainLog={chainLog}
        vault={vault}
        urnStatus={urnStatus}
        ilkStatus={ilkCard.ilkStatus}
        liquidationRatio={ilkCard.liquidationRatio}
        updateAllBalance={updateAllBalance}
        debt={urnStatus.debt}
        lockedBalance={urnStatus.lockedBalance}
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
