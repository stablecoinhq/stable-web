import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { CENT, getAnnualFee, getTotalIssued, UnitFormats } from 'ethereum/helpers/math';
import { useNumericDisplayContext } from 'store/NumericDisplayProvider';

import type IlkType from 'ethereum/IlkType';
import type { IlkInfo } from 'ethereum/contracts/IlkRegistryHelper';
import type { IlkStatus } from 'ethereum/contracts/VatHelper';
import type { FixedNumber } from 'ethers';
import type { FC } from 'react';

type RowProps = {
  field: string;
  value: FixedNumber;
  unit: string;
};

const Row: FC<RowProps> = ({ field, value, unit }) => (
  <TableRow>
    <TableCell sx={{ px: 0, py: 1, border: 'none', fontWeight: 600 }}>{field}</TableCell>
    <TableCell align="right" sx={{ px: 0, py: 1, border: 'none', maxWidth: 150 }}>{`${value} ${unit}`}</TableCell>
  </TableRow>
);

export type IlkItemProps = {
  ilk: IlkType;
  ilkInfo: IlkInfo;
  ilkStatus: IlkStatus;
  liquidationRatio: FixedNumber;
  stabilityFee: FixedNumber;
};

const IlkItem: FC<IlkItemProps> = ({ ilk, ilkInfo, ilkStatus, liquidationRatio, stabilityFee }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.ilk' });
  const { t: terms } = useTranslation('common', { keyPrefix: 'terms' });
  const { t: units } = useTranslation('common', { keyPrefix: 'units' });
  const { format } = useNumericDisplayContext();

  const liquidationRatioPercent = useMemo(() => liquidationRatio.mulUnsafe(CENT.toFormat(UnitFormats.RAY)), [liquidationRatio]);
  const curPrice = useMemo(() => ilkStatus.price.mulUnsafe(liquidationRatio), [ilkStatus.price, liquidationRatio]);
  const annualFee = useMemo(() => getAnnualFee(stabilityFee), [stabilityFee]);
  const totalIssued = useMemo(() => getTotalIssued(ilkStatus), [ilkStatus]);
  const isAboveCeiling = useMemo(() => {
    // debtCeiling < totalIssued + debtFloor
    const { debtFloor, debtCeiling } = ilkStatus;
    const f = UnitFormats.RAD;
    const delta = debtCeiling.toFormat(f).subUnsafe(debtFloor.toFormat(f)).subUnsafe(totalIssued.toFormat(f));
    return delta.isNegative() || delta.isZero();
  }, [ilkStatus, totalIssued]);
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
                <Row field={t('currentPrice', { collateral: ilkInfo.symbol })} value={format(curPrice)} unit={units('jpy')} />
                <Row field={terms('liqRatio')} value={format(liquidationRatioPercent)} unit="%" />
                <Row field={terms('annualFee')} value={format(annualFee)} unit="%" />
                <Row field={terms('totalIssued')} value={format(totalIssued)} unit={units('stableToken')} />
                <Row field={terms('maxLiquidity')} value={format(ilkStatus.debtCeiling)} unit={units('stableToken')} />
                <Row field={terms('debtFloor')} value={format(ilkStatus.debtFloor)} unit={units('stableToken')} />
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
        <CardActions>
          <Link href={`/ilks/${ilk.inString}`} passHref>
            <Button
              endIcon={!isAboveCeiling && <ArrowForwardIcon />}
              style={{ justifyContent: 'start' }}
              fullWidth
              disabled={isAboveCeiling}
            >
              {isAboveCeiling ? t('unavailable') : t('openDesc')}
            </Button>
          </Link>
        </CardActions>
      </Card>
    </Grid>
  );
};

export default IlkItem;
