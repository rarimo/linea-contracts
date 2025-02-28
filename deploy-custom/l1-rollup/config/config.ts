import hre from "hardhat";

export async function getConfig() {
  if (hre.network.name == "localhost" || hre.network.name == "hardhat") {
    return await import("./localhost");
  }

  if (hre.network.name == "sepolia") {
    return await import("./sepolia");
  }

  throw new Error(`Config for network ${hre.network.name} is not specified`);
}
