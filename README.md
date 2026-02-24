# Hero Pull – Farcaster Mini App

Hero Pull is a gacha‑style superhero NFT game built as a Farcaster Mini App using Next.js 14 and Farcaster Frames v2. Users can pull randomly generated heroes with varying rarities and mint them as NFTs on the Base chain. The interface is mobile‑first with dark, epic‑fantasy styling and animated glow effects that change based on rarity.

## Features

* **Random hero generator** – Each pull produces a unique hero with a name, gender, power, rarity and DiceBear avatar. Rarity distribution: 60 % Common, 25 % Rare, 12 % Epic, 3 % Legendary.
* **Daily free pull** – Each Farcaster user gets one free pull per day (tracked in `localStorage`). Additional pulls cost `0.000777` ETH.
* **NFT minting** – Integrates Crossmint’s hosted checkout via the `CrossmintPayButton`. Minting is available for all rarities and costs `0.000777` ETH on Base. Legendary heroes feature a special animation.
* **Social sharing** – A share button generates a pre‑filled Warpcast compose link with the hero’s stats.
* **Mobile‑first design** – Fully responsive with Tailwind CSS, dark mode and glowing trading‑card visuals.

## Tech stack

| Technology            | Purpose                                                                                 |
|----------------------|-----------------------------------------------------------------------------------------|
| Next.js 14 (App Router) | Core React framework for server‑side rendering and API routes                           |
| `@farcaster/frame-sdk` | Access Farcaster Mini App APIs and call `sdk.actions.ready()`                           |
| Wagmi + Viem          | Connect to the Base network and interact with Ethereum wallets (used by Crossmint)       |
| Tailwind CSS          | Utility‑first CSS framework with custom rarity colours and animations                    |
| DiceBear Avatars API  | Generates SVG avatars for heroes using their names as seeds (no API key required)        |
| Crossmint             | Handles NFT minting and checkout via the `CrossmintPayButton` component                  |
| Vercel                | Zero‑config deployment platform for Next.js                                             |

## Setup

1. **Clone the repository**

   ```bash
   git clone <your-fork-url>
   cd hero-pull
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Create environment variables**

   Create a `.env.local` file in the root of the project with the following variables. Do not commit your secrets to version control.

   ```bash
   # Crossmint project ID for your collection
   NEXT_PUBLIC_CROSSMINT_PROJECT_ID=
   
   # Address of your NFT contract on Base (if using your own contract)
   NEXT_PUBLIC_CONTRACT_ADDRESS=
   
   # RPC URL for the Base network (used by Wagmi/Viem)
   NEXT_PUBLIC_BASE_RPC_URL=
   ```

   *You can obtain a Crossmint project ID by creating a collection on the Crossmint dashboard.*

4. **Run locally**

   ```bash
   npm run dev
   ```

   Navigate to `http://localhost:3000` in your browser. When embedded in Farcaster, the app will automatically call `sdk.actions.ready()` once the page loads.

5. **Build and deploy**

   To generate a production build:

   ```bash
   npm run build
   npm run start
   ```

   Deploying to Vercel is as simple as connecting your GitHub repository and selecting the Next.js preset. The provided `vercel.json` ensures the API routes work correctly. Be sure to set your environment variables in the Vercel dashboard.

## Project structure

* `app/layout.tsx` – Root layout that imports global styles and calls `sdk.actions.ready()`.
* `app/page.tsx` – Main page that renders the hero pull interface.
* `app/api/frame/route.ts` – Minimal frame metadata endpoint used by Farcaster to display the embed card.
* `components/HeroPull.tsx` – Encapsulates the hero pulling logic, daily free pull state, hero card UI and share functionality.
* `components/MintButton.tsx` – Implements the paid pull using Crossmint’s hosted checkout and generates a new hero.
* `lib/heroes.ts` – Contains arrays of names, powers and helper functions to generate heroes and weighted rarities.
* `tailwind.config.ts` – Configures Tailwind, including custom colours for each rarity and a slow pulse animation.
* `postcss.config.js` – Enables Tailwind and autoprefixer for styling.
* `vercel.json` – Basic Vercel configuration for deploying the Next.js project.

## Notes

* **Security** – Never hardcode private keys, secret project IDs or wallet addresses. Use environment variables for any sensitive information.
* **No backend** – The app deliberately avoids a backend database. Daily pulls are tracked in `localStorage`; clearing browser storage resets the free pull.
* **Animations** – Legendary cards pulse slowly to emphasise their rarity. Adjust the `glow-*` classes in `globals.css` or the animations in `tailwind.config.ts` to customise.

Enjoy your hero hunting!