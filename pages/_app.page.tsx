/* eslint-disable @typescript-eslint/naming-convention */
import { Box, createTheme, ThemeProvider } from '@mui/material';
import { appWithTranslation } from 'next-i18next';
import { useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import useEthereumProvider from 'ethereum/react/useEthereumProvider';
import { NumericDisplayProvider } from 'store/NumericDisplayProvider';
import 'styles/globals.scss';

import nextI18NextConfig from '../next-i18next.config';

import Header from './Header';
import UnsupportedNetwork, { propagateError } from './UnsupportedNetwork';
import WithoutEthereum from './WithoutEthereum';

import type { AppProps } from 'next/app';
import type { FC } from 'react';
import type { FallbackProps } from 'react-error-boundary';
import type { WithEthereum } from 'types/next';

const RenderWithEthereum: FC<WithEthereum & AppProps> = ({ externalProvider, provider, Component, pageProps }) => {
  const renderUnsupportedNetwork = useCallback(
    (props: FallbackProps) => (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <UnsupportedNetwork externalProvider={externalProvider} {...props} />
    ),
    [externalProvider],
  );

  /**
   * Since using `handleError` as an error handler of async functions,
   * sometimes `handleError` will be called after a fallback component rendered.
   * To prevent unexpected crash, we have to filter errors which should have already been fallen back.
   */
  const onError = useCallback((err: Error) => {
    propagateError(err);
  }, []);

  return (
    <Box padding={4}>
      <ErrorBoundary fallbackRender={renderUnsupportedNetwork} onError={onError} resetKeys={[provider]}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Component externalProvider={externalProvider} provider={provider} {...pageProps} />
      </ErrorBoundary>
    </Box>
  );
};

const MyApp = (appProps: AppProps) => {
  const [external, provider] = useEthereumProvider();

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
      <NumericDisplayProvider>
        <Header externalProvider={external} provider={provider} />
        {external && provider ? (
          // eslint-disable-next-line react/jsx-props-no-spreading
          <RenderWithEthereum externalProvider={external} provider={provider} {...appProps} />
        ) : (
          <WithoutEthereum externalProvider={external} provider={provider} />
        )}
      </NumericDisplayProvider>
    </ThemeProvider>
  );
};

export default appWithTranslation(MyApp, nextI18NextConfig);
