/* eslint-disable i18next/no-literal-string */
import { Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import Link from 'next/link';
import React, { useMemo } from 'react';

import Vault from 'ethereum/Vault';

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

type GridRow = {
  id: number;
  asset: string;
  collateralizationRatio: FixedNumber;
  collateralLocked: [FixedNumber, string];
  daiDebt: FixedNumber;
  manage: FixedNumber;
};

const toRow = (cdp: CDP): GridRow => {
  const { id, urnStatus, ilkStatus, ilk, liquidationRatio } = cdp;
  return {
    id: parseInt(id.toString(), 10),
    asset: ilk.inString,
    collateralizationRatio: Vault.getCollateralizationRatio(
      urnStatus.lockedBalance,
      urnStatus.debt,
      liquidationRatio,
      ilkStatus,
    ),
    collateralLocked: [urnStatus.lockedBalance, ilk.currencySymbol],
    daiDebt: Vault.getDebt(urnStatus.debt, ilkStatus.debtMultiplier),
    manage: id,
  };
};

const tableHeaderCell = (params: GridColumnHeaderParams<string>) => (
  <span style={{ fontWeight: '700' }}>{params.colDef.headerName}</span>
);

const sortFixedNumber: GridComparatorFn<FixedNumber> = (v1, v2) => (v1.subUnsafe(v2).isNegative() ? -1 : 1);
const sortCollateralLocked: GridComparatorFn<[FixedNumber, string]> = (v1, v2) =>
  v1[0].subUnsafe(v2[0]).isNegative() ? -1 : 1;

const columns: GridColDef[] = [
  { field: 'asset', renderHeader: tableHeaderCell, headerName: 'Asset', align: 'left', minWidth: 100 },
  { field: 'id', renderHeader: tableHeaderCell, headerName: 'Vault ID', align: 'right', headerAlign: 'right', minWidth: 100 },
  {
    field: 'collateralizationRatio',
    headerName: 'Collateralization Ratio',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    renderHeader: tableHeaderCell,
    valueFormatter: ({ value }) => `${value} %`,
    sortComparator: sortFixedNumber,
  },
  {
    field: 'collateralLocked',
    headerAlign: 'right',
    headerName: 'Collateral Locked',
    align: 'right',
    valueFormatter: (params: GridValueFormatterParams<[FixedNumber, string]>) => `${params.value[0]} ${params.value[1]}`,
    flex: 1,
    renderHeader: tableHeaderCell,
    sortComparator: sortCollateralLocked,
    minWidth: 100,
  },
  {
    field: 'daiDebt',
    headerName: 'Dai Debt',
    align: 'right',
    headerAlign: 'right',
    flex: 1,
    renderHeader: tableHeaderCell,
    valueFormatter: ({ value }) => `${value} DAI`,
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
        <Button variant="contained">Manage Vault</Button>
      </Link>
    ),
  },
];

const VaultTable: FC<{ cdps: CDP[] }> = ({ cdps }) => {
  const rows = useMemo(() => cdps.map((cdp) => toRow(cdp)), [cdps]);
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
