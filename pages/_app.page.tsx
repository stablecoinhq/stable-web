import { createTheme, ThemeProvider } from '@mui/material';

import 'styles/globals.scss';

import type { AppProps } from 'next/app';

const MyApp = ({ Component, pageProps }: AppProps) => {
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
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Component {...pageProps} />
    </ThemeProvider>
  );
};

export default MyApp;
