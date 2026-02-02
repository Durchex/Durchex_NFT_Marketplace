# Deploy Contracts on VPS for Full On-Chain Features

This guide walks you through deploying all marketplace smart contracts from your VPS so that **Offers**, **Auctions**, **Staking**, **Lazy Mint (Buy & Mint)**, and related features work on-chain.

---

## 1. Prerequisites on the VPS

- **Node.js** 18+ and **npm**
- **Git** (repo cloned)
- **Funded deployer wallet** on the target network (e.g. Sepolia testnet ETH for gas)
- **Private key** for that wallet (never commit it; use env vars only)

---

## 2. One-Time Setup on the VPS

```bash
# Clone (if not already)
cd /opt  # or your app directory
git clone https://github.com/YourOrg/Durchex_NFT_Marketplace.git
cd Durchex_NFT_Marketplace

# Install root dependencies (Hardhat, ethers, etc.)
npm install

# Install frontend deps (needed if you build frontend on same VPS)
cd frontend && npm install && cd ..
```

---

## 3. Environment Variables for Contract Deployment

Create or edit `.env` at the **project root** (same folder as `hardhat.config.cjs`).

### Required for any deployment

| Variable | Description | Example |
|----------|-------------|---------|
| `PRIVATE_KEY` | Deployer wallet private key (no `0x` prefix) | `abc123...` |

### RPC URL (pick the network you deploy to)

| Network | Variable | Example |
|---------|----------|---------|
| Sepolia | `SEPOLIA_RPC_URL` | `https://rpc.ankr.com/eth_sepolia` |
| Ethereum | `ETHEREUM_RPC_URL` | `https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY` |
| Polygon | `POLYGON_RPC_URL` | `https://polygon-rpc.com` |
| Base | `BASE_RPC_URL` | `https://mainnet.base.org` |
| Arbitrum | `ARBITRUM_RPC_URL` | `https://arb1.arbitrum.io/rpc` |

### Optional: NFT Staking contract

If you want the **Staking** contract deployed, set:

| Variable | Description |
|----------|-------------|
| `NFT_COLLECTION_FOR_STAKING` | Address of the NFT collection accepted for staking |
| `REWARD_TOKEN_ADDRESS` | Address of the ERC-20 reward token |
| `STAKING_DAILY_REWARD` | (optional) Reward per day in wei, e.g. `1000000000000000000` for 1 token |
| `STAKING_MIN_PERIOD` | (optional) Min stake time in seconds, e.g. `604800` for 7 days |

---

## 4. Deploy Contracts

### Option A: Sepolia testnet (recommended first)

```bash
# From project root
npx hardhat compile
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

This deploys:

- **LazyMintNFT** – Buy & Mint
- **Auction** – Auctions
- **Offer** – Offers
- **Collection** – Collection template
- **Royalties** – Royalty logic
- **NFTStaking** – only if `NFT_COLLECTION_FOR_STAKING` and `REWARD_TOKEN_ADDRESS` are set

### Option B: Other EVM networks

The repo has `deploy-sepolia.js` for Sepolia. For **mainnet** (e.g. Ethereum, Polygon), you can:

- Reuse the same script logic on another network if you add it to `hardhat.config.cjs`, or
- Use existing scripts such as `scripts/deploy-mainnet.js` / `scripts/deploy-base.js` if they match your contracts.

Example for Polygon mainnet (if your Hardhat config has `polygon`):

```bash
# If you have a deploy script for polygon, e.g. deploy-polygon.js
npx hardhat run scripts/deploy-polygon.js --network polygon
```

After any run, the script prints contract addresses and writes them to:

- `deployments/sepolia/latest.json` (for deploy-sepolia)
- `frontend/src/contracts/addresses.json` (when the script updates it)

**Copy the printed addresses**; you need them for backend and frontend env.

---

## 5. Configure Backend .env on the VPS

On the VPS, set these in the **backend** `.env` (e.g. `backend_temp/.env` or wherever your Node app loads env):

```env
# Contract addresses (use the addresses from step 4)
LAZY_MINT_CONTRACT_ADDRESS=0x...
AUCTION_CONTRACT_ADDRESS=0x...
OFFER_CONTRACT_ADDRESS=0x...

# Optional: staking
STAKING_CONTRACT_ADDRESS=0x...
STAKING_RPC_URL=https://rpc.ankr.com/eth_sepolia

# RPC for the chain where contracts are deployed (backend uses these for reads)
SEPOLIA_RPC_URL=https://rpc.ankr.com/eth_sepolia
# Or for mainnet:
# ETHEREUM_RPC_URL=...
# POLYGON_RPC_URL=...
```

Optional (if your backend uses them):

- `OFFER_NETWORK=sepolia` (or `ethereum`, `polygon`, etc.)
- `AUCTION_NETWORK=sepolia`
- `STAKING_NETWORK=sepolia`

Restart the backend after changing `.env`.

---

## 6. Configure Frontend .env on the VPS

Frontend needs the same contract addresses so the app uses the correct chain and contracts. Set these in `frontend/.env` (or in your build environment):

```env
# Contracts (general or per-network)
VITE_APP_LAZY_MINT_CONTRACT_ADDRESS=0x...
VITE_APP_AUCTION_CONTRACT_ADDRESS=0x...
VITE_APP_OFFER_CONTRACT_ADDRESS=0x...
VITE_APP_STAKING_CONTRACT_ADDRESS=0x...
```

For multi-chain you can use per-network vars, e.g.:

```env
VITE_APP_LAZY_MINT_CONTRACT_ADDRESS_SEPOLIA=0x...
VITE_APP_AUCTION_CONTRACT_ADDRESS_SEPOLIA=0x...
VITE_APP_OFFER_CONTRACT_ADDRESS_SEPOLIA=0x...
VITE_APP_STAKING_CONTRACT_ADDRESS_SEPOLIA=0x...
```

Then **rebuild** the frontend so the new env is baked in:

```bash
cd frontend
npm run build
```

Serve the `frontend/dist` folder with Nginx or your existing static hosting.

---

## 7. Optional: NftPieces + NftLiquidity

If you use **NftPieces** and **NftLiquidity** contracts:

```bash
npx hardhat run scripts/deployNftPiecesAndLiquidity.js --network sepolia
```

Then set in frontend (and backend if used):

- `VITE_APP_NFT_PIECES_CONTRACT_ADDRESS`
- `VITE_APP_NFT_LIQUIDITY_CONTRACT_ADDRESS`

---

## 8. Summary Checklist

| Step | Action |
|------|--------|
| 1 | Install Node/npm and clone repo on VPS |
| 2 | Add `PRIVATE_KEY` and RPC URL to **root** `.env` |
| 3 | (Optional) Set `NFT_COLLECTION_FOR_STAKING` and `REWARD_TOKEN_ADDRESS` for Staking |
| 4 | Run `npx hardhat compile` then `npx hardhat run scripts/deploy-sepolia.js --network sepolia` |
| 5 | Copy printed contract addresses into **backend** `.env` (see step 5) |
| 6 | Copy contract addresses into **frontend** `.env` (see step 6) |
| 7 | Restart backend; rebuild and redeploy frontend |

After this, **Offers**, **Auctions**, **Staking**, and **Lazy Mint** will use the deployed contracts on the chain you chose, and the app on the VPS will be fully on-chain for those features.

---

## 9. Security Notes

- **Never** commit `.env` or put `PRIVATE_KEY` in git. Add `.env` to `.gitignore`.
- Prefer storing secrets in the VPS env (e.g. systemd, Docker, or a secrets manager) rather than a committed file.
- Use a **dedicated deployer wallet** with only the funds needed for deployment and minimal ongoing use.
- For mainnet, consider a multisig or separate deploy machine and only copy the deployed **addresses** to the VPS env (deploy from a more secure environment, then configure the VPS with addresses only).
