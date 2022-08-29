import MetaMaskButton from './ethereum/MetaMaskButton';
import useAccount from './ethereum/useAccount';
import useEthereum from './ethereum/useEthereum';

import type { NextPage } from 'next';

const Home: NextPage = () => {
  const ethereum = useEthereum();
  const account = useAccount(ethereum);

  return <MetaMaskButton ethereum={ethereum} account={account} />;
};

export default Home;
