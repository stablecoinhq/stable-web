import { Box } from '@mui/material';

import type { NextPageWithEthereum } from 'next';

const Home: NextPageWithEthereum = ({ account }) => (
  <Box display="flex" minHeight="calc(100vh - 64px)" justifyContent="center" alignItems="center">
    <p>
      MetaMask is correctly connected.
      <br />
      Network: <code>{account.chainId}</code>
      <br />
      Address: <code>{account.address}</code>
    </p>
  </Box>
);

export default Home;
