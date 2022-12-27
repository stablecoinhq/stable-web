import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Card, CardContent, CardHeader, CircularProgress, Stack, SvgIcon, Typography } from '@mui/material';
import { FixedNumber } from 'ethers';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';

import Vault from 'ethereum/Vault';
import { INT_FORMAT, UnitFormats } from 'ethereum/helpers/math';
import { toFixedNumberOrUndefined } from 'ethereum/helpers/stringNumber';
import IlkStatusCard, { getIlkStatusProps } from 'ethereum/react/cards/IlkStatusCard';
import useChainLog from 'ethereum/react/useChainLog';
import getEmptyPaths from 'pages/getEmptyPaths';
import getTranslationProps from 'pages/getTranslationProps';
import { getStringQuery } from 'pages/query';

import BurnFormController from '../../forms/BurnFormController';
import MintFormController from '../../forms/MintFormController';

import type { TabValue } from '../../forms/FormLayout';
import type ERC20Helper from 'ethereum/contracts/ERC20Helper';
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
  ilkStatus: IlkStatus;
  urnStatus: UrnStatus;
  liquidationRatio: FixedNumber;
  tokenBalance: FixedNumber;
  tokenAllowance: FixedNumber;
  daiBalance: FixedNumber;
  daiAllowance: FixedNumber;
  address: string;
  update: () => void;
  dai: ERC20Helper;
  proxyRegistry: ProxyRegistryHelper;
  proxyAddress: string | undefined;
};

const Controller: FC<ControllerProps> = ({
  cdp,
  vault,
  urnStatus,
  ilkStatus,
  liquidationRatio,
  update,
  tokenBalance,
  daiBalance,
  address,
  tokenAllowance,
  daiAllowance,
  dai,
  proxyAddress,
  proxyRegistry,
}) => {
  const { t } = useTranslation('common', { keyPrefix: 'terms' });
  const { t: common } = useTranslation('common');

  const [selectedTab, setSelectedTab] = useState<TabValue>('mint');
  const onSelectTab: (_: unknown, value: TabValue) => void = useCallback(
    (_, value) => {
      setSelectedTab(value);
    },
    [setSelectedTab],
  );

  const mint: MintFormProps['onMint'] = useCallback(
    (collateralAmount, daiAmount) => vault.mint(cdp.id, collateralAmount, daiAmount).then(() => update()),
    [vault, cdp.id, update],
  );

  const burn: BurnFormProps['onBurn'] = useCallback(
    (daiAmount, col) => vault.burn(cdp.id, col, daiAmount).then(() => update()),
    [vault, cdp.id, update],
  );

  const burnAll: BurnFormProps['onBurnAll'] = useCallback(
    (daiAmount, col) => vault.burnAll(cdp.id, col, daiAmount).then(() => update()),
    [vault, cdp.id, update],
  );

  const ensureProxy = useCallback(() => proxyRegistry.ensureDSProxy().then((v) => v.address), [proxyRegistry]);

  const increateTokenAllowance = useCallback(
    async (who: string, n: FixedNumber) => {
      await vault.ilkInfo.gem.ensureAllowance(who, n, 5);
    },
    [vault.ilkInfo.gem],
  );

  const increaseDaiAllowance = useCallback(
    async (who: string, n: FixedNumber) => {
      await dai.ensureAllowance(who, n, 5);
    },
    [dai],
  );

  const content = useMemo(() => {
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
            allowance={tokenAllowance}
            proxyAddress={proxyAddress}
            increaseAllowance={increateTokenAllowance}
            onMintDialog={common('forms.mint.processing')}
            ensureProxy={ensureProxy}
            onErrorMessage={common('forms.mint.error.errorWhileMinting')}
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
            allowance={daiAllowance}
            increaseAllowance={increaseDaiAllowance}
            ensureProxy={ensureProxy}
            proxyAddress={proxyAddress}
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
    tokenAllowance,
    proxyAddress,
    increateTokenAllowance,
    common,
    ensureProxy,
    burn,
    burnAll,
    daiBalance,
    daiAllowance,
    increaseDaiAllowance,
  ]);

  return content;
};

const VaultDetail: NextPageWithEthereum = ({ provider }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.vault' });

  const router = useRouter();
  const cdpId = useMemo(
    () => toFixedNumberOrUndefined(getStringQuery(router.query.id), INT_FORMAT) || FixedNumber.fromString('0', INT_FORMAT),
    [router.query.id],
  );
  const chainLog = useChainLog(provider);
  const { data, isLoading, mutate } = useSWR('getCDP', async () => {
    const cdpManager = await chainLog.dssCDPManager();
    const proxyRegistry = await chainLog.proxyRegistry();
    const proxy = await proxyRegistry.getDSProxy();
    const cdp = await cdpManager.getCDP(cdpId);
    const [ilkInfo, ilkStatus, liquidationRatio, stabilityFee] = await getIlkStatusProps(chainLog, cdp.ilk);
    const dai = await chainLog.dai();
    const [daiBalance, daiAllowance, urnStatus, tokenBalance, tokenAllowance, vault] = await Promise.all([
      dai.getBalance(),
      proxy ? dai.getAllowance(proxy.address) : FixedNumber.from('0', UnitFormats.WAD),
      chainLog.vat().then((vat) => vat.getUrnStatus(cdp.ilk, cdp.urn)),
      ilkInfo.gem.getBalance(),
      proxy ? ilkInfo.gem.getAllowance(proxy.address) : FixedNumber.from('0', ilkInfo.gem.format),
      Vault.fromChainlog(chainLog, ilkInfo),
    ]);
    return {
      cdp,
      proxyRegistry,
      proxyAddress: proxy?.address,
      ilkInfo,
      ilkStatus,
      liquidationRatio,
      stabilityFee,
      daiBalance,
      daiAllowance,
      urnStatus,
      tokenBalance,
      tokenAllowance,
      vault,
      dai,
    };
  });
  if (!data || isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  const {
    proxyAddress,
    cdp,
    ilkInfo,
    ilkStatus,
    liquidationRatio,
    stabilityFee,
    tokenBalance,
    tokenAllowance,
    daiAllowance,
    daiBalance,
    urnStatus,
    vault,
    proxyRegistry,
    dai,
  } = data;

  if (proxyAddress !== cdp.owner.address) {
    return <NotFound />;
  }

  const { ilk, urn } = cdp;

  return (
    <Card elevation={0}>
      <CardHeader title={t('title', { ilk: ilk.inString, id: cdpId?.toString() })} subheader={urn} />
      <CardContent>
        <Stack padding={2} spacing={2}>
          <IlkStatusCard
            ilkInfo={ilkInfo}
            ilkStatus={ilkStatus}
            liquidationRatio={liquidationRatio}
            stabilityFee={stabilityFee}
          />
          <Controller
            cdp={cdp}
            address={provider.address}
            ilkStatus={ilkStatus}
            liquidationRatio={liquidationRatio}
            tokenBalance={tokenBalance}
            tokenAllowance={tokenAllowance}
            daiAllowance={daiAllowance}
            daiBalance={daiBalance}
            urnStatus={urnStatus}
            vault={vault}
            proxyRegistry={proxyRegistry}
            proxyAddress={proxyAddress}
            dai={dai}
            update={() => mutate()}
          />
        </Stack>
      </CardContent>
    </Card>
  );
};

export const getStaticPaths = getEmptyPaths;
export const getStaticProps = getTranslationProps;
export default VaultDetail;
