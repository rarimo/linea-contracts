import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import { getConfig } from "./config/config";

import { generateRoleAssignments } from "../common/helpers";
import {
  LINEA_ROLLUP_PAUSE_TYPES_ROLES,
  LINEA_ROLLUP_ROLES,
  LINEA_ROLLUP_UNPAUSE_TYPES_ROLES,
  OPERATOR_ROLE,
} from "../common/constants";

import {
  LineaRollup__factory,
  PlonkVerifier__factory,
  ProxyAdmin__factory,
  TransparentUpgradeableProxy__factory,
} from "../typechain-types";

export = async (deployer: Deployer) => {
  const config = await getConfig();

  const verifier = await deployer.deploy(PlonkVerifier__factory, []);
  const lineaRollupImplementation = await deployer.deploy(LineaRollup__factory, []);
  const proxyAdmin = await deployer.deploy(ProxyAdmin__factory, []);

  const lineaRollupInterface = LineaRollup__factory.createInterface();

  const signer = await deployer.getSigner();

  const defaultRoleAddresses = generateRoleAssignments(LINEA_ROLLUP_ROLES, await signer.getAddress(), [
    { role: OPERATOR_ROLE, addresses: config.ROLLUP_OPERATORS },
  ]);

  const data = lineaRollupInterface.encodeFunctionData("initialize", [
    {
      initialStateRootHash: config.ROLLUP_INITIAL_STATE_ROOT_HASH,
      initialL2BlockNumber: config.ROLLUP_INITIAL_L2_BLOCK_NUMBER,
      genesisTimestamp: config.ROLLUP_GENESIS_TIMESTAMP,
      defaultVerifier: await verifier.getAddress(),
      rateLimitPeriodInSeconds: config.ROLLUP_RATE_LIMIT_PERIOD,
      rateLimitAmountInWei: config.ROLLUP_RATE_LIMIT_AMOUNT,
      roleAddresses: defaultRoleAddresses,
      pauseTypeRoles: LINEA_ROLLUP_PAUSE_TYPES_ROLES,
      unpauseTypeRoles: LINEA_ROLLUP_UNPAUSE_TYPES_ROLES,
      fallbackOperator: config.MULTI_CALL_ADDRESS,
      defaultAdmin: config.ROLLUP_SECURITY_COUNCIL,
    },
  ]);

  const lineaRollup = await deployer.deploy(TransparentUpgradeableProxy__factory, [
    await lineaRollupImplementation.getAddress(),
    await proxyAdmin.getAddress(),
    data,
  ]);

  await Reporter.reportContractsMD(["Linea Rollup", `${await lineaRollup.getAddress()}`]);
};
