const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const HeroPull = await hre.ethers.getContractFactory("HeroPull");
  const heroPull = await HeroPull.deploy();
  await heroPull.waitForDeployment();

  const addr = await heroPull.getAddress();
  console.log("HeroPull deployed to:", addr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
