import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import { generateRoleAssignments } from "../common/helpers";
import {
  LINEA_ROLLUP_PAUSE_TYPES_ROLES,
  LINEA_ROLLUP_ROLES,
  LINEA_ROLLUP_UNPAUSE_TYPES_ROLES,
  OPERATOR_ROLE,
} from "../common/constants";

import {
  MULTI_CALL_ADDRESS,
  ROLLUP_GENESIS_TIMESTAMP,
  ROLLUP_INITIAL_L2_BLOCK_NUMBER,
  ROLLUP_INITIAL_STATE_ROOT_HASH,
  ROLLUP_OPERATORS,
  ROLLUP_RATE_LIMIT_AMOUNT,
  ROLLUP_RATE_LIMIT_PERIOD,
  ROLLUP_SECURITY_COUNCIL,
} from "./config/localhost";

import {
  LineaRollup__factory,
  PlonkVerifierDev__factory,
  ProxyAdmin__factory,
  TransparentUpgradeableProxy__factory,
} from "../typechain-types";

export = async (deployer: Deployer) => {
  const verifier = await deployer.deploy(PlonkVerifierDev__factory, []);
  const lineaRollupImplementation = await deployer.deploy(LineaRollup__factory, []);
  const proxyAdmin = await deployer.deploy(ProxyAdmin__factory, []);

  const lineaRollupInterface = LineaRollup__factory.createInterface();

  const defaultRoleAddresses = generateRoleAssignments(LINEA_ROLLUP_ROLES, ROLLUP_SECURITY_COUNCIL, [
    { role: OPERATOR_ROLE, addresses: ROLLUP_OPERATORS },
  ]);

  const data = lineaRollupInterface.encodeFunctionData("initialize", [
    {
      initialStateRootHash: ROLLUP_INITIAL_STATE_ROOT_HASH,
      initialL2BlockNumber: ROLLUP_INITIAL_L2_BLOCK_NUMBER,
      genesisTimestamp: ROLLUP_GENESIS_TIMESTAMP,
      defaultVerifier: await verifier.getAddress(),
      rateLimitPeriodInSeconds: ROLLUP_RATE_LIMIT_PERIOD,
      rateLimitAmountInWei: ROLLUP_RATE_LIMIT_AMOUNT,
      roleAddresses: defaultRoleAddresses,
      pauseTypeRoles: LINEA_ROLLUP_PAUSE_TYPES_ROLES,
      unpauseTypeRoles: LINEA_ROLLUP_UNPAUSE_TYPES_ROLES,
      fallbackOperator: MULTI_CALL_ADDRESS,
      defaultAdmin: ROLLUP_SECURITY_COUNCIL,
    },
  ]);

  const lineaRollup = await deployer.deploy(TransparentUpgradeableProxy__factory, [
    await lineaRollupImplementation.getAddress(),
    await proxyAdmin.getAddress(),
    data,
  ]);

  await Reporter.reportContractsMD(["Linea Rollup", `${await lineaRollup.getAddress()}`]);
};
