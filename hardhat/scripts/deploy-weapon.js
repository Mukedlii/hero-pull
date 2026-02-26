const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying Weapon1155 with:", deployer.address);

  const owner = process.env.WEAPON_OWNER;
  if (!owner) throw new Error("Missing WEAPON_OWNER");

  const baseUri = process.env.WEAPON_BASE_URI || "https://hero-pull.vercel.app/api/weapons/metadata/{id}.json";
  const mintPriceWei = process.env.WEAPON_MINT_PRICE_WEI || "50000000000000"; // 0.00005 ETH

  const Weapon1155 = await hre.ethers.getContractFactory("Weapon1155");
  const c = await Weapon1155.deploy(baseUri, owner, mintPriceWei);
  await c.waitForDeployment();

  const addr = await c.getAddress();
  console.log("Weapon1155 deployed to:", addr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
