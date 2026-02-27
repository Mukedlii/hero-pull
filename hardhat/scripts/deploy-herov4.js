const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying HeroPullV4 with:", deployer.address);

  const v1 = process.env.HERO_V1_CONTRACT || "0xA728A918A767bB085D4ac895b8F2d2AbD0dE27bB";
  const v2 = process.env.HERO_V2_CONTRACT || "0x6103b37B65B42787a5bEC556b6Ff6A5606667fab";
  const v3 = process.env.HERO_V3_CONTRACT || "0x951144FAea2d756556e8cE6131FFd2038A6ae2D9";

  const owner = process.env.HERO_V4_OWNER || deployer.address;
  const receiver = process.env.HERO_V4_RECEIVER || owner;
  const baseURI = process.env.HERO_V4_BASE_URI || "https://hero-pull.vercel.app/api/nftv4/metadata/";
  const priceWei = process.env.HERO_V4_MINT_PRICE_WEI || "200000000000000"; // 0.0002 ETH

  const C = await hre.ethers.getContractFactory("HeroPullV4");
  const c = await C.deploy(v1, v2, v3, baseURI, owner, receiver, priceWei);
  await c.waitForDeployment();

  console.log("HeroPullV4 deployed to:", await c.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
