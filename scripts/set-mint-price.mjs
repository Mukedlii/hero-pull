import dotenv from 'dotenv'
import { createWalletClient, createPublicClient, http, parseAbi } from 'viem'
import { base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// Load env from project root, then also try hardhat/.env (where deploy keys often live)
dotenv.config()
dotenv.config({ path: './hardhat/.env' })

const CONTRACT = '0xA728A918A767bB085D4ac895b8F2d2AbD0dE27bB'
const NEW_PRICE_WEI = 200000000000000n // 0.00020 ETH

function getKey() {
  const key =
    process.env.OWNER_PRIVATE_KEY ||
    process.env.PRIVATE_KEY ||
    process.env.DEPLOYER_PRIVATE_KEY ||
    process.env.WALLET_PRIVATE_KEY
  if (!key) throw new Error('Missing private key in env (OWNER_PRIVATE_KEY/PRIVATE_KEY/...)')
  return key.startsWith('0x') ? key : `0x${key}`
}

async function main() {
  const account = privateKeyToAccount(getKey())

  const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
  })

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
  })

  const abi = parseAbi([
    'function owner() view returns (address)',
    'function mintPrice() view returns (uint256)',
    'function setMintPrice(uint256 _price)',
  ])

  const owner = await publicClient.readContract({
    address: CONTRACT,
    abi,
    functionName: 'owner',
  })

  const current = await publicClient.readContract({
    address: CONTRACT,
    abi,
    functionName: 'mintPrice',
  })

  console.log('contract', CONTRACT)
  console.log('connected account', account.address)
  console.log('owner', owner)
  console.log('current mintPriceWei', current.toString())
  console.log('new mintPriceWei', NEW_PRICE_WEI.toString())

  if (owner.toLowerCase() !== account.address.toLowerCase()) {
    throw new Error('Connected account is not the owner; cannot setMintPrice')
  }

  const hash = await walletClient.writeContract({
    address: CONTRACT,
    abi,
    functionName: 'setMintPrice',
    args: [NEW_PRICE_WEI],
  })

  console.log('tx', hash)
  console.log('waiting for confirmation...')

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  console.log('status', receipt.status)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
