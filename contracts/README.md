# Contracts

## Weapon1155 (Base)

### Prereqs
- Install Foundry: https://book.getfoundry.sh/getting-started/installation
- In this folder:

```bash
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std
```

### Deploy to Base
Set env vars:

```bash
export BASE_RPC_URL="https://mainnet.base.org" # or your preferred RPC
export PRIVATE_KEY="..."                       # deployer key
export WEAPON_OWNER="0xa782922Ff9c54F4264FD049189eC66940f528Eb0"
export WEAPON_BASE_URI="https://hero-pull.vercel.app/api/weapons/metadata/{id}.json"
export WEAPON_MINT_PRICE_WEI="50000000000000" # 0.00005 ETH (tune for ~$0.15)
```

Deploy:

```bash
forge script script/DeployWeapon1155.s.sol:DeployWeapon1155 \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast -vvvv
```

After deploy, set `NEXT_PUBLIC_WEAPON_CONTRACT_ADDRESS` in Vercel.
