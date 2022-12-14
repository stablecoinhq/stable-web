import { Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import Link from 'next/link';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Vault from 'ethereum/Vault';
import { useNumericDisplayContext } from 'store/NumericDisplayProvider';

import type {
  GridColDef,
  GridRenderCellParams,
  GridComparatorFn,
  GridValueFormatterParams,
  GridColumnHeaderParams,
} from '@mui/x-data-grid';
import type { CDP } from 'ethereum/contracts/GetCDPsHelper';
import type { FixedNumber } from 'ethers';
import type { FC } from 'react';

export type BurnFormProps = {
  cdps: CDP[];
};

const tableHeaderCell = (params: GridColumnHeaderParams<string>) => (
  <span style={{ fontWeight: '700' }}>{params.colDef.headerName}</span>
);

const sortFixedNumber: GridComparatorFn<FixedNumber> = (v1, v2) => (v1.subUnsafe(v2).isNegative() ? -1 : 1);
const sortFixedNumberWithArray: GridComparatorFn<[FixedNumber, string]> = (v1, v2) =>
  v1[0].subUnsafe(v2[0]).isNegative() ? -1 : 1;

type ColumnTranaslations = {
  collateralType: string;
  id: string;
  liquidationPrice: string;
  collateralizationRatio: string;
  collateralLocked: string;
  manageVault: string;
  debt: string;
  jpy: string;
  stableTokenSymbol: string;
};

const MIN_WIDTH = 170;
const makeColumns = (
  translations: ColumnTranaslations,
  format: (n: FixedNumber, noCommas?: boolean) => string,
): GridColDef[] => {
  const {
    collateralType,
    id,
    collateralizationRatio,
    collateralLocked,
    debt,
    manageVault,
    liquidationPrice,
    jpy,
    stableTokenSymbol,
  } = translations;
  return [
    {
      field: 'collateralType',
      renderHeader: tableHeaderCell,
      headerName: collateralType,
      align: 'left',
      minWidth: 60,
      width: 130,
    },
    { field: 'id', renderHeader: tableHeaderCell, headerName: id, align: 'right', headerAlign: 'right', maxWidth: 170 },
    {
      field: 'liquidationPrice',
      headerName: liquidationPrice,
      headerAlign: 'right',
      align: 'right',
      flex: 1,
      minWidth: MIN_WIDTH,
      renderHeader: tableHeaderCell,
      valueFormatter: ({ value }) => `${format(value)} ${jpy}`,
      sortComparator: sortFixedNumber,
    },
    {
      field: 'collateralizationRatio',
      headerName: collateralizationRatio,
      headerAlign: 'right',
      align: 'right',
      flex: 1,
      minWidth: MIN_WIDTH,
      renderHeader: tableHeaderCell,
      valueFormatter: ({ value }) => `${format(value, true)} %`,
      sortComparator: sortFixedNumber,
    },
    {
      field: 'collateralLocked',
      headerAlign: 'right',
      headerName: collateralLocked,
      align: 'right',
      minWidth: MIN_WIDTH,
      valueFormatter: (params: GridValueFormatterParams<[FixedNumber, string]>) =>
        `${format(params.value[0])} ${params.value[1]}`,
      flex: 1,
      renderHeader: tableHeaderCell,
      sortComparator: sortFixedNumberWithArray,
    },
    {
      field: 'debt',
      headerName: debt,
      align: 'right',
      headerAlign: 'right',
      flex: 1,
      minWidth: MIN_WIDTH,
      renderHeader: tableHeaderCell,
      valueFormatter: ({ value }) => `${format(value)} ${stableTokenSymbol}`,
      sortComparator: sortFixedNumber,
    },
    {
      field: 'manage',
      headerName: '',
      align: 'right',
      headerAlign: 'right',
      sortable: false,
      width: 150,
      renderCell: (params: GridRenderCellParams<FixedNumber>) => (
        <Link href={`/vaults/${params.id.toString()}`} passHref>
          <Button variant="contained">{manageVault}</Button>
        </Link>
      ),
    },
  ];
};

const VaultTable: FC<{ cdps: CDP[] }> = ({ cdps }) => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.vault' });
  const { t: terms } = useTranslation('common', { keyPrefix: 'terms' });
  const { t: units } = useTranslation('common', { keyPrefix: 'units' });

  const { format } = useNumericDisplayContext();
  const rows = useMemo(
    () =>
      cdps.map((cdp) => {
        const { id, urnStatus, ilkStatus, ilk, liquidationRatio } = cdp;
        return {
          id: parseInt(id.toString(), 10),
          collateralType: ilk.inString,
          collateralizationRatio: Vault.getCollateralizationRatio(
            urnStatus.lockedBalance,
            urnStatus.debt,
            liquidationRatio,
            ilkStatus,
          ),
          liquidationPrice: Vault.getLiquidationPrice(
            urnStatus.lockedBalance,
            urnStatus.debt,
            ilkStatus.debtMultiplier,
            liquidationRatio,
          ),
          collateralLocked: [urnStatus.lockedBalance, ilk.currencySymbol] as [FixedNumber, string],
          debt: Vault.getDebt(urnStatus.debt, ilkStatus.debtMultiplier),
          manage: id,
        };
      }),
    [cdps],
  );
  const columns = useMemo(() => {
    const translations: ColumnTranaslations = {
      collateralType: t('collateralType'),
      id: t('id'),
      collateralizationRatio: terms('colRatio'),
      liquidationPrice: terms('liquidationPrice'),
      collateralLocked: t('lockedCollateral'),
      debt: t('debt'),
      manageVault: t('manageVault'),
      jpy: units('jpy'),
      stableTokenSymbol: units('stableToken'),
    };
    return makeColumns(translations, format);
  }, [format, t, terms, units]);
  return (
    <DataGrid
      columns={columns}
      rows={rows}
      autoHeight
      disableColumnFilter
      disableColumnMenu
      disableColumnSelector
      disableSelectionOnClick
    />
  );
};

export default VaultTable;
