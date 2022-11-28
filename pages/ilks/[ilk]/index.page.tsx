import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Card, CardContent, CardHeader, CircularProgress, Stack, SvgIcon, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';

import IlkType from 'ethereum/IlkType';
import Vault from 'ethereum/Vault';
import { useChainLog } from 'ethereum/react/ContractHooks';
import IlkStatusCard, { useIlkStatusCardProps } from 'ethereum/react/cards/IlkStatusCard';
import WalletStatusCard from 'ethereum/react/cards/WalletStatusCard';
import MintForm from 'pages/forms/MintForm';
import { getStringQuery } from 'pages/query';
import usePromiseFactory from 'pages/usePromiseFactory';

import type EthereumProvider from 'ethereum/EthereumProvider';
import type ChainLogHelper from 'ethereum/contracts/ChainLogHelper';
import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus } from 'ethereum/contracts/VatHelper';
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
  chainLog: ChainLogHelper;
  ilkInfo: IlkInfo;
  ilkStatus: IlkStatus;
  liquidationRatio: FixedNumber;
};

const OpenVault: FC<OpenVaultProps> = ({ chainLog, ilkInfo, ilkStatus, liquidationRatio }) => {
  const router = useRouter();
  const openVault = useCallback(
    async (amount: FixedNumber, ratio: FixedNumber) => {
      await Vault.open(chainLog, ilkInfo, ilkStatus, liquidationRatio, amount, ratio);
      await router.push('/vaults');
    },
    [chainLog, ilkInfo, ilkStatus, liquidationRatio, router],
  );

  return <MintForm ilkInfo={ilkInfo} buttonContent="Open vault" onMint={openVault} />;
};

type ContentProps = {
  provider: EthereumProvider;
  ilkType: IlkType;
};

const Content: FC<ContentProps> = ({ provider, ilkType }) => {
  const chainLog = useChainLog(provider);
  const ilkCard = useIlkStatusCardProps(chainLog, ilkType);
  const [balance] = usePromiseFactory(
    useCallback(async () => {
      if (ilkCard) {
        return ilkCard.ilkInfo.gem.getBalance();
      }
    }, [ilkCard]),
  );

  if (!ilkCard || !balance) {
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
      <WalletStatusCard address={provider.address} balance={balance} label="Balance" />
      <OpenVault
        chainLog={chainLog}
        ilkInfo={ilkCard.ilkInfo}
        ilkStatus={ilkCard.ilkStatus}
        liquidationRatio={ilkCard.liquidationRatio}
      />
    </Stack>
  );
};

const OpenVaultForIlk: NextPageWithEthereum = ({ provider }) => {
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
        <Content provider={provider} ilkType={ilkType} />
      </CardContent>
    </Card>
  );
};

export default OpenVaultForIlk;
