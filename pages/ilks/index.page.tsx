/* eslint-disable i18next/no-literal-string */
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useCallback, useMemo } from 'react';

import ChainLogHelper from 'ethereum/contracts/ChainLogHelper';
import { CENT, getAnnualFee, getTotalIssued, UnitFormats } from 'ethereum/helpers/math';
import usePromiseFactory from 'pages/usePromiseFactory';
import { useConfigContext } from 'store/DisplayProvider';

import getTranslationProps from '../getTranslationProps';

import type EthereumProvider from 'ethereum/EthereumProvider';
import type IlkType from 'ethereum/IlkType';
import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus } from 'ethereum/contracts/VatHelper';
import type { FixedNumber } from 'ethers';
import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

const useIlks = (provider: EthereumProvider) =>
  usePromiseFactory(
    useCallback(async () => {
      const chainLog = new ChainLogHelper(provider);
      const [ilkRegistry, vat, spot, jug] = await Promise.all([
        chainLog.ilkRegistry(),
        chainLog.vat(),
        chainLog.spot(),
        chainLog.jug(),
      ]);
      const list = await ilkRegistry.list();
      return Promise.all(
        list.map(async (ilk) => {
          const [ilkInfo, ilkStatus, liquidationRatio, stabilityFee] = await Promise.all([
            ilkRegistry.info(ilk),
            vat.getIlkStatus(ilk),
            spot.getLiquidationRatio(ilk),
            jug.getStabilityFee(ilk),
          ]);
          return {
            ilk,
            ilkInfo,
            ilkStatus,
            liquidationRatio,
            stabilityFee,
          };
        }),
      );
    }, [provider]),
  )[0];

type RenderRowProps = {
  field: string;
  value: FixedNumber;
  unit: string;
};

const RenderRow: FC<RenderRowProps> = ({ field, value, unit }) => (
  <TableRow>
    <TableCell sx={{ px: 0, py: 1, border: 'none', fontWeight: 600 }}>{field}</TableCell>
    <TableCell align="right" sx={{ px: 0, py: 1, border: 'none' }}>{`${value} ${unit}`}</TableCell>
  </TableRow>
);

type RenderIlkProps = {
  ilk: IlkType;
  ilkInfo: IlkInfo;
  ilkStatus: IlkStatus;
  liquidationRatio: FixedNumber;
  stabilityFee: FixedNumber;
};

const RenderIlk: FC<RenderIlkProps> = ({ ilk, ilkInfo, ilkStatus, liquidationRatio, stabilityFee }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.ilk' });
  const { t: terms } = useTranslation('common', { keyPrefix: 'terms' });
  const { t: units } = useTranslation('common', { keyPrefix: 'units' });
  const { display } = useConfigContext();

  const liquidationRatioPercent = useMemo(() => liquidationRatio.mulUnsafe(CENT.toFormat(UnitFormats.RAY)), [liquidationRatio]);
  const curPrice = useMemo(() => ilkStatus.price.mulUnsafe(liquidationRatio), [ilkStatus.price, liquidationRatio]);

  const annualFee = useMemo(() => getAnnualFee(stabilityFee), [stabilityFee]);
  const totalIssued = useMemo(() => getTotalIssued(ilkStatus), [ilkStatus]);
  return (
    <Grid item xs={12} md={6} lg={4}>
      <Card>
        <CardContent>
          <Typography variant="h5" component="div">
            {ilk.inString}
          </Typography>
          <Typography sx={{ mb: 1.5 }} color="text.secondary">
            {ilkInfo.name}
          </Typography>
          <TableContainer>
            <Table>
              <TableBody>
                <RenderRow
                  field={t('currentPrice', { collateral: ilkInfo.symbol })}
                  value={display(curPrice)}
                  unit={units('jpy')}
                />
                <RenderRow field={terms('liqRatio')} value={display(liquidationRatioPercent)} unit="%" />
                <RenderRow field={terms('annualFee')} value={display(annualFee)} unit="%" />
                <RenderRow field={terms('totalIssued')} value={display(totalIssued)} unit={units('stableToken')} />
                <RenderRow field={terms('maxLiquidity')} value={display(ilkStatus.debtCeiling)} unit={units('stableToken')} />
                <RenderRow field={terms('debtFloor')} value={display(ilkStatus.debtFloor)} unit={units('stableToken')} />
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
        <CardActions>
          <Link href={`/ilks/${ilk.inString}`} passHref>
            <Button endIcon={<ArrowForwardIcon />} style={{ justifyContent: 'start' }} fullWidth>
              {t('openDesc')}
            </Button>
          </Link>
        </CardActions>
      </Card>
    </Grid>
  );
};

type ContentProps = {
  ilks: RenderIlkProps[] | undefined;
};

const Content: FC<ContentProps> = ({ ilks }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.ilk' });

  if (!ilks) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (ilks.length === 0) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <Typography variant="subtitle1">{t('noIlks')}</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={4}>
      {ilks.map(({ ilk, ilkInfo, ilkStatus, liquidationRatio, stabilityFee }) => (
        <RenderIlk
          key={ilk.inString}
          ilk={ilk}
          ilkInfo={ilkInfo}
          ilkStatus={ilkStatus}
          liquidationRatio={liquidationRatio}
          stabilityFee={stabilityFee}
        />
      ))}
    </Grid>
  );
};

const OpenVault: NextPageWithEthereum = ({ provider }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.ilk' });

  const ilks = useIlks(provider);

  return (
    <Card elevation={0}>
      <CardHeader title={t('openLabel')} />
      <CardContent>
        <Content ilks={ilks} />
      </CardContent>
    </Card>
  );
};

export const getStaticProps = getTranslationProps;
export default OpenVault;
