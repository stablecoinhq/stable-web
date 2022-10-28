/* eslint-disable @typescript-eslint/naming-convention */
import { Box, createTheme, ThemeProvider } from '@mui/material';

import 'styles/globals.scss';

import Header from './Header';
import WithoutEthereum from './WithoutEthereum';
import useEthereumProvider from './ethereum/useEthereumProvider';

import type { AppProps } from 'next/app';

const MyApp = ({ Component, pageProps }: AppProps) => {
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
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <Header externalProvider={external} provider={provider} />
      {external && provider ? (
        <Box padding={4}>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <Component external={external} provider={provider} {...pageProps} />
        </Box>
      ) : (
        <WithoutEthereum externalProvider={external} provider={provider} />
      )}
    </ThemeProvider>
  );
};

export default MyApp;
