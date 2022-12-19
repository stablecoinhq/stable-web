/* eslint-disable @typescript-eslint/naming-convention */
import { Box, createTheme, ThemeProvider } from '@mui/material';
import { appWithTranslation } from 'next-i18next';
import { useMemo, useState } from 'react';
import { SWRConfig } from 'swr/_internal';

import { UnsupportedNetworkError } from 'ethereum/contracts/ChainLogHelper';
import { InvalidGemAddress } from 'ethereum/contracts/ERC20Helper';
import useEthereumProvider from 'ethereum/react/useEthereumProvider';
import { ErrorDialogProvider, useErrorDialog } from 'store/ErrorDialogProvider';
import { NumericDisplayProvider } from 'store/NumericDisplayProvider';
import 'styles/globals.scss';

import nextI18NextConfig from '../next-i18next.config';

import Header from './Header';
import UnsupportedNetwork from './UnsupportedNetwork';
import WithoutEthereum from './WithoutEthereum';

import type { AppProps } from 'next/app';
import type { FC } from 'react';
import type { WithEthereum } from 'types/next';

const RenderWithEthereum: FC<WithEthereum & AppProps> = ({ externalProvider, provider, Component, pageProps }) => (
  <Box padding={4}>
    {/* eslint-disable-next-line react/jsx-props-no-spreading */}
    <Component externalProvider={externalProvider} provider={provider} {...pageProps} />
  </Box>
);

const Content: FC<{ appProps: AppProps }> = ({ appProps }) => {
  const [external, provider] = useEthereumProvider();
  const [displayUnsupportedNetwork, setDisplayUnsupportedNetwork] = useState(false);
  const { openDialog } = useErrorDialog();
  const content = useMemo(() => {
    if (external && displayUnsupportedNetwork) {
      return <UnsupportedNetwork externalProvider={external} onChange={() => setDisplayUnsupportedNetwork(false)} />;
    }
    if (external && provider) {
      // eslint-disable-next-line react/jsx-props-no-spreading
      return <RenderWithEthereum externalProvider={external} provider={provider} {...appProps} />;
    }
    return <WithoutEthereum externalProvider={external} provider={provider} />;
  }, [appProps, displayUnsupportedNetwork, external, provider]);

  return (
    <SWRConfig
      value={{
        onError: (err: Error) => {
          // これは別の方法で処理する
          if (err === InvalidGemAddress) {
            return;
          }
          if (err === UnsupportedNetworkError && !displayUnsupportedNetwork) {
            setDisplayUnsupportedNetwork(true);
          } else {
            openDialog(err.toString());
          }
        },
      }}
    >
      <Header externalProvider={external} provider={provider} />
      {content}
    </SWRConfig>
  );
};

const MyApp = (appProps: AppProps) => {
  const theme = createTheme({
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            color: 'inherit',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          notchedOutline: {
            borderColor: 'inherit !important',
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: {
            color: 'inherit',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <ErrorDialogProvider>
        <NumericDisplayProvider>
          <Content appProps={appProps} />
        </NumericDisplayProvider>
      </ErrorDialogProvider>
    </ThemeProvider>
  );
};

export default appWithTranslation(MyApp, nextI18NextConfig);
