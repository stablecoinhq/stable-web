import { ethers } from 'ethers';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { useChainLog } from 'pages/ethereum/ContractHooks';

import VaultManipulator from './VaultManipulator';

import type { VaultManipulatorProps } from './VaultManipulator';
import type { NextPageWithEthereum } from 'next';

const VaultDetail: NextPageWithEthereum = ({ ethereum, account }) => {
  const router = useRouter();
  const { id } = router.query;
  const cdpId = ethers.BigNumber.from(id);
  const chainlog = useChainLog(ethereum.getSigner());
  const [props, setProps] = useState<VaultManipulatorProps | null>(null);

  useEffect(() => {
    (async () => {
      const [cdpMan, vat] = await Promise.all([chainlog.dssCDPManager(), chainlog.vat()]);
      const ilk = await cdpMan.ilks(cdpId);
      const { Art, rate, spot, line, dust } = await vat.ilks(ilk);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      setProps({ ilk, Art, rate, spot, line, dust, ethereum: ethereum.getSigner(), account, cdpId });
    })();
  });

  // eslint-disable-next-line react/jsx-props-no-spreading
  return props ? <VaultManipulator {...props} /> : <div>empty</div>;
};

export default VaultDetail;
