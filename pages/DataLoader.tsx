/* eslint-disable i18next/no-literal-string */
import { Box, CircularProgress } from '@mui/material';

import { UnsupportedNetworkError } from 'ethereum/contracts/ChainLogHelper';
import useEthereumProvider from 'ethereum/react/useEthereumProvider';

import UnsupportedNetwork from './UnsupportedNetwork';

import type { FC, ReactNode } from 'react';
import type { SWRResponse } from 'swr';

type DataLoaderProps = {
  res: SWRResponse<any | undefined, Error>[];
  children: NonNullable<ReactNode>;
};

const DataLoader: FC<DataLoaderProps> = ({ res, children }) => {
  const isLoading = res.find((v) => v.isLoading || !v.data);
  const [externalProvider] = useEthereumProvider();

  const isUnsupportedNetwork = res.find((v) => v.error === UnsupportedNetworkError);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (isUnsupportedNetwork && externalProvider) {
    return <UnsupportedNetwork externalProvider={externalProvider} />;
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
};

export default DataLoader;
