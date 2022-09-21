import { DssProxyActions__factory, DssProxyActions, DSProxy, DSProxy__factory } from 'generated/types';
import type { Provider } from '@ethersproject/providers';
import { formatBytes32String } from '@ethersproject/strings';
import { ethers } from 'ethers';

export default class ProxyActionsHelper {
    private readonly proxy: DSProxy;
    private readonly actions: DssProxyActions;

    constructor(provider: ethers.Signer, proxy: string, actions: string);
    constructor(provider: ethers.Signer, proxy: DSProxy, actions: string);
    constructor(provider: ethers.Signer, proxy: DSProxy | string, actions: string) {
        if (typeof proxy === 'string') {
            this.proxy = DSProxy__factory.connect(proxy, provider);
        } else {
            this.proxy = proxy;
        }
        this.actions = DssProxyActions__factory.connect(actions, provider);
    }

    async open(cdpManager: string, ilk: string) {
        const tx = await this.proxy['execute(address,bytes)'](
            this.actions.address,
            this.actions.interface.encodeFunctionData("open", [cdpManager, formatBytes32String(ilk), this.proxy.address]),
        );
        console.log(tx);
    }
}
