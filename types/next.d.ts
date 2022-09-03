import type { MetaMaskInpageProvider } from '@metamask/providers';
import type { NextPage } from 'next';
import type { EthereumAccount } from 'pages/ethereum/useAccount';

export type WithEthereum = {
  ethereum: MetaMaskInpageProvider;
  account: EthereumAccount;
};
export type WithNullableEthereum = {
  [K in keyof WithEthereum]: WithEthereum[K] | null;
};

declare module 'next' {
  export type NextPageWithEthereum<P = {}, IP = P> = NextPage<P & WithEthereum, IP>;
}
