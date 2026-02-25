import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

const client = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') })

const hashes = [
  '0x8edd01af3dbf3186833a1ca45fd1fef664871021fc7db9c4b4df4244f92894f4',
  '0xebbd3b91240665de0d3df6b39131261a9e82030c669358457b39c15d2acb36a8',
  '0x6ba93277b8ea5b0869a291e02af55c53a87848d48bb10cd30f173accf34e20e4',
]

for (const h of hashes) {
  const tx = await client.getTransaction({ hash: h })
  console.log(h)
  console.log(' from', tx.from)
  console.log(' to  ', tx.to)
  console.log(' value', tx.value.toString())
  console.log(' input', tx.input)
  console.log('---')
}
