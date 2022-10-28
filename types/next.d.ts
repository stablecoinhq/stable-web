import type { ExternalProvider } from '@ethersproject/providers';
import type EthereumProvider from 'contracts/EthereumProvider';
import type { NextPage } from 'next';

export type WithEthereum = {
  externalProvider: ExternalProvider;
  provider: EthereumProvider;
};
export type WithNullableEthereum = {
  [K in keyof WithEthereum]: WithEthereum[K] | null;
};

declare module 'next' {
  export type NextPageWithEthereum<P = {}, IP = P> = NextPage<P & WithEthereum, IP>;
}
