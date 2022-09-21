import { IlkRegistry, IlkRegistry__factory } from "generated/types";
import { Provider } from "@ethersproject/providers";
import { ethers } from "ethers";

export default class IlkRegistryHelper {
    private provider: ethers.Signer;
    private contracts: IlkRegistry;

    constructor(provider: ethers.Signer, address: string) {
        this.provider = provider;
        this.contracts = IlkRegistry__factory.connect(address, provider);
    }

    list() {
        return this.contracts["list()"];
    }
}
