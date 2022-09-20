import { IlkRegistry, IlkRegistry__factory } from "generated/types";
import { Provider } from "@ethersproject/providers";

export default class IlkRegistryHelper {
    private provider: Provider;
    private contracts: IlkRegistry;

    constructor(provider: Provider, address: string) {
        this.provider = provider;
        this.contracts = IlkRegistry__factory.connect(address, provider);
    }

    list() {
        return this.contracts["list()"];
    }
}
