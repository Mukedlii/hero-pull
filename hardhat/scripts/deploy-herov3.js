const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying HeroPullV3 with:", deployer.address);

  const v1 = process.env.HERO_V1_CONTRACT || "0xA728A918A767bB085D4ac895b8F2d2AbD0dE27bB";
  const v2 = process.env.HERO_V2_CONTRACT || "0x6103b37B65B42787a5bEC556b6Ff6A5606667fab";

  const owner = process.env.HERO_V3_OWNER || deployer.address;
  const receiver = process.env.HERO_V3_RECEIVER || owner;
  const baseURI = process.env.HERO_V3_BASE_URI || "https://hero-pull.vercel.app/api/nftv3/metadata/";
  const priceWei = process.env.HERO_V3_MINT_PRICE_WEI || "200000000000000"; // 0.0002 ETH

  const C = await hre.ethers.getContractFactory("HeroPullV3");
  const c = await C.deploy(v1, v2, baseURI, owner, receiver, priceWei);
  await c.waitForDeployment();

  console.log("HeroPullV3 deployed to:", await c.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
