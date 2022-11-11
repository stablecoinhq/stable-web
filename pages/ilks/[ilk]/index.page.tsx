import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Card, CardContent, CardHeader, CircularProgress, Stack, SvgIcon, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';

import IlkType from 'contracts/IlkType';
import Vault from 'contracts/Vault';
import { useChainLog } from 'pages/ethereum/ContractHooks';
import MintForm from 'pages/forms/MintForm';
import IlkStatusCard, { useIlkStatusCardProps } from 'pages/ilks/[ilk]/IlkStatusCard';
import { getStringQuery } from 'pages/query';

import type { Web3Provider } from '@ethersproject/providers';
import type ChainLogHelper from 'contracts/ChainLogHelper';
import type EthereumAccount from 'contracts/EthereumAccount';
import type { IlkInfo } from 'contracts/IlkRegistryHelper';
import type { IlkStatus } from 'contracts/VatHelper';
import type { FixedNumber } from 'ethers';
import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

const InvalidIlk: FC = () => (
  <Stack direction="column" alignItems="center" padding={2}>
    <Box width={128} height={128}>
      <SvgIcon component={WarningIcon} inheritViewBox style={{ fontSize: 128 }} color="error" />
    </Box>
    <Typography variant="h6" component="div" padding={2}>
      指定された担保が見つかりませんでした。
    </Typography>
    <Link href="/ilks" passHref>
      <Button variant="contained">一覧に戻る</Button>
    </Link>
  </Stack>
);

type OpenVaultProps = {
  account: EthereumAccount;
  chainLog: ChainLogHelper;
  ilkInfo: IlkInfo;
  ilkStatus: IlkStatus;
  liquidationRatio: FixedNumber;
};

const OpenVault: FC<OpenVaultProps> = ({ account, chainLog, ilkInfo, ilkStatus, liquidationRatio }) => {
  const router = useRouter();
  const openVault = useCallback(
    async (amount: FixedNumber, ratio: FixedNumber) => {
      await Vault.open(chainLog, account, ilkInfo, ilkStatus, liquidationRatio, amount, ratio);
      await router.push('/vaults');
    },
    [account, chainLog, ilkInfo, ilkStatus, liquidationRatio, router],
  );

  return <MintForm ilkInfo={ilkInfo} buttonContent="Open vault" onMint={openVault} />;
};

type ContentProps = {
  ethereum: Web3Provider;
  account: EthereumAccount;
  ilkType: IlkType;
};

const Content: FC<ContentProps> = ({ ethereum, account, ilkType }) => {
  const chainLog = useChainLog(ethereum);
  const ilkCard = useIlkStatusCardProps(chainLog, ilkType);

  if (!ilkCard) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (!ilkCard.ilkInfo.name) {
    return <InvalidIlk />;
  }

  return (
    <Stack padding={2} spacing={2}>
      <IlkStatusCard
        ilkInfo={ilkCard.ilkInfo}
        ilkStatus={ilkCard.ilkStatus}
        liquidationRatio={ilkCard.liquidationRatio}
        stabilityFee={ilkCard.stabilityFee}
      />
      <OpenVault
        account={account}
        chainLog={chainLog}
        ilkInfo={ilkCard.ilkInfo}
        ilkStatus={ilkCard.ilkStatus}
        liquidationRatio={ilkCard.liquidationRatio}
      />
    </Stack>
  );
};

const OpenVaultForIlk: NextPageWithEthereum = ({ ethereum, account }) => {
  const router = useRouter();
  const ilkType = useMemo(() => {
    const typeInString = getStringQuery(router.query.ilk);
    return typeInString && IlkType.fromString(typeInString);
  }, [router.query.ilk]);

  if (!ilkType) {
    return <InvalidIlk />;
  }

  return (
    <Card elevation={0}>
      <CardHeader title={`Open new ${ilkType.inString} vault`} />
      <CardContent>
        <Content ethereum={ethereum} account={account} ilkType={ilkType} />
      </CardContent>
    </Card>
  );
};

export default OpenVaultForIlk;
