import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import { generateRoleAssignments } from "../../common/helpers";

import { getConfig } from "./config/config";

import {
  L2MessageService__factory,
  ProxyAdmin__factory,
  TransparentUpgradeableProxy__factory,
} from "../../typechain-types";

import {
  L1_L2_MESSAGE_SETTER_ROLE,
  L2_MESSAGE_SERVICE_PAUSE_TYPES_ROLES,
  L2_MESSAGE_SERVICE_ROLES,
  L2_MESSAGE_SERVICE_UNPAUSE_TYPES_ROLES,
} from "../../common/constants";

export = async (deployer: Deployer) => {
  const config = await getConfig();

  const signer = await deployer.getSigner();

  const l2MessageServiceImplementation = await deployer.deploy(L2MessageService__factory, []);
  const proxyAdmin = await deployer.deploy(ProxyAdmin__factory, []);

  const l2MessageServiceInterface = L2MessageService__factory.createInterface();

  const pauseTypeRoles = L2_MESSAGE_SERVICE_PAUSE_TYPES_ROLES;
  const unpauseTypeRoles = L2_MESSAGE_SERVICE_UNPAUSE_TYPES_ROLES;

  const roleAddresses = generateRoleAssignments(L2_MESSAGE_SERVICE_ROLES, await signer.getAddress(), [
    { role: L1_L2_MESSAGE_SETTER_ROLE, addresses: [config.MESSAGE_SETTER!] },
  ]);

  const data = l2MessageServiceInterface.encodeFunctionData("initialize", [
    config.RATE_LIMIT_PERIOD,
    config.RATE_LIMIT_AMOUNT,
    config.SECURITY_COUNCIL,
    roleAddresses,
    pauseTypeRoles,
    unpauseTypeRoles,
  ]);

  const l2MessageServiceProxy = await deployer.deploy(TransparentUpgradeableProxy__factory, [
    await l2MessageServiceImplementation.getAddress(),
    await proxyAdmin.getAddress(),
    data,
  ]);

  const l2MessageService = await deployer.deployed(L2MessageService__factory, await l2MessageServiceProxy.getAddress());
  await l2MessageService.grantRole(L1_L2_MESSAGE_SETTER_ROLE, await signer.getAddress());

  await Reporter.reportContractsMD(["L2MessageService", `${await l2MessageServiceProxy.getAddress()}`]);
};
