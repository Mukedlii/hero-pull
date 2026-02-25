require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

if (!PRIVATE_KEY) {
  console.warn("DEPLOYER_PRIVATE_KEY is not set (deploy will fail).");
}

module.exports = {
  solidity: "0.8.20",
  networks: {
    base: {
      url: BASE_RPC_URL,
      chainId: 8453,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
