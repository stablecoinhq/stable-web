import { ethers } from "ethers";
import { Jug__factory } from "generated/types/factories/Jug__factory";
import { Jug } from "generated/types/Jug";

export default class JugHelper {
    private readonly provider: ethers.Signer;
    private readonly contract: Jug;

    constructor(provider: ethers.Signer, address: string) {
        this.provider = provider;
        this.contract = Jug__factory.connect(address, provider);
    }

    stabilityFee(ilkBytes32: string) {
        return Promise.all([this.contract.base(), this.contract.ilks(ilkBytes32)])
            .then(([base, { duty }]) => base.add(duty));
    }
}