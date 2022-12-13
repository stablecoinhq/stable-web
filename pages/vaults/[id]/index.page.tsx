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
  chainLog: ChainLogHelper;
  vault: Vault;
  ilkStatus: IlkStatus;
  urnStatus: UrnStatus;
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
  tokenBalance,
  daiBalance,
  address,
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
        .mint(chainLog, collateralAmount, daiAmount)
        .then(() => updateAllBalance())
        .catch((err) => openDialog(errorMessage('errorWhileMinting'), err)),
    [vault, chainLog, updateAllBalance, openDialog, errorMessage],
  );

  const burn: BurnFormProps['onBurn'] = useCallback(
    (dai, col) =>
      vault
        .burn(chainLog, col, dai)
        .then(() => updateAllBalance())
        .catch((err) => openDialog(errorMessage('errorWhileRepaying'), err)),
    [vault, chainLog, updateAllBalance, openDialog, errorMessage],
  );

  const burnAll: BurnFormProps['onBurnAll'] = useCallback(
    (dai, col) => vault.burnAll(chainLog, col, dai).then(() => updateAllBalance()),
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
  }, [
    selectedTab,
    vault.ilkInfo,
    ilkStatus,
    urnStatus,
    mint,
    liquidationRatio,
    tokenBalance,
    address,
    t,
    onSelectTab,
    burn,
    burnAll,
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
  const { data, mutate, isLoading } = useSWR('getVaultData', async () => {
    const [ilkInfo, ilkStatus, liquidationRatio, stabilityFee] = await getIlkStatusProps(chainLog, cdp.ilk);
    const [daiBalance, urnStatus, tokenBalance] = await Promise.all([
      chainLog.dai().then((dai) => dai.getBalance()),
      chainLog.vat().then((vat) => vat.getUrnStatus(cdp.ilk, cdp.urn)),
      ilkInfo.gem.getBalance(),
    ]);
    return {
      ilkInfo,
      ilkStatus,
      liquidationRatio,
      stabilityFee,
      tokenBalance,
      daiBalance,
      urnStatus,
    };
  });
  const vault = useMemo(() => data && new Vault(data.ilkInfo, cdp.id), [cdp.id, data]);

  const updateAllBalance = () => {
    mutate();
  };

  if (!data || isLoading || !vault) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  const { ilkInfo, ilkStatus, liquidationRatio, stabilityFee, urnStatus, tokenBalance, daiBalance } = data;

  return (
    <Stack padding={2} spacing={2}>
      <IlkStatusCard ilkInfo={ilkInfo} ilkStatus={ilkStatus} liquidationRatio={liquidationRatio} stabilityFee={stabilityFee} />
      <Controller
        chainLog={chainLog}
        vault={vault}
        urnStatus={urnStatus}
        ilkStatus={ilkStatus}
        liquidationRatio={liquidationRatio}
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
