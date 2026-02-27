const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying HeroPullV2 with:", deployer.address);

  const v1 = process.env.HERO_V1_CONTRACT || "0xA728A918A767bB085D4ac895b8F2d2AbD0dE27bB";
  const owner = process.env.HERO_V2_OWNER || deployer.address;
  const receiver = process.env.HERO_V2_RECEIVER || owner;
  const baseURI = process.env.HERO_V2_BASE_URI || "https://hero-pull.vercel.app/api/nftv2/metadata/";
  const priceWei = process.env.HERO_V2_MINT_PRICE_WEI || "200000000000000"; // 0.0002 ETH

  const C = await hre.ethers.getContractFactory("HeroPullV2");
  const c = await C.deploy(v1, baseURI, owner, receiver, priceWei);
  await c.waitForDeployment();

  const addr = await c.getAddress();
  console.log("HeroPullV2 deployed to:", addr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
