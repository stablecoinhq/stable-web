// eslint-disable-next-line unused-imports/no-unused-imports
import * as _ from '@metamask/providers';

declare module '@metamask/providers' {
  abstract class BaseProvider {
    request(args: { method: 'eth_chainId' }): Promise<string>;
    request(args: { method: 'eth_accounts' }): Promise<string[]>;
    request(args: { method: 'eth_requestAccounts' }): Promise<string[]>;
    request(args: { method: 'wallet_switchEthereumChain'; params: [{ chainId: string }] }): Promise<null>;
  }

  class MetaMaskInpageProvider {
    on(eventName: 'accountsChanged', listener: (accounts: string[]) => void): this;
    on(eventName: 'chainChanged', listener: (chainId: string) => void): this;

    removeListener(eventName: 'accountsChanged', listener: (accounts: string[]) => void): this;
    removeListener(eventName: 'chainChanged', listener: (chainId: string) => void): this;
  }
}
