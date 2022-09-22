import { formatBytes32String } from '@ethersproject/strings';

import { DssProxyActions__factory, DSProxy__factory } from 'generated/types';

import type { ethers } from 'ethers';
import type { DssProxyActions, DSProxy } from 'generated/types';

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

  open(cdpManager: string, ilk: string) {
    return this.proxy['execute(address,bytes)'](
      this.actions.address,
      this.actions.interface.encodeFunctionData('open', [cdpManager, formatBytes32String(ilk), this.proxy.address]),
    );
  }
}
