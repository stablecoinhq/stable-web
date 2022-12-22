import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Card, CardContent, CardHeader, CircularProgress, Stack, SvgIcon, Typography } from '@mui/material';
import { FixedNumber } from 'ethers';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';

import Vault from 'ethereum/Vault';
import { INT_FORMAT } from 'ethereum/helpers/math';
import { toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import IlkStatusCard, { getIlkStatusProps } from 'ethereum/react/cards/IlkStatusCard';
import useChainLog from 'ethereum/react/useChainLog';
import getEmptyPaths from 'pages/getEmptyPaths';
import getTranslationProps from 'pages/getTranslationProps';
import { getStringQuery } from 'pages/query';
import { useErrorDialog } from 'store/ErrorDialogProvider';

import BurnFormController from '../../forms/BurnFormController';
import MintFormController from '../../forms/MintFormController';

import type { TabValue } from '../../forms/FormLayout';
import type ChainLogHelper from 'ethereum/contracts/ChainLogHelper';
import type { CDP } from 'ethereum/contracts/GetCDPsHelper';
import type ProxyRegistryHelper from 'ethereum/contracts/ProxyRegistryHelper';
import type { IlkStatus, UrnStatus } from 'ethereum/contracts/VatHelper';
import type { NextPageWithEthereum } from 'next';
import type { BurnFormProps } from 'pages/forms/BurnForm';
import type { MintFormProps } from 'pages/forms/MintForm';
import type { FC } from 'react';

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
  cdp: CDP;
  vault: Vault;
  proxyRegistry: ProxyRegistryHelper;
  ilkStatus: IlkStatus;
  urnStatus: UrnStatus;
  liquidationRatio: FixedNumber;
  tokenBalance: FixedNumber;
  tokenAllowance: FixedNumber;
  daiBalance: FixedNumber;
  address: string;
  update: () => void;
};

const Controller: FC<ControllerProps> = ({
  cdp,
  vault,
  urnStatus,
  ilkStatus,
  liquidationRatio,
  update,
  tokenBalance,
  tokenAllowance,
  daiBalance,
  address,
  proxyRegistry,
}) => {
  const { t } = useTranslation('common', { keyPrefix: 'terms' });
  const { t: errorMessage } = useTranslation('common', { keyPrefix: 'pages.vault.errors' });
  const { openDialog } = useErrorDialog();

  const [selectedTab, setSelectedTab] = useState<TabValue>('mint');
  const onSelectTab: (_: unknown, value: TabValue) => void = useCallback(
    (_, value) => {
      setSelectedTab(value);
    },
    [setSelectedTab],
  );

  const mint: MintFormProps['onMint'] = useCallback(
    (collateralAmount, daiAmount) =>
      vault
        .mint(cdp.id, collateralAmount, daiAmount)
        .then(() => update())
        .catch((err) => openDialog(errorMessage('errorWhileMinting'), err)),
    [vault, cdp.id, update, openDialog, errorMessage],
  );

  const burn: BurnFormProps['onBurn'] = useCallback(
    (dai, col) =>
      vault
        .burn(cdp.id, col, dai)
        .then(() => update())
        .catch((err) => openDialog(errorMessage('errorWhileRepaying'), err)),
    [vault, cdp.id, update, openDialog, errorMessage],
  );

  const burnAll: BurnFormProps['onBurnAll'] = useCallback(
    (dai, col) =>
      vault
        .burnAll(cdp.id, col, dai)
        .then(() => update())
        .catch((err) => openDialog(errorMessage('errorWhileRepaying'), err)),
    [vault, cdp.id, update, openDialog, errorMessage],
  );

  const TabContent: FC = useCallback(() => {
    switch (selectedTab) {
      case 'mint':
        return (
          <MintFormController
            proxyRegistry={proxyRegistry}
            ilkInfo={vault.ilkInfo}
            ilkStatus={ilkStatus}
            urnStatus={urnStatus}
            mint={mint}
            liquidationRatio={liquidationRatio}
            balance={tokenBalance}
            allowance={tokenAllowance}
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
            burnAll={burnAll}
            liquidationRatio={liquidationRatio}
            urnStatus={urnStatus}
            balance={daiBalance}
            buttonContent={t('burn')}
            address={address}
            ilkStatus={ilkStatus}
            selectedTab={selectedTab}
            onSelectTab={onSelectTab}
          />
        );
    }
  }, [selectedTab, proxyRegistry, vault.ilkInfo, ilkStatus, urnStatus, mint, liquidationRatio, tokenBalance, tokenAllowance, address, t, onSelectTab, burn, burnAll, daiBalance]);

  return <TabContent />;
};

type ContentProps = {
  chainLog: ChainLogHelper;
  cdp: CDP;
  address: string;
};

const Content: FC<ContentProps> = ({ chainLog, cdp, address }) => {
  const { data, mutate, isLoading } = useSWR('getVaultData', async () => {
    const [ilkInfo, ilkStatus, liquidationRatio, stabilityFee] = await getIlkStatusProps(chainLog, cdp.ilk);
    const proxyRegistry = await chainLog.proxyRegistry();
    const proxy = await proxyRegistry.getDSProxy();
    const [daiBalance, urnStatus, tokenBalance, tokenAllowance, vault] = await Promise.all([
      chainLog.dai().then((dai) => dai.getBalance()),
      chainLog.vat().then((vat) => vat.getUrnStatus(cdp.ilk, cdp.urn)),
      ilkInfo.gem.getBalance(),
      proxy ? ilkInfo.gem.getAllowance(proxy.address) : FixedNumber.from('0', ilkInfo.gem.format),
      Vault.fromChainlog(chainLog, ilkInfo),
    ]);
    return {
      ilkInfo,
      ilkStatus,
      liquidationRatio,
      stabilityFee,
      tokenBalance,
      tokenAllowance,
      daiBalance,
      urnStatus,
      vault,
      proxyRegistry,
      proxyAddress: proxy ? proxy.address : undefined,
    };
  });

  const updateAllBalance = mutate;

  if (!data || isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  const {
    ilkInfo,
    ilkStatus,
    liquidationRatio,
    stabilityFee,
    urnStatus,
    tokenBalance,
    tokenAllowance,
    daiBalance,
    vault,
    proxyRegistry,
  } = data;

  return (
    <Stack padding={2} spacing={2}>
      <IlkStatusCard ilkInfo={ilkInfo} ilkStatus={ilkStatus} liquidationRatio={liquidationRatio} stabilityFee={stabilityFee} />
      <Controller
        cdp={cdp}
        vault={vault}
        urnStatus={urnStatus}
        ilkStatus={ilkStatus}
        proxyRegistry={proxyRegistry}
        liquidationRatio={liquidationRatio}
        update={updateAllBalance}
        tokenBalance={tokenBalance}
        tokenAllowance={tokenAllowance}
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
  const { data, isLoading } = useSWR('getCDP', async () => {
    const cdpManager = await chainLog.dssCDPManager();
    const proxyRegistry = await chainLog.proxyRegistry();
    const proxy = await proxyRegistry.getDSProxy();
    return {
      cdp: await cdpManager.getCDP(cdpId),
      proxyAddress: proxy?.address || '',
    };
  });
  if (!data || isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  const { proxyAddress, cdp } = data;

  if (proxyAddress !== cdp.owner.address) {
    return <NotFound />;
  }

  const { ilk, urn } = cdp;

  return (
    <Card elevation={0}>
      <CardHeader title={t('title', { ilk: ilk.inString, id: cdpId?.toString() })} subheader={urn} />
      <CardContent>
        <Content chainLog={chainLog} cdp={cdp} address={provider.address} />
      </CardContent>
    </Card>
  );
};

export const getStaticPaths = getEmptyPaths;
export const getStaticProps = getTranslationProps;
export default VaultDetail;
