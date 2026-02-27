const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying Weapon1155V2 with:", deployer.address);

  const owner = process.env.WEAPON_OWNER;
  if (!owner) throw new Error("Missing WEAPON_OWNER");

  const baseUri = process.env.WEAPON_BASE_URI || "https://hero-pull.vercel.app/api/weapons/metadata/{id}.json";
  const mintPriceWei = process.env.WEAPON_MINT_PRICE_WEI || "50000000000000"; // 0.00005 ETH

  const C = await hre.ethers.getContractFactory("Weapon1155V2");
  const c = await C.deploy(baseUri, owner, mintPriceWei);
  await c.waitForDeployment();

  const addr = await c.getAddress();
  console.log("Weapon1155V2 deployed to:", addr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
