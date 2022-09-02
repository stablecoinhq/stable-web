import { createTheme, ThemeProvider } from '@mui/material';

import 'styles/globals.scss';

import Header from './Header';
import WithoutEthereum from './WithoutEthereum';
import useAccount from './ethereum/useAccount';
import useEthereum from './ethereum/useEthereum';

import type { AppProps } from 'next/app';

const MyApp = ({ Component, pageProps }: AppProps) => {
  const ethereum = useEthereum();
  const account = useAccount(ethereum);

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
      <Header ethereum={ethereum} account={account} />
      {ethereum && account ? (
        /* eslint-disable-next-line react/jsx-props-no-spreading */
        <Component ethereum={ethereum} account={account} {...pageProps} />
      ) : (
        <WithoutEthereum ethereum={ethereum} account={account} />
      )}
    </ThemeProvider>
  );
};

export default MyApp;
