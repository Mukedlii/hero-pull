import { http, createConfig } from "wagmi"
import { base } from "wagmi/chains"

// IMPORTANT: use deep import to avoid bundling unrelated connectors (some pull
// in node-only deps like @base-org/account) which breaks Next/Vercel builds.
import { injected } from "wagmi/connectors/injected"

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [injected()],
  transports: {
    [base.id]: http(),
  },
})
