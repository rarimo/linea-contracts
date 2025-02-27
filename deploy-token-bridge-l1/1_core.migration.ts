import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import { generateRoleAssignments } from "../common/helpers";

import { getConfig } from "./config/config";

import {
  BridgedToken__factory,
  ProxyAdmin__factory,
  TokenBridge__factory,
  TransparentUpgradeableProxy__factory,
  UpgradeableBeacon__factory,
} from "../typechain-types";

import {
  TOKEN_BRIDGE_PAUSE_TYPES_ROLES,
  TOKEN_BRIDGE_ROLES,
  TOKEN_BRIDGE_UNPAUSE_TYPES_ROLES,
} from "../common/constants";

export = async (deployer: Deployer) => {
  const config = await getConfig();

  const signer = await deployer.getSigner();

  const provider = signer.provider;
  const chainId = (await provider.getNetwork()).chainId;

  const securityCouncilAddress = config.L1_TOKEN_BRIDGE_SECURITY_COUNCIL;

  const defaultRoleAddresses = generateRoleAssignments(TOKEN_BRIDGE_ROLES, securityCouncilAddress, []);

  const bridgedToken = await deployer.deploy(BridgedToken__factory, []);
  const tokenBridgeImplementation = await deployer.deploy(TokenBridge__factory, []);
  const proxyAdmin = await deployer.deploy(ProxyAdmin__factory, []);

  console.log(`Deploying UpgradeableBeacon: chainId=${chainId} bridgedTokenAddress=${await bridgedToken.getAddress()}`);

  const beaconProxy = await deployer.deploy(UpgradeableBeacon__factory, [await bridgedToken.getAddress()]);

  console.log(`Deploying TokenBridge on L1, using L1_RESERVED_TOKEN_ADDRESSES environment variable`);

  const initData = TokenBridge__factory.createInterface().encodeFunctionData("initialize", [
    {
      defaultAdmin: securityCouncilAddress,
      messageService: config.LINEA_ROLLUP_ADDRESS,
      tokenBeacon: await beaconProxy.getAddress(),
      sourceChainId: chainId,
      targetChainId: config.REMOTE_CHAIN_ID,
      reservedTokens: config.L1_RESERVED_TOKEN_ADDRESSES,
      roleAddresses: defaultRoleAddresses,
      pauseTypeRoles: TOKEN_BRIDGE_PAUSE_TYPES_ROLES,
      unpauseTypeRoles: TOKEN_BRIDGE_UNPAUSE_TYPES_ROLES,
    },
  ]);

  const tokenBridgeProxy = await deployer.deploy(TransparentUpgradeableProxy__factory, [
    await tokenBridgeImplementation.getAddress(),
    await proxyAdmin.getAddress(),
    initData,
  ]);

  await Reporter.reportContractsMD(["L1 Token Bridge", await tokenBridgeProxy.getAddress()]);
};
