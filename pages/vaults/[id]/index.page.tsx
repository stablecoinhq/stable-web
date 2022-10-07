import { ethers } from 'ethers';
import { useRouter } from 'next/router';

import VaultManipulator from '../VaultManager';

import type { NextPageWithEthereum } from 'next';

const VaultDetail: NextPageWithEthereum = ({ ethereum, account }) => {
  const router = useRouter();
  const { id } = router.query;
  const cdpId = ethers.BigNumber.from(id);

  return <VaultManipulator ethereum={ethereum} account={account} cdpId={cdpId} />;
};

export default VaultDetail;
