import type { ethers } from 'ethers';
import type { NextPage } from 'next';
import type { EthereumAccount } from 'pages/ethereum/useAccount';

export type WithEthereum = {
  ethereum: ethers.providers.Web3Provider;
  account: EthereumAccount;
};
export type WithNullableEthereum = {
  [K in keyof WithEthereum]: WithEthereum[K] | null;
};

declare module 'next' {
  export type NextPageWithEthereum<P = {}, IP = P> = NextPage<P & WithEthereum, IP>;
}
