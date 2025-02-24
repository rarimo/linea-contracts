import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import { MESSAGE_SETTER, RATE_LIMIT_AMOUNT, RATE_LIMIT_PERIOD, SECURITY_COUNCIL } from "./config/localhost";

import {
  L1_L2_MESSAGE_SETTER_ROLE,
  L2_MESSAGE_SERVICE_PAUSE_TYPES_ROLES,
  L2_MESSAGE_SERVICE_ROLES,
  L2_MESSAGE_SERVICE_UNPAUSE_TYPES_ROLES,
} from "../common/constants";

import { generateRoleAssignments } from "../common/helpers";

import {
  L2MessageService__factory,
  ProxyAdmin__factory,
  TransparentUpgradeableProxy__factory,
} from "../typechain-types";

export = async (deployer: Deployer) => {
  const l2MessageServiceImplementation = await deployer.deploy(L2MessageService__factory, []);
  const proxyAdmin = await deployer.deploy(ProxyAdmin__factory, []);

  const l2MessageServiceInterface = L2MessageService__factory.createInterface();

  const pauseTypeRoles = L2_MESSAGE_SERVICE_PAUSE_TYPES_ROLES;
  const unpauseTypeRoles = L2_MESSAGE_SERVICE_UNPAUSE_TYPES_ROLES;
  const roleAddresses = generateRoleAssignments(L2_MESSAGE_SERVICE_ROLES, SECURITY_COUNCIL, [
    { role: L1_L2_MESSAGE_SETTER_ROLE, addresses: [MESSAGE_SETTER!] },
  ]);

  const data = l2MessageServiceInterface.encodeFunctionData("initialize", [
    RATE_LIMIT_PERIOD,
    RATE_LIMIT_AMOUNT,
    SECURITY_COUNCIL,
    roleAddresses,
    pauseTypeRoles,
    unpauseTypeRoles,
  ]);

  const l2MessageService = await deployer.deploy(TransparentUpgradeableProxy__factory, [
    await l2MessageServiceImplementation.getAddress(),
    await proxyAdmin.getAddress(),
    data,
  ]);

  await Reporter.reportContractsMD(["L2MessageService", `${await l2MessageService.getAddress()}`]);
};
