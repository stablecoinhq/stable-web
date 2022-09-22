import { formatBytes32String } from "@ethersproject/strings";
import { ethers } from "ethers";
import { NextPageWithEthereum } from "next";
import { useRouter } from "next/router";
import { useChainLog, useDSProxy, useProxyRegistry } from "pages/ethereum/ContractHooks";
import { useEffect, useState } from "react";
import VaultManipulator, { VaultManipulatorProps } from "./VaultManipulator";

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
            setProps({ ilk, Art, rate, spot, line, dust, ethereum: ethereum.getSigner(), account, cdpId });
        })()
    }, [])

    return (
        props ? <VaultManipulator {...props} /> : <div>empty</div>
    )
}

export default VaultDetail;