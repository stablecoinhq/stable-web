/**
 * Do **NOT** use `account.address` as dependency of React hook.
 * Changing `chainId` **ALSO** requires to re-create contract instances.
 */
type EthereumAccount = {
  chainId: string;
  address: string;
};

export default EthereumAccount;
