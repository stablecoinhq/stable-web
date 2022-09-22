import { parseBytes32String } from '@ethersproject/strings';
import { Button, TextField, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import { useChainLog, useDSProxy, useProxyRegistry } from 'pages/ethereum/ContractHooks';

import type { EthereumAccount } from 'pages/ethereum/useAccount';
import type { FC } from 'react';

export type VaultManipulatorProps = {
  ethereum: ethers.Signer;
  account: EthereumAccount;
  ilk: string; // collateral name as a bytes32 string
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Art: ethers.BigNumber; // total normalized debt for the vault type
  rate: ethers.BigNumber; // fee rate per second
  spot: ethers.BigNumber; // price with safety mergin i.e. collateralization ratio
  line: ethers.BigNumber; // max supply for the vault type
  dust: ethers.BigNumber; // minimum mintable value
  cdpId?: ethers.BigNumber; // eslint-disable-line react/require-default-props
};

const ETH_PREFIX = '0x455448';

// eslint-disable-next-line @typescript-eslint/naming-convention
const VaultManipulator: FC<VaultManipulatorProps> = ({ ethereum, account, ilk, Art, rate, spot, line, dust, cdpId }) => {
  const chainLog = useChainLog(ethereum);
  const registry = useProxyRegistry(chainLog);
  const proxy = useDSProxy(registry, account);

  // collateral to lock
  const [gem, setGem] = useState('');
  // collateralization ratio
  const [cr, setCr] = useState('');
  const [dart, setDart] = useState(ethers.constants.Zero);

  useEffect(() => {
    try {
      setDart(ethers.utils.parseUnits(gem, 18).mul(spot).mul(100).div(rate).div(parseInt(cr, 10)));
    } catch (e) {
      setDart(ethers.constants.Zero);
    }
  }, [gem, cr, rate, spot]);

  const mint = async () => {
    const amtGem = (() => {
      try {
        return ethers.utils.parseUnits(gem, 18);
      } catch (e) {
        return ethers.constants.Zero;
      }
    })();
    if (proxy && !dart.isZero() && !amtGem.isZero()) {
      const actions = await chainLog.bindActions(proxy);
      // bytes32 form of ETH-A,MATIC-A,... into ETH_A,MATIC_A,...
      const ilkType = parseBytes32String(ilk).replace('-', '_');
      const [cdpMan, jug, gemJoin, daiJoin] = await Promise.all(
        ['CDP_MANAGER', 'MCD_JUG', `MCD_JOIN_${ilkType}`, 'MCD_JOIN_DAI'].map((key) =>
          chainLog.getAddress(key as Parameters<typeof chainLog.getAddress>[0]),
        ),
      );

      const isValidAddr = (addr: string | undefined) => addr && addr !== ethers.constants.AddressZero;

      if (isValidAddr(cdpMan) && isValidAddr(jug) && isValidAddr(gemJoin) && isValidAddr(daiJoin)) {
        if (dart.mul(rate) < dust || line < Art.mul(rate).add(dart)) {
          // TODO -- error handling
          console.error('invalid condition');
        } else {
          const isEth = ilk.startsWith(ETH_PREFIX);
          if (cdpId === undefined) {
            if (isEth) {
              await actions.openLockEthAndDraw(cdpMan!, jug!, gemJoin!, daiJoin!, ilk, amtGem, dart);
            } else {
              await actions.openLockGemAndDraw(cdpMan!, jug!, gemJoin!, daiJoin!, ilk, amtGem, dart, true);
            }
          } else if (isEth) {
            await actions.lockETHAndDraw(cdpMan!, jug!, gemJoin!, daiJoin!, cdpId, amtGem, dart);
          } else {
            await actions.lockGemAndDraw(cdpMan!, jug!, gemJoin!, daiJoin!, cdpId, amtGem, dart, true);
          }
        }
      }
    }
  };

  return (
    <Box>
      <TextField
        id="collateral-amount-input"
        label={`${parseBytes32String(ilk).split('-')[0]} to lock`}
        fullWidth
        value={gem}
        onChange={(e) => setGem(e.target.value)}
      />
      <TextField
        id="collateralization-ratio-input"
        label="Collateraliztion-ratio"
        fullWidth
        value={cr}
        onChange={(e) => setCr(e.target.value)}
      />
      <Typography variant="inherit" component="div">
        {dart.mul(rate).toString()}
      </Typography>
      <Typography variant="inherit" component="div">
        {dust.toString()}
      </Typography>
      <Button fullWidth onClick={mint}>
        mint
      </Button>
    </Box>
  );
};

export default VaultManipulator;
