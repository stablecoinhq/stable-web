import VaultManipulator from '../VaultManager';

import type { NextPageWithEthereum } from 'next';

const OpenVault: NextPageWithEthereum = ({ ethereum, account }) => <VaultManipulator ethereum={ethereum} account={account} />;

export default OpenVault;
