import { useCallback } from 'react';

import useAccount from './ethereum/useAccount';
import useEthereum from './ethereum/useEthereum';

import type { MetaMaskInpageProvider } from '@metamask/providers';
import type { NextPage } from 'next';
import type { FC } from 'react';

type WithEthereum = {
  ethereum: MetaMaskInpageProvider;
};

const ConnectMetaMaskButton: FC<WithEthereum> = ({ ethereum }) => {
  const connect = useCallback(() => {
    void ethereum.request({ method: 'eth_requestAccounts' });
  }, [ethereum]);

  return (
    <button type="button" onClick={connect}>
      Connect MetaMask
    </button>
  );
};

const Account: FC<WithEthereum> = ({ ethereum }) => {
  const account = useAccount(ethereum);

  if (!account) {
    return (
      <p>
        MetaMask not connected!
        <br />
        <ConnectMetaMaskButton ethereum={ethereum} />
      </p>
    );
  }

  return (
    <p>
      Confirmed existence of MetaMask!
      <br />
      ChainID: {account.chainId}
      <br />
      Address: {account.address}
      <br />
    </p>
  );
};

const Home: NextPage = () => {
  const ethereum = useEthereum();

  if (!ethereum) {
    return <p>MetaMask not installed!</p>;
  }

  return <Account ethereum={ethereum} />;
};

export default Home;
