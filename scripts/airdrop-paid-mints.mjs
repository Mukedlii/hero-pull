import dotenv from 'dotenv'
import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  http,
  parseAbi,
} from 'viem'
import { base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// Load env from project root, then hardhat/.env
dotenv.config()
dotenv.config({ path: './hardhat/.env' })

const CONTRACT = '0xA728A918A767bB085D4ac895b8F2d2AbD0dE27bB'

const RECIPIENTS = [
  '0x6c2338c814b3519ac73aa79d643da19bda56eadc',
  '0x1abb6d599f0997cff4d293b282e6e6a53e4662d7',
]

function getKey() {
  const key =
    process.env.OWNER_PRIVATE_KEY ||
    process.env.PRIVATE_KEY ||
    process.env.DEPLOYER_PRIVATE_KEY ||
    process.env.WALLET_PRIVATE_KEY
  if (!key) throw new Error('Missing private key in env')
  return key.startsWith('0x') ? key : `0x${key}`
}

const abi = parseAbi([
  'function owner() view returns (address)',
  'function mintPrice() view returns (uint256)',
  'function mint() payable',
  'function safeTransferFrom(address from,address to,uint256 tokenId)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
])

const TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

async function main() {
  const account = privateKeyToAccount(getKey())
  const publicClient = createPublicClient({ chain: base, transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org') })
  const walletClient = createWalletClient({ account, chain: base, transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org') })

  const owner = await publicClient.readContract({ address: CONTRACT, abi, functionName: 'owner' })
  if (owner.toLowerCase() !== account.address.toLowerCase()) {
    throw new Error(`Connected account ${account.address} is not owner ${owner}`)
  }

  const price = await publicClient.readContract({ address: CONTRACT, abi, functionName: 'mintPrice' })
  console.log('contract', CONTRACT)
  console.log('owner', owner)
  console.log('mintPriceWei', price.toString())

  // Ensure sequential nonces (some RPCs are picky when sending multiple txs quickly)
  let nonce = await publicClient.getTransactionCount({ address: account.address })

  for (const to of RECIPIENTS) {
    console.log('\n---')
    console.log('Minting for recipient', to)

    const mintHash = await walletClient.writeContract({
      address: CONTRACT,
      abi,
      functionName: 'mint',
      args: [],
      value: price,
      nonce,
    })
    nonce += 1

    console.log('mint tx', mintHash)
    const mintReceipt = await publicClient.waitForTransactionReceipt({ hash: mintHash })
    if (mintReceipt.status !== 'success') throw new Error('Mint failed')

    const transferLog = mintReceipt.logs.find((l) => l.topics?.[0]?.toLowerCase() === TRANSFER_TOPIC)
    if (!transferLog) throw new Error('No Transfer log found in mint receipt')

    const decoded = decodeEventLog({
      abi,
      data: transferLog.data,
      topics: transferLog.topics,
    })

    // @ts-ignore
    const tokenId = decoded.args.tokenId
    console.log('tokenId', tokenId.toString())

    const transferHash = await walletClient.writeContract({
      address: CONTRACT,
      abi,
      functionName: 'safeTransferFrom',
      args: [account.address, to, tokenId],
      nonce,
    })
    nonce += 1

    console.log('transfer tx', transferHash)
    const transferReceipt = await publicClient.waitForTransactionReceipt({ hash: transferHash })
    if (transferReceipt.status !== 'success') throw new Error('Transfer failed')

    console.log('done')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
