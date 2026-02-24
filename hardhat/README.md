# Hero Pull ERC-721 (Base mainnet)

## Setup

```bash
cd hardhat
yarn
cp .env.example .env
```

Fill `.env`:
- `DEPLOYER_PRIVATE_KEY` = private key of the deployer wallet (fund it with a bit of ETH on Base for gas)
- `BASE_RPC_URL` optional

## Compile

```bash
yarn compile
```

## Deploy to Base mainnet

```bash
yarn deploy:base
```

The script prints the deployed contract address.

## Verify (optional)
Use Basescan verify tools or Hardhat Etherscan plugin (not included here).
