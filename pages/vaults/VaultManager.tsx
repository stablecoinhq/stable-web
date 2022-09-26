import { parseBytes32String, formatBytes32String } from '@ethersproject/strings';
import {
  Button,
  CardContent,
  Modal,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from '@mui/material';
import { Box } from '@mui/system';
import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';

import { useChainLog, useDSProxy, useProxyRegistry, useVat } from 'pages/ethereum/ContractHooks';
import usePromiseFactory from 'pages/usePromiseFactory';

import type ChainLogHelper from 'contracts/ChainLogHelper';
import type { Vat } from 'generated/types';
import type { EthereumAccount } from 'pages/ethereum/useAccount';
import type { FC } from 'react';

export type VaultManagerProps = {
  ethereum: ethers.Signer;
  account: EthereumAccount;
  cdpId?: ethers.BigNumber; // eslint-disable-line react/require-default-props
};

type Ilk = {
  bytes32: string; // collateral name as a bytes32 string
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Art: ethers.BigNumber; // total normalized debt for the vault type  [wad 10 ** 18]
  rate: ethers.BigNumber; // accumulated fee per second  [ray, 10 ** 27]
  spot: ethers.BigNumber; // price with safety mergin i.e. collateralization ratio [ray 10 ** 27]
  line: ethers.BigNumber; // max supply for the vault type  [rad 10 ** 45]
  dust: ethers.BigNumber; // minimum mintable value [rad 10 ** 45]
  liquidationRatio: ethers.BigNumber; // minimum collateralization ratio(mat) [ray 10 ** 27]
};

// vault status
type Urn = {
  gem: ethers.BigNumber; // free collateral [wad 10 ** 18]
  ink: ethers.BigNumber; // locked collateral [wad 10 ** 18]
  art: ethers.BigNumber; // normalized debt [wad 10 ** 18]
};

const ETH_PREFIX = '0x455448';
const ONE_YEAR = 60 * 60 * 24 * 365;
const WAD_DECIMAL = 18;
const RAY_DECIMAL = 27;
const RAD_DECIMAL = 45;

const RAY = ethers.utils.parseUnits('1', RAY_DECIMAL);

/**
 * to avoid rounding ethers.BigNumber
 * @param value
 * @param unit should be positive. assuming one of WAD_DECIMAL, RAY_DECIMAL, RAD_DECIMAL.
 */
const divString = (value: string, unit: number) =>
  value.length < unit ? `0.${value.padStart(unit - 1)}` : `${value.slice(0, -1 * unit)}.${value.slice(-1 * unit)}`;

/**
 * calculate ethers.BigNumber's pow (i.e. base_ ** exponent_) in log time. the default implementation is too expensive.
 * @param base_
 * @param exponent_
 * @param unit assuming one of WAD, RAY, RAD.
 */
const logtimePow = (base_: ethers.BigNumber, exponent_: number, unit: ethers.BigNumber) => {
  let result = unit;
  let base = base_;
  let exponent = exponent_;

  while (exponent > 0) {
    // eslint-disable-next-line no-bitwise
    if (exponent & 1) {
      result = result.mul(base).div(unit);
    }

    base = base.mul(base).div(unit);
    exponent >>= 1; // eslint-disable-line no-bitwise
  }

  return result;
};

const isValidAddr = (addr: string | undefined) => addr && addr !== ethers.constants.AddressZero;

/** ETH-A, MATIC-B, ... => ETH, MATIC, ... */
const getBaseCollateralName = (ilkBytes32: string) => parseBytes32String(ilkBytes32).split('-')[0];

type VaultManipulatorCommonProps = {
  ethereum: ethers.Signer; // eslint-disable-line react/no-unused-prop-types
  account: EthereumAccount;
  chainlog: ChainLogHelper;
  vat: Vat; // eslint-disable-line react/no-unused-prop-types
  ilk: Ilk;
};

type ApproveTokenModalProps = { spender: string; value: ethers.BigNumber; open: boolean; onClose: () => void };

/**
 * display what we will do in the approval transaction when it is needed.
 */
const ApproveTokenModal: FC<ApproveTokenModalProps> = ({ spender, value, open, onClose }) => (
  <Modal open={open} onClose={onClose}>
    <Typography variant="body1">{`to complete the transaction, need to approve ${value} for ${spender}`}</Typography>
  </Modal>
);

/**
 * TODO
 * - consider dai and gem for both internal and external(minted),
 * - consider WETH for ETH pattern
 * - show a status before the execution and after do it. (collateraliztion ratio, vault status, ...)
 * - handle errors and emit some notification
 * - handle loading components
 * - display more intuitive parameters
 */
// eslint-disable-next-line react/require-default-props,react/no-unused-prop-types
const MintManipulator: FC<VaultManipulatorCommonProps & { cdpId?: ethers.BigNumber; urn?: Urn }> = ({
  ethereum,
  account,
  chainlog,
  ilk,
  cdpId,
}) => {
  const isEth = ilk.bytes32.startsWith(ETH_PREFIX);

  const registry = useProxyRegistry(chainlog);
  const proxy = useDSProxy(registry, account);
  // consider this code will work well
  const gemContract = usePromiseFactory(
    useCallback(
      () => chainlog.erc20(formatBytes32String(parseBytes32String(ilk.bytes32).split('-')[0]!)),
      [chainlog, ilk.bytes32],
    ),
  );
  const gemStatus = usePromiseFactory(
    useCallback(
      async () =>
        gemContract
          ? Promise.all([gemContract.balanceOf(account.address), gemContract.decimals()]).then(([balance, decimal]) => ({
              balance,
              decimal,
            }))
          : Promise.resolve({ balance: ethers.constants.Zero, decimal: 18 }),
      [gemContract, account.address],
    ),
  );
  const ethBalance = usePromiseFactory(useCallback(() => ethereum.getBalance(), [ethereum]));

  // collateral to lock
  const [gem, setGem] = useState('0');
  const gemAmount = (() => {
    if (gemStatus) {
      try {
        return ethers.utils.parseUnits(gem, gemStatus.decimal);
      } catch (e) {
        return ethers.constants.Zero;
      }
    } else {
      return ethers.constants.Zero;
    }
  })();
  const existsEnoughGem = (() => {
    try {
      if (isEth && ethBalance) {
        return !!gemStatus?.balance?.add(ethBalance).gte(gemAmount);
      }
      return !!gemStatus?.balance?.gte(gemAmount);
    } catch (e) {
      return true;
    }
  })();
  // collateralization ratio
  const [cr, setCr] = useState('150');
  const dart = (() => {
    try {
      return gemAmount.mul(ilk.spot).mul(100).div(ilk.rate).div(parseInt(cr, 10));
    } catch (e) {
      return ethers.constants.Zero;
    }
  })();

  const [approveWindow, setApproveWindow] = useState({
    open: false,
    value: ethers.constants.Zero,
    spender: ethers.constants.AddressZero,
  });
  const close = () => setApproveWindow({ ...approveWindow, open: false });

  const mint = async () => {
    if (proxy && gemContract && !dart.isZero() && !gemAmount.isZero() && !gemAmount.isNegative() && existsEnoughGem) {
      const actions = await chainlog.bindActions(proxy);
      // bytes32 form of ETH-A,MATIC-A,... into ETH_A,MATIC_A,...
      const ilkType = parseBytes32String(ilk.bytes32).replace('-', '_');
      const [cdpMan, jug, gemJoin, daiJoin] = await Promise.all(
        ['CDP_MANAGER', 'MCD_JUG', `MCD_JOIN_${ilkType}`, 'MCD_JOIN_DAI'].map((key) => chainlog.getAddressFromKey(key)),
      );

      if (isValidAddr(cdpMan) && isValidAddr(jug) && isValidAddr(gemJoin) && isValidAddr(daiJoin)) {
        if (
          gemAmount.mul(ilk.spot).lt(dart) ||
          dart.mul(ilk.rate).lt(ilk.dust) ||
          ilk.line.lt(ilk.Art.add(dart).mul(ilk.rate))
        ) {
          /**
           * invalid condition
           * need to handle error
           */
        } else {
          const checkAllowance = gemContract
            .allowance(account.address, proxy.address)
            .then((allowance) => {
              if (allowance.lt(gemAmount)) {
                const value = gemAmount.sub(allowance);
                setApproveWindow({
                  open: true,
                  spender: proxy.address,
                  value,
                });
                return gemContract.approve(proxy.address, value);
              }

              return Promise.resolve(undefined);
            })
            .catch(() => Promise.reject(close()));

          if (cdpId === undefined) {
            if (isEth) {
              await actions.openLockEthAndDraw(cdpMan!, jug!, gemJoin!, daiJoin!, ilk.bytes32, gemAmount, dart);
            } else {
              await checkAllowance.then(() =>
                actions.openLockGemAndDraw(cdpMan!, jug!, gemJoin!, daiJoin!, ilk.bytes32, gemAmount, dart, true),
              );
            }
          } else if (isEth) {
            await actions.lockETHAndDraw(cdpMan!, jug!, gemJoin!, daiJoin!, cdpId, gemAmount, dart);
          } else {
            await checkAllowance.then(() =>
              actions.lockGemAndDraw(cdpMan!, jug!, gemJoin!, daiJoin!, cdpId, gemAmount, dart, true),
            );
          }
        }
      }
    }
  };

  return (
    <Box>
      <TextField
        id="collateral-amount-input"
        label={`${getBaseCollateralName(ilk.bytes32)} to lock`}
        fullWidth
        error={
          !gemAmount.isZero() &&
          (!existsEnoughGem ||
            gemAmount.mul(ilk.spot).lt(dart) ||
            gemAmount.isNegative() ||
            dart.mul(ilk.rate).lt(ilk.dust) ||
            ilk.line.lt(ilk.Art.mul(ilk.rate).add(dart)))
        }
        value={gem}
        onChange={(e) => setGem(e.target.value)}
        helperText={
          !existsEnoughGem //eslint-disable-line
            ? 'Not Enough Balance'
            : gemAmount.isNegative() //eslint-disable-line
            ? 'Negative Amount'
            : gemAmount.mul(ilk.spot).lt(dart) //eslint-disable-line
            ? 'Not Enough Collateralized'
            : dart.mul(ilk.rate).lt(ilk.dust) //eslint-disable-line
            ? 'Less Than Mintable Floor'
            : ilk.line.lt(ilk.Art.add(dart).mul(ilk.rate))
            ? 'Over The Collateral Line'
            : ''
        }
      />
      <TextField
        id="collateralization-ratio-input"
        label="Collateraliztion-ratio"
        fullWidth
        value={cr}
        onChange={(e) => setCr(e.target.value)}
      />
      <Typography variant="inherit" component="div">
        {divString(dart.mul(ilk.rate).toString(), RAD_DECIMAL)}
      </Typography>
      <Button fullWidth onClick={mint}>
        mint
      </Button>
      <ApproveTokenModal
        spender={approveWindow.spender}
        value={approveWindow.value}
        open={approveWindow.open}
        onClose={close}
      />
    </Box>
  );
};

/**
 * TODO
 * - use wipeAllAndFreeGem if possible.
 * - show a status before the execution and after do it. (collateraliztion ratio, vault status, ...)
 * - handle errors and emit some notification
 * - handle loading components
 * - display more intuitive parameters
 */
const BurnManipulator: FC<VaultManipulatorCommonProps & { cdpId: ethers.BigNumber; urn: Urn }> = ({
  account,
  chainlog,
  ilk,
  cdpId,
  urn,
}) => {
  const isEth = ilk.bytes32.startsWith(ETH_PREFIX);

  const registry = useProxyRegistry(chainlog);
  const proxy = useDSProxy(registry, account);
  // consider this code will work well. to get the Token addr, need to remove a type specifier. (ETH-A, MATIC-A,... => ETH, MATIC,...)
  const gemContract = usePromiseFactory(
    useCallback(
      () => chainlog.erc20(formatBytes32String(parseBytes32String(ilk.bytes32).split('-')[0]!)),
      [chainlog, ilk.bytes32],
    ),
  );
  const gemDecimal = usePromiseFactory(useCallback(async () => gemContract?.decimals(), [gemContract]));
  const daiContract = usePromiseFactory(useCallback(() => chainlog.dai(), [chainlog]));
  const daiBalance = usePromiseFactory(
    useCallback(async () => daiContract?.balanceOf(account.address), [daiContract, account.address]),
  );

  // stable coin to burn
  const [dai, setDai] = useState('0');
  const daiAmount = (() => {
    try {
      return ethers.utils.parseUnits(dai, WAD_DECIMAL);
    } catch (_e) {
      return ethers.constants.Zero;
    }
  })();
  const existsEnoughDai = (() => {
    try {
      return !!daiBalance?.gte(daiAmount);
    } catch (e) {
      return true;
    }
  })();

  // withdrawable collateral amount (limit)
  const withdrawable = (() => {
    const insufficient = urn.art.sub(daiAmount.mul(ethers.utils.parseUnits('1', RAY_DECIMAL)).div(ilk.rate));
    if (insufficient.isZero() || insufficient.isNegative()) {
      return urn.ink;
    }
    const locked = insufficient.mul(ilk.rate).div(ilk.spot);
    return urn.ink.sub(locked);
  })();
  const [gem, setGem] = useState('0');
  const gemAmount = (() => {
    try {
      return ethers.utils.parseUnits(gem, gemDecimal);
    } catch (e) {
      return ethers.constants.Zero;
    }
  })();

  const [approveWindow, setApproveWindow] = useState({
    open: false,
    value: ethers.constants.Zero,
    spender: ethers.constants.AddressZero,
  });
  const close = () => setApproveWindow({ ...approveWindow, open: false });

  const burn = async () => {
    if (
      daiBalance !== undefined &&
      !daiAmount.isZero() &&
      !daiAmount.isNegative() &&
      !gemAmount.isZero() &&
      !gemAmount.isNegative() &&
      !withdrawable.lte(gemAmount)
    ) {
      if (proxy && daiContract && !gemAmount.isZero() && !gemAmount.isNegative()) {
        const actions = await chainlog.bindActions(proxy);
        // bytes32 form of ETH-A,MATIC-A,... into ETH_A,MATIC_A,...
        const ilkType = parseBytes32String(ilk.bytes32).replace('-', '_');
        const [cdpMan, gemJoin, daiJoin] = await Promise.all(
          ['CDP_MANAGER', `MCD_JOIN_${ilkType}`, 'MCD_JOIN_DAI'].map((key) => chainlog.getAddressFromKey(key)),
        );

        if (isValidAddr(cdpMan) && isValidAddr(gemJoin) && isValidAddr(daiJoin)) {
          await daiContract
            .allowance(account.address, proxy.address)
            .then((allowance) => {
              const value = daiAmount.sub(allowance);
              if (allowance.lt(daiAmount)) {
                setApproveWindow({
                  open: true,
                  spender: proxy.address,
                  value,
                });
                return daiContract.approve(proxy.address, value);
              }

              return Promise.resolve(undefined);
            })
            .catch((_e) => Promise.reject(close()))
            .then(() => {
              if (isEth) {
                return actions.wipeAndFreeEth(cdpMan!, gemJoin!, daiJoin!, cdpId, gemAmount, daiAmount);
              }
              return actions.wipeAndFreeGem(cdpMan!, gemJoin!, daiJoin!, cdpId, gemAmount, daiAmount);
            });
        }
      }
    }
  };

  return (
    <Box>
      <TextField
        id="dai-amount-input"
        label="Dai to redeem"
        fullWidth
        error={!daiAmount.isZero() && (!existsEnoughDai || daiAmount.isNegative())}
        value={dai}
        onChange={(e) => setDai(e.target.value)}
        helperText={!existsEnoughDai ? 'Not Enough Balance' : daiAmount.isNegative() ? 'Negative Amount' : ''} //eslint-disable-line
      />
      <TextField
        id="gem-amount-input"
        label={`${getBaseCollateralName(ilk.bytes32)} to free`}
        fullWidth
        error={!gemAmount.isZero() && (gemAmount.isNegative() || withdrawable.lte(gemAmount))}
        value={gem}
        onChange={(e) => setGem(e.target.value)}
        helperText={gemAmount.isNegative() ? 'Negative Amount' : withdrawable.lte(gemAmount) ? 'Not Enough Collateralized' : ''} //eslint-disable-line
      />
      <Typography variant="inherit">{withdrawable.toString()}</Typography>
      <Button fullWidth onClick={burn}>
        burn
      </Button>
      <ApproveTokenModal
        spender={approveWindow.spender}
        value={approveWindow.value}
        open={approveWindow.open}
        onClose={close}
      />
    </Box>
  );
};

/**
 * TODO
 * - handle loading status and errors
 */
const IlkStatusCard: FC<{ ilk: Ilk | null; chainlog: ChainLogHelper }> = ({ ilk, chainlog }) => {
  const stabilityFee = usePromiseFactory(
    useCallback(
      async () => (ilk ? chainlog.jug().then((jug) => jug.stabilityFee(ilk.bytes32)) : undefined),
      [chainlog, ilk?.bytes32, ilk], //eslint-disable-line
    ),
  );
  const [expanded, setExpanded] = useState(true);

  return (
    <Accordion expanded={expanded} onClick={() => setExpanded(!expanded)}>
      <AccordionSummary>Collateral Status</AccordionSummary>
      <AccordionDetails>
        {ilk ? (
          <CardContent>
            <Typography gutterBottom>{`Name: ${parseBytes32String(ilk.bytes32)}`}</Typography>
            <Typography gutterBottom>{`Total Issue: ${divString(ilk.Art.mul(ilk.rate).toString(), RAD_DECIMAL)}`}</Typography>
            <Typography gutterBottom>
              {`Annual fee: ${stabilityFee ? divString(logtimePow(stabilityFee, ONE_YEAR, RAY).toString(), RAY_DECIMAL) : ''}`}
            </Typography>
            <Typography gutterBottom>{`Liquidation ratio: ${divString(
              ilk.liquidationRatio.toString(),
              RAY_DECIMAL,
            )}`}</Typography>
            <Typography gutterBottom>{`Current price: ${divString(
              ilk.liquidationRatio.mul(ilk.spot).div(RAY).toString(),
              RAY_DECIMAL,
            )}`}</Typography>
            <Typography gutterBottom>{`Maximum liquidity: ${divString(ilk.line.toString(), RAD_DECIMAL)}`}</Typography>
            <Typography gutterBottom>{`Debt Floor: ${divString(ilk.dust.toString(), RAD_DECIMAL)}`}</Typography>
          </CardContent>
        ) : (
          <CircularProgress />
        )}
      </AccordionDetails>
    </Accordion>
  );
};

/**
 * TODO
 * - handle loading status and errors
 */
const UrnStatusCard: FC<{ urn: Urn | null } & { rate: ethers.BigNumber | undefined }> = ({ urn, rate }) => {
  const [expanded, setExpanded] = useState(true);
  return (
    <Accordion expanded={expanded} onClick={() => setExpanded(!expanded)}>
      <AccordionSummary>Vault Status</AccordionSummary>
      <AccordionDetails>
        {urn && rate ? (
          <CardContent>
            <Typography gutterBottom>{`Free collateral: ${divString(urn.gem.toString(), WAD_DECIMAL)}`}</Typography>
            <Typography gutterBottom>{`Locked collateral: ${divString(urn.ink.toString(), WAD_DECIMAL)}`}</Typography>
            <Typography gutterBottom>{`Debt: ${divString(urn.art.mul(rate).toString(), RAD_DECIMAL)}`}</Typography>
          </CardContent>
        ) : (
          <CircularProgress />
        )}
      </AccordionDetails>
    </Accordion>
  );
};

type VaultManagerCommonProps = { ethereum: ethers.Signer; account: EthereumAccount; chainlog: ChainLogHelper; vat: Vat };

/**
 * handle vaults already opend
 * TODO
 * - handle loading and errors
 */
const CdpVaultManager: FC<VaultManagerCommonProps & { cdpId: ethers.BigNumber }> = ({
  ethereum,
  account,
  chainlog,
  vat,
  cdpId,
}) => {
  const [selected, setSelected] = useState<'mint' | 'burn'>('mint');
  const cdpMan = usePromiseFactory(useCallback(() => chainlog.dssCDPManager(), [chainlog]));
  const [ilk, setIlk] = useState<Ilk | null>(null);
  const [urn, setUrn] = useState<Urn | null>(null);

  useEffect(() => {
    if (vat && cdpMan) {
      cdpMan.ilks(cdpId).then((ilkBytes32) =>
        Promise.all([
          Promise.all([vat.ilks(ilkBytes32), chainlog.spot().then((spot) => spot.ilks(ilkBytes32))]).then(
            (
              [{ Art, rate, spot, line, dust }, { mat }], //eslint-disable-line
            ) => setIlk({ bytes32: ilkBytes32, Art, rate, spot, line, dust, liquidationRatio: mat }), //eslint-disable-line
          ),
          cdpMan
            .urns(cdpId)
            .then((address) =>
              Promise.all([vat.urns(ilkBytes32, address), vat.gem(ilkBytes32, address)]).then(([{ ink, art }, gem]) =>
                setUrn({ gem, ink, art }),
              ),
            ),
        ]),
      );
    }
  }, [vat, cdpMan, cdpId, chainlog]);

  return (
    <Box>
      <IlkStatusCard ilk={ilk} chainlog={chainlog} />
      <UrnStatusCard urn={urn} rate={ilk?.rate} />
      <ToggleButtonGroup value={selected} exclusive fullWidth onChange={(e, selected_) => selected_ && setSelected(selected_)}>
        <ToggleButton value="mint">Mint Stable coin</ToggleButton>
        <ToggleButton value="burn">Redeem Stable coin</ToggleButton>
      </ToggleButtonGroup>
      {ilk && urn ? ( //eslint-disable-line
        selected === 'mint' ? (
          <MintManipulator
            ethereum={ethereum}
            account={account}
            chainlog={chainlog}
            vat={vat}
            ilk={ilk}
            cdpId={cdpId}
            urn={urn}
          />
        ) : (
          <BurnManipulator
            ethereum={ethereum}
            account={account}
            chainlog={chainlog}
            vat={vat}
            ilk={ilk}
            cdpId={cdpId}
            urn={urn}
          />
        )
      ) : (
        <CircularProgress />
      )}
    </Box>
  );
};

/**
 * handle vaults opening
 * TODO
 * - handle loading and errors
 */
const OpenVaultManager: FC<VaultManagerCommonProps> = ({ ethereum, account, chainlog, vat }) => {
  const [ilkBytes32, setIlkBytes32] = useState('');
  const ilkBytes32List = usePromiseFactory(
    useCallback(async () => {
      const registry = await chainlog.ilkRegistry();
      const list = await registry.list();
      if (list[0]) {
        setIlkBytes32(list[0]);
      }
      return list;
    }, [chainlog]),
  );
  const [ilk, setIlk] = useState<Ilk | null>(null);

  useEffect(() => {
    if (ilkBytes32List) {
      if (ilkBytes32) {
        Promise.all([vat.ilks(ilkBytes32), chainlog.spot().then((spot) => spot.ilks(ilkBytes32))]).then(
          (
            [{ Art, rate, spot, line, dust }, { mat }], //eslint-disable-line
          ) => setIlk({ bytes32: ilkBytes32, Art, rate, spot, line, dust, liquidationRatio: mat }), //eslint-disable-line
        );
      }
    }
  }, [vat, ilkBytes32List, ilkBytes32, chainlog]);

  return ilkBytes32List ? (
    <Box>
      <ToggleButtonGroup
        value={ilkBytes32 || ilkBytes32List[0]}
        exclusive
        fullWidth
        onChange={(e, ilkBytes32_) => ilkBytes32 && setIlkBytes32(ilkBytes32_)}
      >
        {ilkBytes32List.map((ilkBytes32_) => (
          <ToggleButton value={ilkBytes32_} key={ilkBytes32_}>
            {parseBytes32String(ilkBytes32_)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <IlkStatusCard ilk={ilk} chainlog={chainlog} />
      {ilk ? (
        <MintManipulator ethereum={ethereum} account={account} chainlog={chainlog} vat={vat} ilk={ilk} />
      ) : (
        <CircularProgress />
      )}
    </Box>
  ) : (
    <CircularProgress />
  );
};

const VaultManager: FC<VaultManagerProps> = ({ ethereum, account, cdpId }) => {
  const chainlog = useChainLog(ethereum);
  const vat = useVat(chainlog);

  return chainlog && vat ? ( //eslint-disable-line
    cdpId ? (
      <CdpVaultManager ethereum={ethereum} account={account} chainlog={chainlog} vat={vat} cdpId={cdpId} />
    ) : (
      <OpenVaultManager ethereum={ethereum} account={account} chainlog={chainlog} vat={vat} />
    )
  ) : (
    <CircularProgress />
  );
};

export default VaultManager;
