import { DssProxyActions__factory, DssProxyActions, DSProxy, DSProxy__factory } from 'generated/types';
import type { Provider } from '@ethersproject/providers';

export default class ProxyActionsHelper {
    private readonly provider;
    private readonly proxy: DSProxy;
    private readonly actions: DssProxyActions;

    constructor(provider: Provider, proxy: string, actions: string);
    constructor(provider: Provider, proxy: DSProxy, actions: string);
    constructor(provider: Provider, proxy: DSProxy | string, actions: string) {
        this.provider = provider;
        if (typeof proxy === 'string') {
            this.proxy = DSProxy__factory.connect(proxy, provider);
        } else {
            this.proxy = proxy;
        }
        this.actions = DssProxyActions__factory.connect(actions, provider);
    }

    async open(cdpManager: string, ilk: string) {
        const tx = await this.proxy['execute(address,bytes)'](this.actions.address, this.actions.interface.encodeFunctionData("open", [cdpManager, ilk, this.proxy.address]));
        console.log(tx);
    }
}
